"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Award,
  BarChart3,
  BookOpen,
  GraduationCap,
  Receipt,
  Users,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { getCurrentProfile, getDashboardPath, type Profile } from "@/lib/auth";

export default function AdminPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregar() {
      const { profile: loadedProfile } = await getCurrentProfile();

      if (!loadedProfile) {
        router.push("/login");
        return;
      }

      if (!loadedProfile.is_active) {
        router.push("/login");
        return;
      }

      if (loadedProfile.role !== "admin") {
        router.push(getDashboardPath(loadedProfile.role));
        return;
      }

      setProfile(loadedProfile);
      setLoading(false);
    }

    carregar();
  }, [router]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#070B14] px-6 text-white">
        <p className="text-sm text-slate-300">Carregando painel...</p>
      </main>
    );
  }

  if (!profile) return null;

  return (
    <main className="min-h-screen bg-[#070B14] px-6 py-8 text-white">
      <section className="mx-auto w-full max-w-7xl">
        <AppHeader name={profile.name} role={profile.role} />

        <header className="rounded-[2rem] border border-cyan-300/20 bg-white/[0.06] p-6">
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">
            Painel do administrador
          </p>

          <h1 className="mt-3 text-3xl font-semibold">
            Gestão geral do Atlas
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
            Acompanhe alunos, professores, turmas, desempenho, financeiro e
            certificados da plataforma.
          </p>
        </header>
        
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
  <Link
    href="/admin/cursos"
    className="rounded-2xl bg-cyan-300 px-5 py-3 text-center text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
  >
    Ver estrutura dos cursos
  </Link>

  <Link
    href="/admin/turmas"
    className="rounded-2xl border border-cyan-300/40 bg-cyan-300/10 px-5 py-3 text-center text-sm font-semibold text-cyan-100 transition hover:bg-cyan-300/20"
  >
    Gerenciar turmas
  </Link>

  <Link
    href="/admin/financeiro"
    className="rounded-2xl border border-emerald-300/40 bg-emerald-300/10 px-5 py-3 text-center text-sm font-semibold text-emerald-100 transition hover:bg-emerald-300/20"
  >
    Financeiro
  </Link>

  <Link
    href="/comprovante"
    className="rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/10"
  >
    Página pública de comprovante
  </Link>
</div> 

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <AdminCard
            icon={<Users size={24} />}
            title="Alunos ativos"
            value="0"
            text="Acompanhar matrículas, progresso e situação financeira."
          />

          <AdminCard
            icon={<GraduationCap size={24} />}
            title="Professores"
            value="0"
            text="Ver turmas, aulas liberadas e atividades corrigidas."
          />

          <AdminCard
            icon={<BookOpen size={24} />}
            title="Turmas em andamento"
            value="0"
            text="Monitorar cursos, módulos e avanço das turmas."
          />

          <AdminCard
            icon={<Receipt size={24} />}
            title="Comprovantes pendentes"
            value="0"
            text="Conferir pagamentos enviados pelos alunos."
          />

          <AdminCard
            icon={<BarChart3 size={24} />}
            title="Média geral"
            value="0%"
            text="Resumo de desempenho dos alunos nos módulos."
          />

          <AdminCard
            icon={<Award size={24} />}
            title="Certificados emitidos"
            value="0"
            text="Certificados liberados e validações geradas."
          />
        </div>
      </section>
    </main>
  );
}

function AdminCard({
  icon,
  title,
  value,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  text: string;
}) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-300">{title}</p>
          <strong className="mt-3 block text-4xl text-white">{value}</strong>
        </div>

        <div className="rounded-2xl bg-cyan-300/10 p-3 text-cyan-200">
          {icon}
        </div>
      </div>

      <p className="mt-5 text-sm leading-6 text-slate-400">{text}</p>
    </div>
  );
}