export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[]

export interface Database {
  public: {
    Tables: {
      attachments: {
        Row: {
          uuid: string
          domain: string | null
          thread_uuid: string | null
          created_at: string | null
          type: string | null
          name: string | null
          cid: string | null
          inline: boolean | null
          url: string | null
          dimensions: Json | null
        }
        Insert: {
          uuid?: string
          domain?: string | null
          thread_uuid?: string | null
          created_at?: string | null
          type?: string | null
          name?: string | null
          cid?: string | null
          inline?: boolean | null
          url?: string | null
          dimensions?: Json | null
        }
        Update: {
          uuid?: string
          domain?: string | null
          thread_uuid?: string | null
          created_at?: string | null
          type?: string | null
          name?: string | null
          cid?: string | null
          inline?: boolean | null
          url?: string | null
          dimensions?: Json | null
        }
      }
      entities: {
        Row: {
          uuid: string
          created_at: string | null
          archived: boolean | null
          slug: string | null
          name: string | null
          description: string | null
          image_url: string | null
          primaryColor: string | null
          secondaryColor: string | null
        }
        Insert: {
          uuid?: string
          created_at?: string | null
          archived?: boolean | null
          slug?: string | null
          name?: string | null
          description?: string | null
          image_url?: string | null
          primaryColor?: string | null
          secondaryColor?: string | null
        }
        Update: {
          uuid?: string
          created_at?: string | null
          archived?: boolean | null
          slug?: string | null
          name?: string | null
          description?: string | null
          image_url?: string | null
          primaryColor?: string | null
          secondaryColor?: string | null
        }
      }
      groups: {
        Row: {
          uuid: string
          domain: string | null
          slug: string | null
          description: string | null
          created_at: string | null
          title: string | null
          image_url: string | null
          favicon_url: string | null
          aliases: string[] | null
          googleDocId: string | null
          position: number | null
          type: string | null
        }
        Insert: {
          uuid?: string
          domain?: string | null
          slug?: string | null
          description?: string | null
          created_at?: string | null
          title?: string | null
          image_url?: string | null
          favicon_url?: string | null
          aliases?: string[] | null
          googleDocId?: string | null
          position?: number | null
          type?: string | null
        }
        Update: {
          uuid?: string
          domain?: string | null
          slug?: string | null
          description?: string | null
          created_at?: string | null
          title?: string | null
          image_url?: string | null
          favicon_url?: string | null
          aliases?: string[] | null
          googleDocId?: string | null
          position?: number | null
          type?: string | null
        }
      }
      messages: {
        Row: {
          created_at: string | null
          uuid: string
          attachments: Json | null
          from_name: string | null
          from_email: string | null
          text: string | null
          html: string | null
          sent_at: string | null
          in_reply_to: string | null
          inlines: Json | null
          thread_uuid: string | null
          message_id: string | null
        }
        Insert: {
          created_at?: string | null
          uuid?: string
          attachments?: Json | null
          from_name?: string | null
          from_email?: string | null
          text?: string | null
          html?: string | null
          sent_at?: string | null
          in_reply_to?: string | null
          inlines?: Json | null
          thread_uuid?: string | null
          message_id?: string | null
        }
        Update: {
          created_at?: string | null
          uuid?: string
          attachments?: Json | null
          from_name?: string | null
          from_email?: string | null
          text?: string | null
          html?: string | null
          sent_at?: string | null
          in_reply_to?: string | null
          inlines?: Json | null
          thread_uuid?: string | null
          message_id?: string | null
        }
      }
      profiles: {
        Row: {
          uuid: string
          created_at: string | null
          username: string | null
          firstName: string | null
          lastName: string | null
          nickname: string | null
          avatar_url: string | null
          description: string | null
          city: string | null
          user_uuid: string | null
        }
        Insert: {
          uuid?: string
          created_at?: string | null
          username?: string | null
          firstName?: string | null
          lastName?: string | null
          nickname?: string | null
          avatar_url?: string | null
          description?: string | null
          city?: string | null
          user_uuid?: string | null
        }
        Update: {
          uuid?: string
          created_at?: string | null
          username?: string | null
          firstName?: string | null
          lastName?: string | null
          nickname?: string | null
          avatar_url?: string | null
          description?: string | null
          city?: string | null
          user_uuid?: string | null
        }
      }
      roles: {
        Row: {
          uuid: string
          created_at: string | null
          profile_uuid: string | null
          group_uuid: string | null
          role: string | null
          domain: string | null
        }
        Insert: {
          uuid?: string
          created_at?: string | null
          profile_uuid?: string | null
          group_uuid?: string | null
          role?: string | null
          domain?: string | null
        }
        Update: {
          uuid?: string
          created_at?: string | null
          profile_uuid?: string | null
          group_uuid?: string | null
          role?: string | null
          domain?: string | null
        }
      }
      subscriptions: {
        Row: {
          uuid: string
          created_at: string | null
          domain: string | null
          group_uuid: string | null
          thread_uuid: string | null
          email: string | null
        }
        Insert: {
          uuid?: string
          created_at?: string | null
          domain?: string | null
          group_uuid?: string | null
          thread_uuid?: string | null
          email?: string | null
        }
        Update: {
          uuid?: string
          created_at?: string | null
          domain?: string | null
          group_uuid?: string | null
          thread_uuid?: string | null
          email?: string | null
        }
      }
      tags: {
        Row: {
          id: number
          created_at: string | null
          hashtag: string | null
          name: string | null
          description: string | null
          color: string | null
        }
        Insert: {
          id?: number
          created_at?: string | null
          hashtag?: string | null
          name?: string | null
          description?: string | null
          color?: string | null
        }
        Update: {
          id?: number
          created_at?: string | null
          hashtag?: string | null
          name?: string | null
          description?: string | null
          color?: string | null
        }
      }
      threads: {
        Row: {
          uuid: string
          created_at: string | null
          version: number | null
          archived: boolean | null
          slug: string | null
          subject: string | null
          description: string | null
          image: string | null
          message_id: string | null
          domain: string | null
          from_name: string | null
          from_email: string | null
          group_uuid: string | null
        }
        Insert: {
          uuid: string
          created_at?: string | null
          version?: number | null
          archived?: boolean | null
          slug?: string | null
          subject?: string | null
          description?: string | null
          image?: string | null
          message_id?: string | null
          domain?: string | null
          from_name?: string | null
          from_email?: string | null
          group_uuid?: string | null
        }
        Update: {
          uuid?: string
          created_at?: string | null
          version?: number | null
          archived?: boolean | null
          slug?: string | null
          subject?: string | null
          description?: string | null
          image?: string | null
          message_id?: string | null
          domain?: string | null
          from_name?: string | null
          from_email?: string | null
          group_uuid?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      "truncate_tables": any
    }
    Enums: {
      [_ in never]: never
    }
  }
}
