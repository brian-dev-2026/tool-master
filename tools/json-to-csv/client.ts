import { parseJsonStrict } from '@/lib/data/json';
import { jsonToCsv } from '@/lib/data/sheets';
import { output, singleFile } from '../shared/data-io';
import type { ClientTool } from '../types';

const tool: ClientTool = {
  async run(input) {
    const file = singleFile(input);
    return { kind: 'files', files: [output(file, 'csv', jsonToCsv(parseJsonStrict(await file.text())))] };
  },
};

export default tool;
