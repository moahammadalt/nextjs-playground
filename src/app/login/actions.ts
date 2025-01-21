'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';

export async function login(formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

  try {
    const { error } = await supabase.auth.signInWithPassword(data);
    
    if (error) {
      console.log('login error0', error);

      return { error: error.message };
    }

    revalidatePath('/', 'layout');
    return { success: true };
  } catch (err) {
    console.error('login error', err);
    const message = err instanceof Error ? err.message : 'An unexpected error occurred';
    return { error: message };
  }
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

  try {
    const { error } = await supabase.auth.signUp(data);
    

    if (error) {
      console.log('signup error0', error);
      
      return { error: error.message };
    }

    revalidatePath('/', 'layout');
    return { success: true };
  } catch (err) {
    console.error('signup error', err);
    const message = err instanceof Error ? err.message : 'An unexpected error occurred';
    return { error: message };
  }
}