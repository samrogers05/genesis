import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';

export const createClient = () => {
  return createClientComponentClient<Database>();
};

// Message types
export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  createdat: string;
}

// Conversation types
export interface Conversation {
  id: string;
  other_user: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
  };
  last_message: Message | null;
}

// Message fetching utilities
export const fetchMessages = async (
  supabase: ReturnType<typeof createClient>,
  otherUserId: string,
  lastMessageTime: string | null = null
): Promise<Message[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .rpc('get_conversation_messages', {
      p_user_id: user.id,
      p_other_user_id: otherUserId,
      p_last_message_time: lastMessageTime
    });

  if (error) throw error;
  return data || [];
};

export const sendMessage = async (
  supabase: ReturnType<typeof createClient>,
  receiverId: string,
  content: string
): Promise<Message> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('messages')
    .insert({
      sender_id: user.id,
      receiver_id: receiverId,
      content
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};
