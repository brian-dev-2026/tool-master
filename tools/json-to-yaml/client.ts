import { jsonToYaml } from '@/lib/data/formats';
import { parseJsonStrict } from '@/lib/data/json';
import { inputText, textOutput } from '../shared/text-io';
import type { ClientTool } from '../types';

const tool: ClientTool = {
  async run(input, options) {
    const yaml = jsonToYaml(parseJsonStrict(inputText(input)), { indent: Number(options.indent ?? 2) });
    return textOutput(yaml, 'converted.yaml', 'text/yaml');
  },
};

export default tool;
