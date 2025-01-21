'use client';

import { supabase } from '@/lib/supabaseClient';
import { useChat } from 'ai/react';
import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

// Define the server action

export default function Home() {
  console.time('getUser Home');
  const [user, setUser] = useState<User | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const router = useRouter();

  const { messages, input, handleInputChange, handleSubmit: handleAiSubmit, stop, isLoading } = useChat();

  useEffect(() => {
    fetchConversations();
  }, [user]);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Set up realtime subscription for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchConversations = async () => {
    if (!user) return;
    try {
      const response = await fetch('/api/conversations');
      if (!response.ok) throw new Error('Failed to fetch conversations');
      const data = await response.json();
      setConversations(data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    // Create a new conversation if this is the first message
    if (messages.length === 0) {
      try {
        const response = await fetch('/api/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: input.slice(0, 50), // Use first 50 chars of message as title
            conversationMode: 'chat',
          }),
        });
        if (!response.ok) throw new Error('Failed to create conversation');

        await fetchConversations();
      } catch (error) {
        console.error('Error creating conversation:', error);
        return;
      }
    }

    // Process the message with AI
    handleAiSubmit(e);
  };

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      router.push('/');
      router.refresh(); // This will refresh the page data
    }
  }

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <div className="flex justify-between items-center mb-8">
        <div>
          Hello {user?.email}, id: {user?.id}
        </div>
        <form action={signOut}>
          <button className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors">
            Log Out
          </button>
        </form>
      </div>

      {/* Conversations List */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Your Conversations</h2>
        <div className="space-y-2 text-gray-900">
          {conversations.map((conv) => (
            <div key={conv.id} className="p-3 bg-gray-100 rounded">
              <p>{conv.title}</p>
              <p>{conv.id}</p>
              <p className="text-sm text-gray-500">{new Date(conv.createdAt).toLocaleDateString()}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-rows-[20px_1fr_auto] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
          {/* Chat messages */}
          <div className="w-full text-gray-900">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`mb-4 p-4 rounded ${message.role === 'assistant' ? 'bg-gray-100' : 'bg-blue-100 ml-auto'}`}
              >
                <p>{message.content}</p>
              </div>
            ))}
          </div>

          {isLoading && (
            <div>
              loading...
              <button type="button" onClick={() => stop()}>
                Stop
              </button>
            </div>
          )}

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
    </div>
  );
}
