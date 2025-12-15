export type MessageType = 'text' | 'image';
export type Sender = 'user' | 'ai' | 'system';

export interface Message {
  id: string;
  content: string;
  sender: Sender;
  type: MessageType;
  created_at: string;
  image_url?: string; // For image messages
}

export interface User {
  username: string;
  isAuthenticated: boolean;
}

// Supabase Database Definition
export interface Database {
  public: {
    Tables: {
      messages: {
        Row: {
          id: string;
          content: string;
          sender: string;
          type: string;
          image_url: string | null;
          created_at: string;
        };
        Insert: {
          content: string;
          sender: string;
          type: string;
          image_url?: string | null;
        };
      };
    };
  };
}