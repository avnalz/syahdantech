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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      chat_logs: {
        Row: {
          created_at: string
          direction: string
          id: number
          message: string
          phone_number: string
          session: string | null
          tenant_id: number | null
        }
        Insert: {
          created_at?: string
          direction: string
          id?: number
          message: string
          phone_number: string
          session?: string | null
          tenant_id?: number | null
        }
        Update: {
          created_at?: string
          direction?: string
          id?: number
          message?: string
          phone_number?: string
          session?: string | null
          tenant_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_logs_phone_number_fkey"
            columns: ["phone_number"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["phone_number"]
          },
          {
            foreignKeyName: "chat_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          ai_summary: string
          assigned_to: number | null
          budget: number | null
          chat_id: string | null
          created_at: string
          id: number
          last_chat_at: string
          lead_label: string
          lead_score: number
          lead_score_signals: string
          mode: string
          name: string
          phone_number: string
          pipeline_stage: string
          properti_diminati: string[] | null
          sentimen: string
          tenant_id: number
          timeline: string | null
          updated_at: string
        }
        Insert: {
          ai_summary?: string
          assigned_to?: number | null
          budget?: number | null
          chat_id?: string | null
          created_at?: string
          id?: number
          last_chat_at?: string
          lead_label?: string
          lead_score?: number
          lead_score_signals?: string
          mode?: string
          name?: string
          phone_number: string
          pipeline_stage?: string
          properti_diminati?: string[] | null
          sentimen?: string
          tenant_id: number
          timeline?: string | null
          updated_at?: string
        }
        Update: {
          ai_summary?: string
          assigned_to?: number | null
          budget?: number | null
          chat_id?: string | null
          created_at?: string
          id?: number
          last_chat_at?: string
          lead_label?: string
          lead_score?: number
          lead_score_signals?: string
          mode?: string
          name?: string
          phone_number?: string
          pipeline_stage?: string
          properti_diminati?: string[] | null
          sentimen?: string
          tenant_id?: number
          timeline?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      drip_logs: {
        Row: {
          chat_id: string | null
          created_at: string
          id: number
          is_completed: boolean
          message: string | null
          phone_number: string
          sent_at: string | null
          step: number
          tenant_id: number
          updated_at: string
        }
        Insert: {
          chat_id?: string | null
          created_at?: string
          id?: number
          is_completed?: boolean
          message?: string | null
          phone_number: string
          sent_at?: string | null
          step?: number
          tenant_id: number
          updated_at?: string
        }
        Update: {
          chat_id?: string | null
          created_at?: string
          id?: number
          is_completed?: boolean
          message?: string | null
          phone_number?: string
          sent_at?: string | null
          step?: number
          tenant_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "drip_logs_phone_number_fkey"
            columns: ["phone_number"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["phone_number"]
          },
          {
            foreignKeyName: "drip_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drip_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      drip_templates: {
        Row: {
          created_at: string | null
          delay_days: number
          id: number
          is_active: boolean | null
          stage_target: string | null
          step: number
          template_text: string
          tenant_id: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          delay_days: number
          id?: number
          is_active?: boolean | null
          stage_target?: string | null
          step: number
          template_text: string
          tenant_id: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          delay_days?: number
          id?: number
          is_active?: boolean | null
          stage_target?: string | null
          step?: number
          template_text?: string
          tenant_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "drip_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drip_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      history: {
        Row: {
          created_at: string
          id: number
          message: string | null
          role: string | null
          session_id: string
          tenant_id: number | null
        }
        Insert: {
          created_at?: string
          id?: number
          message?: string | null
          role?: string | null
          session_id: string
          tenant_id?: number | null
        }
        Update: {
          created_at?: string
          id?: number
          message?: string | null
          role?: string | null
          session_id?: string
          tenant_id?: number | null
        }
        Relationships: []
      }
      history_v2: {
        Row: {
          id: number
          message: Json
          session_id: string
          tenant_id: number | null
        }
        Insert: {
          id?: number
          message: Json
          session_id: string
          tenant_id?: number | null
        }
        Update: {
          id?: number
          message?: Json
          session_id?: string
          tenant_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "history_v2_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "history_v2_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          full_name: string | null
          id: string
          tenant_id: number
        }
        Insert: {
          created_at?: string | null
          full_name?: string | null
          id: string
          tenant_id: number
        }
        Update: {
          created_at?: string | null
          full_name?: string | null
          id?: string
          tenant_id?: number
        }
        Relationships: []
      }
      properties: {
        Row: {
          area: string | null
          created_at: string
          description: string | null
          harga: number | null
          id: number
          img_url: string | null
          is_active: boolean
          kamar: string | null
          kode: string | null
          legalitas: string | null
          lokasi: string
          luas_tanah: string | null
          posisi: string | null
          status: string | null
          stok: number
          tenant_id: number
          total_unit: number | null
        }
        Insert: {
          area?: string | null
          created_at?: string
          description?: string | null
          harga?: number | null
          id?: number
          img_url?: string | null
          is_active?: boolean
          kamar?: string | null
          kode?: string | null
          legalitas?: string | null
          lokasi: string
          luas_tanah?: string | null
          posisi?: string | null
          status?: string | null
          stok?: number
          tenant_id: number
          total_unit?: number | null
        }
        Update: {
          area?: string | null
          created_at?: string
          description?: string | null
          harga?: number | null
          id?: number
          img_url?: string | null
          is_active?: boolean
          kamar?: string | null
          kode?: string | null
          legalitas?: string | null
          lokasi?: string
          luas_tanah?: string | null
          posisi?: string | null
          status?: string | null
          stok?: number
          tenant_id?: number
          total_unit?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          admin_phone: string
          ai_model: string
          created_at: string
          id: number
          is_active: boolean
          name: string
          wa_session: string
          wa_url: string | null
        }
        Insert: {
          admin_phone: string
          ai_model?: string
          created_at?: string
          id?: number
          is_active?: boolean
          name: string
          wa_session: string
          wa_url?: string | null
        }
        Update: {
          admin_phone?: string
          ai_model?: string
          created_at?: string
          id?: number
          is_active?: boolean
          name?: string
          wa_session?: string
          wa_url?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          email: string
          id: number
          is_active: boolean
          name: string
          password_hash: string
          role: string
          tenant_id: number
        }
        Insert: {
          created_at?: string
          email: string
          id?: number
          is_active?: boolean
          name: string
          password_hash: string
          role?: string
          tenant_id: number
        }
        Update: {
          created_at?: string
          email?: string
          id?: number
          is_active?: boolean
          name?: string
          password_hash?: string
          role?: string
          tenant_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_safe"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      tenants_safe: {
        Row: {
          ai_model: string | null
          created_at: string | null
          id: number | null
          is_active: boolean | null
          name: string | null
        }
        Insert: {
          ai_model?: string | null
          created_at?: string | null
          id?: number | null
          is_active?: boolean | null
          name?: string | null
        }
        Update: {
          ai_model?: string | null
          created_at?: string | null
          id?: number | null
          is_active?: boolean | null
          name?: string | null
        }
        Relationships: []
      }
      users_safe: {
        Row: {
          created_at: string | null
          email: string | null
          id: number | null
          is_active: boolean | null
          name: string | null
          role: string | null
          tenant_id: number | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: number | null
          is_active?: boolean | null
          name?: string | null
          role?: string | null
          tenant_id?: number | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: number | null
          is_active?: boolean | null
          name?: string | null
          role?: string | null
          tenant_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_safe"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
