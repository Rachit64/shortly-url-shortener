import { StatsView } from '@/components/StatsView';

export const metadata = { title: 'Link statistics' };

export default async function StatsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <StatsView slug={slug} />;
}
