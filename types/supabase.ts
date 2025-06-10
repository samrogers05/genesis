export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      Collaborators: {
        Row: {
          id: string
          profileId: string | null
          projectId: string | null
          role: string | null
        }
        Insert: {
          id?: string
          profileId?: string | null
          projectId?: string | null
          role?: string | null
        }
        Update: {
          id?: string
          profileId?: string | null
          projectId?: string | null
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Collaborators_profileId_fkey"
            columns: ["profileId"]
            isOneToOne: false
            referencedRelation: "Profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Collaborators_projectId_fkey"
            columns: ["projectId"]
            isOneToOne: false
            referencedRelation: "Project"
            referencedColumns: ["id"]
          },
        ]
      }
      Favorites: {
        Row: {
          profileId: string
          projectId: string
        }
        Insert: {
          profileId: string
          projectId: string
        }
        Update: {
          profileId?: string
          projectId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Favorites_profileId_fkey"
            columns: ["profileId"]
            isOneToOne: true
            referencedRelation: "Profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Favorites_projectId_fkey"
            columns: ["projectId"]
            isOneToOne: false
            referencedRelation: "Project"
            referencedColumns: ["id"]
          },
        ]
      }
      featured: {
        Row: {
          profileId: string
          projectId: string
        }
        Insert: {
          profileId: string
          projectId: string
        }
        Update: {
          profileId?: string
          projectId?: string
        }
        Relationships: [
          {
            foreignKeyName: "featured_profileId_fkey"
            columns: ["profileId"]
            isOneToOne: true
            referencedRelation: "Profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "featured_projectId_fkey"
            columns: ["projectId"]
            isOneToOne: false
            referencedRelation: "Project"
            referencedColumns: ["id"]
          },
        ]
      }
      Profile: {
        Row: {
          about: string | null
          avatarUrl: string | null
          citations: number | null
          collaborations: number | null
          createdAt: string
          email: string | null
          fullName: string | null
          id: string
          keyQuestion: string | null
          labAffiliation: string | null
          location: string | null
          organization: string | null
          publications: number | null
          researchAreas: string | null
          researchProject: string | null
          signalBoosts: number | null
        }
        Insert: {
          about?: string | null
          avatarUrl?: string | null
          citations?: number | null
          collaborations?: number | null
          createdAt?: string
          email?: string | null
          fullName?: string | null
          id?: string
          keyQuestion?: string | null
          labAffiliation?: string | null
          location?: string | null
          organization?: string | null
          publications?: number | null
          researchAreas?: string | null
          researchProject?: string | null
          signalBoosts?: number | null
        }
        Update: {
          about?: string | null
          avatarUrl?: string | null
          citations?: number | null
          collaborations?: number | null
          createdAt?: string
          email?: string | null
          fullName?: string | null
          id?: string
          keyQuestion?: string | null
          labAffiliation?: string | null
          location?: string | null
          organization?: string | null
          publications?: number | null
          researchAreas?: string | null
          researchProject?: string | null
          signalBoosts?: number | null
        }
        Relationships: []
      }
      profileTags: {
        Row: {
          profileId: string
          tagId: string | null
        }
        Insert: {
          profileId: string
          tagId?: string | null
        }
        Update: {
          profileId?: string
          tagId?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profileTags_profileId_fkey"
            columns: ["profileId"]
            isOneToOne: true
            referencedRelation: "Profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profileTags_tagId_fkey"
            columns: ["tagId"]
            isOneToOne: false
            referencedRelation: "Tags"
            referencedColumns: ["id"]
          },
        ]
      }
      Project: {
        Row: {
          category: number | null
          createdAt: string
          createdBy: string | null
          description: string | null
          id: string
          location: string | null
          name: string | null
          signalBoosts: number | null
          visibilty: string | null
        }
        Insert: {
          category?: number | null
          createdAt?: string
          createdBy?: string | null
          description?: string | null
          id?: string
          location?: string | null
          name?: string | null
          signalBoosts?: number | null
          visibilty?: string | null
        }
        Update: {
          category?: number | null
          createdAt?: string
          createdBy?: string | null
          description?: string | null
          id?: string
          location?: string | null
          name?: string | null
          signalBoosts?: number | null
          visibilty?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Project_createdBy_fkey"
            columns: ["createdBy"]
            isOneToOne: false
            referencedRelation: "Profile"
            referencedColumns: ["id"]
          },
        ]
      }
      projectTags: {
        Row: {
          projectId: string
          tagId: string | null
        }
        Insert: {
          projectId: string
          tagId?: string | null
        }
        Update: {
          projectId?: string
          tagId?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projectTags_projectId_fkey"
            columns: ["projectId"]
            isOneToOne: true
            referencedRelation: "Project"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projectTags_tagId_fkey"
            columns: ["tagId"]
            isOneToOne: false
            referencedRelation: "Tags"
            referencedColumns: ["id"]
          },
        ]
      }
      Publications: {
        Row: {
          abstract: string | null
          createdAt: string
          doi: string | null
          id: string
          journal: string | null
          profileID: string | null
          title: string | null
          year: number | null
        }
        Insert: {
          abstract?: string | null
          createdAt?: string
          doi?: string | null
          id?: string
          journal?: string | null
          profileID?: string | null
          title?: string | null
          year?: number | null
        }
        Update: {
          abstract?: string | null
          createdAt?: string
          doi?: string | null
          id?: string
          journal?: string | null
          profileID?: string | null
          title?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "Publications_profileID_fkey"
            columns: ["profileID"]
            isOneToOne: false
            referencedRelation: "Profile"
            referencedColumns: ["id"]
          },
        ]
      }
      Tags: {
        Row: {
          id: string
          name: string | null
          type: string | null
        }
        Insert: {
          id?: string
          name?: string | null
          type?: string | null
        }
        Update: {
          id?: string
          name?: string | null
          type?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
