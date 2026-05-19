import { v4 as uuidv4 } from 'uuid';

export const STORAGE_KEY = 'websitetracker:v1';

export const DEFAULT_STAGES = [
  { id: 'lead', label: 'Lead', color: '#6b7280', order: 0 },
  { id: 'call-scheduled', label: 'Call Scheduled', color: '#3b82f6', order: 1 },
  { id: 'design', label: 'Design', color: '#f59e0b', order: 2 },
  { id: 'development', label: 'Development', color: '#8b5cf6', order: 3 },
  { id: 'client-review', label: 'Client Review', color: '#ec4899', order: 4 },
  { id: 'live', label: 'Live', color: '#22c55e', order: 5 },
  { id: 'maintenance', label: 'Maintenance', color: '#14b8a6', order: 6 },
];

export const DEFAULT_FIELDS = [
  { id: 'website', label: 'Website', type: 'url', section: 'Links', pinned: true, order: 0 },
  { id: 'googleMaps', label: 'Google Maps', type: 'url', section: 'Links', pinned: true, order: 1 },
  { id: 'nextCall', label: 'Next Call', type: 'datetime', section: 'Schedule', pinned: true, order: 2 },
  { id: 'contactEmail', label: 'Contact Email', type: 'email', section: 'Contact', order: 3 },
  { id: 'contactPhone', label: 'Contact Phone', type: 'phone', section: 'Contact', order: 4 },
  { id: 'domain', label: 'Domain', type: 'text', section: 'Project', order: 5 },
  { id: 'hosting', label: 'Hosting', type: 'text', section: 'Project', order: 6 },
  { id: 'budget', label: 'Budget', type: 'currency', section: 'Project', order: 7 },
  { id: 'projectNotes', label: 'Project Notes', type: 'textarea', section: 'Project', order: 8 },
];

function nextWednesdayAt10AM() {
  const now = new Date();
  const d = new Date(now);
  const day = now.getDay();
  let daysUntil = (3 - day + 7) % 7;
  if (daysUntil === 0 && (now.getHours() > 10 || (now.getHours() === 10 && now.getMinutes() > 0))) {
    daysUntil = 7;
  }
  d.setDate(now.getDate() + daysUntil);
  d.setHours(10, 0, 0, 0);
  return d.toISOString();
}

export function createSeedClient() {
  const now = new Date().toISOString();
  return {
    id: uuidv4(),
    name: 'HVAC Bee Alpharetta',
    stageId: 'call-scheduled',
    tags: ['hvac'],
    starred: true,
    fields: {
      website: 'https://hvacbeealpharetta.com/?utm_campaign=gmb',
      googleMaps: 'https://maps.google.com/?q=HVAC+Bee+Alpharetta',
      nextCall: nextWednesdayAt10AM(),
      projectNotes: 'Site: Will design on Wednesday',
    },
    activities: [
      {
        id: uuidv4(),
        type: 'note',
        text: 'Scheduled call for Wednesday @ 10 AM',
        at: now,
      },
      {
        id: uuidv4(),
        type: 'stage',
        text: 'Moved to Call Scheduled',
        at: now,
      },
    ],
    createdAt: now,
    updatedAt: now,
  };
}

export function createDefaultWorkspace() {
  return {
    version: 1,
    settings: {
      pipelineStages: DEFAULT_STAGES.map((s) => ({ ...s })),
      fieldDefinitions: DEFAULT_FIELDS.map((f) => ({ ...f })),
      tags: ['hvac', 'restaurant', 'retail'],
      theme: 'dark',
    },
    clients: [createSeedClient()],
  };
}

export function createEmptyClient(stageId = 'lead') {
  const now = new Date().toISOString();
  return {
    id: uuidv4(),
    name: '',
    stageId,
    tags: [],
    starred: false,
    archived: false,
    fields: {},
    activities: [],
    createdAt: now,
    updatedAt: now,
  };
}
