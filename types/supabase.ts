export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      packages: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          price_min: number;
          price_max: number | null;
          estimated_hours: number;
          default_duration_days: number;
          is_addon: boolean;
          category: 'main' | 'branding' | 'bundle';
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          price_min: number;
          price_max?: number | null;
          estimated_hours: number;
          default_duration_days: number;
          is_addon?: boolean;
          category?: 'main' | 'branding' | 'bundle';
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          price_min?: number;
          price_max?: number | null;
          estimated_hours?: number;
          default_duration_days?: number;
          is_addon?: boolean;
          category?: 'main' | 'branding' | 'bundle';
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      package_tasks: {
        Row: {
          id: string;
          package_id: string;
          order_number: number;
          title: string;
          description: string | null;
          estimated_hours: number;
          task_type: 'research' | 'design' | 'mockup' | 'content' | 'filming' | 'editing' | 'review' | 'delivery';
          complexity: 'simple' | 'medium' | 'complex' | 'very_complex';
          dependencies: number[] | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          package_id: string;
          order_number: number;
          title: string;
          description?: string | null;
          estimated_hours: number;
          task_type?: 'research' | 'design' | 'mockup' | 'content' | 'filming' | 'editing' | 'review' | 'delivery';
          complexity?: 'simple' | 'medium' | 'complex' | 'very_complex';
          dependencies?: number[] | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          package_id?: string;
          order_number?: number;
          title?: string;
          description?: string | null;
          estimated_hours?: number;
          task_type?: 'research' | 'design' | 'mockup' | 'content' | 'filming' | 'editing' | 'review' | 'delivery';
          complexity?: 'simple' | 'medium' | 'complex' | 'very_complex';
          dependencies?: number[] | null;
          created_at?: string;
        };
        Relationships: [];
      };
      clients: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string | null;
          instagram_handle: string | null;
          company_name: string | null;
          package_id: string;
          addon_package_id: string | null;
          actual_price: number;
          status: 'not_started' | 'in_progress' | 'completed' | 'archived';
          start_date: string | null;
          deadline: string;
          completion_percentage: number;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          phone?: string | null;
          instagram_handle?: string | null;
          company_name?: string | null;
          package_id: string;
          addon_package_id?: string | null;
          actual_price: number;
          status?: 'not_started' | 'in_progress' | 'completed' | 'archived';
          start_date?: string | null;
          deadline: string;
          completion_percentage?: number;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          phone?: string | null;
          instagram_handle?: string | null;
          company_name?: string | null;
          package_id?: string;
          addon_package_id?: string | null;
          actual_price?: number;
          status?: 'not_started' | 'in_progress' | 'completed' | 'archived';
          start_date?: string | null;
          deadline?: string;
          completion_percentage?: number;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      tasks: {
        Row: {
          id: string;
          client_id: string;
          package_task_id: string | null;
          title: string;
          description: string | null;
          estimated_hours: number;
          actual_hours: number | null;
          task_type: 'research' | 'design' | 'mockup' | 'content' | 'filming' | 'editing' | 'review' | 'delivery';
          complexity: 'simple' | 'medium' | 'complex' | 'very_complex';
          scheduled_date: string;
          due_date: string;
          status: 'not_started' | 'in_research' | 'in_progress' | 'on_track' | 'completed' | 'blocked';
          priority: 'low' | 'medium' | 'high' | 'urgent';
          assigned_to: string[];
          dependencies: string[] | null;
          completed_at: string | null;
          completed_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          package_task_id?: string | null;
          title: string;
          description?: string | null;
          estimated_hours: number;
          actual_hours?: number | null;
          task_type?: 'research' | 'design' | 'mockup' | 'content' | 'filming' | 'editing' | 'review' | 'delivery';
          complexity?: 'simple' | 'medium' | 'complex' | 'very_complex';
          scheduled_date: string;
          due_date: string;
          status?: 'not_started' | 'in_research' | 'in_progress' | 'on_track' | 'completed' | 'blocked';
          priority?: 'low' | 'medium' | 'high' | 'urgent';
          assigned_to?: string[];
          dependencies?: string[] | null;
          completed_at?: string | null;
          completed_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          package_task_id?: string | null;
          title?: string;
          description?: string | null;
          estimated_hours?: number;
          actual_hours?: number | null;
          task_type?: 'research' | 'design' | 'mockup' | 'content' | 'filming' | 'editing' | 'review' | 'delivery';
          complexity?: 'simple' | 'medium' | 'complex' | 'very_complex';
          scheduled_date?: string;
          due_date?: string;
          status?: 'not_started' | 'in_research' | 'in_progress' | 'on_track' | 'completed' | 'blocked';
          priority?: 'low' | 'medium' | 'high' | 'urgent';
          assigned_to?: string[];
          dependencies?: string[] | null;
          completed_at?: string | null;
          completed_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      task_notes: {
        Row: {
          id: string;
          task_id: string;
          content: string;
          author_id: string;
          author_name: string;
          note_type: 'progress' | 'blocker' | 'decision' | 'handoff' | 'client_feedback';
          created_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          content: string;
          author_id: string;
          author_name: string;
          note_type?: 'progress' | 'blocker' | 'decision' | 'handoff' | 'client_feedback';
          created_at?: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          content?: string;
          author_id?: string;
          author_name?: string;
          note_type?: 'progress' | 'blocker' | 'decision' | 'handoff' | 'client_feedback';
          created_at?: string;
        };
        Relationships: [];
      };
      client_notes: {
        Row: {
          id: string;
          client_id: string;
          content: string;
          author_id: string;
          author_name: string;
          category: 'preference' | 'communication' | 'feedback' | 'issue' | 'general';
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          content: string;
          author_id: string;
          author_name: string;
          category?: 'preference' | 'communication' | 'feedback' | 'issue' | 'general';
          created_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          content?: string;
          author_id?: string;
          author_name?: string;
          category?: 'preference' | 'communication' | 'feedback' | 'issue' | 'general';
          created_at?: string;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          client_id: string;
          amount: number;
          payment_date: string;
          payment_method: string | null;
          invoice_number: string | null;
          status: 'paid' | 'partial' | 'pending' | 'refunded';
          notes: string | null;
          recorded_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          amount: number;
          payment_date: string;
          payment_method?: string | null;
          invoice_number?: string | null;
          status?: 'paid' | 'partial' | 'pending' | 'refunded';
          notes?: string | null;
          recorded_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          amount?: number;
          payment_date?: string;
          payment_method?: string | null;
          invoice_number?: string | null;
          status?: 'paid' | 'partial' | 'pending' | 'refunded';
          notes?: string | null;
          recorded_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      activity_log: {
        Row: {
          id: string;
          user_id: string;
          user_name: string;
          action: string;
          entity_type: 'client' | 'task' | 'payment' | 'note';
          entity_id: string;
          description: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          user_name: string;
          action: string;
          entity_type: 'client' | 'task' | 'payment' | 'note';
          entity_id: string;
          description?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          user_name?: string;
          action?: string;
          entity_type?: 'client' | 'task' | 'payment' | 'note';
          entity_id?: string;
          description?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
      user_profiles: {
        Row: {
          id: string;
          full_name: string | null;
          role: 'designer' | 'content_creator' | 'manager' | 'admin';
          avatar_url: string | null;
          online: boolean;
          last_active: string;
          preferences: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          role?: 'designer' | 'content_creator' | 'manager' | 'admin';
          avatar_url?: string | null;
          online?: boolean;
          last_active?: string;
          preferences?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          role?: 'designer' | 'content_creator' | 'manager' | 'admin';
          avatar_url?: string | null;
          online?: boolean;
          last_active?: string;
          preferences?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      dashboard_metrics: {
        Row: {
          total_projects: number;
          running_projects: number;
          completed_projects: number;
          pending_projects: number;
          total_revenue: number;
          avg_progress: number;
        };
        Relationships: [];
      };
      client_overview: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string | null;
          instagram_handle: string | null;
          company_name: string | null;
          status: string;
          start_date: string | null;
          deadline: string;
          completion_percentage: number;
          actual_price: number;
          created_at: string;
          updated_at: string;
          package_name: string;
          package_slug: string;
          addon_package_name: string | null;
          total_tasks: number;
          completed_tasks: number;
          active_tasks: number;
          total_paid: number | null;
        };
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

// Helper types for easier use
export type Package = Database['public']['Tables']['packages']['Row'];
export type PackageTask = Database['public']['Tables']['package_tasks']['Row'];
export type Client = Database['public']['Tables']['clients']['Row'];
export type Task = Database['public']['Tables']['tasks']['Row'];
export type TaskNote = Database['public']['Tables']['task_notes']['Row'];
export type ClientNote = Database['public']['Tables']['client_notes']['Row'];
export type Payment = Database['public']['Tables']['payments']['Row'];
export type ActivityLog = Database['public']['Tables']['activity_log']['Row'];
export type UserProfile = Database['public']['Tables']['user_profiles']['Row'];
export type ClientOverview = Database['public']['Views']['client_overview']['Row'];
export type DashboardMetrics = Database['public']['Views']['dashboard_metrics']['Row'];
