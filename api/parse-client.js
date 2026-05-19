const OLLAMA_HOST = 'https://ollama.com';
const MAX_IMAGES = 6;
const MAX_TEXT_LENGTH = 12000;

const STAGE_IDS = [
  'lead',
  'call-scheduled',
  'design',
  'development',
  'client-review',
  'live',
  'maintenance',
];

const FIELD_IDS = [
  'website',
  'googleMaps',
  'nextCall',
  'contactEmail',
  'contactPhone',
  'domain',
  'hosting',
  'budget',
  'projectNotes',
];

function buildSystemPrompt(fieldDefinitions, pipelineStages) {
  const stages = (pipelineStages || [])
    .map((s) => `- ${s.id}: ${s.label}`)
    .join('\n');
  const fields = (fieldDefinitions || [])
    .map((f) => `- ${f.id} (${f.type}): ${f.label}`)
    .join('\n');

  return `You extract website client/project data for a CRM called SiteLedger.
Return ONLY valid JSON (no markdown) matching this schema:
{
  "name": "company or client name",
  "stageId": "one of the stage ids below",
  "tags": ["optional", "tags"],
  "fields": { "fieldId": "value or null for unknown" },
  "activityNote": "short summary of what was imported"
}

Rules:
- stageId must be exactly one of: ${STAGE_IDS.join(', ')}
- Pick stage from context (e.g. "call scheduled" -> call-scheduled, "will design" -> design)
- fields keys should use these ids when possible:\n${fields || FIELD_IDS.map((id) => `- ${id}`).join('\n')}
- website and googleMaps must be full URLs when present
- nextCall must be ISO 8601 datetime if a meeting/call is mentioned, else null
- contactEmail, contactPhone, domain, hosting, budget, projectNotes when found
- Put remaining notes in projectNotes
- tags: lowercase industry keywords (hvac, restaurant, etc.) when inferable

Pipeline stages:\n${stages || STAGE_IDS.map((id) => `- ${id}`).join('\n')}`;
}

function extractJson(text) {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error('Could not parse AI response as JSON');
  }
}

function sanitizeExtraction(data, fieldDefinitions) {
  const validFieldIds = new Set(
    (fieldDefinitions || []).map((f) => f.id).concat(FIELD_IDS)
  );
  const fields = {};
  if (data.fields && typeof data.fields === 'object') {
    for (const [key, value] of Object.entries(data.fields)) {
      if (validFieldIds.has(key) && value != null && value !== '') {
        fields[key] = String(value);
      }
    }
  }

  let stageId = data.stageId;
  if (!STAGE_IDS.includes(stageId)) stageId = 'lead';

  const tags = Array.isArray(data.tags)
    ? data.tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean)
    : [];

  return {
    name: String(data.name || 'New Client').trim() || 'New Client',
    stageId,
    tags: [...new Set(tags)],
    fields,
    activityNote: data.activityNote ? String(data.activityNote).trim() : 'Imported via Quick Add',
  };
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.OLLAMA_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'OLLAMA_API_KEY is not configured. Add it in Vercel env vars or .env.local.',
    });
  }

  try {
    const { text = '', images = [], fieldDefinitions = [], pipelineStages = [] } = req.body || {};

    if (!text.trim() && (!images || images.length === 0)) {
      return res.status(400).json({ error: 'Provide text and/or at least one image.' });
    }

    const imageList = (images || []).slice(0, MAX_IMAGES);
    const userText = String(text).slice(0, MAX_TEXT_LENGTH);

    const userContent = userText.trim()
      ? `Extract client information from the following notes:\n\n${userText}`
      : 'Extract client information from the attached screenshot(s) or images. These may be Notes app screenshots, business cards, emails, or website briefs.';

    const model = process.env.OLLAMA_MODEL || 'gemma3:12b';

    const ollamaRes = await fetch(`${OLLAMA_HOST}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        stream: false,
        format: 'json',
        messages: [
          { role: 'system', content: buildSystemPrompt(fieldDefinitions, pipelineStages) },
          {
            role: 'user',
            content: userContent,
            ...(imageList.length > 0 ? { images: imageList } : {}),
          },
        ],
      }),
    });

    if (!ollamaRes.ok) {
      const errBody = await ollamaRes.text();
      console.error('Ollama error', ollamaRes.status, errBody);
      return res.status(502).json({
        error: `Ollama API error (${ollamaRes.status}). Try a different model or check your API key.`,
      });
    }

    const ollamaData = await ollamaRes.json();
    const rawContent = ollamaData.message?.content || ollamaData.response || '';
    const parsed = extractJson(rawContent);
    const extraction = sanitizeExtraction(parsed, fieldDefinitions);

    return res.status(200).json({ extraction });
  } catch (err) {
    console.error('parse-client error', err);
    return res.status(500).json({
      error: err.message || 'Failed to parse client information',
    });
  }
};
