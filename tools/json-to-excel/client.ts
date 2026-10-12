import { parseJsonStrict } from '@/lib/data/json';
import { jsonToWorkbook } from '@/lib/data/sheets';
import { output, singleFile } from '../shared/data-io';
import type { ClientTool } from '../types';

const tool: ClientTool = {
  async run(input) {
    const file = singleFile(input);
    return { kind: 'files', files: [output(file, 'xlsx', jsonToWorkbook(parseJsonStrict(await file.text())))] };
  },
};

export default tool;
