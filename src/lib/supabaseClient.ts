import { createBrowserClient } from '@supabase/ssr';
import { type CookieOptions } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const createClient = () => {
  if (typeof window === 'undefined') {
    return null; // Return null or throw an error if trying to use in server context
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return document.cookie
          .split('; ')
          .find((row) => row.startsWith(`${name}=`))
          ?.split('=')[1];
      },
      set(name: string, value: string, options: CookieOptions) {
        document.cookie = `${name}=${value}; path=${options.path}; max-age=${options.maxAge}`;
      },
      remove(name: string, options: CookieOptions) {
        document.cookie = `${name}=; path=${options.path}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      },
    },
  });
};

// Create a singleton instance for client-side use
let browserClient: ReturnType<typeof createBrowserClient> | null = null;

// Only initialize the browser client on the client side
if (typeof window !== 'undefined') {
  browserClient = createClient();
}

export { browserClient as supabase };