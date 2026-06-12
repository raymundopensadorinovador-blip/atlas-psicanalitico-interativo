"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Award,
  BookOpen,
  Brain,
  ClipboardList,
  KeyRound,
  TrendingUp,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { getCurrentProfile, getDashboardPath, type Profile } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

type StudentClass = {
  id: string;
  status: string;
  class_id: string;
  classes: {
    id: string;
    title: string;
    invite_code: string;
    status: string;
    courses: {
      title: string;
      workload_hours: number;
    } | null;
    profiles: {
      name: string;
    } | null;
  } | null;
};

type PaymentPlan = {
  id: string;
  class_id: string;
  financial_code: string;
  status: string;
};

export default function AlunoPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [studentClasses, setStudentClasses] = useState<StudentClass[]>([]);
  const [paymentPlans, setPaymentPlans] = useState<PaymentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

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

      if (loadedProfile.role !== "student") {
        router.push(getDashboardPath(loadedProfile.role));
        return;
      }

      setProfile(loadedProfile);

      const { data: vinculosData, error: vinculosError } = await supabase
        .from("class_students")
        .select(
          `
          id,
          status,
          class_id,
          classes (
            id,
            title,
            invite_code,
            status,
            courses (
              title,
              workload_hours
            ),
            profiles (
              name
            )
          )
        `
        )
        .eq("student_id", loadedProfile.id);

      if (vinculosError) {
        setErro(vinculosError.message);
        setLoading(false);
        return;
      }

      const { data: plansData } = await supabase
        .from("payment_plans")
        .select("id, class_id, financial_code, status")
        .eq("student_id", loadedProfile.id);

      setStudentClasses((vinculosData ?? []) as unknown as StudentClass[]);
      setPaymentPlans((plansData ?? []) as PaymentPlan[]);
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

  const hasClass = studentClasses.length > 0;

  return (
    <main className="min-h-screen bg-[#070B14] px-6 py-8 text-white">
      <section className="mx-auto w-full max-w-7xl">
        <AppHeader name={profile.name} role={profile.role} />

        <header className="rounded-[2rem] border border-cyan-300/20 bg-white/[0.06] p-6">
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">
            Sala do aluno
          </p>

          <h1 className="mt-3 text-3xl font-semibold">
            Seu percurso em psicanálise
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
            Acompanhe suas aulas liberadas, progresso, pontuação, atividades e
            certificado.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
  <Link
    href="/aluno/aulas"
    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
  >
    <BookOpen size={18} />
    Minhas aulas
  </Link>

  <Link
    href="/aluno/entrar-turma"
    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-300/40 bg-cyan-300/10 px-5 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-300/20"
  >
    <KeyRound size={18} />
    Entrar em turma
  </Link>

  <Link
    href="/aluno/financeiro"
    className="rounded-2xl border border-emerald-300/40 bg-emerald-300/10 px-5 py-3 text-center text-sm font-semibold text-emerald-100 transition hover:bg-emerald-300/20"
  >
    Meu financeiro
  </Link>

  <Link
    href="/comprovante"
    className="rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/10"
  >
    Enviar comprovante
  </Link>
</div>        
        </header>

        {erro && (
          <div className="mt-6 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">
            {erro}
          </div>
        )}

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <AlunoCard
            icon={<TrendingUp size={24} />}
            title="Progresso geral"
            value="0%"
            text="Avanço no curso e nas aulas liberadas."
          />

          <AlunoCard
            icon={<Brain size={24} />}
            title="Próxima aula"
            value={hasClass ? "Introdução" : "Sem turma"}
            text={
              hasClass
                ? "Comece pela base antes dos mapas avançados."
                : "Entre em uma turma com o código recebido."
            }
          />

          <AlunoCard
            icon={<ClipboardList size={24} />}
            title="Atividades pendentes"
            value="0"
            text="Exercícios e tarefas aguardando envio."
          />

          <AlunoCard
            icon={<BookOpen size={24} />}
            title="Turmas vinculadas"
            value={String(studentClasses.length)}
            text="Turmas em que você está matriculado."
          />

          <AlunoCard
            icon={<Award size={24} />}
            title="Certificado"
            value="Bloqueado"
            text="Será liberado conforme progresso, nota e financeiro."
          />
        </div>

        <section className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.06] p-6">
          <h2 className="text-xl font-semibold">Minhas turmas</h2>
          <p className="mt-1 text-sm text-slate-300">
            Turmas vinculadas ao seu acesso de aluno.
          </p>

          <div className="mt-6 space-y-3">
            {studentClasses.length === 0 && (
              <div className="rounded-2xl border border-yellow-300/20 bg-yellow-300/10 p-5 text-sm leading-6 text-yellow-100">
                Você ainda não está vinculado a nenhuma turma. Use o código
                recebido para entrar.
              </div>
            )}

            {studentClasses.map((item) => {
              const turma = item.classes;
              const financialCode = paymentPlans.find(
                (plan) => plan.class_id === item.class_id
              )?.financial_code;

              return (
                <article
                  key={item.id}
                  className="rounded-3xl border border-white/10 bg-[#07101D] p-5"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">
                        {turma?.title ?? "Turma não encontrada"}
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-slate-300">
                        Curso: {turma?.courses?.title ?? "Curso não encontrado"}
                      </p>

                      <p className="text-sm leading-6 text-slate-300">
                        Professor:{" "}
                        {turma?.profiles?.name ?? "Professor não encontrado"}
                      </p>
                    </div>

                    <span className="w-fit rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-semibold text-cyan-100">
                      {item.status}
                    </span>
                  </div>

                  {financialCode && (
                    <div className="mt-4 rounded-2xl border border-cyan-300/10 bg-cyan-300/5 p-4">
                      <p className="text-xs uppercase tracking-[0.25em] text-cyan-300">
                        Código financeiro
                      </p>
                      <strong className="mt-2 block break-all text-lg text-white">
                        {financialCode}
                      </strong>
                      <p className="mt-2 text-sm leading-6 text-slate-300">
                        Use este código ao enviar comprovante de pagamento.
                      </p>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      </section>
    </main>
  );
}

function AlunoCard({
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
          <strong className="mt-3 block text-3xl text-white">{value}</strong>
        </div>

        <div className="rounded-2xl bg-cyan-300/10 p-3 text-cyan-200">
          {icon}
        </div>
      </div>

      <p className="mt-5 text-sm leading-6 text-slate-400">{text}</p>
    </div>
  );
}