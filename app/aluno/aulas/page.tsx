"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, Layers3, MonitorPlay } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { getCurrentProfile, getDashboardPath, type Profile } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

type ClassStudent = {
  id: string;
  class_id: string;
  status: string;
};

type ClassItem = {
  id: string;
  title: string;
  course_id: string;
  status: string;
};

type Course = {
  id: string;
  title: string;
  workload_hours: number;
  is_active: boolean;
};

type CourseModule = {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  order_index: number;
  is_active: boolean;
};

type Lesson = {
  id: string;
  module_id: string;
  title: string;
  description: string | null;
  map_type: string | null;
  order_index: number;
  is_active: boolean;
};

type Progress = {
  lesson_id: string;
  class_id: string;
  progress_percent: number;
  status: string;
};

export default function AlunoAulasPage() {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [classStudents, setClassStudents] = useState<ClassStudent[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progressList, setProgressList] = useState<Progress[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

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

      const { data: classStudentsData, error: classStudentsError } =
        await supabase
          .from("class_students")
          .select("id, class_id, status")
          .eq("student_id", loadedProfile.id);

      if (classStudentsError) {
        setErro(classStudentsError.message);
        setLoading(false);
        return;
      }

      const typedClassStudents = (classStudentsData ?? []) as ClassStudent[];
      const activeClassStudents = typedClassStudents.filter(
        (item) => item.status === "active"
      );

      setClassStudents(activeClassStudents);

      const classIds = activeClassStudents.map((item) => item.class_id);

      if (classIds.length === 0) {
        setLoading(false);
        return;
      }

      const { data: classesData, error: classesError } = await supabase
        .from("classes")
        .select("id, title, course_id, status")
        .in("id", classIds);

      if (classesError) {
        setErro(classesError.message);
        setLoading(false);
        return;
      }

      const typedClasses = ((classesData ?? []) as ClassItem[]).filter(
        (classItem) => classItem.status === "active"
      );

      setClasses(typedClasses);

      const courseIds = Array.from(
        new Set(typedClasses.map((classItem) => classItem.course_id))
      );

      if (courseIds.length === 0) {
        setLoading(false);
        return;
      }

      const { data: coursesData, error: coursesError } = await supabase
        .from("courses")
        .select("id, title, workload_hours, is_active")
        .in("id", courseIds);

      if (coursesError) {
        setErro(coursesError.message);
        setLoading(false);
        return;
      }

      const typedCourses = ((coursesData ?? []) as Course[]).filter(
        (course) => course.is_active
      );

      setCourses(typedCourses);

      const activeCourseIds = typedCourses.map((course) => course.id);

      if (activeCourseIds.length === 0) {
        setLoading(false);
        return;
      }

      const { data: modulesData, error: modulesError } = await supabase
        .from("course_modules")
        .select("id, course_id, title, description, order_index, is_active")
        .in("course_id", activeCourseIds)
        .order("order_index", { ascending: true });

      if (modulesError) {
        setErro(modulesError.message);
        setLoading(false);
        return;
      }

      const typedModules = ((modulesData ?? []) as CourseModule[]).filter(
        (moduleItem) => moduleItem.is_active
      );

      setModules(typedModules);

      const moduleIds = typedModules.map((moduleItem) => moduleItem.id);

      if (moduleIds.length > 0) {
        const { data: lessonsData, error: lessonsError } = await supabase
          .from("lessons")
          .select(
            "id, module_id, title, description, map_type, order_index, is_active"
          )
          .in("module_id", moduleIds)
          .order("order_index", { ascending: true });

        if (lessonsError) {
          setErro(lessonsError.message);
          setLoading(false);
          return;
        }

        const typedLessons = ((lessonsData ?? []) as Lesson[]).filter(
          (lesson) => lesson.is_active
        );

        setLessons(typedLessons);
      }

      const { data: progressData } = await supabase
        .from("student_lesson_progress")
        .select("lesson_id, class_id, progress_percent, status")
        .eq("student_id", loadedProfile.id)
        .in("class_id", classIds);

      setProgressList((progressData ?? []) as Progress[]);
      setLoading(false);
    }

    carregar();
  }, [router]);

  const coursesById = useMemo(() => {
    return new Map(courses.map((course) => [course.id, course]));
  }, [courses]);

  const progressByLessonAndClass = useMemo(() => {
    const map = new Map<string, Progress>();

    for (const progress of progressList) {
      map.set(`${progress.class_id}-${progress.lesson_id}`, progress);
    }

    return map;
  }, [progressList]);

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

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <DebugCard title="Vínculos ativos" value={String(classStudents.length)} />
          <DebugCard title="Turmas ativas" value={String(classes.length)} />
          <DebugCard title="Módulos encontrados" value={String(modules.length)} />
          <DebugCard title="Aulas encontradas" value={String(lessons.length)} />
        </div>

        <div className="mt-8 space-y-6">
          {classes.length === 0 && (
            <div className="rounded-[2rem] border border-yellow-300/20 bg-yellow-300/10 p-6 text-yellow-100">
              <h2 className="text-xl font-semibold">
                Nenhuma turma ativa encontrada
              </h2>
              <p className="mt-2 text-sm leading-7">
                Entre em uma turma ativa usando o código recebido para acessar
                as aulas.
              </p>
            </div>
          )}

          {classes.map((classItem) => {
            const course = coursesById.get(classItem.course_id);
            const courseModules = modules.filter(
              (moduleItem) => moduleItem.course_id === classItem.course_id
            );

            return (
              <article
                key={classItem.id}
                className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6"
              >
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-cyan-300">
                    {classItem.title}
                  </p>

                  <h2 className="mt-2 text-2xl font-semibold">
                    {course?.title ?? "Curso não encontrado"}
                  </h2>
                </div>

                <div className="mt-6 space-y-4">
                  {courseModules.length === 0 && (
                    <div className="rounded-2xl border border-yellow-300/20 bg-yellow-300/10 p-5 text-sm leading-6 text-yellow-100">
                      Nenhum módulo encontrado para este curso.
                    </div>
                  )}

                  {courseModules.map((moduleItem) => {
                    const moduleLessons = lessons.filter(
                      (lesson) => lesson.module_id === moduleItem.id
                    );

                    return (
                      <section
                        key={moduleItem.id}
                        className="rounded-3xl border border-white/10 bg-[#07101D] p-5"
                      >
                        <div className="flex items-start gap-3">
                          <div className="rounded-2xl bg-cyan-300/10 p-3 text-cyan-200">
                            <Layers3 size={20} />
                          </div>

                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">
                              Módulo {moduleItem.order_index}
                            </p>

                            <h3 className="mt-1 text-lg font-semibold">
                              {moduleItem.title}
                            </h3>

                            {moduleItem.description && (
                              <p className="mt-2 text-sm leading-6 text-slate-300">
                                {moduleItem.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="mt-4 space-y-2">
                          {moduleLessons.length === 0 && (
                            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-300">
                              Nenhuma aula cadastrada neste módulo ainda.
                            </div>
                          )}

                          {moduleLessons.map((lesson) => {
                            const progress = progressByLessonAndClass.get(
                              `${classItem.id}-${lesson.id}`
                            );

                            return (
                              <div
                                key={lesson.id}
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
                                        Aula {lesson.order_index}: {lesson.title}
                                      </p>
                                    </div>

                                    {lesson.description && (
                                      <p className="mt-2 text-sm leading-6 text-slate-300">
                                        {lesson.description}
                                      </p>
                                    )}

                                    {lesson.map_type && (
                                      <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-white/[0.06] px-3 py-1 text-xs text-cyan-100">
                                        <MonitorPlay size={14} />
                                        Mapa: {lesson.map_type}
                                      </p>
                                    )}
                                  </div>

                                  <div className="flex flex-col gap-3 md:items-end">
                                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-200">
                                      Progresso:{" "}
                                      {progress?.progress_percent ?? 0}%
                                    </div>

                                    <Link
                                      href={`/aula/${lesson.id}?classId=${classItem.id}`}
                                      className="rounded-2xl bg-cyan-300 px-5 py-3 text-center text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
                                    >
                                      Abrir aula
                                    </Link>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </section>
                    );
                  })}
                </div>
              </article>
            );
          })}
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