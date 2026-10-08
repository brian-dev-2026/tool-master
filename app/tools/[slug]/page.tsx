import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ToolPage } from '@/components/ToolPage';
import { getTool, tools } from '@/tools/registry';

export function generateStaticParams() {
  // Cache Components requires at least one param; the placeholder resolves to notFound().
  return tools.length ? tools.map((t) => ({ slug: t.slug })) : [{ slug: '__placeholder__' }];
}

export async function generateMetadata({ params }: PageProps<'/tools/[slug]'>): Promise<Metadata> {
  const tool = getTool((await params).slug);
  return tool ? { title: `${tool.name} · Tool-Master`, description: tool.description } : {};
}

export default async function Page({ params }: PageProps<'/tools/[slug]'>) {
  const { slug } = await params;
  if (!getTool(slug)) notFound();
  return <ToolPage slug={slug} />;
}
