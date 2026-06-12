"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, KeyRound, School } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { getCurrentProfile, getDashboardPath, type Profile } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

type ClassWithCourse = {
  id: string;
  title: string;
  invite_code: string;
  status: "draft" | "active" | "finished" | "cancelled";
  course_id: string;
  teacher_id: string;
};

function gerarCodigoFinanceiro() {
  const ano = new Date().getFullYear();
  const aleatorio = Math.random().toString(36).substring(2, 9).toUpperCase();

  return `API-${ano}-${aleatorio}`;
}

export default function EntrarTurmaPage() {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [codigo, setCodigo] = useState("");
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

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
      setLoading(false);
    }

    carregar();
  }, [router]);

  async function handleEntrar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro("");
    setMensagem("");

    if (!profile) return;

    const codigoLimpo = codigo.trim().toUpperCase();

    if (!codigoLimpo) {
      setErro("Informe o código da turma.");
      return;
    }

    setEnviando(true);

    const { data: turma, error: turmaError } = await supabase
      .from("classes")
      .select("id, title, invite_code, status, course_id, teacher_id")
      .eq("invite_code", codigoLimpo)
      .single();

    if (turmaError || !turma) {
      setErro("Código de turma não encontrado.");
      setEnviando(false);
      return;
    }

    const turmaEncontrada = turma as ClassWithCourse;

    if (turmaEncontrada.status !== "active") {
      setErro("Esta turma não está ativa.");
      setEnviando(false);
      return;
    }

    const { data: vinculoExistente } = await supabase
      .from("class_students")
      .select("id")
      .eq("class_id", turmaEncontrada.id)
      .eq("student_id", profile.id)
      .maybeSingle();

    if (vinculoExistente) {
      setMensagem("Você já está vinculado a esta turma.");
      setEnviando(false);
      setTimeout(() => router.push("/aluno"), 900);
      return;
    }

    const { error: vinculoError } = await supabase.from("class_students").insert({
      class_id: turmaEncontrada.id,
      student_id: profile.id,
      status: "active",
    });

    if (vinculoError) {
      setErro(vinculoError.message);
      setEnviando(false);
      return;
    }

    const codigoFinanceiro = gerarCodigoFinanceiro();

    await supabase.from("payment_plans").insert({
      student_id: profile.id,
      class_id: turmaEncontrada.id,
      course_id: turmaEncontrada.course_id,
      plan_type: "monthly",
      total_amount: 0,
      installments_count: 1,
      discount_amount: 0,
      final_amount: 0,
      financial_code: codigoFinanceiro,
      status: "active",
    });

    setMensagem("Você entrou na turma com sucesso.");
    setCodigo("");
    setEnviando(false);

    setTimeout(() => router.push("/aluno"), 900);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#070B14] px-6 text-white">
        <p className="text-sm text-slate-300">Carregando...</p>
      </main>
    );
  }

  if (!profile) return null;

  return (
    <main className="min-h-screen bg-[#070B14] px-6 py-8 text-white">
      <section className="mx-auto w-full max-w-3xl">
        <AppHeader name={profile.name} role={profile.role} />

        <Link
          href="/aluno"
          className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-200"
        >
          <ArrowLeft size={18} />
          Voltar para sala do aluno
        </Link>

        <div className="mt-6 rounded-[2rem] border border-cyan-300/20 bg-white/[0.06] p-6 shadow-2xl shadow-cyan-950/30 backdrop-blur md:p-8">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-cyan-300/10 p-3 text-cyan-200">
              <KeyRound size={28} />
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">
                Código de convite
              </p>

              <h1 className="mt-3 text-3xl font-semibold">
                Entrar em uma turma
              </h1>

              <p className="mt-3 text-sm leading-7 text-slate-300">
                Digite o código recebido do professor ou da administração para
                vincular sua conta à turma.
              </p>
            </div>
          </div>

          <form onSubmit={handleEntrar} className="mt-8 space-y-5">
            <div>
              <label className="text-sm font-medium text-slate-200">
                Código da turma
              </label>
              <input
                value={codigo}
                onChange={(event) => setCodigo(event.target.value.toUpperCase())}
                disabled={enviando}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300"
                placeholder="Ex: ATLAS-2026-A1B2C3"
              />
            </div>

            {erro && (
              <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">
                {erro}
              </div>
            )}

            {mensagem && (
              <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">
                {mensagem}
              </div>
            )}

            <button
              type="submit"
              disabled={enviando}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <School size={18} />
              {enviando ? "Entrando..." : "Entrar na turma"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}