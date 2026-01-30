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
      appointments: {
        Row: {
          appointment_type: string | null
          contact_id: string | null
          created_at: string | null
          doctor_id: string
          end_time: string
          id: string
          instance_id: string
          insurance: string | null
          notes: string | null
          patient_id: string
          patient_name: string | null
          reminder_sent_at: string | null
          rescheduled_from: string | null
          start_time: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          appointment_type?: string | null
          contact_id?: string | null
          created_at?: string | null
          doctor_id: string
          end_time: string
          id?: string
          instance_id: string
          insurance?: string | null
          notes?: string | null
          patient_id: string
          patient_name?: string | null
          reminder_sent_at?: string | null
          rescheduled_from?: string | null
          start_time: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          appointment_type?: string | null
          contact_id?: string | null
          created_at?: string | null
          doctor_id?: string
          end_time?: string
          id?: string
          instance_id?: string
          insurance?: string | null
          notes?: string | null
          patient_id?: string
          patient_name?: string | null
          reminder_sent_at?: string | null
          rescheduled_from?: string | null
          start_time?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          birth_date: string | null
          cpf: string | null
          created_at: string
          email: string | null
          health_insurance: string | null
          id: string
          instance_id: string
          name: string | null
          notes: string | null
          phone: string
          profile_pic_url: string | null
        }
        Insert: {
          birth_date?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          health_insurance?: string | null
          id?: string
          instance_id: string
          name?: string | null
          notes?: string | null
          phone: string
          profile_pic_url?: string | null
        }
        Update: {
          birth_date?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          health_insurance?: string | null
          id?: string
          instance_id?: string
          name?: string | null
          notes?: string | null
          phone?: string
          profile_pic_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "instances"
            referencedColumns: ["id"]
          },
        ]
      }
      doctors: {
        Row: {
          active: boolean | null
          avatar_url: string | null
          color: string | null
          created_at: string | null
          default_duration: number | null
          id: string
          instance_id: string
          name: string
          schedule_config: Json | null
          specialty: string
        }
        Insert: {
          active?: boolean | null
          avatar_url?: string | null
          color?: string | null
          created_at?: string | null
          default_duration?: number | null
          id?: string
          instance_id: string
          name: string
          schedule_config?: Json | null
          specialty: string
        }
        Update: {
          active?: boolean | null
          avatar_url?: string | null
          color?: string | null
          created_at?: string | null
          default_duration?: number | null
          id?: string
          instance_id?: string
          name?: string
          schedule_config?: Json | null
          specialty?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctors_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "instances"
            referencedColumns: ["id"]
          },
        ]
      }
      instances: {
        Row: {
          active: boolean | null
          agent_name: string | null
          ai_config: Json | null
          clinic_config: Json | null
          company_name: string
          created_at: string
          current_period_end: string | null
          followup_config: Json | null
          id: string
          pastorini_id: string
          pastorini_status: string | null
          public_booking_active: boolean | null
          schedule_config: Json | null
          slug: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_plan: string | null
          subscription_status: string | null
          user_id: string
        }
        Insert: {
          active?: boolean | null
          agent_name?: string | null
          ai_config?: Json | null
          clinic_config?: Json | null
          company_name: string
          created_at?: string
          current_period_end?: string | null
          followup_config?: Json | null
          id?: string
          pastorini_id: string
          pastorini_status?: string | null
          public_booking_active?: boolean | null
          schedule_config?: Json | null
          slug?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
          user_id: string
        }
        Update: {
          active?: boolean | null
          agent_name?: string | null
          ai_config?: Json | null
          clinic_config?: Json | null
          company_name?: string
          created_at?: string
          current_period_end?: string | null
          followup_config?: Json | null
          id?: string
          pastorini_id?: string
          pastorini_status?: string | null
          public_booking_active?: boolean | null
          schedule_config?: Json | null
          slug?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_name: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          settings: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          settings?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          settings?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_public_booking:
        | {
            Args: {
              p_doctor_id: string
              p_end_time: string
              p_instance_id: string
              p_notes?: string
              p_patient_name: string
              p_patient_phone: string
              p_start_time: string
            }
            Returns: string
          }
        | {
            Args: {
              p_doctor_id: string
              p_end_time: string
              p_instance_id: string
              p_notes?: string
              p_patient_cpf?: string
              p_patient_name: string
              p_patient_phone: string
              p_start_time: string
            }
            Returns: string
          }
        | {
            Args: {
              p_appointment_type?: string
              p_doctor_id: string
              p_end_time: string
              p_instance_id: string
              p_insurance?: string
              p_notes?: string
              p_patient_cpf?: string
              p_patient_name: string
              p_patient_phone: string
              p_start_time: string
            }
            Returns: string
          }
      get_appointment_details: {
        Args: { p_id: string }
        Returns: {
          clinic_config: Json
          company_name: string
          doctor_id: string
          doctor_name: string
          doctor_specialty: string
          end_time: string
          id: string
          patient_name: string
          start_time: string
          status: string
        }[]
      }
      get_appointment_details_public: {
        Args: { p_id: string }
        Returns: {
          clinic_config: Json
          company_name: string
          doctor_duration: number
          doctor_id: string
          doctor_name: string
          doctor_schedule_config: Json
          doctor_specialty: string
          end_time: string
          id: string
          patient_name: string
          start_time: string
          status: string
        }[]
      }
      get_busy_slots: {
        Args: { p_date: string; p_doctor_id: string }
        Returns: {
          end_time: string
          start_time: string
        }[]
      }
      get_clinic_by_slug: {
        Args: { p_slug: string }
        Returns: {
          clinic_config: Json
          company_name: string
          id: string
          public_booking_active: boolean
          schedule_config: Json
        }[]
      }
      get_public_doctors: {
        Args: { p_instance_id: string }
        Returns: {
          avatar_url: string
          color: string
          default_duration: number
          id: string
          name: string
          schedule_config: Json
          specialty: string
        }[]
      }
      patient_update_appointment: {
        Args: { p_action: string; p_id: string; p_new_start?: string }
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
