export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          location_id: string
          created_at: string
          updated_at: string
          company_name: string | null
          email: string | null
          full_name: string | null
        }
        Insert: {
          id?: string
          location_id: string
          created_at?: string
          updated_at?: string
          company_name?: string | null
          email?: string | null
          full_name?: string | null
        }
        Update: {
          id?: string
          location_id?: string
          created_at?: string
          updated_at?: string
          company_name?: string | null
          email?: string | null
          full_name?: string | null
        }
      }
      company_data: {
        Row: {
          id: string
          location_id: string
          created_at: string
          updated_at: string
          business_type: string
          industry: string
          target_audience: string
          company_description: string
          brand_voice: string
          key_products: string[]
          competitors: string[]
        }
        Insert: {
          id?: string
          location_id: string
          created_at?: string
          updated_at?: string
          business_type: string
          industry: string
          target_audience: string
          company_description: string
          brand_voice: string
          key_products?: string[]
          competitors?: string[]
        }
        Update: {
          id?: string
          location_id?: string
          created_at?: string
          updated_at?: string
          business_type?: string
          industry?: string
          target_audience?: string
          company_description?: string
          brand_voice?: string
          key_products?: string[]
          competitors?: string[]
        }
      }
      target_market_data: {
        Row: {
          id: string
          location_id: string
          created_at: string
          updated_at: string
          demographics: Json
          psychographics: Json
          pain_points: string[]
          goals: string[]
          buying_behavior: string
          market_size: string
        }
        Insert: {
          id?: string
          location_id: string
          created_at?: string
          updated_at?: string
          demographics: Json
          psychographics: Json
          pain_points?: string[]
          goals?: string[]
          buying_behavior: string
          market_size: string
        }
        Update: {
          id?: string
          location_id?: string
          created_at?: string
          updated_at?: string
          demographics?: Json
          psychographics?: Json
          pain_points?: string[]
          goals?: string[]
          buying_behavior?: string
          market_size?: string
        }
      }
      campaigns: {
        Row: {
          id: string
          location_id: string
          created_at: string
          updated_at: string
          name: string
          article: {
            title: string
            content: string
            meta_description: string
            keywords: string[]
          }
          social_media_posts: {
            platform: string
            content: string
            image_url?: string
          }[]
          email_campaign: {
            subject_lines: string[]
            emails: {
              content: string
              order: number
            }[]
          }
          images: {
            url: string
            alt: string
            type: string
          }[]
          status: 'draft' | 'published' | 'archived'
          target_audience: string
          campaign_goals: string[]
        }
        Insert: {
          id?: string
          location_id: string
          created_at?: string
          updated_at?: string
          name: string
          article: {
            title: string
            content: string
            meta_description: string
            keywords: string[]
          }
          social_media_posts: {
            platform: string
            content: string
            image_url?: string
          }[]
          email_campaign: {
            subject_lines: string[]
            emails: {
              content: string
              order: number
            }[]
          }
          images: {
            url: string
            alt: string
            type: string
          }[]
          status?: 'draft' | 'published' | 'archived'
          target_audience: string
          campaign_goals?: string[]
        }
        Update: {
          id?: string
          location_id?: string
          created_at?: string
          updated_at?: string
          name?: string
          article?: {
            title: string
            content: string
            meta_description: string
            keywords: string[]
          }
          social_media_posts?: {
            platform: string
            content: string
            image_url?: string
          }[]
          email_campaign?: {
            subject_lines: string[]
            emails: {
              content: string
              order: number
            }[]
          }
          images?: {
            url: string
            alt: string
            type: string
          }[]
          status?: 'draft' | 'published' | 'archived'
          target_audience?: string
          campaign_goals?: string[]
        }
      }
      images: {
        Row: {
          id: string
          location_id: string
          created_at: string
          updated_at: string
          url: string
          alt: string
          type: string
          tags: string[]
          metadata: Json
        }
        Insert: {
          id?: string
          location_id: string
          created_at?: string
          updated_at?: string
          url: string
          alt: string
          type: string
          tags?: string[]
          metadata?: Json
        }
        Update: {
          id?: string
          location_id?: string
          created_at?: string
          updated_at?: string
          url?: string
          alt?: string
          type?: string
          tags?: string[]
          metadata?: Json
        }
      }
    }
  }
}
