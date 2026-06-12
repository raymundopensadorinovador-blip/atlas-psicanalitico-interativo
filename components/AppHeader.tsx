"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { UserRole } from "@/lib/auth";

type AppHeaderProps = {
  name: string;
  role: UserRole;
};

function roleLabel(role: UserRole) {
  if (role === "admin") return "Administrador";
  if (role === "teacher") return "Professor";
  return "Aluno";
}

export default function AppHeader({ name, role }: AppHeaderProps) {
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <header className="mb-8 rounded-[2rem] border border-cyan-300/20 bg-white/[0.06] p-4 text-white">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <Link href="/" className="min-w-0">
          <p className="text-xs uppercase tracking-[0.25em] text-cyan-300">
            Atlas Psicanalítico
          </p>
          <h2 className="mt-1 break-words text-xl font-semibold">
            {name}
          </h2>
          <p className="mt-1 text-sm text-slate-300">{roleLabel(role)}</p>
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          <LogOut size={18} />
          Sair
        </button>
      </div>
    </header>
  );
}