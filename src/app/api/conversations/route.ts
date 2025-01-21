import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();
  console.log('session POST in conversations route', session);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { title, conversationMode } = await request.json();

  // get the user id from the users table

  try {
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (!user || userError) {
      console.error('userError:', userError);
      return NextResponse.json({ error: `User not found ${userError}` }, { status: 404 });
    }

    const { data: conversation, error } = await supabase
      .from('conversations')
      .insert({
        user_id: user.id,
        title,
        conversation_mode: conversationMode,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating conversation:', error);
      return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
    }

    return NextResponse.json(conversation);
  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
  }
}

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  //console.log('session GET in conversations route', user);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // get all the conversations records in the table
    const { data: userDB, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!userDB || userError) {
      console.error('userError:', userError);
      return NextResponse.json({ error: `User not found ${userError}` }, { status: 404 });
    }

    const { data: allConversations, error } = await supabase
      .from('conversations')
      .select('*')
      .order('created_at', { ascending: false });
    /* const userConversations = await db.query.conversations.findMany({
      where: (conversations, { eq }) => eq(conversations.userId, userDB.id),
      orderBy: (conversations, { desc }) => [desc(conversations.createdAt)],
    }); */

    if (error) {
      console.error('Error fetching conversations:', error);
      return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
    }

    return NextResponse.json(allConversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}
