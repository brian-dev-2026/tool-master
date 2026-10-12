import { workbookToCsvs } from '@/lib/data/sheets';
import { baseName } from '@/lib/pdf/load';
import { MIME, singleFile } from '../shared/data-io';
import type { ClientTool } from '../types';

const tool: ClientTool = {
  async run(input) {
    const file = singleFile(input);
    const csvs = workbookToCsvs(new Uint8Array(await file.arrayBuffer())).filter((c) => c.csv.trim());
    const base = baseName(file.name);
    return {
      kind: 'files',
      files: csvs.map((c) => ({
        name: csvs.length === 1 ? `${base}.csv` : `${base}-${c.sheet}.csv`,
        data: new Blob([c.csv], { type: MIME.csv }),
      })),
    };
  },
};

export default tool;
