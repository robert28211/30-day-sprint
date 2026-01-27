import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, Circle, ChevronDown, ChevronRight, AlertTriangle, Target, Zap, Shield, TrendingUp, Building2, Settings, Plus, Trash2, RefreshCw, Loader2, Users } from 'lucide-react';

const AIRTABLE_API_KEY = import.meta.env.VITE_AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = import.meta.env.VITE_AIRTABLE_BASE_ID;
const CLIENTS_TABLE = 'Clients';
const TASKS_TABLE = 'Tasks';

const airtableFetch = async (table, options = {}) => {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(table)}${options.params || ''}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Airtable API error');
  }
  return response.json();
};

const sprintTemplate = {
  preSprintAccess: {
    title: "Access & Credentials",
    items: [
      { id: "gbp", text: "Google Business Profile (Owner access)", critical: true },
      { id: "ga4", text: "Google Analytics 4 (Admin access)", critical: true },
      { id: "gads", text: "Google Ads (Admin access, if existing)" },
      { id: "meta", text: "Meta Business Manager (Admin access)" },
      { id: "website", text: "Website backend access", critical: true },
      { id: "domain", text: "Domain registrar access" },
      { id: "crm", text: "CRM access (if applicable)" },
      { id: "hosting", text: "Hosting panel access" }
    ]
  },
  preSprintVendasta: {
    title: "Vendasta Setup",
    items: [
      { id: "vendasta-account", text: "Create client account in Vendasta", critical: true },
      { id: "vendasta-listings", text: "Activate Business Listings (Listings Sync Pro)", critical: true },
      { id: "vendasta-reputation", text: "Activate Reputation Management" },
      { id: "vendasta-seo", text: "Activate Local SEO (if applicable)" },
      { id: "vendasta-social", text: "Activate Social Marketing dashboard" },
      { id: "vendasta-notifications", text: "Configure email notifications" },
      { id: "vendasta-invite", text: "Send client portal invitation" }
    ]
  },
  preSprintOviond: {
    title: "Oviond Reporting",
    items: [
      { id: "oviond-workspace", text: "Create new client workspace", critical: true },
      { id: "oviond-ga4", text: "Connect Google Analytics 4" },
      { id: "oviond-gsc", text: "Connect Google Search Console" },
      { id: "oviond-gads", text: "Connect Google Ads (if applicable)" },
      { id: "oviond-meta", text: "Connect Meta Ads (if applicable)" },
      { id: "oviond-gbp", text: "Connect Google Business Profile" },
      { id: "oviond-widgets", text: "Configure dashboard widgets" },
      { id: "oviond-reports", text: "Set up automated weekly reports" }
    ]
  },
  preSprintAssets: {
    title: "Asset Collection",
    items: [
      { id: "logo", text: "Logo files (vector preferred)" },
      { id: "colors", text: "Brand colors (hex codes)" },
      { id: "fonts", text: "Brand fonts (if specified)" },
      { id: "photos", text: "Current photography library" },
      { id: "testimonials", text: "Existing testimonials and reviews" },
      { id: "service-area", text: "Service area documentation" },
      { id: "pricing", text: "Current pricing structure" }
    ]
  },
  week1Technical: {
    title: "Day 1-2: Technical Infrastructure",
    items: [
      { id: "pixel-install", text: "Install EngageEngine Identity Pixel", critical: true },
      { id: "pixel-verify", text: "Verify pixel firing in diagnostics" },
      { id: "pixel-test", text: "Test across desktop, mobile, tablet" },
      { id: "clarity-create", text: "Create Clarity project", critical: true },
      { id: "clarity-install", text: "Install Clarity tracking code" },
      { id: "clarity-recordings", text: "Enable session recordings" },
      { id: "clarity-heatmaps", text: "Enable heatmaps" },
      { id: "clarity-verify", text: "Verify data collection" },
      { id: "ga4-verify", text: "Verify GA4 property exists" },
      { id: "ga4-enhanced", text: "Enable Enhanced Measurement" },
      { id: "ga4-conversions", text: "Configure conversion events (phone, form, email)" },
      { id: "ga4-audiences", text: "Set up audience definitions" },
      { id: "ga4-link-gads", text: "Link to Google Ads" },
      { id: "ga4-link-gsc", text: "Link to Search Console" },
      { id: "gtm-access", text: "Access/create GTM container" },
      { id: "gtm-verify", text: "Verify container on all pages" },
      { id: "gtm-phone", text: "Configure phone click tracking" },
      { id: "gtm-form", text: "Configure form submission tracking" },
      { id: "gtm-test", text: "Test all tags in Preview mode" },
      { id: "gtm-publish", text: "Publish container" }
    ]
  },
  week1Speed: {
    title: "Day 3-4: Speed & Technical Audit",
    items: [
      { id: "speed-psi", text: "Run PageSpeed Insights (mobile + desktop)", critical: true },
      { id: "speed-gtmetrix", text: "Run GTmetrix full report" },
      { id: "speed-document", text: "Document current LCP, FID, CLS scores" },
      { id: "speed-compress", text: "Compress all images (80% reduction)" },
      { id: "speed-cache", text: "Enable browser caching" },
      { id: "speed-gzip", text: "Enable GZIP compression" },
      { id: "speed-minify", text: "Minify CSS and JavaScript" },
      { id: "speed-plugins", text: "Remove unused plugins/scripts" },
      { id: "speed-fonts", text: "Optimize web fonts" },
      { id: "speed-lazy", text: "Implement lazy loading" },
      { id: "speed-retest", text: "Re-test and document improvements" }
    ]
  },
  week1Listings: {
    title: "Day 5-6: Listings & Presence",
    items: [
      { id: "gbp-verify", text: "Verify GBP ownership", critical: true },
      { id: "gbp-audit", text: "Audit profile completeness" },
      { id: "gbp-nap", text: "Verify NAP accuracy" },
      { id: "gbp-categories", text: "Add/update service categories" },
      { id: "gbp-description", text: "Write optimized description" },
      { id: "gbp-photos", text: "Upload 15+ quality photos" },
      { id: "gbp-messaging", text: "Enable messaging" },
      { id: "gbp-services", text: "Add products/services" },
      { id: "gbp-reviews", text: "Respond to unanswered reviews" },
      { id: "listings-scan", text: "Run Vendasta listings scan", critical: true },
      { id: "listings-document", text: "Document accuracy score" },
      { id: "listings-errors", text: "Identify incorrect listings" },
      { id: "listings-correct", text: "Submit corrections" },
      { id: "listings-suppress", text: "Suppress duplicates" },
      { id: "listings-add", text: "Add to missing directories" }
    ]
  },
  week1Diagnosis: {
    title: "Day 7: Failure Mode Diagnosis",
    items: [
      { id: "diag-traffic", text: "Review current traffic levels", critical: true },
      { id: "diag-sources", text: "Review traffic sources breakdown" },
      { id: "diag-bounce", text: "Review bounce rate and time on site" },
      { id: "diag-clarity", text: "Review Clarity recordings (min 10)" },
      { id: "diag-heatmaps", text: "Review homepage heatmaps" },
      { id: "diag-maps", text: "Review Maps visibility (5 key terms)" },
      { id: "diag-reviews", text: "Review review profile" },
      { id: "diag-competitors", text: "Audit top 3 competitors" },
      { id: "diag-conversion", text: "Document conversion rate estimate" },
      { id: "diag-declare", text: "Declare dominant failure mode", critical: true }
    ]
  },
  week2Headlines: {
    title: "Day 8-10: Homepage Hero Rewrite",
    items: [
      { id: "hero-review", text: "Review Clarity heatmaps for above-fold" },
      { id: "hero-pain", text: "Identify primary pain point" },
      { id: "hero-draft", text: "Draft 3-5 headline options", critical: true },
      { id: "hero-select", text: "Select top 2 for A/B testing" },
      { id: "hero-subhead", text: "Write benefit-focused subhead" },
      { id: "vp-document", text: "Document current value props" },
      { id: "vp-reframe", text: "Reframe features as benefits", critical: true },
      { id: "vp-update", text: "Update homepage copy" }
    ]
  },
  week2Offer: {
    title: "Day 11-12: Offer Creation",
    items: [
      { id: "offer-audit", text: "Review competitor offers" },
      { id: "offer-select", text: "Select offer type", critical: true },
      { id: "offer-scarcity", text: "Add scarcity element" },
      { id: "offer-homepage", text: "Create homepage copy" },
      { id: "offer-landing", text: "Create landing page copy" },
      { id: "offer-ads", text: "Create ad creative copy" },
      { id: "offer-document", text: "Document offer in client file" }
    ]
  },
  week2Landing: {
    title: "Day 13-14: Landing Pages",
    items: [
      { id: "lp-build", text: "Build primary conversion page", critical: true },
      { id: "lp-headline", text: "Structure above-fold headline" },
      { id: "lp-benefits", text: "Add 3 key benefits" },
      { id: "lp-form", text: "Add simple form" },
      { id: "lp-trust", text: "Add trust element" },
      { id: "lp-process", text: "Add process explanation" },
      { id: "lp-faq", text: "Add FAQ section" },
      { id: "lp-testimonials", text: "Add testimonials" },
      { id: "lp-conversion", text: "Configure GA4 conversion event" },
      { id: "lp-notification", text: "Configure instant form notification" },
      { id: "lp-emergency", text: "Build emergency landing page (if applicable)" }
    ]
  },
  week3Reviews: {
    title: "Day 15-17: Review Acceleration",
    items: [
      { id: "review-document", text: "Document current review profile", critical: true },
      { id: "review-vendasta-email", text: "Set up review request email template" },
      { id: "review-vendasta-sms", text: "Set up review request SMS template" },
      { id: "review-link", text: "Configure direct Google review link" },
      { id: "review-alerts", text: "Enable review monitoring alerts" },
      { id: "review-train", text: "Train client on review request process" },
      { id: "review-script", text: "Create review request script for staff" },
      { id: "review-response", text: "Set up review response protocol" },
      { id: "testimonial-identify", text: "Identify past customers for outreach" },
      { id: "testimonial-send", text: "Send testimonial requests (20+)" },
      { id: "testimonial-incentive", text: "Offer video testimonial incentive" }
    ]
  },
  week3Proof: {
    title: "Day 18-19: Proof Stacking",
    items: [
      { id: "proof-badge", text: "Add review count badge to hero" },
      { id: "proof-stars", text: "Add star rating display" },
      { id: "proof-years", text: "Add years in business" },
      { id: "proof-jobs", text: "Add total jobs served (if impressive)" },
      { id: "proof-area", text: "Add service area coverage" },
      { id: "proof-certs", text: "Add certification badges" },
      { id: "proof-testimonials", text: "Create rotating testimonial section" },
      { id: "proof-service", text: "Add testimonials to service pages" },
      { id: "proof-conversion", text: "Add testimonials to conversion pages" }
    ]
  },
  week3Guarantee: {
    title: "Day 20-21: Guarantee Creation",
    items: [
      { id: "guarantee-advantage", text: "Identify competitive advantage for guarantee" },
      { id: "guarantee-primary", text: "Draft primary guarantee", critical: true },
      { id: "guarantee-secondary", text: "Draft secondary service guarantee" },
      { id: "guarantee-approval", text: "Get client approval" },
      { id: "guarantee-homepage", text: "Add to homepage" },
      { id: "guarantee-conversion", text: "Add to conversion pages" },
      { id: "guarantee-footer", text: "Add to footer" }
    ]
  },
  week4CTA: {
    title: "Day 22-24: CTA Optimization",
    items: [
      { id: "cta-recordings", text: "Review new Clarity recordings (10+)" },
      { id: "cta-friction", text: "Identify friction points" },
      { id: "cta-phone-visible", text: "Verify phone visible on all pages" },
      { id: "cta-click-to-call", text: "Verify click-to-call on mobile" },
      { id: "cta-sticky", text: "Implement sticky header with phone" },
      { id: "cta-floating", text: "Add floating Call Now button" },
      { id: "cta-forms", text: "Verify forms work on mobile" },
      { id: "cta-test", text: "Test conversion path on 3 devices" },
      { id: "cta-exit", text: "Configure exit-intent popup" }
    ]
  },
  week4Retargeting: {
    title: "Day 25-27: Retargeting Setup",
    items: [
      { id: "meta-access", text: "Access Meta Business Manager", critical: true },
      { id: "meta-pixel", text: "Create/verify Meta Pixel" },
      { id: "meta-install", text: "Install pixel on all pages" },
      { id: "meta-events", text: "Configure standard events" },
      { id: "meta-test", text: "Test pixel in Events Manager" },
      { id: "audience-visitors", text: "Create Website Visitors audience" },
      { id: "audience-service", text: "Create Service Page Visitors audience" },
      { id: "audience-exclude", text: "Create Converters exclusion audience" },
      { id: "gads-access", text: "Access/create Google Ads account" },
      { id: "gads-link", text: "Link to GA4" },
      { id: "gads-import", text: "Import conversion events" },
      { id: "gads-remarketing", text: "Create remarketing audience" },
      { id: "gads-campaigns", text: "Build campaign structure", critical: true },
      { id: "gads-geo", text: "Set geographic targeting" },
      { id: "gads-schedule", text: "Set ad scheduling" },
      { id: "gads-copy", text: "Create ad copy variations (3+ per campaign)" }
    ]
  },
  week4Launch: {
    title: "Day 28-29: Campaign Launch",
    items: [
      { id: "launch-tracking", text: "Verify all conversion tracking", critical: true },
      { id: "launch-speed", text: "Verify landing pages < 3 seconds" },
      { id: "launch-notifications", text: "Verify form notifications instant" },
      { id: "launch-phone", text: "Verify phone tracking" },
      { id: "launch-oviond", text: "Verify Oviond pulling data" },
      { id: "launch-meta", text: "Launch Meta retargeting ($10-20/day)" },
      { id: "launch-gads", text: "Launch Google Ads campaigns" },
      { id: "launch-monitor", text: "Monitor first 24 hours" },
      { id: "launch-approvals", text: "Verify ad approvals" },
      { id: "launch-policy", text: "Check for policy violations" }
    ]
  },
  week4Handoff: {
    title: "Day 30: Sprint Close & Handoff",
    items: [
      { id: "handoff-credentials", text: "Compile all credentials securely" },
      { id: "handoff-changes", text: "Document all changes made" },
      { id: "handoff-diagnosis", text: "Document failure mode diagnosis" },
      { id: "handoff-roadmap", text: "Create ongoing optimization roadmap" },
      { id: "handoff-oviond", text: "Verify Oviond reports configured" },
      { id: "handoff-first-report", text: "Send first weekly report" },
      { id: "handoff-cadence", text: "Schedule ongoing reporting" },
      { id: "handoff-call", text: "Schedule Sprint Complete call", critical: true },
      { id: "handoff-walkthrough", text: "Walk through all changes" },
      { id: "handoff-performance", text: "Review performance vs baseline" },
      { id: "handoff-present", text: "Present 60-90 day roadmap" },
      { id: "handoff-confirm", text: "Confirm ongoing retainer scope" },
      { id: "handoff-feedback", text: "Collect sprint feedback" }
    ]
  }
};

const phases = [
  { 
    id: 'preSprint', 
    name: 'Pre-Sprint', 
    subtitle: 'Days -7 to 0',
    icon: Settings,
    color: 'from-slate-500 to-slate-600',
    sections: ['preSprintAccess', 'preSprintVendasta', 'preSprintOviond', 'preSprintAssets']
  },
  { 
    id: 'week1', 
    name: 'Week 1', 
    subtitle: 'Foundation & Diagnosis',
    icon: Target,
    color: 'from-blue-500 to-blue-600',
    sections: ['week1Technical', 'week1Speed', 'week1Listings', 'week1Diagnosis']
  },
  { 
    id: 'week2', 
    name: 'Week 2', 
    subtitle: 'Messaging & Positioning',
    icon: Zap,
    color: 'from-purple-500 to-purple-600',
    sections: ['week2Headlines', 'week2Offer', 'week2Landing']
  },
  { 
    id: 'week3', 
    name: 'Week 3', 
    subtitle: 'Social Proof & Trust',
    icon: Shield,
    color: 'from-emerald-500 to-emerald-600',
    sections: ['week3Reviews', 'week3Proof', 'week3Guarantee']
  },
  { 
    id: 'week4', 
    name: 'Week 4', 
    subtitle: 'Conversion & Launch',
    icon: TrendingUp,
    color: 'from-orange-500 to-orange-600',
    sections: ['week4CTA', 'week4Retargeting', 'week4Launch', 'week4Handoff']
  }
];

const failureModes = [
  { id: 'Not Seen', name: 'Not Seen When Decisions Are Made', control: 'Presence Control', color: 'bg-red-100 border-red-300 text-red-800' },
  { id: 'Not Trusted', name: 'Seen But Not Trusted', control: 'Confidence Control', color: 'bg-yellow-100 border-yellow-300 text-yellow-800' },
  { id: 'Still Compared', name: 'Trusted But Still Compared', control: 'Comparison Control', color: 'bg-blue-100 border-blue-300 text-blue-800' },
  { id: 'No Action', name: 'Intended Choice, No Action', control: 'Momentum Control', color: 'bg-purple-100 border-purple-300 text-purple-800' }
];

export default function App() {
  const [clients, setClients] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [activeClientId, setActiveClientId] = useState(null);
  const [activePhase, setActivePhase] = useState('preSprint');
  const [expandedSections, setExpandedSections] = useState({});
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientStartDate, setNewClientStartDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Load clients and tasks from Airtable
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load clients
      const clientsData = await airtableFetch(CLIENTS_TABLE);
      const loadedClients = clientsData.records.map(record => ({
        id: record.id,
        name: record.fields.Name || '',
        startDate: record.fields['Start Date'] || '',
        status: record.fields.Status || 'Active',
        failureMode: record.fields['Failure Mode'] || null
      }));
      setClients(loadedClients);

      // Load tasks
      const tasksData = await airtableFetch(TASKS_TABLE);
      const loadedTasks = tasksData.records.map(record => ({
        id: record.id,
        clientId: record.fields.Client?.[0] || null,
        taskId: record.fields['Task ID'] || '',
        completed: record.fields.Completed || false,
        completedAt: record.fields['Completed Date'] || null
      }));
      setTasks(loadedTasks);

    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load data from Airtable. Check your API key and Base ID.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activeClient = clients.find(c => c.id === activeClientId);

  // Get completed status for a task
  const isTaskCompleted = (taskId) => {
    if (!activeClientId) return false;
    const task = tasks.find(t => t.clientId === activeClientId && t.taskId === taskId);
    return task?.completed || false;
  };

  // Create new client
  const createNewClient = async () => {
    if (!newClientName.trim()) return;
    
    try {
      setSaving(true);
      const result = await airtableFetch(CLIENTS_TABLE, {
        method: 'POST',
        body: JSON.stringify({
          records: [{
            fields: {
              Name: newClientName.trim(),
              'Start Date': newClientStartDate || new Date().toISOString().split('T')[0],
              Status: 'Active'
            }
          }]
        })
      });
      
      const newClient = {
        id: result.records[0].id,
        name: result.records[0].fields.Name,
        startDate: result.records[0].fields['Start Date'],
        status: result.records[0].fields.Status,
        failureMode: null
      };
      
      setClients([...clients, newClient]);
      setActiveClientId(newClient.id);
      setNewClientName('');
      setNewClientStartDate('');
      setShowNewClientModal(false);
    } catch (err) {
      console.error('Failed to create client:', err);
      setError('Failed to create client');
    } finally {
      setSaving(false);
    }
  };

  // Delete client
  const deleteClient = async (clientId) => {
    if (!confirm('Delete this client and all their tasks? This cannot be undone.')) return;
    
    try {
      setSaving(true);
      
      // Delete all tasks for this client
      const clientTasks = tasks.filter(t => t.clientId === clientId);
      for (const task of clientTasks) {
        await airtableFetch(`${TASKS_TABLE}/${task.id}`, { method: 'DELETE' });
      }
      
      // Delete the client
      await airtableFetch(`${CLIENTS_TABLE}/${clientId}`, { method: 'DELETE' });
      
      setClients(clients.filter(c => c.id !== clientId));
      setTasks(tasks.filter(t => t.clientId !== clientId));
      
      if (activeClientId === clientId) {
        setActiveClientId(null);
      }
    } catch (err) {
      console.error('Failed to delete client:', err);
      setError('Failed to delete client');
    } finally {
      setSaving(false);
    }
  };

  // Toggle task completion
  const toggleItem = async (taskId) => {
    if (!activeClientId) return;
    
    const existingTask = tasks.find(t => t.clientId === activeClientId && t.taskId === taskId);
    const newCompleted = !existingTask?.completed;
    
    try {
      setSaving(true);
      
      if (existingTask) {
        // Update existing task
        await airtableFetch(`${TASKS_TABLE}/${existingTask.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            fields: {
              Completed: newCompleted,
              'Completed Date': newCompleted ? new Date().toISOString().split('T')[0] : null
            }
          })
        });
        
        setTasks(tasks.map(t => 
          t.id === existingTask.id 
            ? { ...t, completed: newCompleted, completedAt: newCompleted ? new Date().toISOString().split('T')[0] : null }
            : t
        ));
      } else {
        // Create new task record
        const result = await airtableFetch(TASKS_TABLE, {
          method: 'POST',
          body: JSON.stringify({
            records: [{
              fields: {
                Client: [activeClientId],
                'Task ID': taskId,
                Completed: true,
                'Completed Date': new Date().toISOString().split('T')[0]
              }
            }]
          })
        });
        
        const newTask = {
          id: result.records[0].id,
          clientId: activeClientId,
          taskId: taskId,
          completed: true,
          completedAt: new Date().toISOString().split('T')[0]
        };
        
        setTasks([...tasks, newTask]);
      }
    } catch (err) {
      console.error('Failed to update task:', err);
      setError('Failed to update task');
    } finally {
      setSaving(false);
    }
  };

  // Set failure mode
  const setFailureMode = async (modeId) => {
    if (!activeClient) return;
    
    try {
      setSaving(true);
      await airtableFetch(`${CLIENTS_TABLE}/${activeClientId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          fields: {
            'Failure Mode': modeId
          }
        })
      });
      
      setClients(clients.map(c => 
        c.id === activeClientId ? { ...c, failureMode: modeId } : c
      ));
    } catch (err) {
      console.error('Failed to update failure mode:', err);
      setError('Failed to update failure mode');
    } finally {
      setSaving(false);
    }
  };

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const getPhaseProgress = (phase) => {
    if (!activeClientId) return { completed: 0, total: 0, percent: 0 };
    
    let completed = 0;
    let total = 0;
    
    phase.sections.forEach(sectionId => {
      const section = sprintTemplate[sectionId];
      if (section) {
        section.items.forEach(item => {
          total++;
          if (isTaskCompleted(item.id)) completed++;
        });
      }
    });
    
    return { completed, total, percent: total > 0 ? Math.round((completed / total) * 100) : 0 };
  };

  const getTotalProgress = () => {
    if (!activeClientId) return { completed: 0, total: 0, percent: 0 };
    
    let completed = 0;
    let total = 0;
    
    Object.values(sprintTemplate).forEach(section => {
      section.items.forEach(item => {
        total++;
        if (isTaskCompleted(item.id)) completed++;
      });
    });
    
    return { completed, total, percent: total > 0 ? Math.round((completed / total) * 100) : 0 };
  };

  const getCriticalIncomplete = () => {
    if (!activeClientId) return [];
    
    const incomplete = [];
    Object.entries(sprintTemplate).forEach(([sectionId, section]) => {
      section.items.forEach(item => {
        if (item.critical && !isTaskCompleted(item.id)) {
          incomplete.push({ ...item, section: section.title });
        }
      });
    });
    return incomplete;
  };

  const currentPhase = phases.find(p => p.id === activePhase);
  const totalProgress = getTotalProgress();
  const criticalIncomplete = getCriticalIncomplete();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading from Airtable...</p>
        </div>
      </div>
    );
  }

  if (error && clients.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Connection Error</h2>
          <p className="text-slate-600 mb-4">{error}</p>
          <button
            onClick={loadData}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 py-2 font-medium transition-colors inline-flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold">EngageEngine 30-Day Sprint</h1>
              <p className="text-slate-300 text-sm flex items-center gap-2">
                <Users className="w-4 h-4" />
                Team Tracker (Airtable Connected)
              </p>
            </div>
            
            <div className="flex items-center gap-3 flex-wrap">
              {/* Refresh */}
              <button
                onClick={loadData}
                disabled={loading}
                className="bg-slate-700 hover:bg-slate-600 rounded-lg p-2 transition-colors disabled:opacity-50"
                title="Refresh Data"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              
              {/* Saving indicator */}
              {saving && (
                <div className="flex items-center gap-2 text-slate-300 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </div>
              )}
              
              {/* Client Selector */}
              <div className="flex items-center gap-2">
                <select
                  value={activeClientId || ''}
                  onChange={(e) => setActiveClientId(e.target.value || null)}
                  className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Client...</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </select>
                
                <button
                  onClick={() => setShowNewClientModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 rounded-lg p-2 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
          
          {/* Error banner */}
          {error && (
            <div className="mt-4 bg-red-500/20 border border-red-500/50 rounded-lg px-4 py-2 text-red-200 text-sm">
              {error}
            </div>
          )}
          
          {/* Total Progress */}
          {activeClient && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-300">Overall Progress</span>
                <span className="text-sm font-medium">{totalProgress.completed} / {totalProgress.total} tasks ({totalProgress.percent}%)</span>
              </div>
              <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500"
                  style={{ width: `${totalProgress.percent}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {!activeClient ? (
        /* No Client Selected */
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-700 mb-2">No Client Selected</h2>
          <p className="text-slate-500 mb-6">Select an existing client or create a new sprint.</p>
          <button
            onClick={() => setShowNewClientModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 py-3 font-medium transition-colors inline-flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Start New Sprint
          </button>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Sidebar - Phase Navigation */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-800">{activeClient.name}</h3>
                    <button
                      onClick={() => deleteClient(activeClient.id)}
                      className="text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Started {activeClient.startDate}</p>
                </div>
                
                <div className="p-2">
                  {phases.map(phase => {
                    const progress = getPhaseProgress(phase);
                    const Icon = phase.icon;
                    const isActive = activePhase === phase.id;
                    
                    return (
                      <button
                        key={phase.id}
                        onClick={() => setActivePhase(phase.id)}
                        className={`w-full text-left p-3 rounded-lg mb-1 transition-all ${
                          isActive 
                            ? 'bg-slate-100 border border-slate-200' 
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${phase.color} flex items-center justify-center flex-shrink-0`}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-slate-800 text-sm">{phase.name}</div>
                            <div className="text-xs text-slate-500 truncate">{phase.subtitle}</div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className={`text-sm font-semibold ${progress.percent === 100 ? 'text-emerald-600' : 'text-slate-600'}`}>
                              {progress.percent}%
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full bg-gradient-to-r ${phase.color} transition-all duration-300`}
                            style={{ width: `${progress.percent}%` }}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
                
                {/* Failure Mode Selector */}
                <div className="p-4 border-t border-gray-100">
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Failure Mode</h4>
                  <div className="space-y-2">
                    {failureModes.map(mode => (
                      <button
                        key={mode.id}
                        onClick={() => setFailureMode(mode.id)}
                        className={`w-full text-left p-2 rounded-lg border text-xs transition-all ${
                          activeClient.failureMode === mode.id
                            ? mode.color + ' border-2'
                            : 'bg-white border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="font-medium">{mode.name}</div>
                        {activeClient.failureMode === mode.id && (
                          <div className="text-xs opacity-75 mt-0.5">→ {mode.control}</div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Critical Items Warning */}
              {criticalIncomplete.length > 0 && (
                <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-amber-700 mb-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm font-semibold">{criticalIncomplete.length} Critical Items</span>
                  </div>
                  <div className="space-y-1">
                    {criticalIncomplete.slice(0, 5).map(item => (
                      <div key={item.id} className="text-xs text-amber-600 truncate">
                        • {item.text}
                      </div>
                    ))}
                    {criticalIncomplete.length > 5 && (
                      <div className="text-xs text-amber-500">+{criticalIncomplete.length - 5} more...</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Main Content */}
            <div className="lg:col-span-9">
              {currentPhase && (
                <div className="space-y-4">
                  {/* Phase Header */}
                  <div className={`bg-gradient-to-r ${currentPhase.color} rounded-xl p-6 text-white`}>
                    <div className="flex items-center gap-4">
                      <currentPhase.icon className="w-10 h-10" />
                      <div>
                        <h2 className="text-2xl font-bold">{currentPhase.name}</h2>
                        <p className="text-white/80">{currentPhase.subtitle}</p>
                      </div>
                    </div>
                  </div>

                  {/* Sections */}
                  {currentPhase.sections.map(sectionId => {
                    const section = sprintTemplate[sectionId];
                    if (!section) return null;
                    
                    const isExpanded = expandedSections[sectionId] !== false;
                    const sectionCompleted = section.items.filter(item => isTaskCompleted(item.id)).length;
                    const sectionTotal = section.items.length;
                    const sectionPercent = Math.round((sectionCompleted / sectionTotal) * 100);
                    
                    return (
                      <div key={sectionId} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <button
                          onClick={() => toggleSection(sectionId)}
                          className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {isExpanded ? (
                              <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
                            ) : (
                              <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
                            )}
                            <h3 className="font-semibold text-slate-800 text-left">{section.title}</h3>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span className={`text-sm font-medium ${sectionPercent === 100 ? 'text-emerald-600' : 'text-slate-500'}`}>
                              {sectionCompleted}/{sectionTotal}
                            </span>
                            <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all duration-300 ${sectionPercent === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                style={{ width: `${sectionPercent}%` }}
                              />
                            </div>
                          </div>
                        </button>
                        
                        {isExpanded && (
                          <div className="border-t border-gray-100 p-4">
                            <div className="space-y-2">
                              {section.items.map(item => {
                                const completed = isTaskCompleted(item.id);
                                return (
                                  <button
                                    key={item.id}
                                    onClick={() => toggleItem(item.id)}
                                    disabled={saving}
                                    className={`w-full flex items-start gap-3 p-3 rounded-lg transition-all text-left ${
                                      completed
                                        ? 'bg-emerald-50 hover:bg-emerald-100'
                                        : 'bg-slate-50 hover:bg-slate-100'
                                    } ${saving ? 'opacity-50' : ''}`}
                                  >
                                    {completed ? (
                                      <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                                    ) : (
                                      <Circle className="w-5 h-5 text-slate-300 flex-shrink-0 mt-0.5" />
                                    )}
                                    <span className={`text-sm ${
                                      completed ? 'text-emerald-800 line-through' : 'text-slate-700'
                                    }`}>
                                      {item.text}
                                      {item.critical && !completed && (
                                        <span className="ml-2 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium">
                                          CRITICAL
                                        </span>
                                      )}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Client Modal */}
      {showNewClientModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-slate-800">Start New Sprint</h2>
              <p className="text-sm text-slate-500 mt-1">Create a new client sprint tracker</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Client Name</label>
                <input
                  type="text"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="e.g., Austin Drilling"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && createNewClient()}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Sprint Start Date</label>
                <input
                  type="date"
                  value={newClientStartDate}
                  onChange={(e) => setNewClientStartDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="p-6 bg-slate-50 flex justify-end gap-3">
              <button
                onClick={() => setShowNewClientModal(false)}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createNewClient}
                disabled={!newClientName.trim() || saving}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg px-6 py-2 font-medium transition-colors inline-flex items-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Create Sprint
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
