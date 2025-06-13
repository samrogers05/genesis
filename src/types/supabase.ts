export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      messages: {
        Row: {
          id: string
          sender_id: string
          receiver_id: string
          content: string
          createdat: string
        }
        Insert: {
          id?: string
          sender_id: string
          receiver_id: string
          content: string
          createdat?: string
        }
        Update: {
          id?: string
          sender_id?: string
          receiver_id?: string
          content?: string
          createdat?: string
        }
      }
      Profile: {
        Row: {
          id: string
          fullName: string | null
          avatarUrl: string | null
          email: string | null
        }
        Insert: {
          id: string
          fullName?: string | null
          avatarUrl?: string | null
          email?: string | null
        }
        Update: {
          id?: string
          fullName?: string | null
          avatarUrl?: string | null
          email?: string | null
        }
      }
    }
    Functions: {
      get_conversation_messages: {
        Args: {
          p_user_id: string
          p_other_user_id: string
          p_last_message_time?: string
        }
        Returns: {
          id: string
          sender_id: string
          receiver_id: string
          content: string
          createdat: string
        }[]
      }
    }
  }
} 