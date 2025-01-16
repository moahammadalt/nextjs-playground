'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { createClient } from '@/utils/supabase/server';

export async function login(formData: FormData) {
  const supabase = await createClient();

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

  try {
    const { error } = await supabase.auth.signInWithPassword(data);

    if (error) {
      redirect(`/error?message=${encodeURIComponent(error?.message)}`);
    }

    revalidatePath('/', 'layout');
    redirect('/');
  } catch (err) {
    console.log('signin error', err);
    const message =
      err instanceof Error ? err.message : 'An unexpected error occurred';
    redirect(`/error?message=${encodeURIComponent(message)}`);
  }
}

export async function signup(formData: FormData) {
  console.log('signup');
  const supabase = await createClient();

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data1 = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

  try {
    const { error } = await supabase.auth.signUp(data1);

    if (error) {
      redirect(`/error?message=${encodeURIComponent(error.message)}`);
    }

    revalidatePath('/', 'layout');
    redirect('/');
  } catch (err) {
    console.log('signin error', err);
    const message =
      err instanceof Error ? err.message : 'An unexpected error occurred';
    redirect(`/error?message=${encodeURIComponent(message)}`);
  }
}
