export function exportJSON(workspace) {
  const blob = new Blob([JSON.stringify(workspace, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `siteledger-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function parseImportJSON(text) {
  const data = JSON.parse(text);
  if (!data || data.version !== 1) throw new Error('Invalid backup file');
  if (!Array.isArray(data.clients) || !data.settings) throw new Error('Invalid backup structure');
  return data;
}

function escapeCSV(val) {
  const s = val == null ? '' : String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function exportCSV(workspace) {
  const { clients, settings } = workspace;
  const fields = settings.fieldDefinitions || [];
  const stageMap = Object.fromEntries(
    (settings.pipelineStages || []).map((s) => [s.id, s.label])
  );

  const headers = ['Name', 'Stage', 'Starred', 'Tags', ...fields.map((f) => f.label), 'Created', 'Updated'];
  const rows = clients.map((c) => {
    const row = [
      c.name,
      stageMap[c.stageId] || c.stageId,
      c.starred ? 'Yes' : 'No',
      (c.tags || []).join('; '),
      ...fields.map((f) => {
        const v = c.fields?.[f.id];
        if (f.type === 'checkbox') return v ? 'Yes' : 'No';
        return v ?? '';
      }),
      c.createdAt,
      c.updatedAt,
    ];
    return row.map(escapeCSV).join(',');
  });

  const csv = [headers.map(escapeCSV).join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `siteledger-clients-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function mergeWorkspaces(current, imported) {
  const clientIds = new Set(current.clients.map((c) => c.id));
  const mergedClients = [
    ...current.clients,
    ...imported.clients.filter((c) => !clientIds.has(c.id)),
  ];
  return {
    ...current,
    settings: {
      ...current.settings,
      pipelineStages: imported.settings.pipelineStages?.length
        ? imported.settings.pipelineStages
        : current.settings.pipelineStages,
      fieldDefinitions: mergeFieldDefinitions(
        current.settings.fieldDefinitions,
        imported.settings.fieldDefinitions
      ),
      tags: [...new Set([...(current.settings.tags || []), ...(imported.settings.tags || [])])],
    },
    clients: mergedClients,
  };
}

function mergeFieldDefinitions(current, imported) {
  const ids = new Set(current.map((f) => f.id));
  return [...current, ...(imported || []).filter((f) => !ids.has(f.id))];
}
