"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  Layers3,
  MonitorPlay,
  School,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { getCurrentProfile, getDashboardPath, type Profile } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

type Course = {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
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

type LessonPoint = {
  id: string;
  lesson_id: string;
  title: string;
  order_index: number;
};

export default function AdminCursosPage() {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [points, setPoints] = useState<LessonPoint[]>([]);
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

      if (loadedProfile.role !== "admin") {
        router.push(getDashboardPath(loadedProfile.role));
        return;
      }

      setProfile(loadedProfile);

      const { data: coursesData, error: coursesError } = await supabase
        .from("courses")
        .select("id, title, subtitle, description, workload_hours, is_active")
        .order("created_at", { ascending: true });

      if (coursesError) {
        setErro(coursesError.message);
        setLoading(false);
        return;
      }

      const { data: modulesData, error: modulesError } = await supabase
        .from("course_modules")
        .select("id, course_id, title, description, order_index, is_active")
        .order("order_index", { ascending: true });

      if (modulesError) {
        setErro(modulesError.message);
        setLoading(false);
        return;
      }

      const { data: lessonsData, error: lessonsError } = await supabase
        .from("lessons")
        .select(
          "id, module_id, title, description, map_type, order_index, is_active"
        )
        .order("order_index", { ascending: true });

      if (lessonsError) {
        setErro(lessonsError.message);
        setLoading(false);
        return;
      }

      const { data: pointsData, error: pointsError } = await supabase
        .from("lesson_points")
        .select("id, lesson_id, title, order_index")
        .order("order_index", { ascending: true });

      if (pointsError) {
        setErro(pointsError.message);
        setLoading(false);
        return;
      }

      setCourses(coursesData ?? []);
      setModules(modulesData ?? []);
      setLessons(lessonsData ?? []);
      setPoints(pointsData ?? []);
      setLoading(false);
    }

    carregar();
  }, [router]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#070B14] px-6 text-white">
        <p className="text-sm text-slate-300">Carregando cursos...</p>
      </main>
    );
  }

  if (!profile) return null;

  const totalLessons = lessons.length;
  const totalPoints = points.length;

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
            Estrutura pedagógica
          </p>

          <h1 className="mt-3 text-3xl font-semibold">Cursos e módulos</h1>

          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
            Aqui o administrador acompanha a estrutura do curso, os módulos, as
            aulas e os pontos interativos do Atlas Psicanalítico Interativo.
          </p>
        </header>

        {erro && (
          <div className="mt-6 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">
            {erro}
          </div>
        )}

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <SummaryCard
            icon={<School size={20} />}
            title="Cursos"
            value={String(courses.length)}
          />

          <SummaryCard
            icon={<Layers3 size={20} />}
            title="Módulos"
            value={String(modules.length)}
          />

          <SummaryCard
            icon={<BookOpen size={20} />}
            title="Aulas"
            value={String(totalLessons)}
          />

          <SummaryCard
            icon={<MonitorPlay size={20} />}
            title="Pontos interativos"
            value={String(totalPoints)}
          />
        </div>

        {courses.length === 0 && (
          <div className="mt-8 rounded-[2rem] border border-yellow-300/20 bg-yellow-300/10 p-6 text-yellow-100">
            <h2 className="text-xl font-semibold">Nenhum curso encontrado</h2>
            <p className="mt-2 text-sm leading-7">
              O banco ainda não retornou cursos para esta página. Rode o SQL de
              reparo do curso base no Supabase e atualize esta tela.
            </p>
          </div>
        )}

        <div className="mt-8 space-y-6">
          {courses.map((course) => {
            const courseModules = modules.filter(
              (moduleItem) => moduleItem.course_id === course.id
            );

            const courseLessons = lessons.filter((lesson) =>
              courseModules.some(
                (moduleItem) => moduleItem.id === lesson.module_id
              )
            );

            return (
              <article
                key={course.id}
                className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-semibold text-cyan-100">
                      <School size={14} />
                      Curso cadastrado
                    </div>

                    <h2 className="mt-4 text-2xl font-semibold">
                      {course.title}
                    </h2>

                    {course.subtitle && (
                      <p className="mt-2 text-sm text-cyan-100">
                        {course.subtitle}
                      </p>
                    )}

                    {course.description && (
                      <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-300">
                        {course.description}
                      </p>
                    )}
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-200">
                    <p>Carga horária</p>
                    <strong className="mt-1 block text-2xl text-white">
                      {course.workload_hours}h
                    </strong>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 md:grid-cols-3">
                  <SummaryCard
                    icon={<Layers3 size={20} />}
                    title="Módulos deste curso"
                    value={String(courseModules.length)}
                  />

                  <SummaryCard
                    icon={<BookOpen size={20} />}
                    title="Aulas deste curso"
                    value={String(courseLessons.length)}
                  />

                  <SummaryCard
                    icon={<MonitorPlay size={20} />}
                    title="Modo telão"
                    value="Preparado"
                  />
                </div>

                <div className="mt-8 space-y-3">
                  {courseModules.map((moduleItem) => {
                    const moduleLessons = lessons.filter(
                      (lesson) => lesson.module_id === moduleItem.id
                    );

                    return (
                      <div
                        key={moduleItem.id}
                        className="rounded-3xl border border-white/10 bg-[#07101D] p-5"
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">
                              Módulo {moduleItem.order_index}
                            </p>

                            <h3 className="mt-2 text-xl font-semibold">
                              {moduleItem.title}
                            </h3>

                            {moduleItem.description && (
                              <p className="mt-2 text-sm leading-7 text-slate-300">
                                {moduleItem.description}
                              </p>
                            )}
                          </div>

                          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-300">
                            {moduleLessons.length} aula(s)
                          </span>
                        </div>

                        {moduleLessons.length > 0 && (
                          <div className="mt-4 space-y-2">
                            {moduleLessons.map((lesson) => {
                              const lessonPoints = points.filter(
                                (point) => point.lesson_id === lesson.id
                              );

                              return (
                                <div
                                  key={lesson.id}
                                  className="rounded-2xl border border-cyan-300/10 bg-cyan-300/5 p-4"
                                >
                                  <p className="text-sm font-semibold text-white">
                                    Aula {lesson.order_index}: {lesson.title}
                                  </p>

                                  {lesson.description && (
                                    <p className="mt-1 text-sm leading-6 text-slate-300">
                                      {lesson.description}
                                    </p>
                                  )}

                                  <div className="mt-3 flex flex-wrap gap-2">
                                    {lesson.map_type && (
                                      <span className="rounded-full bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100">
                                        Mapa: {lesson.map_type}
                                      </span>
                                    )}

                                    <span className="rounded-full bg-white/[0.06] px-3 py-1 text-xs text-slate-200">
                                      {lessonPoints.length} ponto(s)
                                      interativo(s)
                                    </span>
                                  </div>

                                  {lessonPoints.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                      {lessonPoints.map((point) => (
                                        <span
                                          key={point.id}
                                          className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-300"
                                        >
                                          {point.title}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
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