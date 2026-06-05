import { redirect, RedirectType } from 'next/navigation';

export default function Home() {
  redirect('/feed', RedirectType.replace);
}
