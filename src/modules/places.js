/**
 * Google Places API client with Cloudflare KV caching.
 * Cache key: place:{place_id}  TTL: 86400s (24h)
 */

const PLACES_BASE = 'https://maps.googleapis.com/maps/api/place';

const DETAIL_FIELDS = [
  'name', 'rating', 'user_ratings_total', 'opening_hours',
  'formatted_phone_number', 'website', 'photos', 'types',
  'editorial_summary', 'business_status', 'price_level',
  'reviews', 'geometry',
].join(',');

/**
 * Fetch full Place Details for a place_id.
 * Checks KV cache first; writes on miss.
 *
 * @param {string} placeId
 * @param {object} env - Worker env bindings (CACHE, GOOGLE_PLACES_API_KEY)
 * @returns {Promise<object>} Places API result object
 */
export async function getPlaceDetails(placeId, env) {
  const cacheKey = `place:${placeId}`;

  // Cache hit
  const cached = await env.CACHE.get(cacheKey, { type: 'json' });
  if (cached) {
    return cached;
  }

  // Cache miss — fetch from API
  const url = `${PLACES_BASE}/details/json?place_id=${placeId}&fields=${DETAIL_FIELDS}&key=${env.GOOGLE_PLACES_API_KEY}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Places API HTTP error: ${response.status}`);
  }

  const data = await response.json();

  if (data.status !== 'OK') {
    throw new Error(`Places API error: ${data.status} — ${data.error_message || 'no message'}`);
  }

  const result = data.result;

  // Write to cache
  await env.CACHE.put(cacheKey, JSON.stringify(result), { expirationTtl: 86400 });

  console.log(`[places] cache miss for ${placeId} — fetched from API`);
  return result;
}

/**
 * Text search to resolve a business name + city to a place_id.
 *
 * @param {string} query - e.g. "Stormy Plumbing Lexington SC"
 * @param {object} env
 * @returns {Promise<{place_id: string, name: string, address: string}|null>}
 */
export async function findPlaceByText(query, env) {
  const encoded = encodeURIComponent(query);
  const url = `${PLACES_BASE}/findplacefromtext/json?input=${encoded}&inputtype=textquery&fields=place_id,name,formatted_address&key=${env.GOOGLE_PLACES_API_KEY}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Places findplace HTTP error: ${response.status}`);
  }

  const data = await response.json();

  if (data.status !== 'OK' || !data.candidates?.length) {
    return null;
  }

  const candidate = data.candidates[0];
  return {
    place_id: candidate.place_id,
    name: candidate.name,
    address: candidate.formatted_address,
  };
}

/**
 * Nearby search: find competitors of same type near a location.
 *
 * @param {string} type - Places API type (e.g. "plumber")
 * @param {number} lat
 * @param {number} lng
 * @param {string} excludePlaceId - subject's own place_id to exclude
 * @param {number} limit - max results (default 3)
 * @param {object} env
 * @returns {Promise<Array<{place_id, name, address}>>}
 */
export async function findNearbyCompetitors(type, lat, lng, excludePlaceId, limit = 3, env) {
  const url = `${PLACES_BASE}/nearbysearch/json?location=${lat},${lng}&rankby=prominence&radius=10000&type=${type}&key=${env.GOOGLE_PLACES_API_KEY}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Places nearby HTTP error: ${response.status}`);
  }

  const data = await response.json();

  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    throw new Error(`Places nearby error: ${data.status}`);
  }

  return (data.results || [])
    .filter(r => r.place_id !== excludePlaceId)
    .slice(0, limit)
    .map(r => ({
      place_id: r.place_id,
      name: r.name,
      address: r.vicinity,
    }));
}
