# EngageEngine 30-Day Sprint Tracker

Interactive sprint tracking tool for EngageEngine demand control implementations.

## Quick Deploy to Vercel

### Option 1: Drag & Drop (Easiest)

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New..." → "Project"
3. Choose "Import Third-Party Git Repository" or drag this entire folder onto the page
4. Vercel auto-detects Vite and configures everything
5. Click "Deploy"
6. Done! You'll get a URL like `engageengine-sprint-tracker.vercel.app`

### Option 2: Via GitHub

1. Create a new GitHub repo
2. Push this folder to the repo:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/engageengine-sprint-tracker.git
   git push -u origin main
   ```
3. Go to [vercel.com](https://vercel.com)
4. Click "Add New..." → "Project"
5. Import your GitHub repo
6. Click "Deploy"

### Option 3: Vercel CLI

```bash
npm install -g vercel
vercel
```

Follow the prompts. Done.

## Local Development

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`

## Features

- **Multi-client tracking** - Manage multiple sprint implementations
- **Progress visualization** - See completion at phase, section, and task levels
- **Critical item alerts** - Never miss the tasks that block progress
- **Failure mode tracking** - Document the diagnosed failure mode per client
- **Export/Import** - Backup your data or share between team members
- **Persistent storage** - Data saves to browser localStorage

## Data Storage

Currently uses browser localStorage. Each team member's browser stores their own data independently.

To share data between team members:
1. Use the Export button (download icon) to save a JSON file
2. Share the file
3. Other team members use Import button (upload icon) to load it

## Future: Airtable Integration

When ready to upgrade to shared team data, we can wire this to Airtable as the backend. This enables:
- All team members see the same data
- View/edit in Airtable directly
- Automations (Slack alerts, email triggers)
- Reporting and dashboards

## Customization

To modify the sprint checklist, edit the `sprintTemplate` object in `src/App.jsx`. Each section contains:
- `title` - Section header
- `items` - Array of tasks with `id`, `text`, and optional `critical` flag

---

Built for EngageEngine Marketing | Demand Control Systems
