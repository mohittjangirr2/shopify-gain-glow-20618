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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      api_cache: {
        Row: {
          cache_data: Json
          cache_key: string
          cached_at: string | null
          company_id: string | null
          created_at: string | null
          expires_at: string
          id: string
          user_id: string
        }
        Insert: {
          cache_data: Json
          cache_key: string
          cached_at?: string | null
          company_id?: string | null
          created_at?: string | null
          expires_at: string
          id?: string
          user_id: string
        }
        Update: {
          cache_data?: Json
          cache_key?: string
          cached_at?: string | null
          company_id?: string | null
          created_at?: string | null
          expires_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_cache_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      api_settings: {
        Row: {
          cod_remittance_fee: number | null
          company_id: string | null
          created_at: string | null
          facebook_access_token: string | null
          facebook_ad_account_id: string | null
          facebook_app_id: string | null
          facebook_app_secret: string | null
          footer_names: string | null
          footer_text: string | null
          id: string
          marketer_enabled: boolean | null
          marketer_type: string | null
          marketer_value: number | null
          payment_gateway_enabled: boolean | null
          payment_gateway_fee: number | null
          shiprocket_email: string | null
          shiprocket_password: string | null
          shopify_access_token: string | null
          shopify_store_url: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          cod_remittance_fee?: number | null
          company_id?: string | null
          created_at?: string | null
          facebook_access_token?: string | null
          facebook_ad_account_id?: string | null
          facebook_app_id?: string | null
          facebook_app_secret?: string | null
          footer_names?: string | null
          footer_text?: string | null
          id?: string
          marketer_enabled?: boolean | null
          marketer_type?: string | null
          marketer_value?: number | null
          payment_gateway_enabled?: boolean | null
          payment_gateway_fee?: number | null
          shiprocket_email?: string | null
          shiprocket_password?: string | null
          shopify_access_token?: string | null
          shopify_store_url?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          cod_remittance_fee?: number | null
          company_id?: string | null
          created_at?: string | null
          facebook_access_token?: string | null
          facebook_ad_account_id?: string | null
          facebook_app_id?: string | null
          facebook_app_secret?: string | null
          footer_names?: string | null
          footer_text?: string | null
          id?: string
          marketer_enabled?: boolean | null
          marketer_type?: string | null
          marketer_value?: number | null
          payment_gateway_enabled?: boolean | null
          payment_gateway_fee?: number | null
          shiprocket_email?: string | null
          shiprocket_password?: string | null
          shopify_access_token?: string | null
          shopify_store_url?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
          name: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          name: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      company_modules: {
        Row: {
          can_delete: boolean | null
          can_read: boolean | null
          can_write: boolean | null
          company_id: string
          created_at: string | null
          id: string
          module_id: string
        }
        Insert: {
          can_delete?: boolean | null
          can_read?: boolean | null
          can_write?: boolean | null
          company_id: string
          created_at?: string | null
          id?: string
          module_id: string
        }
        Update: {
          can_delete?: boolean | null
          can_read?: boolean | null
          can_write?: boolean | null
          company_id?: string
          created_at?: string | null
          id?: string
          module_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_modules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_modules_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      fcm_config: {
        Row: {
          company_id: string | null
          created_at: string | null
          enabled: boolean | null
          firebase_project_id: string | null
          firebase_sender_id: string | null
          firebase_server_key: string | null
          firebase_service_account: Json | null
          firebase_vapid_key: string | null
          id: string
          notification_sound_url: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          enabled?: boolean | null
          firebase_project_id?: string | null
          firebase_sender_id?: string | null
          firebase_server_key?: string | null
          firebase_service_account?: Json | null
          firebase_vapid_key?: string | null
          id?: string
          notification_sound_url?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          enabled?: boolean | null
          firebase_project_id?: string | null
          firebase_sender_id?: string | null
          firebase_server_key?: string | null
          firebase_service_account?: Json | null
          firebase_vapid_key?: string | null
          id?: string
          notification_sound_url?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fcm_config_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          route: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          route?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          route?: string | null
        }
        Relationships: []
      }
      notification_events: {
        Row: {
          company_id: string | null
          created_at: string | null
          event_data: Json
          event_type: string
          id: string
          notification_sent: boolean | null
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          event_data: Json
          event_type: string
          id?: string
          notification_sent?: boolean | null
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          event_data?: Json
          event_type?: string
          id?: string
          notification_sent?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      rto_verifications: {
        Row: {
          awb_code: string
          company_id: string
          created_at: string | null
          id: string
          order_id: string
          shipment_id: string | null
          updated_at: string | null
          vendor_id: string
          vendor_notes: string | null
          verification_status: string | null
          verified_at: string | null
        }
        Insert: {
          awb_code: string
          company_id: string
          created_at?: string | null
          id?: string
          order_id: string
          shipment_id?: string | null
          updated_at?: string | null
          vendor_id: string
          vendor_notes?: string | null
          verification_status?: string | null
          verified_at?: string | null
        }
        Update: {
          awb_code?: string
          company_id?: string
          created_at?: string | null
          id?: string
          order_id?: string
          shipment_id?: string | null
          updated_at?: string | null
          vendor_id?: string
          vendor_notes?: string | null
          verification_status?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rto_verifications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rto_verifications_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          company_id: string | null
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
          vendor_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
          vendor_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_payments: {
        Row: {
          amount: number
          company_id: string
          created_at: string | null
          id: string
          order_id: string
          order_number: string | null
          payment_date: string | null
          status: string | null
          updated_at: string | null
          vendor_id: string
        }
        Insert: {
          amount: number
          company_id: string
          created_at?: string | null
          id?: string
          order_id: string
          order_number?: string | null
          payment_date?: string | null
          status?: string | null
          updated_at?: string | null
          vendor_id: string
        }
        Update: {
          amount?: number
          company_id?: string
          created_at?: string | null
          id?: string
          order_id?: string
          order_number?: string | null
          payment_date?: string | null
          status?: string | null
          updated_at?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_payments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_payments_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          company_id: string
          cost_per_order: number | null
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
          name: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          company_id: string
          cost_per_order?: number | null
          created_at?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          name: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          cost_per_order?: number | null
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendors_company_id_fkey"
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
      clean_expired_cache: { Args: never; Returns: undefined }
      get_user_company_id: { Args: { _user_id: string }; Returns: string }
      get_user_vendor_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "super_admin" | "company" | "vendor"
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
      app_role: ["super_admin", "company", "vendor"],
    },
  },
} as const
