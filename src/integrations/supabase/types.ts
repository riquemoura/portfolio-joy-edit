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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      catalogs: {
        Row: {
          background_image: string | null
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          background_image?: string | null
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Update: {
          background_image?: string | null
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          catalog_id: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_page_break: boolean
          name: string
          position: number
          price: number
          updated_at: string
        }
        Insert: {
          catalog_id: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_page_break?: boolean
          name: string
          position?: number
          price?: number
          updated_at?: string
        }
        Update: {
          catalog_id?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_page_break?: boolean
          name?: string
          position?: number
          price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_catalog_id_fkey"
            columns: ["catalog_id"]
            isOneToOne: false
            referencedRelation: "catalogs"
            referencedColumns: ["id"]
          },
        ]
      }
      products_backup_20260202: {
        Row: {
          backed_up_at: string
          catalog_id: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          backed_up_at?: string
          catalog_id: string
          created_at: string
          description?: string | null
          id: string
          image_url?: string | null
          name: string
          price: number
          updated_at: string
        }
        Update: {
          backed_up_at?: string
          catalog_id?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      products_backup_20260203_reorder: {
        Row: {
          backed_up_at: string
          catalog_id: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          position: number
          price: number
          updated_at: string
        }
        Insert: {
          backed_up_at?: string
          catalog_id: string
          created_at: string
          description?: string | null
          id: string
          image_url?: string | null
          name: string
          position?: number
          price: number
          updated_at: string
        }
        Update: {
          backed_up_at?: string
          catalog_id?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          position?: number
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      products_backup_bulk_edit: {
        Row: {
          backed_up_at: string | null
          catalog_id: string | null
          created_at: string | null
          description: string | null
          id: string | null
          image_url: string | null
          is_page_break: boolean | null
          name: string | null
          position: number | null
          price: number | null
          updated_at: string | null
        }
        Insert: {
          backed_up_at?: string | null
          catalog_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          is_page_break?: boolean | null
          name?: string | null
          position?: number | null
          price?: number | null
          updated_at?: string | null
        }
        Update: {
          backed_up_at?: string | null
          catalog_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          is_page_break?: boolean | null
          name?: string | null
          position?: number | null
          price?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      products_backup_cards_feature: {
        Row: {
          backed_up_at: string
          catalog_id: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_page_break: boolean
          name: string
          position: number
          price: number
          updated_at: string
        }
        Insert: {
          backed_up_at?: string
          catalog_id: string
          created_at: string
          description?: string | null
          id: string
          image_url?: string | null
          is_page_break?: boolean
          name: string
          position?: number
          price: number
          updated_at: string
        }
        Update: {
          backed_up_at?: string
          catalog_id?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_page_break?: boolean
          name?: string
          position?: number
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      products_backup_pagebreak: {
        Row: {
          backed_up_at: string
          catalog_id: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          position: number
          price: number
          updated_at: string
        }
        Insert: {
          backed_up_at?: string
          catalog_id: string
          created_at: string
          description?: string | null
          id: string
          image_url?: string | null
          name: string
          position?: number
          price: number
          updated_at: string
        }
        Update: {
          backed_up_at?: string
          catalog_id?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          position?: number
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      replace_catalog_products: {
        Args: { p_catalog_id: string; p_products: Json }
        Returns: undefined
      }
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
