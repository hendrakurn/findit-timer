import { redirect } from 'next/navigation';

export const metadata = {
  title: 'FindIT UGM — Countdown Setup',
};

export default function SetupPage() {
  redirect('/remote/main-stage');
}
