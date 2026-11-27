
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "babies": {
                  Row: {
                    "allergies": string | null,"birth_head_cm": number | null,"birth_length_cm": number | null,"birth_weight_g": number | null,"blood_type": string | null,"created_at": string,"dob": string,"family_id": string,"father_height_cm": number | null,"feed_interval_min": number,"id": string,"mother_height_cm": number | null,"name": string,"notes": string | null,"sex": string,"target_height_cm": number | null,"updated_at": string,"vaccine_choices": NonNullable<Json>
                  }
                  ComputedFields: never
                  Insert: {
                    "allergies"?: string | null,"birth_head_cm"?: number | null,"birth_length_cm"?: number | null,"birth_weight_g"?: number | null,"blood_type"?: string | null,"created_at"?: string,"dob": string,"family_id": string,"father_height_cm"?: number | null,"feed_interval_min"?: number,"id"?: string,"mother_height_cm"?: number | null,"name": string,"notes"?: string | null,"sex": string,"target_height_cm"?: number | null,"updated_at"?: string,"vaccine_choices"?: NonNullable<Json>
                  }
                  Update: {
                    "allergies"?: string | null,"birth_head_cm"?: number | null,"birth_length_cm"?: number | null,"birth_weight_g"?: number | null,"blood_type"?: string | null,"created_at"?: string,"dob"?: string,"family_id"?: string,"father_height_cm"?: number | null,"feed_interval_min"?: number,"id"?: string,"mother_height_cm"?: number | null,"name"?: string,"notes"?: string | null,"sex"?: string,"target_height_cm"?: number | null,"updated_at"?: string,"vaccine_choices"?: NonNullable<Json>
                  }
                  Relationships: [
                    {
      foreignKeyName: "babies_family_id_fkey"
      columns: ["family_id"]
isOneToOne: false
      referencedRelation: "families"
      referencedColumns: ["id"]
    }
                  ]
                },"emergency_contacts": {
                  Row: {
                    "created_at": string,"created_by": string,"family_id": string,"id": string,"label": string,"phone": string,"sort": number
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string,"family_id": string,"id"?: string,"label": string,"phone": string,"sort"?: number
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string,"family_id"?: string,"id"?: string,"label"?: string,"phone"?: string,"sort"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "emergency_contacts_family_id_fkey"
      columns: ["family_id"]
isOneToOne: false
      referencedRelation: "families"
      referencedColumns: ["id"]
    }
                  ]
                },"families": {
                  Row: {
                    "created_at": string,"id": string,"name": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"name": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"name"?: string
                  }
                  Relationships: [
                    
                  ]
                },"family_members": {
                  Row: {
                    "created_at": string,"display_name": string,"email": string,"family_id": string,"id": string,"role": string,"user_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"display_name": string,"email": string,"family_id": string,"id"?: string,"role": string,"user_id"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"display_name"?: string,"email"?: string,"family_id"?: string,"id"?: string,"role"?: string,"user_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "family_members_family_id_fkey"
      columns: ["family_id"]
isOneToOne: false
      referencedRelation: "families"
      referencedColumns: ["id"]
    }
                  ]
                },"growth": {
                  Row: {
                    "baby_id": string,"created_at": string,"created_by": string,"head_cm": number | null,"id": string,"length_cm": number | null,"measured_on": string,"updated_at": string,"weight_g": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "baby_id": string,"created_at"?: string,"created_by"?: string,"head_cm"?: number | null,"id": string,"length_cm"?: number | null,"measured_on": string,"updated_at"?: string,"weight_g"?: number | null
                  }
                  Update: {
                    "baby_id"?: string,"created_at"?: string,"created_by"?: string,"head_cm"?: number | null,"id"?: string,"length_cm"?: number | null,"measured_on"?: string,"updated_at"?: string,"weight_g"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "growth_baby_id_fkey"
      columns: ["baby_id"]
isOneToOne: false
      referencedRelation: "babies"
      referencedColumns: ["id"]
    }
                  ]
                },"illness_episodes": {
                  Row: {
                    "baby_id": string,"created_at": string,"created_by": string,"ended_at": string | null,"id": string,"started_at": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "baby_id": string,"created_at"?: string,"created_by"?: string,"ended_at"?: string | null,"id": string,"started_at": string,"updated_at"?: string
                  }
                  Update: {
                    "baby_id"?: string,"created_at"?: string,"created_by"?: string,"ended_at"?: string | null,"id"?: string,"started_at"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "illness_episodes_baby_id_fkey"
      columns: ["baby_id"]
isOneToOne: false
      referencedRelation: "babies"
      referencedColumns: ["id"]
    }
                  ]
                },"illness_visits": {
                  Row: {
                    "advice": string | null,"baby_id": string,"conclusion": string | null,"created_at": string,"created_by": string,"episode_id": string,"id": string,"place": string | null,"updated_at": string,"visited_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "advice"?: string | null,"baby_id": string,"conclusion"?: string | null,"created_at"?: string,"created_by"?: string,"episode_id": string,"id": string,"place"?: string | null,"updated_at"?: string,"visited_at": string
                  }
                  Update: {
                    "advice"?: string | null,"baby_id"?: string,"conclusion"?: string | null,"created_at"?: string,"created_by"?: string,"episode_id"?: string,"id"?: string,"place"?: string | null,"updated_at"?: string,"visited_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "illness_visits_baby_id_fkey"
      columns: ["baby_id"]
isOneToOne: false
      referencedRelation: "babies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "illness_visits_episode_id_baby_id_fkey"
      columns: ["episode_id","baby_id"]
isOneToOne: false
      referencedRelation: "illness_episodes"
      referencedColumns: ["id","baby_id"]
    }
                  ]
                },"logs": {
                  Row: {
                    "baby_id": string,"created_at": string,"created_by": string,"details": NonNullable<Json>,"ended_at": string | null,"id": string,"note": string | null,"started_at": string,"type": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "baby_id": string,"created_at"?: string,"created_by"?: string,"details"?: NonNullable<Json>,"ended_at"?: string | null,"id": string,"note"?: string | null,"started_at": string,"type": string,"updated_at"?: string
                  }
                  Update: {
                    "baby_id"?: string,"created_at"?: string,"created_by"?: string,"details"?: NonNullable<Json>,"ended_at"?: string | null,"id"?: string,"note"?: string | null,"started_at"?: string,"type"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "logs_baby_id_fkey"
      columns: ["baby_id"]
isOneToOne: false
      referencedRelation: "babies"
      referencedColumns: ["id"]
    }
                  ]
                },"medicine_schedules": {
                  Row: {
                    "baby_id": string,"created_at": string,"created_by": string,"enabled": boolean,"id": string,"name": string,"remind_at_min": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "baby_id": string,"created_at"?: string,"created_by"?: string,"enabled"?: boolean,"id"?: string,"name": string,"remind_at_min": number,"updated_at"?: string
                  }
                  Update: {
                    "baby_id"?: string,"created_at"?: string,"created_by"?: string,"enabled"?: boolean,"id"?: string,"name"?: string,"remind_at_min"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "medicine_schedules_baby_id_fkey"
      columns: ["baby_id"]
isOneToOne: false
      referencedRelation: "babies"
      referencedColumns: ["id"]
    }
                  ]
                },"milestones_achieved": {
                  Row: {
                    "achieved_on": string,"baby_id": string,"created_at": string,"created_by": string,"id": string,"milestone_code": string,"note": string | null,"photo_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "achieved_on": string,"baby_id": string,"created_at"?: string,"created_by"?: string,"id"?: string,"milestone_code": string,"note"?: string | null,"photo_id"?: string | null
                  }
                  Update: {
                    "achieved_on"?: string,"baby_id"?: string,"created_at"?: string,"created_by"?: string,"id"?: string,"milestone_code"?: string,"note"?: string | null,"photo_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "milestones_achieved_baby_id_fkey"
      columns: ["baby_id"]
isOneToOne: false
      referencedRelation: "babies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "milestones_achieved_photo_id_fkey"
      columns: ["photo_id"]
isOneToOne: false
      referencedRelation: "photos"
      referencedColumns: ["id"]
    }
                  ]
                },"music_links": {
                  Row: {
                    "category": string,"created_at": string,"created_by": string,"family_id": string,"hidden": boolean,"id": string,"preset_code": string | null,"title": string | null,"youtube_playlist_id": string | null,"youtube_video_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "category": string,"created_at"?: string,"created_by"?: string,"family_id": string,"hidden"?: boolean,"id"?: string,"preset_code"?: string | null,"title"?: string | null,"youtube_playlist_id"?: string | null,"youtube_video_id"?: string | null
                  }
                  Update: {
                    "category"?: string,"created_at"?: string,"created_by"?: string,"family_id"?: string,"hidden"?: boolean,"id"?: string,"preset_code"?: string | null,"title"?: string | null,"youtube_playlist_id"?: string | null,"youtube_video_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "music_links_family_id_fkey"
      columns: ["family_id"]
isOneToOne: false
      referencedRelation: "families"
      referencedColumns: ["id"]
    }
                  ]
                },"notification_log": {
                  Row: {
                    "id": string,"kind": string,"ref_key": string,"sent_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: string,"kind": string,"ref_key": string,"sent_at"?: string,"user_id": string
                  }
                  Update: {
                    "id"?: string,"kind"?: string,"ref_key"?: string,"sent_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"notification_prefs": {
                  Row: {
                    "feed_reminder": boolean,"growth_alert": boolean,"growth_measure": boolean,"hold_feed_while_asleep": boolean,"medicine": boolean,"quiet_enabled": boolean,"quiet_end_min": number,"quiet_start_min": number,"snooze_until": string | null,"timer_alert": boolean,"updated_at": string,"user_id": string,"vaccine": boolean,"wake_window": boolean
                  }
                  ComputedFields: never
                  Insert: {
                    "feed_reminder"?: boolean,"growth_alert"?: boolean,"growth_measure"?: boolean,"hold_feed_while_asleep"?: boolean,"medicine"?: boolean,"quiet_enabled"?: boolean,"quiet_end_min"?: number,"quiet_start_min"?: number,"snooze_until"?: string | null,"timer_alert"?: boolean,"updated_at"?: string,"user_id": string,"vaccine"?: boolean,"wake_window"?: boolean
                  }
                  Update: {
                    "feed_reminder"?: boolean,"growth_alert"?: boolean,"growth_measure"?: boolean,"hold_feed_while_asleep"?: boolean,"medicine"?: boolean,"quiet_enabled"?: boolean,"quiet_end_min"?: number,"quiet_start_min"?: number,"snooze_until"?: string | null,"timer_alert"?: boolean,"updated_at"?: string,"user_id"?: string,"vaccine"?: boolean,"wake_window"?: boolean
                  }
                  Relationships: [
                    
                  ]
                },"photos": {
                  Row: {
                    "baby_id": string,"caption": string | null,"created_at": string,"created_by": string,"id": string,"size_bytes": number,"storage_path": string,"taken_on": string,"visit_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "baby_id": string,"caption"?: string | null,"created_at"?: string,"created_by"?: string,"id": string,"size_bytes": number,"storage_path": string,"taken_on": string,"visit_id"?: string | null
                  }
                  Update: {
                    "baby_id"?: string,"caption"?: string | null,"created_at"?: string,"created_by"?: string,"id"?: string,"size_bytes"?: number,"storage_path"?: string,"taken_on"?: string,"visit_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "photos_baby_id_fkey"
      columns: ["baby_id"]
isOneToOne: false
      referencedRelation: "babies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "photos_visit_id_baby_id_fkey"
      columns: ["visit_id","baby_id"]
isOneToOne: false
      referencedRelation: "illness_visits"
      referencedColumns: ["id","baby_id"]
    }
                  ]
                },"push_subscriptions": {
                  Row: {
                    "auth": string,"created_at": string,"endpoint": string,"id": string,"last_success_at": string | null,"p256dh": string,"user_agent": string | null,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "auth": string,"created_at"?: string,"endpoint": string,"id"?: string,"last_success_at"?: string | null,"p256dh": string,"user_agent"?: string | null,"user_id": string
                  }
                  Update: {
                    "auth"?: string,"created_at"?: string,"endpoint"?: string,"id"?: string,"last_success_at"?: string | null,"p256dh"?: string,"user_agent"?: string | null,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"vaccine_doses": {
                  Row: {
                    "baby_id": string,"created_at": string,"created_by": string,"dose_no": number,"due_on_override": string | null,"given_on": string | null,"id": string,"note": string | null,"place": string | null,"status": string,"updated_at": string,"vaccine_code": string
                  }
                  ComputedFields: never
                  Insert: {
                    "baby_id": string,"created_at"?: string,"created_by"?: string,"dose_no": number,"due_on_override"?: string | null,"given_on"?: string | null,"id"?: string,"note"?: string | null,"place"?: string | null,"status": string,"updated_at"?: string,"vaccine_code": string
                  }
                  Update: {
                    "baby_id"?: string,"created_at"?: string,"created_by"?: string,"dose_no"?: number,"due_on_override"?: string | null,"given_on"?: string | null,"id"?: string,"note"?: string | null,"place"?: string | null,"status"?: string,"updated_at"?: string,"vaccine_code"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "vaccine_doses_baby_id_fkey"
      columns: ["baby_id"]
isOneToOne: false
      referencedRelation: "babies"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "baby_family":
{ Args: { "b": string }; Returns: string
                           },
"can_create_family":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"claim_membership":
{ Args: Record<PropertyKey, never>; Returns: {
              "created_at": string,
"id": string,
"name": string
            }[]
                          SetofOptions: {
        from: "*"
        to: "families"
        isOneToOne: false
        isSetofReturn: true
      } },
"create_family":
{ Args: { "display_name": string,"name": string }; Returns: {
              "created_at": string,
"id": string,
"name": string
            }
                          SetofOptions: {
        from: "*"
        to: "families"
        isOneToOne: true
        isSetofReturn: false
      } },
"is_member":
{ Args: { "fam": string }; Returns: boolean
                           },
"is_owner":
{ Args: { "fam": string }; Returns: boolean
                           },
"object_baby":
{ Args: { "object_name": string }; Returns: string
                           },
"object_family":
{ Args: { "object_name": string }; Returns: string
                           },
"photo_matches_baby":
{ Args: { "p_baby": string,"p_photo": string }; Returns: boolean
                           },
"photos_total_bytes":
{ Args: Record<PropertyKey, never>; Returns: number
                           },
"stop_timer":
{ Args: { "p_ended_at": string,"p_log_id": string }; Returns: {
              "baby_id": string,
"created_at": string,
"created_by": string,
"details": NonNullable<Json>,
"ended_at": string | null,
"id": string,
"note": string | null,
"started_at": string,
"type": string,
"updated_at": string
            }
                          SetofOptions: {
        from: "*"
        to: "logs"
        isOneToOne: true
        isSetofReturn: false
      } }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            
          }
        }
} as const
