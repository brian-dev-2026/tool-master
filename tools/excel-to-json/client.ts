import { excelToJson } from '@/lib/data/sheets';
import { output, singleFile } from '../shared/data-io';
import type { ClientTool } from '../types';

const tool: ClientTool = {
  async run(input, options) {
    const file = singleFile(input);
    const data = excelToJson(new Uint8Array(await file.arrayBuffer()), {
      sheet: options.sheet === '__all__' ? '__all__' : '__first__',
      header: options.header !== false,
    });
    return { kind: 'files', files: [output(file, 'json', JSON.stringify(data, null, 2))] };
  },
};

export default tool;
