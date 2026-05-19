import { format } from 'date-fns';

export function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function getTodayLabel() {
  return format(new Date(), 'EEEE, MMMM d');
}

export function getPipelineProgress(clients, stages) {
  const active = clients.filter((c) => !c.archived);
  if (!active.length) return 0;
  const liveIndex = stages.findIndex((s) => s.id === 'live');
  const maintenanceIndex = stages.findIndex((s) => s.id === 'maintenance');
  const doneIndex = maintenanceIndex >= 0 ? maintenanceIndex : liveIndex;
  if (doneIndex < 0) return 0;

  const sorted = [...stages].sort((a, b) => a.order - b.order);
  const maxOrder = sorted[sorted.length - 1]?.order ?? 1;

  let totalProgress = 0;
  for (const c of active) {
    const stage = sorted.find((s) => s.id === c.stageId);
    const order = stage?.order ?? 0;
    totalProgress += maxOrder > 0 ? (order / maxOrder) * 100 : 0;
  }
  return Math.round(totalProgress / active.length);
}
