import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zqnkcontuonquefkdejq.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpxbmtjb250dW9ucXVlZmtkZWpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMTUwOTUsImV4cCI6MjA3MjU5MTA5NX0.otRdz-XpydPsBlOnazyTHC0MI0r3_oFo3smH8XGMVpk'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Profile {
  id: string
  user_id: string
  full_name: string
  username: string
  bio?: string
  age?: number
  location?: string
  interests: string[]
  avatar_url?: string
  privacy_setting: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Post {
  id: string
  author_id: string
  content: string
  media_urls: string[]
  media_type?: string
  audience_type: string
  is_public: boolean
  likes_count: number
  comments_count: number
  is_reported: boolean
  is_approved: boolean
  created_at: string
  updated_at: string
  author?: Profile
}

export interface Friend {
  id: string
  user_id: string
  friend_id: string
  status: string
  created_at: string
  friend_profile?: Profile
}

export interface FriendRequest {
  id: string
  sender_id: string
  receiver_id: string
  status: string
  message?: string
  created_at: string
  updated_at: string
  sender_profile?: Profile
  receiver_profile?: Profile
}

export interface PostLike {
  id: string
  post_id: string
  user_id: string
  created_at: string
}

export interface TextComment {
  id: string
  post_id: string
  user_id: string
  content: string
  is_reported: boolean
  created_at: string
  author?: Profile
}

export interface VoiceComment {
  id: string
  post_id: string
  user_id: string
  audio_url: string
  duration_seconds: number
  transcription?: string
  is_reported: boolean
  created_at: string
  author?: Profile
}

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  data?: any
  is_read: boolean
  created_at: string
}

export interface ReportedContent {
  id: string
  content_id: string
  content_type: string
  reporter_id: string
  reason: string
  description?: string
  status: string
  reviewed_by?: string
  reviewed_at?: string
  created_at: string
}