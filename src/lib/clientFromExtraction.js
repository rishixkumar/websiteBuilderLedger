import { v4 as uuidv4 } from 'uuid';

export function clientFromExtraction(extraction) {
  const now = new Date().toISOString();
  const activities = [];

  if (extraction.activityNote) {
    activities.push({
      id: uuidv4(),
      type: 'note',
      text: extraction.activityNote,
      at: now,
    });
  }

  activities.push({
    id: uuidv4(),
    type: 'note',
    text: 'Created via Quick Add (AI extraction)',
    at: now,
  });

  return {
    id: uuidv4(),
    name: extraction.name || 'New Client',
    stageId: extraction.stageId || 'lead',
    tags: extraction.tags || [],
    starred: false,
    fields: extraction.fields || {},
    activities,
    createdAt: now,
    updatedAt: now,
  };
}

export async function parseClientWithAI({ text, imageDataUrls, fieldDefinitions, pipelineStages }) {
  const images = imageDataUrls
    .map((dataUrl) => {
      const match = dataUrl.match(/^data:[^;]+;base64,(.+)$/);
      return match ? match[1] : dataUrl;
    })
    .filter(Boolean);

  const res = await fetch('/api/parse-client', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      images,
      fieldDefinitions,
      pipelineStages,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data.extraction;
}

export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function isImageFile(file) {
  return file.type.startsWith('image/');
}

export function isTextFile(file) {
  return (
    file.type.startsWith('text/') ||
    file.name.endsWith('.txt') ||
    file.name.endsWith('.md')
  );
}
