import { supabase } from "@/lib/supabase";

export type UserRole = "admin" | "teacher" | "student";

export type Profile = {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  role: UserRole;
  is_active: boolean;
};

export function getDashboardPath(role: UserRole) {
  if (role === "admin") return "/admin";
  if (role === "teacher") return "/professor";
  return "/aluno";
}

export async function getCurrentProfile() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      user: null,
      profile: null,
      error: userError,
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, user_id, name, email, role, is_active")
    .eq("user_id", user.id)
    .single();

  if (profileError || !profile) {
    return {
      user,
      profile: null,
      error: profileError,
    };
  }

  return {
    user,
    profile: profile as Profile,
    error: null,
  };
}