export type Role = "admin" | "marketing" | "partner" | "unit_manager";

export type Organization = {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  currency: string;
  created_at: string;
};

export type Unit = {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  archived_at: string | null;
  created_at: string;
};

export type AppUser = {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  created_at: string;
};

export type UserOrganization = {
  user_id: string;
  organization_id: string;
  role: Role;
  created_at: string;
};

export type UserUnit = {
  user_id: string;
  unit_id: string;
  created_at: string;
};

export type AuditLog = {
  id: string;
  organization_id: string;
  actor_id: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export type TaskStatus = "pending" | "completed";
export type TaskPriority = "low" | "normal" | "high";

export type Task = {
  id: string;
  organization_id: string;
  unit_id: string | null;
  title: string;
  description: string | null;
  assigned_to: string;
  created_by: string;
  priority: TaskPriority;
  due_at: string | null;
  status: TaskStatus;
  completed_at: string | null;
  completed_by: string | null;
  created_at: string;
  updated_at: string;
};

type TableDef<Row extends Record<string, unknown>, InsertKeys extends keyof Row = keyof Row> = {
  Row: Row;
  Insert: Partial<Row> & Pick<Row, InsertKeys>;
  Update: Partial<Row>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      organizations: TableDef<Organization, "name" | "slug">;
      units: TableDef<Unit, "organization_id" | "name" | "slug">;
      users: TableDef<AppUser, "id" | "email">;
      user_organizations: TableDef<UserOrganization, "user_id" | "organization_id" | "role">;
      user_units: TableDef<UserUnit, "user_id" | "unit_id">;
      audit_log: TableDef<AuditLog, "organization_id" | "action" | "target_type">;
      tasks: TableDef<Task, "organization_id" | "title" | "assigned_to" | "created_by">;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      app_role: Role;
      task_status: TaskStatus;
      task_priority: TaskPriority;
    };
    CompositeTypes: Record<string, never>;
  };
};
