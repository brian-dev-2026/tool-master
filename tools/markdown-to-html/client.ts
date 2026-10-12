import { markdownToHtml } from '@/lib/data/formats';
import { inputText, textOutput } from '../shared/text-io';
import type { ClientTool } from '../types';

/** Wraps the fragment in a small, readable standalone page for download. */
export function htmlDocument(body: string, title = 'Document'): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title.replace(/[<>&"]/g, '')}</title>
<style>
  body { font: 16px/1.6 system-ui, sans-serif; max-width: 46rem; margin: 2rem auto; padding: 0 1rem; color: #0f172a; }
  pre, code { font-family: ui-monospace, monospace; background: #f1f5f9; border-radius: 6px; }
  pre { padding: 1rem; overflow: auto; } code { padding: .1rem .3rem; }
  table { border-collapse: collapse; } th, td { border: 1px solid #e2e8f0; padding: .4rem .6rem; }
  blockquote { margin: 0; padding-left: 1rem; border-left: 3px solid #e2e8f0; color: #475569; }
  img { max-width: 100%; }
</style>
</head>
<body>
${body}
</body>
</html>
`;
}

const tool: ClientTool = {
  async run(input) {
    return textOutput(htmlDocument(markdownToHtml(inputText(input))), 'document.html', 'text/html');
  },
};

export default tool;
