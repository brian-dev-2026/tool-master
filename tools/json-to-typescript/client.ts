import { parseJsonStrict } from '@/lib/data/json';
import { inferTypescript } from '@/lib/data/ts-infer';
import { inputText, textOutput } from '../shared/text-io';
import type { ClientTool } from '../types';

const tool: ClientTool = {
  async run(input, options) {
    const types = inferTypescript(parseJsonStrict(inputText(input)), String(options.rootName || 'Root'));
    return textOutput(types, 'types.ts', 'text/plain');
  },
};

export default tool;
