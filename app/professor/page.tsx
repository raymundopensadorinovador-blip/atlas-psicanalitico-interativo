"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Award,
  BookOpen,
  ClipboardCheck,
  MonitorPlay,
  Users,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { getCurrentProfile, getDashboardPath, type Profile } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

type ClassItem = {
  id: string;
  title: string;
  invite_code: string;
  status: string;
  course_id: string;
  courses: {
    title: string;
  } | null;
};

type ClassStudent = {
  id: string;
  class_id: string;
  status: string;
  profiles: {
    name: string;
    email: string | null;
  } | null;
};

export default function ProfessorPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [students, setStudents] = useState<ClassStudent[]>([]);
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

      if (loadedProfile.role !== "teacher") {
        router.push(getDashboardPath(loadedProfile.role));
        return;
      }

      setProfile(loadedProfile);

      const { data: classesData, error: classesError } = await supabase
        .from("classes")
        .select(
          `
          id,
          title,
          invite_code,
          status,
          course_id,
          courses (
            title
          )
        `
        )
        .eq("teacher_id", loadedProfile.id)
        .order("created_at", { ascending: false });

      if (classesError) {
        setErro(classesError.message);
        setLoading(false);
        return;
      }

      const classIds = (classesData ?? []).map((classItem) => classItem.id);

      let studentsData: ClassStudent[] = [];

      if (classIds.length > 0) {
        const { data, error } = await supabase
          .from("class_students")
          .select(
            `
            id,
            class_id,
            status,
            profiles (
              name,
              email
            )
          `
          )
          .in("class_id", classIds);

        if (error) {
          setErro(error.message);
          setLoading(false);
          return;
        }

        studentsData = (data ?? []) as unknown as ClassStudent[];
      }

      setClasses((classesData ?? []) as unknown as ClassItem[]);
      setStudents(studentsData);
      setLoading(false);
    }

    carregar();
  }, [router]);

  const totalStudents = students.length;

  const pendingAssignments = 0;

  const studentsByClass = useMemo(() => {
    const map = new Map<string, ClassStudent[]>();

    for (const student of students) {
      const current = map.get(student.class_id) ?? [];
      current.push(student);
      map.set(student.class_id, current);
    }

    return map;
  }, [students]);

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
            Painel do professor
          </p>

          <h1 className="mt-3 text-3xl font-semibold">
            Suas turmas e aulas guiadas
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
            Use mapas interativos no modo telão, acompanhe alunos, corrija
            atividades e libere certificados conforme os critérios do curso.
          </p>
        </header>

        {erro && (
          <div className="mt-6 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">
            {erro}
          </div>
        )}

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <ProfessorCard
            icon={<Users size={24} />}
            title="Alunos vinculados"
            value={String(totalStudents)}
            text="Alunos ativos nas suas turmas."
          />

          <ProfessorCard
            icon={<BookOpen size={24} />}
            title="Turmas ativas"
            value={String(classes.length)}
            text="Turmas sob sua responsabilidade."
          />

          <ProfessorCard
            icon={<ClipboardCheck size={24} />}
            title="Atividades pendentes"
            value={String(pendingAssignments)}
            text="Respostas aguardando correção."
          />

          <ProfessorCard
            icon={<Award size={24} />}
            title="Certificados aguardando"
            value="0"
            text="Alunos aptos para análise de certificado."
          />

          <ProfessorCard
            icon={<MonitorPlay size={24} />}
            title="Modo telão"
            value="Acessar"
            text="Abrir mapas visuais em tela cheia para aula."
          />
        </div>

        <section className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.06] p-6">
          <h2 className="text-xl font-semibold">Minhas turmas</h2>
          <p className="mt-1 text-sm text-slate-300">
            Turmas vinculadas ao seu perfil de professor.
          </p>

          <div className="mt-6 space-y-3">
            {classes.length === 0 && (
              <div className="rounded-2xl border border-yellow-300/20 bg-yellow-300/10 p-5 text-sm leading-6 text-yellow-100">
                Nenhuma turma vinculada ao seu perfil ainda.
              </div>
            )}

            {classes.map((classItem) => {
              const classStudents = studentsByClass.get(classItem.id) ?? [];

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
                        Curso: {classItem.courses?.title ?? "Curso não encontrado"}
                      </p>

                      <p className="text-sm leading-6 text-slate-300">
                        Código: {classItem.invite_code}
                      </p>
                    </div>

                    <span className="w-fit rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-semibold text-cyan-100">
                      {classStudents.length} aluno(s)
                    </span>
                  </div>

                  {classStudents.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {classStudents.map((student) => (
                        <div
                          key={student.id}
                          className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                        >
                          <p className="font-semibold text-white">
                            {student.profiles?.name ?? "Aluno sem nome"}
                          </p>

                          <p className="mt-1 text-sm text-slate-300">
                            {student.profiles?.email ?? "Sem e-mail"}
                          </p>
                        </div>
                      ))}
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

function ProfessorCard({
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