"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Layers3,
  MonitorPlay,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { getCurrentProfile, getDashboardPath, type Profile } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

type AvailableLesson = {
  class_id: string;
  class_title: string;
  course_id: string;
  course_title: string;
  course_workload_hours: number | null;

  module_id: string;
  module_title: string;
  module_description: string | null;
  module_order: number;

  lesson_id: string | null;
  lesson_title: string | null;
  lesson_description: string | null;
  lesson_map_type: string | null;
  lesson_order: number | null;

  progress_percent: number;
  progress_status: string;
};

export default function AlunoAulasPage() {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [items, setItems] = useState<AvailableLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function carregar() {
      setErro("");

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

      const { data, error } = await supabase.rpc(
        "get_student_available_lessons",
        {
          p_student_id: loadedProfile.id,
        }
      );

      if (error) {
        setErro(error.message);
        setLoading(false);
        return;
      }

      setItems((data ?? []) as AvailableLesson[]);
      setLoading(false);
    }

    carregar();
  }, [router]);

  const classes = useMemo(() => {
    const map = new Map<
      string,
      {
        class_id: string;
        class_title: string;
        course_id: string;
        course_title: string;
        course_workload_hours: number | null;
        modules: Map<
          string,
          {
            module_id: string;
            module_title: string;
            module_description: string | null;
            module_order: number;
            lessons: AvailableLesson[];
          }
        >;
      }
    >();

    for (const item of items) {
      if (!map.has(item.class_id)) {
        map.set(item.class_id, {
          class_id: item.class_id,
          class_title: item.class_title,
          course_id: item.course_id,
          course_title: item.course_title,
          course_workload_hours: item.course_workload_hours,
          modules: new Map(),
        });
      }

      const classItem = map.get(item.class_id)!;

      if (!classItem.modules.has(item.module_id)) {
        classItem.modules.set(item.module_id, {
          module_id: item.module_id,
          module_title: item.module_title,
          module_description: item.module_description,
          module_order: item.module_order,
          lessons: [],
        });
      }

      if (item.lesson_id) {
        classItem.modules.get(item.module_id)!.lessons.push(item);
      }
    }

    return Array.from(map.values()).map((classItem) => ({
      ...classItem,
      modules: Array.from(classItem.modules.values()).sort(
        (a, b) => a.module_order - b.module_order
      ),
    }));
  }, [items]);

  const totalModules = useMemo(() => {
    const moduleIds = new Set(items.map((item) => item.module_id));
    return moduleIds.size;
  }, [items]);

  function toggleModule(moduleId: string) {
    setOpenModules((current) => ({
      ...current,
      [moduleId]: !current[moduleId],
    }));
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#070B14] px-6 text-white">
        <p className="text-sm text-slate-300">Carregando aulas...</p>
      </main>
    );
  }

  if (!profile) return null;

  return (
    <main className="min-h-screen bg-[#070B14] px-6 py-8 text-white">
      <section className="mx-auto w-full max-w-7xl">
        <AppHeader name={profile.name} role={profile.role} />

        <Link
          href="/aluno"
          className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-200"
        >
          <ArrowLeft size={18} />
          Voltar para sala do aluno
        </Link>

        <header className="mt-6 rounded-[2rem] border border-cyan-300/20 bg-white/[0.06] p-6">
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">
            Aulas liberadas
          </p>

          <h1 className="mt-3 text-3xl font-semibold">
            Seu curso em ordem pedagógica
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
            Comece pela introdução e avance pelos módulos. Cada aula interativa
            registra seu progresso.
          </p>
        </header>

        {erro && (
          <div className="mt-6 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">
            {erro}
          </div>
        )}

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <DebugCard title="Turmas encontradas" value={String(classes.length)} />
          <DebugCard title="Módulos encontrados" value={String(totalModules)} />
          <DebugCard
  title="Aulas encontradas"
  value={String(items.filter((item) => item.lesson_id).length)}
/>
        </div>

        <div className="mt-8 space-y-6">
          {items.length === 0 && (
            <div className="rounded-[2rem] border border-yellow-300/20 bg-yellow-300/10 p-6 text-yellow-100">
              <h2 className="text-xl font-semibold">
                Nenhuma aula liberada encontrada
              </h2>
              <p className="mt-2 text-sm leading-7">
                Verifique se o aluno está vinculado a uma turma ativa e se o
                curso possui módulos e aulas ativos.
              </p>
            </div>
          )}

          {classes.map((classItem) => (
            <article
              key={classItem.class_id}
              className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6"
            >
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-cyan-300">
                  {classItem.class_title}
                </p>

                <h2 className="mt-2 text-2xl font-semibold">
                  {classItem.course_title}
                </h2>

                {classItem.course_workload_hours && (
                  <p className="mt-2 text-sm text-slate-300">
                    Carga horária: {classItem.course_workload_hours}h
                  </p>
                )}
              </div>

              <div className="mt-6 space-y-4">
                {classItem.modules.map((moduleItem) => (
                 <section
                 key={moduleItem.module_id}
                 className="rounded-3xl border border-white/10 bg-[#07101D] p-4"
               >
                 <button
                   type="button"
                   onClick={() => toggleModule(moduleItem.module_id)}
                   className="flex w-full items-start justify-between gap-4 rounded-2xl p-2 text-left transition hover:bg-white/[0.04]"
                 >
                   <div className="flex items-start gap-3">
                     <div className="rounded-2xl bg-cyan-300/10 p-3 text-cyan-200">
                       <Layers3 size={20} />
                     </div>
               
                     <div>
                       <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">
                         Módulo {moduleItem.module_order}
                       </p>
               
                       <h3 className="mt-1 text-lg font-semibold">
                         {moduleItem.module_title}
                       </h3>
               
                       <p className="mt-2 text-xs text-slate-400">
                         {moduleItem.lessons.length > 0
                           ? `${moduleItem.lessons.length} aula(s) cadastrada(s)`
                           : "Nenhuma aula cadastrada ainda"}
                       </p>
               
                       {moduleItem.module_description && openModules[moduleItem.module_id] && (
                         <p className="mt-2 text-sm leading-6 text-slate-300">
                           {moduleItem.module_description}
                         </p>
                       )}
                     </div>
                   </div>
               
                   <div className="mt-2 rounded-full border border-white/10 bg-white/[0.04] p-2 text-cyan-100">
                     {openModules[moduleItem.module_id] ? (
                       <ChevronDown size={18} />
                     ) : (
                       <ChevronRight size={18} />
                     )}
                   </div>
                 </button>
               
                 {openModules[moduleItem.module_id] && (
                   <div className="mt-4 space-y-2">
                    {moduleItem.lessons.length === 0 && (
  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-300">
    Nenhuma aula cadastrada neste módulo ainda.
  </div>
)}

{moduleItem.lessons
  .sort((a, b) => Number(a.lesson_order ?? 0) - Number(b.lesson_order ?? 0))
  .map((lesson) => (
                          <div
                            key={lesson.lesson_id}
                            className="rounded-2xl border border-cyan-300/10 bg-cyan-300/5 p-4 transition hover:bg-cyan-300/10"
                          >
                            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <BookOpen
                                    size={18}
                                    className="text-cyan-200"
                                  />
                                  <p className="font-semibold text-white">
                                    Aula {lesson.lesson_order}:{" "}
                                    {lesson.lesson_title}
                                  </p>
                                </div>

                                {lesson.lesson_description && (
                                  <p className="mt-2 text-sm leading-6 text-slate-300">
                                    {lesson.lesson_description}
                                  </p>
                                )}

                                {lesson.lesson_map_type && (
                                  <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-white/[0.06] px-3 py-1 text-xs text-cyan-100">
                                    <MonitorPlay size={14} />
                                    Mapa: {lesson.lesson_map_type}
                                  </p>
                                )}
                              </div>

                              <div className="flex flex-col gap-3 md:items-end">
                                <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-200">
                                  Progresso: {lesson.progress_percent ?? 0}%
                                </div>

                                <Link
                                  href={`/aula/${lesson.lesson_id as string}?classId=${classItem.class_id}`}
                                  className="rounded-2xl bg-cyan-300 px-5 py-3 text-center text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
                                >
                                  Abrir aula
                                </Link>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                    )}
                  </section>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function DebugCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
      <p className="text-xs text-slate-400">{title}</p>
      <strong className="mt-1 block text-xl text-white">{value}</strong>
    </div>
  );
}