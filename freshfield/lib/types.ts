export interface Profile {
  id: string
  slug: string
  name: string
  bio: string | null
  avatar_url: string | null
  website_url: string | null
  medium_tags: string[]
  created_at: string
}

export interface Work {
  id: string
  profile_id: string
  title: string | null
  year: string | null
  medium: string | null
  description: string | null
  tags: string[]
  file_url: string
  file_type: 'image' | 'audio' | 'video'
  thumbnail_url: string | null
  published_at: string | null
  scheduled_for: string | null
  is_draft: boolean
  deep_dives: number
  created_at: string
  profile?: Profile
}

export interface Comment {
  id: string
  work_id: string
  user_id: string
  body: string
  created_at: string
}

export interface NewsletterSubscription {
  id: string
  profile_id: string
  email: string
  confirmed: boolean
  created_at: string
}

export interface Favorite {
  user_id: string
  profile_id: string
  created_at: string
}

export interface WorkLike {
  user_id: string
  work_id: string
  created_at: string
}

// Newsletter

export type NewsletterBlockType =
  | 'text'
  | 'h1'
  | 'h2'
  | 'list'
  | 'quote'
  | 'divider'
  | 'button'
  | 'image'
  | 'work'
  | 'video'

export interface NewsletterBlock {
  id: string
  type: NewsletterBlockType
  // text, h1, h2, quote
  content?: string
  // list
  items?: string[]
  // button
  label?: string
  url?: string
  // image
  src?: string
  caption?: string
  // work (eingebettetes eigenes Werk)
  work_id?: string
  // video (YouTube/Vimeo URL)
  video_url?: string
}

export interface Newsletter {
  id: string
  profile_id: string
  subject: string
  blocks: NewsletterBlock[]
  status: 'draft' | 'scheduled' | 'sent'
  scheduled_for: string | null
  sent_at: string | null
  created_at: string
  updated_at: string
}
