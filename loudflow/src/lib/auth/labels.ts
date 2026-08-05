import type { Role } from "@/lib/supabase/types";

export function roleLabel(role: Role): string {
  switch (role) {
    case "admin":
      return "Administrador";
    case "marketing":
      return "Marketing";
    case "partner":
      return "Sócio";
    case "unit_manager":
      return "Gestor de unidade";
  }
}
