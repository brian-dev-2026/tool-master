import { csvToJson } from '@/lib/data/sheets';
import { output, singleFile } from '../shared/data-io';
import type { ClientTool } from '../types';

const tool: ClientTool = {
  async run(input, options) {
    const file = singleFile(input);
    const data = csvToJson(await file.text(), { header: options.header !== false });
    return { kind: 'files', files: [output(file, 'json', JSON.stringify(data, null, 2))] };
  },
};

export default tool;
