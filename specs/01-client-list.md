# Spec 01: Client List (Seed Data)

## Source

Extracted from business.google.com/u/1/locations on 2026-03-20.
Account: robertlbutt@gmail.com (second Google account — authuser=1).
Total: 46 profiles.

## JTBD

**When** Robbie wants to run weekly reports or look up a client,
**He needs** a managed list of all active client GBPs with their addresses
**So that** the system knows which businesses to monitor automatically.

## Requirements

1. Client list stored in D1 `clients` table
2. Each client has: `id`, `name`, `address`, `status`, `place_id` (nullable until resolved), `category`, `competitors_json`, `active` flag, `created_at`, `updated_at`
3. `active = false` for: Suspended, Permanently Closed, Duplicate profiles
4. `place_id` populated by geocoding lookup using name + address via Places API
5. Admin endpoint `GET /admin/clients` lists all clients with their status
6. Admin endpoint `POST /admin/clients/:id/resolve-place-id` triggers geocoding for a specific client

## Seed Data (46 businesses — active_flag = true unless noted)

```json
[
  { "name": "Artists for Africa", "address": "United States", "active": true },
  { "name": "Atlantic Building Materials", "address": "321 Community Rd, Blythewood, SC 29016", "active": true },
  { "name": "Austin Drilling & Well Repair Inc", "address": "14786 C R Koon Hwy, Newberry, SC 29108", "active": true },
  { "name": "Austin Drilling Inc", "address": "3830 Hwy 321, West Columbia, SC 29172", "active": true },
  { "name": "Blue Marlin", "address": "1200 Lincoln St, Columbia, SC 29201", "active": true },
  { "name": "Brabham Fence Company", "address": "119 Farm Rd, Summerville, SC 29485", "active": true },
  { "name": "Brabham Fence Company", "address": "2800 William H Tuller Drive, Columbia, SC 29205", "active": true },
  { "name": "Carolina Stone Craftsman", "address": "2010 Chapin Rd, Chapin, SC 29036", "active": true },
  { "name": "CENTA Medical Group", "address": "157 Corley Mill Rd, Lexington, SC 29072", "active": true },
  { "name": "CENTA Medical Group", "address": "9 Medical Park Dr #510, Columbia, SC 29203", "active": true },
  { "name": "CENTA Medical Group (duplicate)", "address": "9 Medical Park Dr #510, Columbia, SC 29203", "active": false, "notes": "Duplicate" },
  { "name": "Cricket Newman Designs", "address": "2005 N Beltline Blvd Suite 6, Columbia, SC 29204", "active": true },
  { "name": "Crystal Clean Janitorial", "address": "Columbia/Lexington/Chapin, SC", "active": true },
  { "name": "DNB Electric Inc.", "address": "310 Cedarcrest Dr, Lexington, SC 29072", "active": true },
  { "name": "Donen Davis Plastic Surgery", "address": "1850 Laurel St B, Columbia, SC 29201", "active": true },
  { "name": "Floor Pro Cleaning & Restoration", "address": "107 Vera Rd, Lexington, SC 29072", "active": true },
  { "name": "Furniture on Sunset", "address": "2250 Sunset Blvd Suite H, West Columbia, SC 29169", "active": false, "notes": "Marked as closed from Google — confirm with client" },
  { "name": "Genesis Pro Painters", "address": "Columbia/Lexington/Chapin, SC", "active": false, "notes": "Suspended" },
  { "name": "Icebox Cryotherapy Columbia", "address": "4609 Forest Drive Bldg E Suite 3, Columbia, SC 29206", "active": true },
  { "name": "Macon Metal Roofing Inc", "address": "7789 Hawkinsville Rd, Macon, GA 31216", "active": true },
  { "name": "Marketing Performance, LLC", "address": "United States", "active": true },
  { "name": "Midland's Construction", "address": "Irmo/Cayce + 5 other areas, SC", "active": false, "notes": "Verification required" },
  { "name": "Midlands Landscape and Lawn", "address": "1612 North Lake Drive, Lexington, SC 29072", "active": true },
  { "name": "Mike's Painting & Sandblasting", "address": "1015 Acline Ave, Myrtle Beach, SC 29577", "active": true },
  { "name": "Nature's Best Lawn & Landscape", "address": "Irmo/Elgin + 5 other areas, SC", "active": true },
  { "name": "Palmetto Equipment Sales & Services", "address": "6920 Pennington Rd Suite A, Columbia, SC 29209", "active": true },
  { "name": "Preferred Home Inspections, Inc", "address": "Irmo/Cayce + 10 other areas, SC", "active": true },
  { "name": "Pucci Commercial Properties", "address": "720 Old Clemson Rd Suite E, Columbia, SC 29229", "active": false, "notes": "Verification required" },
  { "name": "Rhino Linings of Lexington", "address": "108-A White Oak Lane, Lexington, SC 29073", "active": true },
  { "name": "Rytech Restoration of the Midlands", "address": "1310 Haviland Circle STE B, Columbia, SC 29210", "active": false, "notes": "Duplicate" },
  { "name": "Sandra E. Hennies, M.Ed., LMFT", "address": "906 Burwell Lane, Columbia, SC 29205", "active": false, "notes": "Duplicate" },
  { "name": "Signature Catering", "address": "991 First Street South, Columbia, SC 29209", "active": true },
  { "name": "Signature Catering (duplicate)", "address": "991 1st St S, Columbia, SC 29209", "active": false, "notes": "Duplicate" },
  { "name": "Smith-Built Metal Building & Supplies", "address": "6945 Albany Hwy, Dawson, GA 39842", "active": true },
  { "name": "SmithBuilt Metal Roofing", "address": "802 Rosewood Drive, Columbia, SC 29201", "active": true },
  { "name": "Smith-Built Metals (duplicate)", "address": "6945 Albany Hwy, Dawson, GA 39842", "active": false, "notes": "Duplicate" },
  { "name": "Soda City Dentistry", "address": "1801 Charleston Hwy, Cayce, SC 29033", "active": true },
  { "name": "Stormy Plumbing", "address": "1308 Boiling Springs Rd, Lexington, SC 29073", "active": true },
  { "name": "StripeWide Inc.", "address": "1824 Airport Blvd, Cayce, SC 29033", "active": true },
  { "name": "Sub Station II", "address": "928 Main St, Columbia, SC 29201", "active": false, "notes": "Permanently closed" },
  { "name": "Superior Plumbing & Gas", "address": "3610 Landmark Dr Suite F, Columbia, SC 29204", "active": true },
  { "name": "The Fritz Pet Resort and Spa", "address": "432 Ermine Rd, West Columbia, SC 29170", "active": true },
  { "name": "The Guttermen", "address": "3631 Delree St, West Columbia, SC 29170", "active": true },
  { "name": "The Red Shirt Guys Roofing", "address": "720 Old Clemson Rd ste b, Columbia, SC 29229", "active": true },
  { "name": "Township Auditorium", "address": "1703 Taylor St, Columbia, SC 29201", "active": true },
  { "name": "Whetzel's Automotive", "address": "2017 Augusta Rd, West Columbia, SC 29169", "active": true }
]
```

## Place ID Resolution

Place IDs are resolved at seed time using Places API text search:
`https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input={name}+{address}&inputtype=textquery&fields=place_id`

Store resolved `place_id` in DB. Re-run resolution for any with `place_id = NULL`.
