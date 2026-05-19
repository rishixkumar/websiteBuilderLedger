import { format, formatDistanceToNow, isPast, isToday, isTomorrow, parseISO } from 'date-fns';

export function getStage(workspace, stageId) {
  return workspace.settings.pipelineStages.find((s) => s.id === stageId);
}

export function formatDateTime(iso) {
  if (!iso) return '';
  try {
    const d = parseISO(iso);
    if (isToday(d)) return `Today ${format(d, 'h:mm a')}`;
    if (isTomorrow(d)) return `Tomorrow ${format(d, 'h:mm a')}`;
    return format(d, 'EEE, MMM d · h:mm a');
  } catch {
    return iso;
  }
}

export function formatRelative(iso) {
  if (!iso) return '';
  try {
    return formatDistanceToNow(parseISO(iso), { addSuffix: true });
  } catch {
    return '';
  }
}

export function isCallOverdue(iso) {
  if (!iso) return false;
  try {
    return isPast(parseISO(iso));
  } catch {
    return false;
  }
}

export function isCallUpcoming(iso, withinDays = 7) {
  if (!iso) return false;
  try {
    const d = parseISO(iso);
    const now = new Date();
    const limit = new Date();
    limit.setDate(limit.getDate() + withinDays);
    return d >= now && d <= limit;
  } catch {
    return false;
  }
}

export function searchClients(clients, query, fieldDefs) {
  if (!query.trim()) return clients;
  const q = query.toLowerCase();
  return clients.filter((c) => {
    if (c.name?.toLowerCase().includes(q)) return true;
    if (c.tags?.some((t) => t.toLowerCase().includes(q))) return true;
    for (const f of fieldDefs) {
      const val = c.fields?.[f.id];
      if (val != null && String(val).toLowerCase().includes(q)) return true;
    }
    return false;
  });
}

export function formatClientSummary(client, fieldDefs, stageLabel) {
  const lines = [`# ${client.name || 'Untitled client'}`, `Stage: ${stageLabel || client.stageId}`];
  if (client.tags?.length) lines.push(`Tags: ${client.tags.join(', ')}`);
  lines.push('');
  for (const f of [...fieldDefs].sort((a, b) => a.order - b.order)) {
    const v = client.fields?.[f.id];
    if (v) lines.push(`${f.label}: ${v}`);
  }
  if (client.activities?.length) {
    lines.push('', 'Recent activity:');
    client.activities.slice(0, 5).forEach((a) => lines.push(`- ${a.text}`));
  }
  return lines.join('\n');
}

export function groupFieldsBySection(fieldDefs) {
  const sections = {};
  const sorted = [...fieldDefs].sort((a, b) => a.order - b.order);
  for (const f of sorted) {
    const sec = f.section || 'Other';
    if (!sections[sec]) sections[sec] = [];
    sections[sec].push(f);
  }
  return sections;
}
