'use client';

import { supabase } from '@/lib/supabaseClient';
import { useChat } from 'ai/react';
import { revalidatePath } from 'next/cache';
import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';

// Define the server action
async function signOut() {

  await supabase.auth.signOut();
  revalidatePath('/');
}

export default function Home() {
  console.time('getUser Home');
  const [user, setUser] = useState<User | null>(null);

  const { messages, input, handleInputChange, handleSubmit } = useChat();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };

    getUser();

    // Set up realtime subscription for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      Hello logged in user {user?.email} id {user?.id}
      <div className="grid grid-rows-[20px_1fr_auto] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
        {/* Chat messages */}
        <div className="w-full max-w-2xl h-[600px] overflow-y-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`mb-4 p-4 rounded ${message.role === 'assistant' ? 'bg-gray-100' : 'bg-blue-100 ml-auto'}`}
            >
              <p>{message.content}</p>
            </div>
          ))}
        </div>

        {/* Chat input form */}
        <form onSubmit={handleSubmit} className="w-full max-w-2xl">
          <div className="flex gap-4">
            <input
              value={input}
              onChange={handleInputChange}
              placeholder="Say something..."
              className="flex-1 p-2 border rounded text-gray-900 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Send
            </button>
          </div>
        </form>

        <form action={signOut}>
          <button className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors">
            Log Out
          </button>
        </form>
      </div>
    </div>
  );
}
