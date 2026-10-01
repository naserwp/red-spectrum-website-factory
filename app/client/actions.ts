'use server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { sameOrigin } from '@/lib/webfactory/server';

export async function leaveCustomerWorkspace() {
  if (!await sameOrigin()) return;
  (await cookies()).delete('wf_request');
  redirect('/client/login');
}
