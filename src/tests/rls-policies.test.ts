import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
config({ path: '.env.test' });

// Test users credentials
const TEST_USERS = [
  {
    email: 'muhammed.altinci@gmail.com',
    password: '123456',
  },
  {
    email: 'maltinci@arenainstitute.org',
    password: '123456',
  },
];

describe('RLS Policies Integration Tests', () => {
  // Create Supabase clients
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  let user1Client: any;
  let user2Client: any;
  let user1ConversationId: string;
  let user1Id: string;

  beforeAll(async () => {
    // Sign in as user 1 and create their client
    const { data: user1Data, error: user1Error } = await supabase.auth.signInWithPassword({
      email: TEST_USERS[0].email,
      password: TEST_USERS[0].password,
    });
    expect(user1Error).toBeNull();

    // Get user1's ID from the users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('user_id', user1Data.user!.id)
      .single();

    expect(userError).toBeNull();
    user1Id = userData?.id; // Store the user's ID

    user1Client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      global: {
        headers: {
          Authorization: `Bearer ${user1Data.session?.access_token}`,
        },
      },
    });

    // Sign in as user 2 and create their client
    const { data: user2Data, error: user2Error } = await supabase.auth.signInWithPassword({
      email: TEST_USERS[1].email,
      password: TEST_USERS[1].password,
    });
    expect(user2Error).toBeNull();
    user2Client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      global: {
        headers: {
          Authorization: `Bearer ${user2Data.session?.access_token}`,
        },
      },
    });
  });

  afterAll(async () => {
    // Clean up test data
    if (user1ConversationId) {
      //await user1Client.from('conversations').delete().eq('id', user1ConversationId);
    }
  });

  it('should allow user1 to create and read their own conversation', async () => {
    // Create a conversation as user1
    console.log('user1Id', user1Id);
    const { data: createData, error: createError } = await user1Client
      .from('conversations')
      .insert({
        user_id: user1Id,
        title: 'Test Conversation',
        conversation_mode: 'chat',
      })
      .select()
      .single();

    expect(createError).toBeNull();
    expect(createData).toBeDefined();
    user1ConversationId = createData.id;

    // User1 should be able to read their conversation
    const { data: readData, error: readError } = await user1Client
      .from('conversations')
      .select('*')
      .eq('id', user1ConversationId)
      .single();

    expect(readError).toBeNull();
    expect(readData).toBeDefined();
    expect(readData.id).toBe(user1ConversationId);
  });

  it("should prevent user2 from reading user1's conversation", async () => {
    // User2 tries to read user1's conversation
    const { data, error } = await user2Client.from('conversations').select('*').eq('id', user1ConversationId).single();

    // Should return no data due to RLS
    expect(data).toBeNull();
    expect(error).toBeDefined();
  });

  it("should prevent user2 from updating user1's conversation", async () => {
    const { data, error } = await user2Client
      .from('conversations')
      .update({ title: 'Hacked Title' })
      .eq('id', user1ConversationId);

    // Should fail due to RLS
    expect(error).toBeDefined();
  });

  it("should prevent user2 from deleting user1's conversation", async () => {
    const { data, error } = await user2Client.from('conversations').delete().eq('id', user1ConversationId);

    // Should fail due to RLS
    expect(error).toBeDefined();
  });

  it('should allow user1 to list only their conversations', async () => {
    const { data, error } = await user1Client.from('conversations').select('*');

    expect(error).toBeNull();
    expect(data).toBeDefined();
    // All returned conversations should belong to user1
    data?.forEach((conversation) => {
      expect(conversation.user_id).toBe(user1Id);
    });
  });
});
