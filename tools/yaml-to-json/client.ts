import { yamlToJson } from '@/lib/data/formats';
import { inputText, textOutput } from '../shared/text-io';
import type { ClientTool } from '../types';

const tool: ClientTool = {
  async run(input) {
    return textOutput(JSON.stringify(yamlToJson(inputText(input)), null, 2), 'converted.json', 'application/json');
  },
};

export default tool;
