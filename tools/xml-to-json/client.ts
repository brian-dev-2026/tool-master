import { xmlToJson } from '@/lib/data/formats';
import { inputText, textOutput } from '../shared/text-io';
import type { ClientTool } from '../types';

const tool: ClientTool = {
  async run(input, options) {
    const data = xmlToJson(inputText(input), { attributes: options.attributes !== false });
    return textOutput(JSON.stringify(data, null, 2), 'converted.json', 'application/json');
  },
};

export default tool;
