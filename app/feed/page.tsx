import FeedClient from '@/components/FeedClient';
import { LISTINGS, fromDbRow, Listing } from '@/lib/data';

export const metadata = { title: 'Feed — VibeSandbox' };
export const revalidate = 30;

async function getListings(): Promise<Listing[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return LISTINGS;
  try {
    const { createServerSupabaseClient } = await import('@/lib/supabase/server');
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .order('score', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });
    if (error) { console.error('[feed]', error); return LISTINGS; }
    return (data ?? []).map(fromDbRow);
  } catch (err) {
    console.error('[feed]', err);
    return LISTINGS;
  }
}

export default async function FeedPage() {
  const listings = await getListings();
  return <FeedClient initialListings={listings} />;
}
