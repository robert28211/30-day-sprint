import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, Circle, ChevronDown, ChevronRight, AlertTriangle, Target, Zap, Shield, TrendingUp, Building2, Settings, Plus, Trash2, RefreshCw, Loader2, Users, MessageSquare, X, User, Briefcase, Calendar, Clock, ClipboardList } from 'lucide-react';

const AIRTABLE_API_KEY = import.meta.env.VITE_AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = import.meta.env.VITE_AIRTABLE_BASE_ID;
const CLIENTS_TABLE = 'Clients';
const TASKS_TABLE = 'Tasks';
const JOBS_TABLE = 'Jobs';
const JOB_TEMPLATES_TABLE = 'Job Templates';

const airtableFetch = async (table, options = {}) => {
  const tablePart = table.includes('/') ? table : encodeURIComponent(table);
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${tablePart}${options.params || ''}`;
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

const updateRecord = async (table, recordId, fields) => {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(table)}`;
  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      records: [{ id: recordId, fields: fields }]
    })
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
      { id: "vendasta-chatbot", text: "Activate Chatbot" },
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
    title: "Technical Audit",
    items: [
      { id: "speed-test", text: "Run PageSpeed Insights audit", critical: true },
      { id: "mobile-test", text: "Mobile responsiveness check" },
      { id: "ssl-check", text: "SSL certificate verification" },
      { id: "indexing", text: "Google Search Console indexing status" },
      { id: "broken-links", text: "Broken link scan" },
      { id: "schema", text: "Schema markup review" }
    ]
  },
  week1Speed: {
    title: "Speed Optimization",
    items: [
      { id: "image-opt", text: "Image compression and optimization" },
      { id: "caching", text: "Browser caching implementation" },
      { id: "minify", text: "CSS/JS minification" },
      { id: "cdn", text: "CDN setup (if applicable)" }
    ]
  },
  week1Listings: {
    title: "Listings Audit",
    items: [
      { id: "nap-audit", text: "NAP consistency audit", critical: true },
      { id: "gbp-optimize", text: "Google Business Profile optimization" },
      { id: "categories", text: "Category selection review" },
      { id: "photos-gbp", text: "GBP photo upload" },
      { id: "services-gbp", text: "Services/Products setup in GBP" }
    ]
  },
  week1Diagnosis: {
    title: "Initial Diagnosis",
    items: [
      { id: "competitor-review", text: "Top 3 competitor analysis" },
      { id: "keyword-baseline", text: "Current keyword rankings baseline" },
      { id: "traffic-baseline", text: "Traffic baseline documentation" },
      { id: "conversion-baseline", text: "Conversion baseline setup" }
    ]
  },
  week2Headlines: {
    title: "Messaging Overhaul",
    items: [
      { id: "headline-audit", text: "Current headline effectiveness audit" },
      { id: "value-prop", text: "Value proposition refinement", critical: true },
      { id: "headline-variants", text: "Create 5+ headline variants" },
      { id: "subheadline", text: "Supporting subheadline copy" }
    ]
  },
  week2Offer: {
    title: "Offer Development",
    items: [
      { id: "offer-audit", text: "Current offer analysis" },
      { id: "offer-create", text: "Develop irresistible offer", critical: true },
      { id: "urgency", text: "Add urgency/scarcity elements" },
      { id: "guarantee", text: "Guarantee formulation" }
    ]
  },
  week2Landing: {
    title: "Landing Page Optimization",
    items: [
      { id: "hero-section", text: "Hero section redesign" },
      { id: "benefit-blocks", text: "Benefit blocks creation" },
      { id: "social-proof-section", text: "Social proof section" },
      { id: "cta-placement", text: "CTA button optimization" }
    ]
  },
  week3Reviews: {
    title: "Review Generation",
    items: [
      { id: "review-audit", text: "Current review audit", critical: true },
      { id: "review-response", text: "Respond to existing reviews" },
      { id: "review-system", text: "Implement review request system" },
      { id: "review-training", text: "Train client on review requests" }
    ]
  },
  week3Proof: {
    title: "Social Proof Assets",
    items: [
      { id: "testimonial-collect", text: "Collect written testimonials" },
      { id: "case-study", text: "Create 1 case study" },
      { id: "before-after", text: "Before/after examples" },
      { id: "credentials", text: "Credentials/certifications display" }
    ]
  },
  week3Guarantee: {
    title: "Trust Elements",
    items: [
      { id: "guarantee-badge", text: "Guarantee badge creation" },
      { id: "trust-badges", text: "Trust badges implementation" },
      { id: "about-page", text: "About page humanization" },
      { id: "team-photos", text: "Team photos (if applicable)" }
    ]
  },
  week4CTA: {
    title: "Conversion Optimization",
    items: [
      { id: "cta-audit", text: "CTA audit and optimization", critical: true },
      { id: "form-optimization", text: "Form field optimization" },
      { id: "click-to-call", text: "Click-to-call implementation" },
      { id: "chat-widget", text: "Chat widget setup (if applicable)" }
    ]
  },
  week4Retargeting: {
    title: "Retargeting Setup",
    items: [
      { id: "pixel-install", text: "Facebook pixel installation" },
      { id: "google-remarketing", text: "Google remarketing tag" },
      { id: "audience-creation", text: "Custom audience creation" },
      { id: "retargeting-ads", text: "Retargeting ad creation" }
    ]
  },
  week4Launch: {
    title: "Campaign Launch",
    items: [
      { id: "campaign-structure", text: "Campaign structure finalization" },
      { id: "ad-copy-final", text: "Final ad copy approval" },
      { id: "budget-confirm", text: "Budget confirmation" },
      { id: "launch", text: "Campaign launch", critical: true }
    ]
  },
  week4Handoff: {
    title: "Client Handoff",
    items: [
      { id: "dashboard-walkthrough", text: "Reporting dashboard walkthrough" },
      { id: "expectations", text: "Set ongoing expectations" },
      { id: "communication", text: "Establish communication cadence" },
      { id: "documentation", text: "Handoff documentation complete" }
    ]
  }
};

const phases = [
  { id: 'preSprint', name: 'Pre-Sprint', subtitle: 'Foundation Setup', icon: Target, color: 'from-slate-500 to-slate-600', sections: ['preSprintAccess', 'preSprintVendasta', 'preSprintOviond', 'preSprintAssets'] },
  { id: 'week1', name: 'Week 1', subtitle: 'Technical Foundation', icon: Settings, color: 'from-blue-500 to-blue-600', sections: ['week1Technical', 'week1Speed', 'week1Listings', 'week1Diagnosis'] },
  { id: 'week2', name: 'Week 2', subtitle: 'Messaging & Positioning', icon: Zap, color: 'from-purple-500 to-purple-600', sections: ['week2Headlines', 'week2Offer', 'week2Landing'] },
  { id: 'week3', name: 'Week 3', subtitle: 'Social Proof & Trust', icon: Shield, color: 'from-emerald-500 to-emerald-600', sections: ['week3Reviews', 'week3Proof', 'week3Guarantee'] },
  { id: 'week4', name: 'Week 4', subtitle: 'Conversion & Launch', icon: TrendingUp, color: 'from-orange-500 to-orange-600', sections: ['week4CTA', 'week4Retargeting', 'week4Launch', 'week4Handoff'] },
  { id: 'custom', name: 'Custom', subtitle: 'Added Tasks', icon: Plus, color: 'from-pink-500 to-pink-600', sections: ['customTasks'] }
];

const clientColors = [
  { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-800', dot: 'bg-blue-500' },
  { bg: 'bg-emerald-100', border: 'border-emerald-300', text: 'text-emerald-800', dot: 'bg-emerald-500' },
  { bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-800', dot: 'bg-purple-500' },
  { bg: 'bg-orange-100', border: 'border-orange-300', text: 'text-orange-800', dot: 'bg-orange-500' },
  { bg: 'bg-pink-100', border: 'border-pink-300', text: 'text-pink-800', dot: 'bg-pink-500' },
  { bg: 'bg-cyan-100', border: 'border-cyan-300', text: 'text-cyan-800', dot: 'bg-cyan-500' },
];

const categoryColors = {
  'Digital Ads': { bg: 'bg-blue-100', text: 'text-blue-800' },
  'Traditional Media': { bg: 'bg-purple-100', text: 'text-purple-800' },
  'Website': { bg: 'bg-emerald-100', text: 'text-emerald-800' },
  'Social Media': { bg: 'bg-pink-100', text: 'text-pink-800' },
  'Email': { bg: 'bg-amber-100', text: 'text-amber-800' },
  'SEO': { bg: 'bg-cyan-100', text: 'text-cyan-800' },
  'Tech Setup': { bg: 'bg-slate-100', text: 'text-slate-800' },
};

const jobTypeColors = {
  'Sprint': { bg: 'bg-emerald-100', text: 'text-emerald-800' },
  'Recurring': { bg: 'bg-green-100', text: 'text-green-800' },
  'Job': { bg: 'bg-orange-100', text: 'text-orange-800' },
};

export default function App() {
  const [appMode, setAppMode] = useState(() => localStorage.getItem('engageengine-mode') || 'sprint');
  const [clients, setClients] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [jobTemplates, setJobTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [userName, setUserName] = useState(() => localStorage.getItem('engageengine-username') || '');
  const [showUserModal, setShowUserModal] = useState(false);
  const [activeClientId, setActiveClientId] = useState(null);
  const [activePhase, setActivePhase] = useState('preSprint');
  const [expandedSections, setExpandedSections] = useState({});
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientStartDate, setNewClientStartDate] = useState('');
  const [customTasks, setCustomTasks] = useState([]);
  const [viewMode, setViewMode] = useState('byClient');
  const [allClientsSort, setAllClientsSort] = useState('task');
  const [activeJobId, setActiveJobId] = useState(null);
  const [showNewJobModal, setShowNewJobModal] = useState(false);
  const [showAddJobTaskModal, setShowAddJobTaskModal] = useState(false);
  const [newJobName, setNewJobName] = useState('');
  const [newJobTemplate, setNewJobTemplate] = useState('');
  const [newJobType, setNewJobType] = useState('Job');
  const [newJobTaskText, setNewJobTaskText] = useState('');
  const [newJobTaskDueDate, setNewJobTaskDueDate] = useState('');
  const [newJobTaskAssignee, setNewJobTaskAssignee] = useState('');
  const [jobViewMode, setJobViewMode] = useState('byClient');
  const [expandedJobs, setExpandedJobs] = useState({});

  useEffect(() => { localStorage.setItem('engageengine-mode', appMode); }, [appMode]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const clientsData = await airtableFetch(CLIENTS_TABLE);
      const loadedClients = clientsData.records.map(r => ({
        id: r.id, name: r.fields.Name || '', startDate: r.fields['Start Date'] || '', status: r.fields.Status || 'Active', hasSprint: r.fields['Has Sprint'] || false
      }));
      setClients(loadedClients.sort((a, b) => a.name.localeCompare(b.name)));

      const tasksData = await airtableFetch(TASKS_TABLE);
      const loadedTasks = tasksData.records.map(r => ({
        id: r.id, clientId: r.fields.Client?.[0] || null, jobId: r.fields.Job?.[0] || null,
        taskId: r.fields['Task ID'] || '', completed: r.fields.Completed || false,
        completedAt: r.fields['Completed Date'] || null, completedBy: r.fields['Completed By'] || null,
        notes: r.fields.Notes || '', assignedTo: r.fields['Assigned To'] || '', dueDate: r.fields['Due Date'] || '',
        isCustom: r.fields['Task ID']?.startsWith('custom-') || false,
        customText: r.fields['Task ID']?.startsWith('custom-') ? (r.fields.Notes?.split('|||')[0] || '') : ''
      }));
      setTasks(loadedTasks);
      setCustomTasks(loadedTasks.filter(t => t.isCustom && t.clientId && !t.jobId).map(t => ({ id: t.taskId, text: t.customText, clientId: t.clientId })));

      const templatesData = await airtableFetch(JOB_TEMPLATES_TABLE);
      setJobTemplates(templatesData.records.map(r => ({ id: r.id, name: r.fields.Name || '', category: r.fields.Category || '', subTasks: r.fields['Sub-Tasks'] || '' })));

      const jobsData = await airtableFetch(JOBS_TABLE);
      const loadedJobs = jobsData.records.map(r => ({
        id: r.id, name: r.fields.Name || '', clientId: r.fields.Client?.[0] || null, templateId: r.fields.Template?.[0] || null,
        type: r.fields.Type || 'Job', status: r.fields.Status || 'Active', created: r.fields.Created || ''
      }));
      setJobs(loadedJobs);
      const expanded = {}; loadedJobs.forEach(j => { expanded[j.id] = true; }); setExpandedJobs(expanded);
    } catch (err) {
      console.error('Failed to load:', err);
      setError('Failed to load data from Airtable.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { if (!userName) setShowUserModal(true); }, [userName]);

  const saveUserName = (name) => { localStorage.setItem('engageengine-username', name); setUserName(name); setShowUserModal(false); };
  const activeClient = clients.find(c => c.id === activeClientId);
  const sprintClients = clients.filter(c => c.hasSprint);
  const getClientColor = (clientId) => { const idx = clients.findIndex(c => c.id === clientId); return clientColors[idx % clientColors.length]; };

  // Sprint functions
  const getTaskRecord = (taskId, clientId = null) => {
    const cid = clientId || activeClientId;
    return cid ? tasks.find(t => t.clientId === cid && t.taskId === taskId && !t.jobId) : null;
  };
  const isTaskCompleted = (taskId, clientId = null) => getTaskRecord(taskId, clientId)?.completed || false;
  const getCompletedBy = (taskId, clientId = null) => getTaskRecord(taskId, clientId)?.completedBy || null;

  const toggleSprintItem = async (taskId, clientId = null) => {
    const targetClientId = clientId || activeClientId;
    if (!targetClientId || !userName) { if (!userName) setShowUserModal(true); return; }
    const existingTask = tasks.find(t => t.clientId === targetClientId && t.taskId === taskId && !t.jobId);
    const newCompleted = !existingTask?.completed;
    try {
      setSaving(true);
      if (existingTask) {
        const updateFields = { Completed: newCompleted };
        if (newCompleted) { updateFields['Completed Date'] = new Date().toISOString().split('T')[0]; updateFields['Completed By'] = userName; }
        await updateRecord(TASKS_TABLE, existingTask.id, updateFields);
        setTasks(tasks.map(t => t.id === existingTask.id ? { ...t, completed: newCompleted, completedAt: newCompleted ? new Date().toISOString().split('T')[0] : null, completedBy: newCompleted ? userName : null } : t));
      } else {
        const result = await airtableFetch(TASKS_TABLE, { method: 'POST', body: JSON.stringify({ records: [{ fields: { Client: [targetClientId], 'Task ID': taskId, Completed: true, 'Completed Date': new Date().toISOString().split('T')[0], 'Completed By': userName } }] }) });
        setTasks([...tasks, { id: result.records[0].id, clientId: targetClientId, jobId: null, taskId, completed: true, completedAt: new Date().toISOString().split('T')[0], completedBy: userName, notes: '' }]);
      }
    } catch (err) { console.error('Failed:', err); setError('Failed to update task'); } finally { setSaving(false); }
  };

  const createNewClient = async () => {
    if (!newClientName.trim()) return;
    const trimmedName = newClientName.trim();
    const existing = clients.find(c => c.name.toLowerCase() === trimmedName.toLowerCase());
    if (existing) {
      if (appMode === 'sprint' && existing.hasSprint) {
        alert(`"${existing.name}" already has a sprint.`);
        return;
      }
      if (appMode === 'sprint' && !existing.hasSprint) {
        if (!confirm(`"${existing.name}" already exists. Add a sprint for this client?`)) return;
        try {
          setSaving(true);
          await updateRecord(CLIENTS_TABLE, existing.id, { 'Has Sprint': true, 'Start Date': newClientStartDate || new Date().toISOString().split('T')[0] });
          setClients(clients.map(c => c.id === existing.id ? { ...c, hasSprint: true, startDate: newClientStartDate || c.startDate } : c));
          setActiveClientId(existing.id);
          setNewClientName(''); setNewClientStartDate(''); setShowNewClientModal(false);
        } catch (err) { console.error('Failed:', err); setError('Failed to update client'); } finally { setSaving(false); }
        return;
      }
      alert(`"${existing.name}" already exists.`);
      return;
    }
    try {
      setSaving(true);
      const fields = { 
        Name: trimmedName, 
        'Start Date': newClientStartDate || new Date().toISOString().split('T')[0], 
        Status: 'Active' 
      };
      if (appMode === 'sprint') {
        fields['Has Sprint'] = true;
      }
      const result = await airtableFetch(CLIENTS_TABLE, { method: 'POST', body: JSON.stringify({ records: [{ fields }] }) });
      const newClient = { id: result.records[0].id, name: result.records[0].fields.Name, startDate: result.records[0].fields['Start Date'], status: 'Active', hasSprint: appMode === 'sprint' };
      setClients([...clients, newClient].sort((a, b) => a.name.localeCompare(b.name)));
      setActiveClientId(newClient.id);
      setNewClientName(''); setNewClientStartDate(''); setShowNewClientModal(false);
    } catch (err) { console.error('Failed:', err); setError('Failed to create client'); } finally { setSaving(false); }
  };

  const deleteClient = async (clientId) => {
    if (appMode === 'sprint') {
      if (!confirm('SPRINT REMOVE: This only removes the sprint. Client stays in Job Tracker.')) return;
      try {
        setSaving(true);
        await updateRecord(CLIENTS_TABLE, clientId, { 'Has Sprint': false });
        const sprintTasks = tasks.filter(t => t.clientId === clientId && !t.jobId);
        for (const task of sprintTasks) { await airtableFetch(`${TASKS_TABLE}/${task.id}`, { method: 'DELETE' }); }
        if (activeClientId === clientId) setActiveClientId(null);
        setSaving(false);
        loadData();
      } catch (err) { console.error('Sprint remove failed:', err); setError('Failed to remove sprint'); setSaving(false); }
    } else {
      if (!confirm('FULL DELETE: This will permanently delete this client, all jobs, and all tasks. Cannot be undone.')) return;
      try {
        setSaving(true);
        for (const task of tasks.filter(t => t.clientId === clientId)) { await airtableFetch(`${TASKS_TABLE}/${task.id}`, { method: 'DELETE' }); }
        for (const job of jobs.filter(j => j.clientId === clientId)) { await airtableFetch(`${JOBS_TABLE}/${job.id}`, { method: 'DELETE' }); }
        await airtableFetch(`${CLIENTS_TABLE}/${clientId}`, { method: 'DELETE' });
        setClients(clients.filter(c => c.id !== clientId)); setTasks(tasks.filter(t => t.clientId !== clientId)); setJobs(jobs.filter(j => j.clientId !== clientId));
        if (activeClientId === clientId) setActiveClientId(null);
      } catch (err) { console.error('Full delete failed:', err); setError('Failed to delete'); } finally { setSaving(false); }
    }
  };

  const getClientCustomTasks = () => customTasks.filter(t => t.clientId === activeClientId);
  const toggleSection = (sectionId) => setExpandedSections(prev => ({ ...prev, [sectionId]: prev[sectionId] === false ? true : false }));

  const getPhaseProgress = (phase) => {
    if (!activeClientId) return { completed: 0, total: 0, percent: 0 };
    let completed = 0, total = 0;
    phase.sections.forEach(key => {
      const section = sprintTemplate[key];
      if (!section) return;
      if (key === 'customTasks') { getClientCustomTasks().forEach(item => { total++; if (isTaskCompleted(item.id)) completed++; }); }
      else { section.items.forEach(item => { total++; if (isTaskCompleted(item.id)) completed++; }); }
    });
    return { completed, total, percent: total > 0 ? Math.round((completed / total) * 100) : 0 };
  };

  const getTotalProgress = () => {
    if (!activeClientId) return { completed: 0, total: 0, percent: 0 };
    let completed = 0, total = 0;
    phases.forEach(phase => {
      phase.sections.forEach(key => {
        const section = sprintTemplate[key];
        if (!section) return;
        if (key === 'customTasks') { getClientCustomTasks().forEach(item => { total++; if (isTaskCompleted(item.id)) completed++; }); }
        else { section.items.forEach(item => { total++; if (isTaskCompleted(item.id)) completed++; }); }
      });
    });
    return { completed, total, percent: total > 0 ? Math.round((completed / total) * 100) : 0 };
  };

  // Job tracker functions
  const [showArchived, setShowArchived] = useState(false);
  const clientJobs = jobs.filter(j => j.clientId === activeClientId && (showArchived || j.status !== 'Complete'));
  const archivedCount = jobs.filter(j => j.clientId === activeClientId && j.status === 'Complete').length;
  const getJobTasks = (jobId) => tasks.filter(t => t.jobId === jobId);

  const createJob = async () => {
    if (!activeClientId || !newJobName.trim()) return;
    try {
      setSaving(true);
      const jobFields = {
        Name: newJobName.trim(),
        Client: [activeClientId],
        Type: newJobType,
        Status: 'Active',
        Created: new Date().toISOString().split('T')[0]
      };
      if (newJobTemplate) {
        jobFields.Template = [newJobTemplate];
      }
      const jobResult = await airtableFetch(JOBS_TABLE, { 
        method: 'POST', 
        body: JSON.stringify({ records: [{ fields: jobFields }] }) 
      });
      const newJob = { id: jobResult.records[0].id, name: jobResult.records[0].fields.Name, clientId: activeClientId, templateId: newJobTemplate || null, type: newJobType, status: 'Active', created: new Date().toISOString().split('T')[0] };
      setJobs([...jobs, newJob]);
      setExpandedJobs({ ...expandedJobs, [newJob.id]: true });

      if (newJobTemplate) {
        const template = jobTemplates.find(t => t.id === newJobTemplate);
        if (template?.subTasks) {
          for (const taskText of template.subTasks.split('\n').filter(l => l.trim())) {
            const taskFields = {
              Client: [activeClientId],
              Job: [newJob.id],
              'Task ID': `job-${newJob.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              Completed: false,
              Notes: taskText.trim()
            };
            const taskResult = await airtableFetch(TASKS_TABLE, { 
              method: 'POST', 
              body: JSON.stringify({ records: [{ fields: taskFields }] }) 
            });
            setTasks(prev => [...prev, { id: taskResult.records[0].id, clientId: activeClientId, jobId: newJob.id, taskId: taskResult.records[0].fields['Task ID'], completed: false, completedAt: null, completedBy: null, notes: taskText.trim(), assignedTo: '', dueDate: '' }]);
          }
        }
      }
      setShowNewJobModal(false); setNewJobName(''); setNewJobTemplate(''); setNewJobType('Job'); setActiveJobId(newJob.id);
    } catch (err) { console.error('Failed:', err); setError('Failed to create job'); } finally { setSaving(false); }
  };

  const addTaskToJob = async () => {
    if (!activeJobId || !newJobTaskText.trim()) return;
    try {
      setSaving(true);
      const taskFields = {
        Client: [activeClientId],
        Job: [activeJobId],
        'Task ID': `manual-${activeJobId}-${Date.now()}`,
        Completed: false,
        Notes: newJobTaskText.trim()
      };
      if (newJobTaskAssignee) {
        taskFields['Assigned To'] = newJobTaskAssignee;
      }
      if (newJobTaskDueDate) {
        taskFields['Due Date'] = newJobTaskDueDate;
      }
      const taskResult = await airtableFetch(TASKS_TABLE, { 
        method: 'POST', 
        body: JSON.stringify({ records: [{ fields: taskFields }] }) 
      });
      setTasks([...tasks, { id: taskResult.records[0].id, clientId: activeClientId, jobId: activeJobId, taskId: taskResult.records[0].fields['Task ID'], completed: false, completedAt: null, completedBy: null, notes: newJobTaskText.trim(), assignedTo: newJobTaskAssignee, dueDate: newJobTaskDueDate }]);
      setShowAddJobTaskModal(false); setNewJobTaskText(''); setNewJobTaskAssignee(''); setNewJobTaskDueDate('');
    } catch (err) { console.error('Failed:', err); setError('Failed to add task'); } finally { setSaving(false); }
  };

  const toggleJobTask = async (taskId) => {
    if (!userName) { setShowUserModal(true); return; }
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const newCompleted = !task.completed;
    try {
      setSaving(true);
      const updateFields = { Completed: newCompleted };
      if (newCompleted) { updateFields['Completed Date'] = new Date().toISOString().split('T')[0]; updateFields['Completed By'] = userName; }
      await updateRecord(TASKS_TABLE, taskId, updateFields);
      setTasks(tasks.map(t => t.id === taskId ? { ...t, completed: newCompleted, completedAt: newCompleted ? new Date().toISOString().split('T')[0] : null, completedBy: newCompleted ? userName : null } : t));
    } catch (err) { console.error('Failed:', err); setError('Failed to update'); } finally { setSaving(false); }
  };

  const updateTaskAssignee = async (taskId, assignee) => { try { setSaving(true); await updateRecord(TASKS_TABLE, taskId, { 'Assigned To': assignee }); setTasks(tasks.map(t => t.id === taskId ? { ...t, assignedTo: assignee } : t)); } catch (err) { console.error('Failed:', err); } finally { setSaving(false); } };
  const updateTaskDueDate = async (taskId, dueDate) => { try { setSaving(true); await updateRecord(TASKS_TABLE, taskId, { 'Due Date': dueDate }); setTasks(tasks.map(t => t.id === taskId ? { ...t, dueDate } : t)); } catch (err) { console.error('Failed:', err); } finally { setSaving(false); } };

  const deleteJobTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    try { setSaving(true); await airtableFetch(`${TASKS_TABLE}/${taskId}`, { method: 'DELETE' }); setTasks(tasks.filter(t => t.id !== taskId)); } catch (err) { console.error('Failed:', err); setError('Failed to delete'); } finally { setSaving(false); }
  };

  const deleteJob = async (jobId) => {
    if (!confirm('Delete this job and all tasks?')) return;
    try {
      setSaving(true);
      for (const task of tasks.filter(t => t.jobId === jobId)) { await airtableFetch(`${TASKS_TABLE}/${task.id}`, { method: 'DELETE' }); }
      await airtableFetch(`${JOBS_TABLE}/${jobId}`, { method: 'DELETE' });
      setTasks(tasks.filter(t => t.jobId !== jobId)); setJobs(jobs.filter(j => j.id !== jobId));
      if (activeJobId === jobId) setActiveJobId(null);
    } catch (err) { console.error('Failed:', err); setError('Failed to delete'); } finally { setSaving(false); }
  };

  const toggleJobComplete = async (jobId) => {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;
    const newStatus = job.status === 'Active' ? 'Complete' : 'Active';
    try { setSaving(true); await updateRecord(JOBS_TABLE, jobId, { Status: newStatus }); setJobs(jobs.map(j => j.id === jobId ? { ...j, status: newStatus } : j)); } catch (err) { console.error('Failed:', err); } finally { setSaving(false); }
  };

  const getMyTasks = () => tasks.filter(t => t.assignedTo && t.assignedTo.toLowerCase() === userName.toLowerCase() && !t.completed && t.jobId);
  const getDueSoonTasks = () => {
    const today = new Date();
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    return tasks.filter(t => t.dueDate && !t.completed && t.jobId && new Date(t.dueDate) <= weekFromNow).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  };

  const templatesByCategory = jobTemplates.reduce((acc, t) => { const cat = t.category || 'Other'; if (!acc[cat]) acc[cat] = []; acc[cat].push(t); return acc; }, {});
  const currentPhase = phases.find(p => p.id === activePhase);
  const totalProgress = getTotalProgress();

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-center"><Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" /><p className="text-slate-600">Loading...</p></div></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className={`text-white ${appMode === 'sprint' ? 'bg-gradient-to-r from-slate-800 to-slate-900' : 'bg-gradient-to-r from-slate-800 to-slate-900'}`}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center bg-black/20 rounded-lg p-1">
                <button onClick={() => setAppMode('sprint')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${appMode === 'sprint' ? 'bg-white text-slate-800' : 'text-white/70 hover:text-white'}`}>
                  <ClipboardList className="w-4 h-4" />Sprint Tracker
                </button>
                <button onClick={() => setAppMode('jobs')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${appMode === 'jobs' ? 'bg-white text-slate-800' : 'text-white/70 hover:text-white'}`}>
                  <Briefcase className="w-4 h-4" />Job Tracker
                </button>
              </div>
              {userName && <button onClick={() => setShowUserModal(true)} className="bg-white/10 hover:bg-white/20 px-3 py-1 rounded text-sm">{userName}</button>}
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <button onClick={loadData} disabled={loading} className="bg-white/10 hover:bg-white/20 rounded-lg p-2 transition-colors"><RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} /></button>
              {saving && <div className="flex items-center gap-2 text-white/70 text-sm"><Loader2 className="w-4 h-4 animate-spin" />Saving...</div>}
              
              {appMode === 'sprint' && (
                <div className="flex items-center bg-white/10 rounded-lg p-1">
                  <button onClick={() => setViewMode('byClient')} className={`px-3 py-1.5 rounded-md text-sm font-medium ${viewMode === 'byClient' ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white'}`}>By Client</button>
                  <button onClick={() => setViewMode('allClients')} className={`px-3 py-1.5 rounded-md text-sm font-medium ${viewMode === 'allClients' ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white'}`}>All Clients</button>
                </div>
              )}
              
              {appMode === 'jobs' && (
                <div className="flex items-center bg-white/10 rounded-lg p-1">
                  <button onClick={() => setJobViewMode('byClient')} className={`px-3 py-1.5 rounded-md text-sm font-medium ${jobViewMode === 'byClient' ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white'}`}>By Client</button>
                  <button onClick={() => setJobViewMode('allJobs')} className={`px-3 py-1.5 rounded-md text-sm font-medium ${jobViewMode === 'allJobs' ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white'}`}>All Jobs</button>
                  <button onClick={() => setJobViewMode('myTasks')} className={`px-3 py-1.5 rounded-md text-sm font-medium ${jobViewMode === 'myTasks' ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white'}`}>My Tasks</button>
                  <button onClick={() => setJobViewMode('dueSoon')} className={`px-3 py-1.5 rounded-md text-sm font-medium ${jobViewMode === 'dueSoon' ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white'}`}>Due Soon</button>
                </div>
              )}
              
              {appMode === 'sprint' && viewMode === 'byClient' && (
                <div className="flex items-center gap-2">
                  <select value={activeClientId || ''} onChange={(e) => setActiveClientId(e.target.value || null)} className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm">
                    <option value="">Select Client...</option>
                    {clients.filter(c => c.hasSprint).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <button onClick={() => setShowNewClientModal(true)} className="bg-blue-600 hover:bg-blue-700 rounded-lg p-2"><Plus className="w-5 h-5" /></button>
                </div>
              )}
            </div>
          </div>
          {error && <div className="mt-4 bg-red-500/20 border border-red-500/50 rounded-lg px-4 py-2 text-red-200 text-sm">{error}</div>}
        </div>
      </div>

      {/* SPRINT TRACKER */}
      {appMode === 'sprint' ? (
        viewMode === 'allClients' ? (
          <div className="max-w-7xl mx-auto px-4 py-6">
            {sprintClients.length === 0 ? (
              <div className="text-center py-16"><Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" /><h2 className="text-xl font-semibold text-slate-700 mb-2">No Clients Yet</h2><button onClick={() => setShowNewClientModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 py-3 font-medium inline-flex items-center gap-2"><Plus className="w-5 h-5" />Start New Sprint</button></div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2"><span className="text-sm text-slate-600">Group by:</span>
                    <select value={allClientsSort} onChange={(e) => setAllClientsSort(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
                      <option value="task">Task</option><option value="phase">Phase</option><option value="client">Client</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    {sprintClients.map(c => { const color = getClientColor(c.id); return <div key={c.id} className="flex items-center gap-1.5 text-sm"><div className={`w-3 h-3 rounded-full ${color.dot}`}></div><span className="text-slate-600">{c.name}</span></div>; })}
                  </div>
                </div>
                <div className="space-y-4">
                  {(() => {
                    let taskGroups = {};
                    Object.entries(sprintTemplate).forEach(([sectionId, section]) => {
                      const phase = phases.find(p => p.sections?.includes(sectionId));
                      section.items.forEach(item => {
                        if (!taskGroups[item.id]) taskGroups[item.id] = { taskId: item.id, text: item.text, critical: item.critical, sectionTitle: section.title, phaseId: phase?.id || 'preSprint', phaseName: phase?.name || 'Pre-Sprint', clients: [] };
                      });
                    });
                    Object.keys(taskGroups).forEach(taskId => {
                      sprintClients.forEach(c => {
                        const color = getClientColor(c.id);
                        taskGroups[taskId].clients.push({ clientId: c.id, clientName: c.name, clientColor: color, completed: isTaskCompleted(taskId, c.id), completedBy: getCompletedBy(taskId, c.id) });
                      });
                      taskGroups[taskId].clients.sort((a, b) => a.completed !== b.completed ? (a.completed ? 1 : -1) : a.clientName.localeCompare(b.clientName));
                    });
                    let taskList = Object.values(taskGroups);
                    taskList.forEach(t => { t.completedCount = t.clients.filter(c => c.completed).length; t.totalCount = t.clients.length; });
                    const phaseOrder = ['preSprint', 'week1', 'week2', 'week3', 'week4', 'custom'];
                    taskList.sort((a, b) => phaseOrder.indexOf(a.phaseId) - phaseOrder.indexOf(b.phaseId));
                    let grouped = {};
                    taskList.forEach(t => { const key = `${t.phaseName} - ${t.sectionTitle}`; if (!grouped[key]) grouped[key] = { tasks: [] }; grouped[key].tasks.push(t); });
                    return Object.entries(grouped).map(([groupName, groupData]) => (
                      <div key={groupName} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-4 border-b border-gray-100 bg-slate-50"><h3 className="font-semibold text-slate-800">{groupName}</h3><p className="text-sm text-slate-500">{groupData.tasks.length} tasks × {sprintClients.length} clients</p></div>
                        <div className="divide-y divide-gray-100">
                          {groupData.tasks.map((task, idx) => (
                            <div key={`${task.taskId}-${idx}`} className="p-4">
                              <div className="flex items-center gap-2 mb-3"><span className="font-medium text-slate-800">{task.text}</span>{task.critical && <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">Critical</span>}<span className="text-sm text-slate-400 ml-auto">{task.completedCount}/{task.totalCount} done</span></div>
                              <div className="space-y-2">
                                {task.clients.map(cd => (
                                  <div key={cd.clientId} className={`flex items-center gap-3 p-2 rounded-lg border ${cd.clientColor.bg} ${cd.clientColor.border}`}>
                                    <button onClick={() => toggleSprintItem(task.taskId, cd.clientId)} disabled={saving} className="flex-shrink-0">{cd.completed ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <Circle className="w-5 h-5 text-slate-400 hover:text-blue-500" />}</button>
                                    <div className={`w-2.5 h-2.5 rounded-full ${cd.clientColor.dot}`}></div>
                                    <span className={`font-medium text-sm ${cd.completed ? 'line-through text-slate-400' : cd.clientColor.text}`}>{cd.clientName}</span>
                                    {cd.completedBy && <span className="text-xs text-slate-500 flex items-center gap-1 ml-auto"><User className="w-3 h-3" />{cd.completedBy}</span>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </>
            )}
          </div>
        ) : !activeClient ? (
          <div className="max-w-2xl mx-auto px-4 py-16 text-center"><Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" /><h2 className="text-xl font-semibold text-slate-700 mb-2">No Client Selected</h2><p className="text-slate-500 mb-6">Select an existing client or create a new sprint.</p><button onClick={() => setShowNewClientModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 py-3 font-medium inline-flex items-center gap-2"><Plus className="w-5 h-5" />Start New Sprint</button></div>
        ) : (
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-3">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center justify-between"><h3 className="font-semibold text-slate-800">{activeClient.name}</h3><button onClick={() => deleteClient(activeClient.id)} className="text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button></div>
                    <p className="text-xs text-slate-500 mt-1">Started {activeClient.startDate}</p>
                    <div className="mt-3"><div className="flex items-center justify-between text-sm mb-1"><span className="text-slate-500">Progress</span><span className="font-medium">{totalProgress.percent}%</span></div><div className="h-2 bg-slate-200 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all" style={{ width: `${totalProgress.percent}%` }} /></div></div>
                  </div>
                  <div className="p-2">
                    {phases.map(phase => {
                      const progress = getPhaseProgress(phase); const Icon = phase.icon; const isActive = activePhase === phase.id;
                      if (phase.id === 'custom' && getClientCustomTasks().length === 0) return null;
                      return (
                        <button key={phase.id} onClick={() => setActivePhase(phase.id)} className={`w-full text-left p-3 rounded-lg mb-1 transition-all ${isActive ? 'bg-slate-100 border border-slate-200' : 'hover:bg-slate-50'}`}>
                          <div className="flex items-center gap-3"><div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${phase.color} flex items-center justify-center flex-shrink-0`}><Icon className="w-5 h-5 text-white" /></div><div className="flex-1 min-w-0"><div className="font-medium text-slate-800 text-sm">{phase.name}</div><div className="text-xs text-slate-500 truncate">{phase.subtitle}</div></div><div className={`text-sm font-semibold ${progress.percent === 100 ? 'text-emerald-600' : 'text-slate-600'}`}>{progress.percent}%</div></div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="lg:col-span-9">
                {currentPhase && (
                  <div className="space-y-4">
                    <div className={`bg-gradient-to-r ${currentPhase.color} rounded-xl p-6 text-white`}><div className="flex items-center gap-4"><currentPhase.icon className="w-10 h-10" /><div><h2 className="text-2xl font-bold">{currentPhase.name}</h2><p className="text-white/80">{currentPhase.subtitle}</p></div></div></div>
                    {currentPhase.sections.map(sectionId => {
                      const section = sprintTemplate[sectionId]; if (!section) return null;
                      const isExpanded = expandedSections[sectionId] !== false;
                      const sectionItems = section.items;
                      const sectionCompleted = sectionItems.filter(item => isTaskCompleted(item.id)).length;
                      const sectionTotal = sectionItems.length;
                      return (
                        <div key={sectionId} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                          <button onClick={() => toggleSection(sectionId)} className="w-full p-4 flex items-center justify-between hover:bg-slate-50">
                            <div className="flex items-center gap-3">{isExpanded ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}<h3 className="font-semibold text-slate-800">{section.title}</h3></div>
                            <div className="flex items-center gap-3"><span className={`text-sm font-medium ${sectionCompleted === sectionTotal ? 'text-emerald-600' : 'text-slate-500'}`}>{sectionCompleted}/{sectionTotal}</span><div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden"><div className={`h-full transition-all ${sectionCompleted === sectionTotal ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${sectionTotal > 0 ? (sectionCompleted / sectionTotal) * 100 : 0}%` }} /></div></div>
                          </button>
                          {isExpanded && (
                            <div className="border-t border-gray-100 p-4"><div className="space-y-2">
                              {sectionItems.map(item => {
                                const completed = isTaskCompleted(item.id); const completedBy = getCompletedBy(item.id);
                                return (
                                  <div key={item.id} className={`flex items-center gap-3 p-3 rounded-lg border ${completed ? 'bg-slate-50 border-slate-200' : 'bg-white border-gray-200'}`}>
                                    <button onClick={() => toggleSprintItem(item.id)} disabled={saving} className="flex-shrink-0">{completed ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <Circle className="w-5 h-5 text-slate-400 hover:text-blue-500" />}</button>
                                    <span className={`flex-1 text-sm ${completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>{item.text}</span>
                                    {item.critical && <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">Critical</span>}
                                    {completedBy && <span className="text-xs text-slate-400 flex items-center gap-1"><User className="w-3 h-3" />{completedBy}</span>}
                                  </div>
                                );
                              })}
                            </div></div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      ) : (
        /* JOB TRACKER */
        <div className="max-w-7xl mx-auto px-4 py-6">
          {jobViewMode === 'byClient' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-3">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-4 border-b border-gray-100 flex items-center justify-between"><h3 className="font-semibold text-slate-800">Clients</h3><button onClick={() => setShowNewClientModal(true)} className="bg-emerald-600 hover:bg-emerald-700 rounded-lg p-1.5 text-white"><Plus className="w-4 h-4" /></button></div>
                  <div className="p-2 overflow-y-auto">
                    {clients.map(c => {
                      const jobCount = jobs.filter(j => j.clientId === c.id && j.status === 'Active').length;
                      const isActive = activeClientId === c.id;
                      return (
                        <button key={c.id} onClick={() => { setActiveClientId(c.id); setActiveJobId(null); }} className={`w-full text-left p-3 rounded-lg mb-1 transition-all ${isActive ? 'bg-slate-100 border border-slate-300' : 'hover:bg-slate-50'}`}>
                          <div className="flex items-center justify-between"><span className="font-medium text-slate-800">{c.name}</span>{jobCount > 0 && <span className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded-full">{jobCount}</span>}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="lg:col-span-9">
                {!activeClient ? (
                  <div className="text-center py-16"><Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" /><h2 className="text-xl font-semibold text-slate-700 mb-2">Select a Client</h2><p className="text-slate-500">Choose a client from the sidebar to view their jobs.</p></div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div>
                        <h2 className="text-2xl font-bold text-slate-800">{activeClient.name}</h2>
                        <p className="text-slate-500">{clientJobs.filter(j => j.status === 'Active').length} active jobs{archivedCount > 0 && ` · ${archivedCount} archived`}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        {archivedCount > 0 && (
                          <button 
                            onClick={() => setShowArchived(!showArchived)} 
                            className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${showArchived ? 'bg-slate-200 text-slate-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                          >
                            {showArchived ? 'Hide Archived' : 'Show Archived'}
                          </button>
                        )}
                        <button onClick={() => setShowNewJobModal(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4 py-2 font-medium flex items-center gap-2"><Plus className="w-5 h-5" />New Job</button>
                      </div>
                    </div>
                    {clientJobs.length === 0 ? (
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center"><Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4" /><p className="text-slate-500">{showArchived ? 'No archived jobs.' : 'No active jobs. Create one to get started.'}</p></div>
                    ) : (
                      <div className="space-y-4">
                        {clientJobs.map(job => {
                          const jobTasks = getJobTasks(job.id);
                          const completedTasks = jobTasks.filter(t => t.completed).length;
                          const totalTasks = jobTasks.length;
                          const isExpanded = expandedJobs[job.id];
                          const template = jobTemplates.find(t => t.id === job.templateId);
                          const catColor = template ? categoryColors[template.category] || {} : {};
                          return (
                            <div key={job.id} className={`bg-white rounded-xl shadow-sm border ${job.status === 'Complete' ? 'border-green-200 bg-green-50/30' : 'border-gray-200'} overflow-hidden`}>
                              <div className="p-4 cursor-pointer hover:bg-slate-50" onClick={() => setExpandedJobs({ ...expandedJobs, [job.id]: !isExpanded })}>
                                <div className="flex items-center gap-3">
                                  {isExpanded ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap"><span className={`font-semibold ${job.status === 'Complete' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{job.name}</span><span className={`text-xs px-2 py-0.5 rounded ${jobTypeColors[job.type]?.bg} ${jobTypeColors[job.type]?.text}`}>{job.type}</span>{template && <span className={`text-xs px-2 py-0.5 rounded ${catColor.bg} ${catColor.text}`}>{template.category}</span>}</div>
                                    <div className="text-sm text-slate-500 mt-1">{completedTasks}/{totalTasks} tasks complete</div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden"><div className={`h-full transition-all ${job.status === 'Complete' ? 'bg-green-500' : 'bg-emerald-500'}`} style={{ width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%` }} /></div>
                                    <button onClick={(e) => { e.stopPropagation(); toggleJobComplete(job.id); }} className={`p-1 rounded ${job.status === 'Complete' ? 'text-green-600 hover:bg-green-100' : 'text-slate-400 hover:bg-slate-100'}`}><CheckCircle2 className="w-5 h-5" /></button>
                                    <button onClick={(e) => { e.stopPropagation(); deleteJob(job.id); }} className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50"><Trash2 className="w-5 h-5" /></button>
                                  </div>
                                </div>
                              </div>
                              {isExpanded && (
                                <div className="border-t border-gray-100 p-4">
                                  <div className="space-y-2">
                                    {jobTasks.map(task => (
                                      <div key={task.id} className={`flex items-start gap-3 p-3 rounded-lg border ${task.completed ? 'bg-slate-50 border-slate-200' : 'bg-white border-gray-200'}`}>
                                        <button onClick={() => toggleJobTask(task.id)} disabled={saving} className="flex-shrink-0 mt-0.5">{task.completed ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <Circle className="w-5 h-5 text-slate-400 hover:text-emerald-500" />}</button>
                                        <div className="flex-1 min-w-0">
                                          <span className={`text-sm ${task.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>{task.notes}</span>
                                          <div className="flex items-center gap-4 mt-2">
                                            <div className="flex items-center gap-1"><User className="w-3 h-3 text-slate-400" /><input type="text" value={task.assignedTo} onChange={(e) => updateTaskAssignee(task.id, e.target.value)} placeholder="Assign..." className="text-xs border-none bg-transparent p-0 w-20 focus:outline-none text-slate-600" /></div>
                                            <div className="flex items-center gap-1"><Calendar className="w-3 h-3 text-slate-400" /><input type="date" value={task.dueDate} onChange={(e) => updateTaskDueDate(task.id, e.target.value)} className="text-xs border-none bg-transparent p-0 focus:outline-none text-slate-600" /></div>
                                            {task.completedBy && <span className="text-xs text-slate-400">✓ {task.completedBy}</span>}
                                          </div>
                                        </div>
                                        <button onClick={() => deleteJobTask(task.id)} className="flex-shrink-0 p-1 rounded text-slate-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                                      </div>
                                    ))}
                                  </div>
                                  <button onClick={() => { setActiveJobId(job.id); setShowAddJobTaskModal(true); }} className="mt-3 w-full border-2 border-dashed border-slate-200 rounded-lg p-2 text-slate-500 hover:border-emerald-400 hover:text-emerald-600 flex items-center justify-center gap-2"><Plus className="w-4 h-4" />Add Task</button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : jobViewMode === 'allJobs' ? (
            <div className="space-y-6">
              {(() => {
                const activeJobs = jobs.filter(j => j.status === 'Active');
                const clientsWithJobs = clients.filter(c => activeJobs.some(j => j.clientId === c.id)).sort((a, b) => a.name.localeCompare(b.name));
                if (clientsWithJobs.length === 0) return <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center"><Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4" /><p className="text-slate-500">No active jobs.</p></div>;
                return clientsWithJobs.map(client => {
                  const clientActiveJobs = activeJobs.filter(j => j.clientId === client.id);
                  return (
                    <div key={client.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                      <div className="p-4 border-b border-gray-100 bg-slate-50">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-slate-800 text-lg">{client.name}</h3>
                          <span className="text-sm text-slate-500">{clientActiveJobs.length} active job{clientActiveJobs.length !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                      <div className="divide-y divide-gray-100">
                        {clientActiveJobs.map(job => {
                          const jobTasks = tasks.filter(t => t.jobId === job.id);
                          const completedCount = jobTasks.filter(t => t.completed).length;
                          const totalCount = jobTasks.length;
                          const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
                          return (
                            <div key={job.id} className="p-4">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                  <span className="font-medium text-slate-800">{job.name}</span>
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${job.type === 'Recurring' ? 'bg-blue-100 text-blue-700' : job.type === 'Sprint' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>{job.type}</span>
                                </div>
                                <span className="text-sm text-slate-500">{completedCount}/{totalCount} tasks</span>
                              </div>
                              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 transition-all rounded-full" style={{ width: `${percent}%` }} />
                              </div>
                              {jobTasks.filter(t => !t.completed).length > 0 && (
                                <div className="mt-2 space-y-1">
                                  {jobTasks.filter(t => !t.completed).map(task => (
                                    <div key={task.id} className="flex items-center gap-2 text-sm text-slate-600 pl-1">
                                      <Circle className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                                      <span className="flex-1">{task.notes || task.taskId}</span>
                                      {task.assignedTo && <span className="text-xs text-slate-400">{task.assignedTo}</span>}
                                      {task.dueDate && <span className="text-xs text-slate-400">{task.dueDate}</span>}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          ) : jobViewMode === 'myTasks' ? (
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">My Tasks</h2>
              {getMyTasks().length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center"><User className="w-12 h-12 text-slate-300 mx-auto mb-4" /><p className="text-slate-500">No tasks assigned to you.</p></div>
              ) : (
                <div className="space-y-2">
                  {getMyTasks().map(task => {
                    const job = jobs.find(j => j.id === task.jobId);
                    const client = clients.find(c => c.id === task.clientId);
                    return (
                      <div key={task.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-start gap-3">
                        <button onClick={() => toggleJobTask(task.id)} disabled={saving} className="flex-shrink-0 mt-0.5"><Circle className="w-5 h-5 text-slate-400 hover:text-emerald-500" /></button>
                        <div className="flex-1 min-w-0"><span className="text-sm text-slate-700">{task.notes}</span><div className="flex items-center gap-2 mt-1 text-xs text-slate-500"><span className="font-medium">{client?.name}</span><span>•</span><span>{job?.name}</span>{task.dueDate && <><span>•</span><span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{task.dueDate}</span></>}</div></div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">Due Soon (Next 7 Days)</h2>
              {getDueSoonTasks().length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center"><Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" /><p className="text-slate-500">No tasks due in the next 7 days.</p></div>
              ) : (
                <div className="space-y-2">
                  {getDueSoonTasks().map(task => {
                    const job = jobs.find(j => j.id === task.jobId);
                    const client = clients.find(c => c.id === task.clientId);
                    const dueDate = new Date(task.dueDate);
                    const today = new Date();
                    const isOverdue = dueDate < today;
                    const isToday = dueDate.toDateString() === today.toDateString();
                    return (
                      <div key={task.id} className={`bg-white rounded-lg shadow-sm border p-4 flex items-start gap-3 ${isOverdue ? 'border-red-300 bg-red-50' : isToday ? 'border-amber-300 bg-amber-50' : 'border-gray-200'}`}>
                        <button onClick={() => toggleJobTask(task.id)} disabled={saving} className="flex-shrink-0 mt-0.5"><Circle className="w-5 h-5 text-slate-400 hover:text-emerald-500" /></button>
                        <div className="flex-1 min-w-0"><span className="text-sm text-slate-700">{task.notes}</span><div className="flex items-center gap-2 mt-1 text-xs text-slate-500"><span className="font-medium">{client?.name}</span><span>•</span><span>{job?.name}</span>{task.assignedTo && <><span>•</span><span className="flex items-center gap-1"><User className="w-3 h-3" />{task.assignedTo}</span></>}</div></div>
                        <div className={`text-xs font-medium px-2 py-1 rounded ${isOverdue ? 'bg-red-100 text-red-700' : isToday ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>{isOverdue ? 'Overdue' : isToday ? 'Today' : task.dueDate}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MODALS */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-6 border-b border-gray-100"><h2 className="text-xl font-semibold text-slate-800">What's your name?</h2><p className="text-sm text-slate-500 mt-1">This will be shown when you complete tasks.</p></div>
            <div className="p-6"><input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="Enter your name..." className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" autoFocus onKeyDown={(e) => e.key === 'Enter' && userName.trim() && saveUserName(userName.trim())} /></div>
            <div className="p-6 bg-slate-50 flex justify-end"><button onClick={() => saveUserName(userName.trim())} disabled={!userName.trim()} className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg px-6 py-2 font-medium">Continue</button></div>
          </div>
        </div>
      )}

      {showNewClientModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between"><h2 className="text-xl font-semibold text-slate-800">{appMode === 'sprint' ? 'New Client Sprint' : 'New Client'}</h2><button onClick={() => setShowNewClientModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button></div>
            <div className="p-6 space-y-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Client Name</label><input type="text" value={newClientName} onChange={(e) => setNewClientName(e.target.value)} placeholder="Enter client name..." className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" autoFocus /></div>
              {appMode === 'sprint' && <div><label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label><input type="date" value={newClientStartDate} onChange={(e) => setNewClientStartDate(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>}
            </div>
            <div className="p-6 bg-slate-50 flex justify-end gap-3"><button onClick={() => setShowNewClientModal(false)} className="px-4 py-2 text-slate-600 hover:text-slate-800">Cancel</button><button onClick={createNewClient} disabled={!newClientName.trim() || saving} className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg px-6 py-2 font-medium inline-flex items-center gap-2">{saving && <Loader2 className="w-4 h-4 animate-spin" />}{appMode === 'sprint' ? 'Create Sprint' : 'Add Client'}</button></div>
          </div>
        </div>
      )}

      {showNewJobModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between"><h2 className="text-xl font-semibold text-slate-800">New Job</h2><button onClick={() => setShowNewJobModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button></div>
            <div className="p-6 space-y-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Job Name</label><input type="text" value={newJobName} onChange={(e) => setNewJobName(e.target.value)} placeholder="e.g., January Meta Campaign" className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500" autoFocus /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Job Type</label><select value={newJobType} onChange={(e) => setNewJobType(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"><option value="Job">Job (One-time)</option><option value="Recurring">Recurring (Monthly)</option><option value="Sprint">Sprint</option></select></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Template (optional)</label><select value={newJobTemplate} onChange={(e) => setNewJobTemplate(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"><option value="">No template - start blank</option>{Object.entries(templatesByCategory).map(([cat, temps]) => <optgroup key={cat} label={cat}>{temps.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</optgroup>)}</select></div>
              {newJobTemplate && (
                <div className="bg-slate-50 rounded-lg p-3"><p className="text-xs font-medium text-slate-500 mb-2">Tasks that will be created:</p><ul className="text-sm text-slate-600 space-y-1">{jobTemplates.find(t => t.id === newJobTemplate)?.subTasks.split('\n').filter(s => s.trim()).map((task, i) => <li key={i} className="flex items-center gap-2"><Circle className="w-3 h-3 text-slate-400" />{task.trim()}</li>)}</ul></div>
              )}
            </div>
            <div className="p-6 bg-slate-50 flex justify-end gap-3"><button onClick={() => setShowNewJobModal(false)} className="px-4 py-2 text-slate-600 hover:text-slate-800">Cancel</button><button onClick={createJob} disabled={!newJobName.trim() || saving} className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-lg px-6 py-2 font-medium inline-flex items-center gap-2">{saving && <Loader2 className="w-4 h-4 animate-spin" />}Create Job</button></div>
          </div>
        </div>
      )}

      {showAddJobTaskModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between"><h2 className="text-xl font-semibold text-slate-800">Add Task</h2><button onClick={() => setShowAddJobTaskModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button></div>
            <div className="p-6 space-y-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Task</label><input type="text" value={newJobTaskText} onChange={(e) => setNewJobTaskText(e.target.value)} placeholder="What needs to be done?" className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500" autoFocus /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Assign To (optional)</label><input type="text" value={newJobTaskAssignee} onChange={(e) => setNewJobTaskAssignee(e.target.value)} placeholder="Who's responsible?" className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Due Date (optional)</label><input type="date" value={newJobTaskDueDate} onChange={(e) => setNewJobTaskDueDate(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
            </div>
            <div className="p-6 bg-slate-50 flex justify-end gap-3"><button onClick={() => setShowAddJobTaskModal(false)} className="px-4 py-2 text-slate-600 hover:text-slate-800">Cancel</button><button onClick={addTaskToJob} disabled={!newJobTaskText.trim() || saving} className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-lg px-6 py-2 font-medium inline-flex items-center gap-2">{saving && <Loader2 className="w-4 h-4 animate-spin" />}Add Task</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
