"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  GraduationCap,
  Plus,
  School,
  Users,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { getCurrentProfile, getDashboardPath, type Profile } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

type Course = {
  id: string;
  title: string;
};

type Teacher = {
  id: string;
  name: string;
  email: string | null;
};

type ClassItem = {
  id: string;
  course_id: string;
  teacher_id: string;
  title: string;
  invite_code: string;
  starts_at: string | null;
  ends_at: string | null;
  status: "draft" | "active" | "finished" | "cancelled";
  created_at: string;
};

function gerarCodigoTurma() {
  const prefixo = "ATLAS";
  const ano = new Date().getFullYear();
  const aleatorio = Math.random().toString(36).substring(2, 8).toUpperCase();

  return `${prefixo}-${ano}-${aleatorio}`;
}

function statusLabel(status: ClassItem["status"]) {
  if (status === "active") return "Ativa";
  if (status === "finished") return "Finalizada";
  if (status === "cancelled") return "Cancelada";
  return "Rascunho";
}

export default function AdminTurmasPage() {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [courseId, setCourseId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  const coursesById = useMemo(() => {
    return new Map(courses.map((course) => [course.id, course]));
  }, [courses]);

  const teachersById = useMemo(() => {
    return new Map(teachers.map((teacher) => [teacher.id, teacher]));
  }, [teachers]);

  async function carregarDados() {
    setErro("");

    const { data: coursesData, error: coursesError } = await supabase
      .from("courses")
      .select("id, title")
      .eq("is_active", true)
      .order("created_at", { ascending: true });

    if (coursesError) {
      setErro(coursesError.message);
      return;
    }

    const { data: teachersData, error: teachersError } = await supabase
      .from("profiles")
      .select("id, name, email")
      .eq("role", "teacher")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (teachersError) {
      setErro(teachersError.message);
      return;
    }

    const { data: classesData, error: classesError } = await supabase
      .from("classes")
      .select(
        "id, course_id, teacher_id, title, invite_code, starts_at, ends_at, status, created_at"
      )
      .order("created_at", { ascending: false });

    if (classesError) {
      setErro(classesError.message);
      return;
    }

    setCourses(coursesData ?? []);
    setTeachers(teachersData ?? []);
    setClasses((classesData ?? []) as ClassItem[]);

    if (!courseId && coursesData && coursesData.length > 0) {
      setCourseId(coursesData[0].id);
    }

    if (!teacherId && teachersData && teachersData.length > 0) {
      setTeacherId(teachersData[0].id);
    }
  }

  useEffect(() => {
    async function iniciar() {
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
      await carregarDados();
      setLoading(false);
    }

    iniciar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function handleCriarTurma(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro("");
    setMensagem("");

    const tituloLimpo = title.trim();

    if (!tituloLimpo) {
      setErro("Informe o nome da turma.");
      return;
    }

    if (!courseId) {
      setErro("Selecione um curso.");
      return;
    }

    if (!teacherId) {
      setErro("Selecione um professor.");
      return;
    }

    setSaving(true);

    const { error } = await supabase.from("classes").insert({
      course_id: courseId,
      teacher_id: teacherId,
      title: tituloLimpo,
      invite_code: gerarCodigoTurma(),
      starts_at: startsAt || null,
      ends_at: endsAt || null,
      status: "active",
    });

    if (error) {
      setErro(error.message);
      setSaving(false);
      return;
    }

    setMensagem("Turma criada com sucesso.");
    setTitle("");
    setStartsAt("");
    setEndsAt("");
    await carregarDados();
    setSaving(false);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#070B14] px-6 text-white">
        <p className="text-sm text-slate-300">Carregando turmas...</p>
      </main>
    );
  }

  if (!profile) return null;

  return (
    <main className="min-h-screen bg-[#070B14] px-6 py-8 text-white">
      <section className="mx-auto w-full max-w-7xl">
        <AppHeader name={profile.name} role={profile.role} />

        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-200"
        >
          <ArrowLeft size={18} />
          Voltar ao painel
        </Link>

        <header className="mt-6 rounded-[2rem] border border-cyan-300/20 bg-white/[0.06] p-6">
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">
            Gestão de turmas
          </p>

          <h1 className="mt-3 text-3xl font-semibold">
            Criar e acompanhar turmas
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
            Vincule curso, professor e código de convite para que os alunos
            possam entrar na turma.
          </p>
        </header>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <SummaryCard
            icon={<School size={20} />}
            title="Cursos disponíveis"
            value={String(courses.length)}
          />

          <SummaryCard
            icon={<GraduationCap size={20} />}
            title="Professores ativos"
            value={String(teachers.length)}
          />

          <SummaryCard
            icon={<Users size={20} />}
            title="Turmas criadas"
            value={String(classes.length)}
          />
        </div>

        {erro && (
          <div className="mt-6 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">
            {erro}
          </div>
        )}

        {mensagem && (
          <div className="mt-6 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">
            {mensagem}
          </div>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <form
            onSubmit={handleCriarTurma}
            className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-cyan-300/10 p-3 text-cyan-200">
                <Plus size={22} />
              </div>

              <div>
                <h2 className="text-xl font-semibold">Nova turma</h2>
                <p className="mt-1 text-sm text-slate-300">
                  Crie uma turma ativa para um professor.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-5">
              <div>
                <label className="text-sm font-medium text-slate-200">
                  Nome da turma
                </label>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  disabled={saving}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300"
                  placeholder="Ex: Freud Básico - Turma 01"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-200">
                  Curso
                </label>
                <select
                  value={courseId}
                  onChange={(event) => setCourseId(event.target.value)}
                  disabled={saving}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-[#111827] px-4 py-3 text-white outline-none transition focus:border-cyan-300"
                >
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-200">
                  Professor
                </label>
                <select
                  value={teacherId}
                  onChange={(event) => setTeacherId(event.target.value)}
                  disabled={saving}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-[#111827] px-4 py-3 text-white outline-none transition focus:border-cyan-300"
                >
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name}
                      {teacher.email ? ` — ${teacher.email}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-slate-200">
                    Início
                  </label>
                  <input
                    type="date"
                    value={startsAt}
                    onChange={(event) => setStartsAt(event.target.value)}
                    disabled={saving}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition focus:border-cyan-300"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-200">
                    Término
                  </label>
                  <input
                    type="date"
                    value={endsAt}
                    onChange={(event) => setEndsAt(event.target.value)}
                    disabled={saving}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition focus:border-cyan-300"
                  />
                </div>
              </div>

              {teachers.length === 0 && (
                <div className="rounded-2xl border border-yellow-300/20 bg-yellow-300/10 p-4 text-sm leading-6 text-yellow-100">
                  Nenhum professor ativo encontrado. Crie uma conta como
                  professor ou altere um perfil para professor no Supabase.
                </div>
              )}

              <button
                type="submit"
                disabled={saving || teachers.length === 0 || courses.length === 0}
                className="w-full rounded-2xl bg-cyan-300 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Criando turma..." : "Criar turma"}
              </button>
            </div>
          </form>

          <section className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6">
            <h2 className="text-xl font-semibold">Turmas criadas</h2>
            <p className="mt-1 text-sm text-slate-300">
              Cada turma possui um código de convite para entrada dos alunos.
            </p>

            <div className="mt-6 space-y-3">
              {classes.length === 0 && (
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-sm text-slate-300">
                  Nenhuma turma criada ainda.
                </div>
              )}

              {classes.map((classItem) => {
                const course = coursesById.get(classItem.course_id);
                const teacher = teachersById.get(classItem.teacher_id);

                return (
                  <article
                    key={classItem.id}
                    className="rounded-3xl border border-white/10 bg-[#07101D] p-5"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">
                          {classItem.title}
                        </h3>

                        <p className="mt-2 text-sm leading-6 text-slate-300">
                          Curso: {course?.title ?? "Curso não encontrado"}
                        </p>

                        <p className="text-sm leading-6 text-slate-300">
                          Professor: {teacher?.name ?? "Professor não encontrado"}
                        </p>
                      </div>

                      <span className="w-fit rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-semibold text-cyan-100">
                        {statusLabel(classItem.status)}
                      </span>
                    </div>

                    <div className="mt-4 rounded-2xl border border-cyan-300/10 bg-cyan-300/5 p-4">
                      <p className="text-xs uppercase tracking-[0.25em] text-cyan-300">
                        Código de convite
                      </p>

                      <strong className="mt-2 block break-all text-xl text-white">
                        {classItem.invite_code}
                      </strong>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-300">
                      {classItem.starts_at && (
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">
                          <CalendarDays size={14} />
                          Início: {classItem.starts_at}
                        </span>
                      )}

                      {classItem.ends_at && (
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">
                          <CalendarDays size={14} />
                          Término: {classItem.ends_at}
                        </span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

function SummaryCard({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-cyan-300/10 p-3 text-cyan-200">
          {icon}
        </div>

        <div>
          <p className="text-xs text-slate-400">{title}</p>
          <strong className="text-lg text-white">{value}</strong>
        </div>
      </div>
    </div>
  );
}