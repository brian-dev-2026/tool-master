import type { EngineId } from '@/tools/types';

export type EngineStatus = Record<'word' | 'excel' | 'powerpoint' | 'libreoffice' | 'ghostscript', boolean>;

export const ENGINE_HINTS: Record<EngineId, { label: string; url: string }> = {
  word: { label: 'Microsoft Word', url: 'https://www.microsoft.com/microsoft-365' },
  excel: { label: 'Microsoft Excel', url: 'https://www.microsoft.com/microsoft-365' },
  powerpoint: { label: 'Microsoft PowerPoint', url: 'https://www.microsoft.com/microsoft-365' },
  libreoffice: { label: 'LibreOffice', url: 'https://www.libreoffice.org/download/' },
  ghostscript: { label: 'Ghostscript', url: 'https://ghostscript.com/releases/gsdnld.html' },
  birefnet: { label: 'BiRefNet model', url: 'https://huggingface.co/onnx-community/BiRefNet-ONNX' },
};
