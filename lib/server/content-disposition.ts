/** Attachment header that keeps non-ASCII names intact (RFC 5987) with a safe ASCII fallback. */
export function contentDisposition(name: string): string {
  const fallback = name
    .normalize('NFKD')
    .replace(/[^\x20-\x7e]/g, '')
    .replace(/["\\]/g, '')
    .trim() || 'download';
  const encoded = encodeURIComponent(name).replace(/['()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encoded}`;
}
