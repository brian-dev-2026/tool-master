import { jsonToXml } from '@/lib/data/formats';
import { parseJsonStrict } from '@/lib/data/json';
import { inputText, textOutput } from '../shared/text-io';
import type { ClientTool } from '../types';

const tool: ClientTool = {
  async run(input, options) {
    const xml = jsonToXml(parseJsonStrict(inputText(input)), { root: String(options.root || 'root') });
    return textOutput(xml, 'converted.xml', 'application/xml');
  },
};

export default tool;
