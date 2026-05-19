export function HighlightText({ text, query }) {
  if (!text || !query?.trim()) return text;

  const q = query.trim();
  const lower = text.toLowerCase();
  const idx = lower.indexOf(q.toLowerCase());
  if (idx === -1) return text;

  const before = text.slice(0, idx);
  const match = text.slice(idx, idx + q.length);
  const after = text.slice(idx + q.length);

  return (
    <>
      {before}
      <mark className="highlight-text">{match}</mark>
      {after}
    </>
  );
}
