export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      api_keys: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          revoked_at: string | null
          scopes: string[]
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          revoked_at?: string | null
          scopes?: string[]
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          revoked_at?: string | null
          scopes?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          after: Json | null
          before: Json | null
          company_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          ip: unknown
          module: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          after?: Json | null
          before?: Json | null
          company_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip?: unknown
          module: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          after?: Json | null
          before?: Json | null
          company_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip?: unknown
          module?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_recipients: {
        Row: {
          campaign_id: string
          contact_id: string | null
          cost: number
          created_at: string
          delivered_at: string | null
          error_code: string | null
          id: string
          phone: string
          sent_at: string | null
          status: Database["public"]["Enums"]["message_status"]
          variables: Json
        }
        Insert: {
          campaign_id: string
          contact_id?: string | null
          cost?: number
          created_at?: string
          delivered_at?: string | null
          error_code?: string | null
          id?: string
          phone: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["message_status"]
          variables?: Json
        }
        Update: {
          campaign_id?: string
          contact_id?: string | null
          cost?: number
          created_at?: string
          delivered_at?: string | null
          error_code?: string | null
          id?: string
          phone?: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["message_status"]
          variables?: Json
        }
        Relationships: [
          {
            foreignKeyName: "campaign_recipients_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_recipients_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          channel: Database["public"]["Enums"]["message_channel"]
          company_id: string
          completed_at: string | null
          cost: number
          created_at: string
          created_by: string | null
          id: string
          message_body: string | null
          metadata: Json
          name: string
          scheduled_at: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["campaign_status"]
          template_id: string | null
          total_delivered: number
          total_failed: number
          total_recipients: number
          total_sent: number
          updated_at: string
        }
        Insert: {
          channel?: Database["public"]["Enums"]["message_channel"]
          company_id: string
          completed_at?: string | null
          cost?: number
          created_at?: string
          created_by?: string | null
          id?: string
          message_body?: string | null
          metadata?: Json
          name: string
          scheduled_at?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          template_id?: string | null
          total_delivered?: number
          total_failed?: number
          total_recipients?: number
          total_sent?: number
          updated_at?: string
        }
        Update: {
          channel?: Database["public"]["Enums"]["message_channel"]
          company_id?: string
          completed_at?: string | null
          cost?: number
          created_at?: string
          created_by?: string | null
          id?: string
          message_body?: string | null
          metadata?: Json
          name?: string
          scheduled_at?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          template_id?: string | null
          total_delivered?: number
          total_failed?: number
          total_recipients?: number
          total_sent?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      commercial_features: {
        Row: {
          category: string
          created_at: string
          description: string
          icon: string
          id: string
          is_active: boolean
          key: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          is_active?: boolean
          key: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          is_active?: boolean
          key?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      commercial_history: {
        Row: {
          amount: number | null
          company_id: string | null
          created_at: string
          created_by: string | null
          currency: string
          description: string | null
          entity_id: string | null
          entity_type: string | null
          event_type: string
          id: string
          metadata: Json
        }
        Insert: {
          amount?: number | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          entity_id?: string | null
          entity_type?: string | null
          event_type: string
          id?: string
          metadata?: Json
        }
        Update: {
          amount?: number | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          entity_id?: string | null
          entity_type?: string | null
          event_type?: string
          id?: string
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "commercial_history_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      commercial_promotions: {
        Row: {
          auto_apply: boolean
          channel: string | null
          code: string
          created_at: string
          created_by: string | null
          description: string
          ends_at: string | null
          id: string
          kind: string
          max_redemptions: number
          name: string
          redemptions: number
          starts_at: string | null
          status: string
          updated_at: string
          value: number
          value_type: string
        }
        Insert: {
          auto_apply?: boolean
          channel?: string | null
          code: string
          created_at?: string
          created_by?: string | null
          description?: string
          ends_at?: string | null
          id?: string
          kind?: string
          max_redemptions?: number
          name: string
          redemptions?: number
          starts_at?: string | null
          status?: string
          updated_at?: string
          value?: number
          value_type?: string
        }
        Update: {
          auto_apply?: boolean
          channel?: string | null
          code?: string
          created_at?: string
          created_by?: string | null
          description?: string
          ends_at?: string | null
          id?: string
          kind?: string
          max_redemptions?: number
          name?: string
          redemptions?: number
          starts_at?: string | null
          status?: string
          updated_at?: string
          value?: number
          value_type?: string
        }
        Relationships: []
      }
      companies: {
        Row: {
          balance: number
          created_at: string
          currency: string
          id: string
          logo_url: string | null
          metadata: Json
          name: string
          plan_code: string | null
          slug: string
          status: Database["public"]["Enums"]["company_status"]
          tax_id: string | null
          timezone: string
          updated_at: string
        }
        Insert: {
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          logo_url?: string | null
          metadata?: Json
          name: string
          plan_code?: string | null
          slug: string
          status?: Database["public"]["Enums"]["company_status"]
          tax_id?: string | null
          timezone?: string
          updated_at?: string
        }
        Update: {
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          logo_url?: string | null
          metadata?: Json
          name?: string
          plan_code?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["company_status"]
          tax_id?: string | null
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      company_members: {
        Row: {
          company_id: string
          id: string
          invited_by: string | null
          is_active: boolean
          joined_at: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          company_id: string
          id?: string
          invited_by?: string | null
          is_active?: boolean
          joined_at?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          company_id?: string
          id?: string
          invited_by?: string | null
          is_active?: boolean
          joined_at?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_group_members: {
        Row: {
          added_at: string
          contact_id: string
          group_id: string
        }
        Insert: {
          added_at?: string
          contact_id: string
          group_id: string
        }
        Update: {
          added_at?: string
          contact_id?: string
          group_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_group_members_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "contact_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_groups: {
        Row: {
          color: string | null
          company_id: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_groups_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          attributes: Json
          company_id: string
          country_code: string | null
          created_at: string
          created_by: string | null
          email: string | null
          first_name: string | null
          id: string
          last_conversation_at: string | null
          last_name: string | null
          opt_in: boolean
          phone: string
          preferred_channel: Database["public"]["Enums"]["preferred_channel"]
          status: string
          tags: string[]
          updated_at: string
          whatsapp_phone: string | null
        }
        Insert: {
          attributes?: Json
          company_id: string
          country_code?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_conversation_at?: string | null
          last_name?: string | null
          opt_in?: boolean
          phone: string
          preferred_channel?: Database["public"]["Enums"]["preferred_channel"]
          status?: string
          tags?: string[]
          updated_at?: string
          whatsapp_phone?: string | null
        }
        Update: {
          attributes?: Json
          company_id?: string
          country_code?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_conversation_at?: string | null
          last_name?: string | null
          opt_in?: boolean
          phone?: string
          preferred_channel?: Database["public"]["Enums"]["preferred_channel"]
          status?: string
          tags?: string[]
          updated_at?: string
          whatsapp_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          created_at: string
          description: string | null
          enabled_globally: boolean
          id: string
          key: string
          rollout_percentage: number
          target_companies: string[]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          enabled_globally?: boolean
          id?: string
          key: string
          rollout_percentage?: number
          target_companies?: string[]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          enabled_globally?: boolean
          id?: string
          key?: string
          rollout_percentage?: number
          target_companies?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          company_id: string
          created_at: string
          currency: string
          due_at: string | null
          id: string
          issued_at: string | null
          metadata: Json
          number: string
          paid_at: string | null
          pdf_url: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          subtotal: number
          tax: number
          total: number
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          currency?: string
          due_at?: string | null
          id?: string
          issued_at?: string | null
          metadata?: Json
          number: string
          paid_at?: string | null
          pdf_url?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          currency?: string
          due_at?: string | null
          id?: string
          issued_at?: string | null
          metadata?: Json
          number?: string
          paid_at?: string | null
          pdf_url?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          company_id: string | null
          created_at: string
          id: string
          link: string | null
          metadata: Json
          read_at: string | null
          severity: Database["public"]["Enums"]["notification_severity"]
          title: string
          user_id: string | null
        }
        Insert: {
          body?: string | null
          company_id?: string | null
          created_at?: string
          id?: string
          link?: string | null
          metadata?: Json
          read_at?: string | null
          severity?: Database["public"]["Enums"]["notification_severity"]
          title: string
          user_id?: string | null
        }
        Update: {
          body?: string | null
          company_id?: string | null
          created_at?: string
          id?: string
          link?: string | null
          metadata?: Json
          read_at?: string | null
          severity?: Database["public"]["Enums"]["notification_severity"]
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      nova_ai_logs: {
        Row: {
          company_id: string | null
          conversation_id: string | null
          cost: number
          created_at: string
          error: string | null
          id: string
          latency_ms: number
          model: string
          prompt: string
          provider: string
          response: string
          status: string
          tokens_input: number
          tokens_output: number
          tool_calls: Json
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
          conversation_id?: string | null
          cost?: number
          created_at?: string
          error?: string | null
          id?: string
          latency_ms?: number
          model: string
          prompt?: string
          provider?: string
          response?: string
          status?: string
          tokens_input?: number
          tokens_output?: number
          tool_calls?: Json
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
          conversation_id?: string | null
          cost?: number
          created_at?: string
          error?: string | null
          id?: string
          latency_ms?: number
          model?: string
          prompt?: string
          provider?: string
          response?: string
          status?: string
          tokens_input?: number
          tokens_output?: number
          tool_calls?: Json
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nova_ai_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nova_ai_logs_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "nova_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      nova_chunks: {
        Row: {
          chunk_index: number
          company_id: string | null
          content: string
          created_at: string
          document_id: string
          embedding: string | null
          id: string
          metadata: Json
          token_count: number
        }
        Insert: {
          chunk_index?: number
          company_id?: string | null
          content: string
          created_at?: string
          document_id: string
          embedding?: string | null
          id?: string
          metadata?: Json
          token_count?: number
        }
        Update: {
          chunk_index?: number
          company_id?: string | null
          content?: string
          created_at?: string
          document_id?: string
          embedding?: string | null
          id?: string
          metadata?: Json
          token_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "nova_chunks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nova_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "nova_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      nova_conversations: {
        Row: {
          archived_at: string | null
          company_id: string | null
          context: Json
          created_at: string
          id: string
          is_favorite: boolean
          model: string | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          company_id?: string | null
          context?: Json
          created_at?: string
          id?: string
          is_favorite?: boolean
          model?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          archived_at?: string | null
          company_id?: string | null
          context?: Json
          created_at?: string
          id?: string
          is_favorite?: boolean
          model?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nova_conversations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      nova_documents: {
        Row: {
          author_id: string | null
          category: string
          chunk_count: number
          company_id: string | null
          created_at: string
          error: string | null
          id: string
          metadata: Json
          mime_type: string | null
          name: string
          size_bytes: number
          source_type: string
          source_url: string | null
          status: string
          storage_path: string | null
          token_count: number
          updated_at: string
          version: number
        }
        Insert: {
          author_id?: string | null
          category?: string
          chunk_count?: number
          company_id?: string | null
          created_at?: string
          error?: string | null
          id?: string
          metadata?: Json
          mime_type?: string | null
          name: string
          size_bytes?: number
          source_type?: string
          source_url?: string | null
          status?: string
          storage_path?: string | null
          token_count?: number
          updated_at?: string
          version?: number
        }
        Update: {
          author_id?: string | null
          category?: string
          chunk_count?: number
          company_id?: string | null
          created_at?: string
          error?: string | null
          id?: string
          metadata?: Json
          mime_type?: string | null
          name?: string
          size_bytes?: number
          source_type?: string
          source_url?: string | null
          status?: string
          storage_path?: string | null
          token_count?: number
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "nova_documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      nova_memory: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          key: string
          scope: string
          updated_at: string
          user_id: string | null
          value: Json
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          key: string
          scope?: string
          updated_at?: string
          user_id?: string | null
          value?: Json
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          key?: string
          scope?: string
          updated_at?: string
          user_id?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "nova_memory_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      nova_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          metadata: Json
          role: Database["public"]["Enums"]["nova_role"]
          tokens_input: number | null
          tokens_output: number | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          metadata?: Json
          role: Database["public"]["Enums"]["nova_role"]
          tokens_input?: number | null
          tokens_output?: number | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          metadata?: Json
          role?: Database["public"]["Enums"]["nova_role"]
          tokens_input?: number | null
          tokens_output?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "nova_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "nova_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      nova_prompt_versions: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          id: string
          note: string | null
          prompt_id: string
          version: number
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          prompt_id: string
          version: number
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          prompt_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "nova_prompt_versions_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "nova_prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      nova_prompts: {
        Row: {
          company_id: string | null
          content: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          key: string
          name: string
          updated_at: string
          version: number
        }
        Insert: {
          company_id?: string | null
          content?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          key: string
          name: string
          updated_at?: string
          version?: number
        }
        Update: {
          company_id?: string | null
          content?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          key?: string
          name?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "nova_prompts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      nova_tools: {
        Row: {
          category: string
          code: string
          created_at: string
          description: string
          id: string
          is_enabled: boolean
          is_ready: boolean
          min_role: Database["public"]["Enums"]["app_role"]
          name: string
          required_permission: string | null
          updated_at: string
        }
        Insert: {
          category?: string
          code: string
          created_at?: string
          description?: string
          id?: string
          is_enabled?: boolean
          is_ready?: boolean
          min_role?: Database["public"]["Enums"]["app_role"]
          name: string
          required_permission?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          code?: string
          created_at?: string
          description?: string
          id?: string
          is_enabled?: boolean
          is_ready?: boolean
          min_role?: Database["public"]["Enums"]["app_role"]
          name?: string
          required_permission?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      payment_gateways: {
        Row: {
          code: string
          config: Json
          created_at: string
          description: string
          icon: string
          id: string
          is_enabled: boolean
          last_test_at: string | null
          last_test_message: string | null
          last_test_ok: boolean | null
          mode: string
          name: string
          sort_order: number
          status: string
          updated_at: string
        }
        Insert: {
          code: string
          config?: Json
          created_at?: string
          description?: string
          icon?: string
          id?: string
          is_enabled?: boolean
          last_test_at?: string | null
          last_test_message?: string | null
          last_test_ok?: boolean | null
          mode?: string
          name: string
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Update: {
          code?: string
          config?: Json
          created_at?: string
          description?: string
          icon?: string
          id?: string
          is_enabled?: boolean
          last_test_at?: string | null
          last_test_message?: string | null
          last_test_ok?: boolean | null
          mode?: string
          name?: string
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      permissions: {
        Row: {
          code: string
          description: string | null
          id: string
          module: string
        }
        Insert: {
          code: string
          description?: string | null
          id?: string
          module: string
        }
        Update: {
          code?: string
          description?: string | null
          id?: string
          module?: string
        }
        Relationships: []
      }
      plan_features: {
        Row: {
          created_at: string
          feature_key: string
          id: string
          included: boolean
          note: string | null
          plan_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          feature_key: string
          id?: string
          included?: boolean
          note?: string | null
          plan_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          feature_key?: string
          id?: string
          included?: boolean
          note?: string | null
          plan_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_features_feature_key_fkey"
            columns: ["feature_key"]
            isOneToOne: false
            referencedRelation: "commercial_features"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "plan_features_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_limits: {
        Row: {
          created_at: string
          id: string
          is_unlimited: boolean
          limit_key: string
          limit_value: number
          plan_id: string
          unit: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_unlimited?: boolean
          limit_key: string
          limit_value?: number
          plan_id: string
          unit?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_unlimited?: boolean
          limit_key?: string
          limit_value?: number
          plan_id?: string
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_limits_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          badge: string | null
          code: string
          color: string
          created_at: string
          currency: string
          description: string
          icon: string
          id: string
          is_active: boolean
          is_visible: boolean
          name: string
          price_monthly: number
          price_yearly: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          badge?: string | null
          code: string
          color?: string
          created_at?: string
          currency?: string
          description?: string
          icon?: string
          id?: string
          is_active?: boolean
          is_visible?: boolean
          name: string
          price_monthly?: number
          price_yearly?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          badge?: string | null
          code?: string
          color?: string
          created_at?: string
          currency?: string
          description?: string
          icon?: string
          id?: string
          is_active?: boolean
          is_visible?: boolean
          name?: string
          price_monthly?: number
          price_yearly?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          is_active: boolean
          last_seen_at: string | null
          locale: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          is_active?: boolean
          last_seen_at?: string | null
          locale?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          last_seen_at?: string | null
          locale?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      rate_tiers: {
        Row: {
          channel: string
          created_at: string
          currency: string
          from_qty: number
          id: string
          is_active: boolean
          sort_order: number
          to_qty: number
          unit_price: number
          updated_at: string
        }
        Insert: {
          channel: string
          created_at?: string
          currency?: string
          from_qty?: number
          id?: string
          is_active?: boolean
          sort_order?: number
          to_qty?: number
          unit_price?: number
          updated_at?: string
        }
        Update: {
          channel?: string
          created_at?: string
          currency?: string
          from_qty?: number
          id?: string
          is_active?: boolean
          sort_order?: number
          to_qty?: number
          unit_price?: number
          updated_at?: string
        }
        Relationships: []
      }
      recharges: {
        Row: {
          amount: number
          channel: string
          company_id: string
          completed_at: string | null
          created_at: string
          created_by: string | null
          currency: string
          gateway_code: string | null
          id: string
          metadata: Json
          mode: string
          payment_method: string | null
          payment_reference: string | null
          receipt_path: string | null
          review_note: string | null
          review_status: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["recharge_status"]
        }
        Insert: {
          amount: number
          channel?: string
          company_id: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          gateway_code?: string | null
          id?: string
          metadata?: Json
          mode?: string
          payment_method?: string | null
          payment_reference?: string | null
          receipt_path?: string | null
          review_note?: string | null
          review_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["recharge_status"]
        }
        Update: {
          amount?: number
          channel?: string
          company_id?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          gateway_code?: string | null
          id?: string
          metadata?: Json
          mode?: string
          payment_method?: string | null
          payment_reference?: string | null
          receipt_path?: string | null
          review_note?: string | null
          review_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["recharge_status"]
        }
        Relationships: [
          {
            foreignKeyName: "recharges_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          id: string
          permission_id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          id?: string
          permission_id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          id?: string
          permission_id?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          is_public: boolean
          key: string
          namespace: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          is_public?: boolean
          key: string
          namespace: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          is_public?: boolean
          key?: string
          namespace?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_messages: {
        Row: {
          body: string
          campaign_id: string | null
          company_id: string
          cost: number
          created_at: string
          created_by: string | null
          delivered_at: string | null
          encoding: string | null
          error_code: string | null
          external_id: string | null
          from_sender: string | null
          id: string
          provider_id: string | null
          segments: number
          sent_at: string | null
          status: Database["public"]["Enums"]["message_status"]
          to_phone: string
        }
        Insert: {
          body: string
          campaign_id?: string | null
          company_id: string
          cost?: number
          created_at?: string
          created_by?: string | null
          delivered_at?: string | null
          encoding?: string | null
          error_code?: string | null
          external_id?: string | null
          from_sender?: string | null
          id?: string
          provider_id?: string | null
          segments?: number
          sent_at?: string | null
          status?: Database["public"]["Enums"]["message_status"]
          to_phone: string
        }
        Update: {
          body?: string
          campaign_id?: string | null
          company_id?: string
          cost?: number
          created_at?: string
          created_by?: string | null
          delivered_at?: string | null
          encoding?: string | null
          error_code?: string | null
          external_id?: string | null
          from_sender?: string | null
          id?: string
          provider_id?: string | null
          segments?: number
          sent_at?: string | null
          status?: Database["public"]["Enums"]["message_status"]
          to_phone?: string
        }
        Relationships: [
          {
            foreignKeyName: "sms_messages_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sms_messages_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sms_messages_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "sms_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_providers: {
        Row: {
          code: string
          company_id: string | null
          config: Json
          created_at: string
          id: string
          is_active: boolean
          name: string
          priority: number
          updated_at: string
        }
        Insert: {
          code: string
          company_id?: string | null
          config?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          priority?: number
          updated_at?: string
        }
        Update: {
          code?: string
          company_id?: string | null
          config?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          priority?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sms_providers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_schedules: {
        Row: {
          actual_cost: number | null
          body: string
          company_id: string
          created_at: string
          error_log: string | null
          error_reason: string | null
          estimated_cost: number
          executed_at: string | null
          id: string
          is_flash: boolean
          metadata: Json
          recipients: string[]
          recipients_failed: number | null
          recipients_sent: number | null
          reference: string
          scheduled_at: string
          status: Database["public"]["Enums"]["sms_schedule_status"]
          timezone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_cost?: number | null
          body: string
          company_id: string
          created_at?: string
          error_log?: string | null
          error_reason?: string | null
          estimated_cost?: number
          executed_at?: string | null
          id?: string
          is_flash?: boolean
          metadata?: Json
          recipients: string[]
          recipients_failed?: number | null
          recipients_sent?: number | null
          reference: string
          scheduled_at: string
          status?: Database["public"]["Enums"]["sms_schedule_status"]
          timezone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          actual_cost?: number | null
          body?: string
          company_id?: string
          created_at?: string
          error_log?: string | null
          error_reason?: string | null
          estimated_cost?: number
          executed_at?: string | null
          id?: string
          is_flash?: boolean
          metadata?: Json
          recipients?: string[]
          recipients_failed?: number | null
          recipients_sent?: number | null
          reference?: string
          scheduled_at?: string
          status?: Database["public"]["Enums"]["sms_schedule_status"]
          timezone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sms_schedules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      system_logs: {
        Row: {
          context: Json
          created_at: string
          id: number
          level: string
          message: string
          source: string | null
        }
        Insert: {
          context?: Json
          created_at?: string
          id?: number
          level: string
          message: string
          source?: string | null
        }
        Update: {
          context?: Json
          created_at?: string
          id?: number
          level?: string
          message?: string
          source?: string | null
        }
        Relationships: []
      }
      templates: {
        Row: {
          company_id: string
          content: string
          created_at: string
          created_by: string | null
          id: string
          is_approved: boolean
          kind: Database["public"]["Enums"]["template_kind"]
          language: string | null
          name: string
          updated_at: string
          variables: Json
        }
        Insert: {
          company_id: string
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_approved?: boolean
          kind?: Database["public"]["Enums"]["template_kind"]
          language?: string | null
          name: string
          updated_at?: string
          variables?: Json
        }
        Update: {
          company_id?: string
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_approved?: boolean
          kind?: Database["public"]["Enums"]["template_kind"]
          language?: string | null
          name?: string
          updated_at?: string
          variables?: Json
        }
        Relationships: [
          {
            foreignKeyName: "templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          balance_after: number | null
          company_id: string
          created_at: string
          currency: string
          description: string | null
          id: string
          metadata: Json
          reference: string | null
          type: Database["public"]["Enums"]["transaction_type"]
        }
        Insert: {
          amount: number
          balance_after?: number | null
          company_id: string
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          metadata?: Json
          reference?: string | null
          type: Database["public"]["Enums"]["transaction_type"]
        }
        Update: {
          amount?: number
          balance_after?: number | null
          company_id?: string
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          metadata?: Json
          reference?: string | null
          type?: Database["public"]["Enums"]["transaction_type"]
        }
        Relationships: [
          {
            foreignKeyName: "transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wa_schedules: {
        Row: {
          account_id: string
          actual_cost: number | null
          company_id: string
          created_at: string | null
          error_log: string | null
          estimated_cost: number | null
          id: string
          message_body: string | null
          recipients: string[]
          reference: string
          scheduled_at: string
          status: string | null
          template_id: string | null
          timezone: string | null
          updated_at: string | null
          user_id: string | null
          variables: Json | null
        }
        Insert: {
          account_id: string
          actual_cost?: number | null
          company_id: string
          created_at?: string | null
          error_log?: string | null
          estimated_cost?: number | null
          id?: string
          message_body?: string | null
          recipients: string[]
          reference: string
          scheduled_at: string
          status?: string | null
          template_id?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string | null
          variables?: Json | null
        }
        Update: {
          account_id?: string
          actual_cost?: number | null
          company_id?: string
          created_at?: string | null
          error_log?: string | null
          estimated_cost?: number | null
          id?: string
          message_body?: string | null
          recipients?: string[]
          reference?: string
          scheduled_at?: string
          status?: string | null
          template_id?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string | null
          variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "wa_schedules_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wa_schedules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wa_schedules_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_transactions: {
        Row: {
          amount: number
          balance_after: number | null
          company_id: string
          created_at: string
          description: string | null
          id: string
          metadata: Json
          reference: string | null
          type: string
          units: number
          wallet_id: string
        }
        Insert: {
          amount?: number
          balance_after?: number | null
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json
          reference?: string | null
          type: string
          units?: number
          wallet_id: string
        }
        Update: {
          amount?: number
          balance_after?: number | null
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json
          reference?: string | null
          type?: string
          units?: number
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          balance: number
          channel: string
          company_id: string
          consumed: number
          created_at: string
          credits: number
          currency: string
          id: string
          status: string
          updated_at: string
        }
        Insert: {
          balance?: number
          channel: string
          company_id: string
          consumed?: number
          created_at?: string
          credits?: number
          currency?: string
          id?: string
          status?: string
          updated_at?: string
        }
        Update: {
          balance?: number
          channel?: string
          company_id?: string
          consumed?: number
          created_at?: string
          credits?: number
          currency?: string
          id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      webhooks: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          events: string[]
          failure_count: number
          id: string
          is_active: boolean
          last_failure_at: string | null
          last_success_at: string | null
          name: string
          secret: string | null
          updated_at: string
          url: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          events?: string[]
          failure_count?: number
          id?: string
          is_active?: boolean
          last_failure_at?: string | null
          last_success_at?: string | null
          name: string
          secret?: string | null
          updated_at?: string
          url: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          events?: string[]
          failure_count?: number
          id?: string
          is_active?: boolean
          last_failure_at?: string | null
          last_success_at?: string | null
          name?: string
          secret?: string | null
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhooks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_accounts: {
        Row: {
          access_token: string | null
          alias: string
          business_account_id: string | null
          company_id: string
          created_at: string
          created_by: string | null
          department: Database["public"]["Enums"]["wa_department"]
          display_phone: string | null
          id: string
          is_primary: boolean
          last_synced_at: string | null
          metadata: Json
          phone_number_id: string | null
          provider: string
          quality_rating: string | null
          refresh_token: string | null
          status: Database["public"]["Enums"]["whatsapp_account_status"]
          token_expires_at: string | null
          updated_at: string
          verified_name: string | null
          waba_name: string | null
          webhook_secret: string | null
          webhook_url: string | null
          webhook_verify_token: string | null
        }
        Insert: {
          access_token?: string | null
          alias: string
          business_account_id?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          department?: Database["public"]["Enums"]["wa_department"]
          display_phone?: string | null
          id?: string
          is_primary?: boolean
          last_synced_at?: string | null
          metadata?: Json
          phone_number_id?: string | null
          provider?: string
          quality_rating?: string | null
          refresh_token?: string | null
          status?: Database["public"]["Enums"]["whatsapp_account_status"]
          token_expires_at?: string | null
          updated_at?: string
          verified_name?: string | null
          waba_name?: string | null
          webhook_secret?: string | null
          webhook_url?: string | null
          webhook_verify_token?: string | null
        }
        Update: {
          access_token?: string | null
          alias?: string
          business_account_id?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          department?: Database["public"]["Enums"]["wa_department"]
          display_phone?: string | null
          id?: string
          is_primary?: boolean
          last_synced_at?: string | null
          metadata?: Json
          phone_number_id?: string | null
          provider?: string
          quality_rating?: string | null
          refresh_token?: string | null
          status?: Database["public"]["Enums"]["whatsapp_account_status"]
          token_expires_at?: string | null
          updated_at?: string
          verified_name?: string | null
          waba_name?: string | null
          webhook_secret?: string | null
          webhook_url?: string | null
          webhook_verify_token?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_accounts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_campaigns: {
        Row: {
          account_id: string | null
          company_id: string
          completed_at: string | null
          cost: number
          created_at: string
          created_by: string | null
          id: string
          metadata: Json
          name: string
          scheduled_at: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["campaign_status"]
          template_id: string | null
          total_delivered: number
          total_failed: number
          total_read: number
          total_recipients: number
          total_sent: number
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          company_id: string
          completed_at?: string | null
          cost?: number
          created_at?: string
          created_by?: string | null
          id?: string
          metadata?: Json
          name: string
          scheduled_at?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          template_id?: string | null
          total_delivered?: number
          total_failed?: number
          total_read?: number
          total_recipients?: number
          total_sent?: number
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          company_id?: string
          completed_at?: string | null
          cost?: number
          created_at?: string
          created_by?: string | null
          id?: string
          metadata?: Json
          name?: string
          scheduled_at?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          template_id?: string | null
          total_delivered?: number
          total_failed?: number
          total_read?: number
          total_recipients?: number
          total_sent?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_campaigns_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_campaigns_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_campaigns_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_conversations: {
        Row: {
          account_id: string | null
          assigned_to: string | null
          channel: Database["public"]["Enums"]["message_channel"]
          company_id: string
          contact_id: string | null
          contact_name: string | null
          contact_phone: string
          created_at: string
          external_id: string | null
          id: string
          last_message_at: string | null
          last_message_preview: string | null
          metadata: Json
          status: Database["public"]["Enums"]["conversation_status"]
          tags: string[]
          unread_count: number
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          assigned_to?: string | null
          channel?: Database["public"]["Enums"]["message_channel"]
          company_id: string
          contact_id?: string | null
          contact_name?: string | null
          contact_phone: string
          created_at?: string
          external_id?: string | null
          id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          metadata?: Json
          status?: Database["public"]["Enums"]["conversation_status"]
          tags?: string[]
          unread_count?: number
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          assigned_to?: string | null
          channel?: Database["public"]["Enums"]["message_channel"]
          company_id?: string
          contact_id?: string | null
          contact_name?: string | null
          contact_phone?: string
          created_at?: string
          external_id?: string | null
          id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          metadata?: Json
          status?: Database["public"]["Enums"]["conversation_status"]
          tags?: string[]
          unread_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_conversations_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_conversations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_conversations_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_media: {
        Row: {
          caption: string | null
          company_id: string
          conversation_id: string | null
          created_at: string
          external_url: string | null
          id: string
          kind: string
          message_id: string | null
          metadata: Json
          mime_type: string | null
          size_bytes: number
          storage_path: string | null
        }
        Insert: {
          caption?: string | null
          company_id: string
          conversation_id?: string | null
          created_at?: string
          external_url?: string | null
          id?: string
          kind?: string
          message_id?: string | null
          metadata?: Json
          mime_type?: string | null
          size_bytes?: number
          storage_path?: string | null
        }
        Update: {
          caption?: string | null
          company_id?: string
          conversation_id?: string | null
          created_at?: string
          external_url?: string | null
          id?: string
          kind?: string
          message_id?: string | null
          metadata?: Json
          mime_type?: string | null
          size_bytes?: number
          storage_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_media_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_media_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_media_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_messages: {
        Row: {
          account_id: string | null
          body: string | null
          campaign_id: string | null
          company_id: string
          conversation_id: string | null
          cost: number
          created_at: string
          created_by: string | null
          delivered_at: string | null
          direction: string
          error_code: string | null
          external_id: string | null
          id: string
          media_url: string | null
          metadata: Json | null
          provider_id: string | null
          read_at: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["message_status"]
          template_id: string | null
          to_phone: string
        }
        Insert: {
          account_id?: string | null
          body?: string | null
          campaign_id?: string | null
          company_id: string
          conversation_id?: string | null
          cost?: number
          created_at?: string
          created_by?: string | null
          delivered_at?: string | null
          direction?: string
          error_code?: string | null
          external_id?: string | null
          id?: string
          media_url?: string | null
          metadata?: Json | null
          provider_id?: string | null
          read_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["message_status"]
          template_id?: string | null
          to_phone: string
        }
        Update: {
          account_id?: string | null
          body?: string | null
          campaign_id?: string | null
          company_id?: string
          conversation_id?: string | null
          cost?: number
          created_at?: string
          created_by?: string | null
          delivered_at?: string | null
          direction?: string
          error_code?: string | null
          external_id?: string | null
          id?: string
          media_url?: string | null
          metadata?: Json | null
          provider_id?: string | null
          read_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["message_status"]
          template_id?: string | null
          to_phone?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_providers: {
        Row: {
          code: string
          company_id: string | null
          config: Json
          created_at: string
          id: string
          is_active: boolean
          name: string
          priority: number
          updated_at: string
        }
        Insert: {
          code: string
          company_id?: string | null
          config?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          priority?: number
          updated_at?: string
        }
        Update: {
          code?: string
          company_id?: string | null
          config?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          priority?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_providers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_templates: {
        Row: {
          account_id: string | null
          body: string
          buttons: Json
          category: string
          company_id: string
          created_at: string
          created_by: string | null
          external_id: string | null
          footer: string | null
          header: string | null
          id: string
          language: string
          metadata: Json | null
          name: string
          rejected_reason: string | null
          status: string
          updated_at: string
          variables: Json
          version: number
        }
        Insert: {
          account_id?: string | null
          body: string
          buttons?: Json
          category?: string
          company_id: string
          created_at?: string
          created_by?: string | null
          external_id?: string | null
          footer?: string | null
          header?: string | null
          id?: string
          language?: string
          metadata?: Json | null
          name: string
          rejected_reason?: string | null
          status?: string
          updated_at?: string
          variables?: Json
          version?: number
        }
        Update: {
          account_id?: string | null
          body?: string
          buttons?: Json
          category?: string
          company_id?: string
          created_at?: string
          created_by?: string | null
          external_id?: string | null
          footer?: string | null
          header?: string | null
          id?: string
          language?: string
          metadata?: Json | null
          name?: string
          rejected_reason?: string | null
          status?: string
          updated_at?: string
          variables?: Json
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_templates_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_webhooks: {
        Row: {
          account_id: string | null
          company_id: string | null
          created_at: string
          error: string | null
          event_type: string
          id: string
          payload: Json
          processed_at: string | null
          signature_valid: boolean | null
        }
        Insert: {
          account_id?: string | null
          company_id?: string | null
          created_at?: string
          error?: string | null
          event_type: string
          id?: string
          payload?: Json
          processed_at?: string | null
          signature_valid?: boolean | null
        }
        Update: {
          account_id?: string | null
          company_id?: string | null
          created_at?: string
          error?: string | null
          event_type?: string
          id?: string
          payload?: Json
          processed_at?: string | null
          signature_valid?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_webhooks_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_webhooks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_company_role: {
        Args: {
          _company_id: string
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_company_member: {
        Args: { _company_id: string; _user_id: string }
        Returns: boolean
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      match_nova_chunks: {
        Args: {
          match_company_id: string
          match_count?: number
          query_embedding: string
        }
        Returns: {
          content: string
          document_id: string
          id: string
          similarity: number
        }[]
      }
    }
    Enums: {
      app_role: "super_admin" | "company_admin" | "manager" | "agent" | "viewer"
      campaign_status:
        | "draft"
        | "scheduled"
        | "running"
        | "paused"
        | "completed"
        | "cancelled"
        | "failed"
      company_status: "active" | "suspended" | "trial" | "cancelled"
      conversation_status: "open" | "pending" | "closed" | "archived"
      invoice_status: "draft" | "issued" | "paid" | "overdue" | "cancelled"
      message_channel: "sms" | "whatsapp"
      message_status:
        | "queued"
        | "sending"
        | "sent"
        | "delivered"
        | "failed"
        | "undelivered"
        | "read"
      notification_severity: "info" | "success" | "warning" | "error"
      nova_role: "user" | "assistant" | "system" | "tool"
      preferred_channel: "sms" | "whatsapp" | "email"
      provider_kind: "sms" | "whatsapp"
      recharge_status: "pending" | "completed" | "failed" | "refunded"
      sms_schedule_status:
        | "PROGRAMADO"
        | "PROCESANDO"
        | "ENVIANDO"
        | "COMPLETADO"
        | "FALLIDO"
        | "CANCELADO"
      template_kind: "sms" | "whatsapp" | "email"
      transaction_type: "credit" | "debit" | "refund" | "adjustment"
      wa_department: "ventas" | "soporte" | "cobranza" | "marketing" | "general"
      whatsapp_account_status:
        | "disconnected"
        | "pending"
        | "connected"
        | "error"
        | "suspended"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["super_admin", "company_admin", "manager", "agent", "viewer"],
      campaign_status: [
        "draft",
        "scheduled",
        "running",
        "paused",
        "completed",
        "cancelled",
        "failed",
      ],
      company_status: ["active", "suspended", "trial", "cancelled"],
      conversation_status: ["open", "pending", "closed", "archived"],
      invoice_status: ["draft", "issued", "paid", "overdue", "cancelled"],
      message_channel: ["sms", "whatsapp"],
      message_status: [
        "queued",
        "sending",
        "sent",
        "delivered",
        "failed",
        "undelivered",
        "read",
      ],
      notification_severity: ["info", "success", "warning", "error"],
      nova_role: ["user", "assistant", "system", "tool"],
      preferred_channel: ["sms", "whatsapp", "email"],
      provider_kind: ["sms", "whatsapp"],
      recharge_status: ["pending", "completed", "failed", "refunded"],
      sms_schedule_status: [
        "PROGRAMADO",
        "PROCESANDO",
        "ENVIANDO",
        "COMPLETADO",
        "FALLIDO",
        "CANCELADO",
      ],
      template_kind: ["sms", "whatsapp", "email"],
      transaction_type: ["credit", "debit", "refund", "adjustment"],
      wa_department: ["ventas", "soporte", "cobranza", "marketing", "general"],
      whatsapp_account_status: [
        "disconnected",
        "pending",
        "connected",
        "error",
        "suspended",
      ],
    },
  },
} as const
