'use client';

import { PdfPagesEditor } from '@/components/PdfPagesEditor';
import type { ToolMeta } from '../types';

export default function RotatePdfUi({ meta }: { meta: ToolMeta }) {
  return <PdfPagesEditor meta={meta} organize={false} />;
}
