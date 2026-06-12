"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Maximize2,
  Quote,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { getCurrentProfile, type Profile } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

type Lesson = {
  id: string;
  title: string;
  description: string | null;
  map_type: string | null;
};

type LessonPoint = {
  id: string;
  lesson_id: string;
  title: string;
  short_text: string | null;
  full_text: string | null;
  teacher_note: string | null;
  reference_text: string | null;
  x_position: number;
  y_position: number;
  color: string;
  order_index: number;
};

type Progress = {
  id: string;
  viewed_points: string[];
  progress_percent: number;
  status: string;
};

export default function AulaPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();

  const lessonId = params.id;
  const classId = searchParams.get("classId");

  const [profile, setProfile] = useState<Profile | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [points, setPoints] = useState<LessonPoint[]>([]);
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  const [viewedPoints, setViewedPoints] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const selectedPoint = useMemo(() => {
    return points.find((point) => point.id === selectedPointId) ?? points[0];
  }, [points, selectedPointId]);

  const progressPercent = useMemo(() => {
    if (points.length === 0) return 0;

    return Math.round((viewedPoints.length / points.length) * 100);
  }, [points.length, viewedPoints.length]);

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

      setProfile(loadedProfile);

      const { data: lessonData, error: lessonError } = await supabase
        .from("lessons")
        .select("id, title, description, map_type")
        .eq("id", lessonId)
        .single();

      if (lessonError || !lessonData) {
        setErro("Aula não encontrada.");
        setLoading(false);
        return;
      }

      const { data: pointsData, error: pointsError } = await supabase
        .from("lesson_points")
        .select(
          `
          id,
          lesson_id,
          title,
          short_text,
          full_text,
          teacher_note,
          reference_text,
          x_position,
          y_position,
          color,
          order_index
        `
        )
        .eq("lesson_id", lessonId)
        .order("order_index", { ascending: true });

      if (pointsError) {
        setErro(pointsError.message);
        setLoading(false);
        return;
      }

      const typedPoints = (pointsData ?? []) as LessonPoint[];

      setLesson(lessonData as Lesson);
      setPoints(typedPoints);
      setSelectedPointId(typedPoints[0]?.id ?? null);

      if (loadedProfile.role === "student" && classId) {
        const { data: progressData } = await supabase
          .from("student_lesson_progress")
          .select("id, viewed_points, progress_percent, status")
          .eq("student_id", loadedProfile.id)
          .eq("class_id", classId)
          .eq("lesson_id", lessonId)
          .maybeSingle();

        if (progressData) {
          const typedProgress = progressData as Progress;
          setViewedPoints(typedProgress.viewed_points ?? []);
        }
      }

      setLoading(false);
    }

    carregar();
  }, [classId, lessonId, router]);

  async function markPointAsViewed(pointId: string) {
    setSelectedPointId(pointId);

    if (!profile || profile.role !== "student" || !classId) {
      return;
    }

    const nextViewedPoints = Array.from(new Set([...viewedPoints, pointId]));
    setViewedPoints(nextViewedPoints);

    const nextProgressPercent =
      points.length > 0
        ? Math.round((nextViewedPoints.length / points.length) * 100)
        : 0;

    const nextStatus =
      nextProgressPercent >= 100 ? "completed" : "in_progress";

    const { data: existingProgress } = await supabase
      .from("student_lesson_progress")
      .select("id")
      .eq("student_id", profile.id)
      .eq("class_id", classId)
      .eq("lesson_id", lessonId)
      .maybeSingle();

    if (existingProgress) {
      await supabase
        .from("student_lesson_progress")
        .update({
          viewed_points: nextViewedPoints,
          progress_percent: nextProgressPercent,
          status: nextStatus,
          completed_at:
            nextStatus === "completed" ? new Date().toISOString() : null,
        })
        .eq("id", existingProgress.id);
    } else {
      await supabase.from("student_lesson_progress").insert({
        student_id: profile.id,
        class_id: classId,
        lesson_id: lessonId,
        viewed_points: nextViewedPoints,
        progress_percent: nextProgressPercent,
        status: nextStatus,
        score: 0,
        completed_at:
          nextStatus === "completed" ? new Date().toISOString() : null,
      });
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#070B14] px-6 text-white">
        <p className="text-sm text-slate-300">Carregando aula...</p>
      </main>
    );
  }

  if (!profile || !lesson) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#070B14] px-6 text-white">
        <p className="text-sm text-slate-300">{erro || "Aula não encontrada."}</p>
      </main>
    );
  }

  const backHref = profile.role === "student" ? "/aluno/aulas" : "/professor";

  return (
    <main className="min-h-screen bg-[#070B14] px-6 py-8 text-white">
      <section className="mx-auto w-full max-w-7xl">
        <AppHeader name={profile.name} role={profile.role} />

        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-200"
        >
          <ArrowLeft size={18} />
          Voltar
        </Link>

        <header className="mt-6 rounded-[2rem] border border-cyan-300/20 bg-white/[0.06] p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">
                Aula interativa
              </p>

              <h1 className="mt-3 text-3xl font-semibold">{lesson.title}</h1>

              {lesson.description && (
                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
                  {lesson.description}
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-200">
              <p>Progresso</p>
              <strong className="mt-1 block text-2xl text-white">
                {progressPercent}%
              </strong>
            </div>
          </div>
        </header>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5">
            <div className="relative min-h-[620px] overflow-hidden rounded-[1.6rem] border border-cyan-300/20 bg-[#050A12]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.18),transparent_45%),linear-gradient(135deg,rgba(59,130,246,0.12),transparent_45%)]" />

              <div className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/20 bg-cyan-300/5 shadow-2xl shadow-cyan-500/20">
                <div className="absolute inset-8 rounded-full border border-cyan-300/20" />
                <div className="absolute inset-20 rounded-full border border-cyan-300/10" />
              </div>

              <div className="absolute left-1/2 top-[52%] h-32 w-[520px] -translate-x-1/2 rounded-full border border-cyan-300/20 bg-cyan-300/5 blur-[1px]" />

              <div className="absolute left-1/2 top-[50%] flex h-64 w-64 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-cyan-300/30 bg-cyan-300/10 shadow-2xl shadow-cyan-500/30">
                <div className="text-center">
                  <BookOpen className="mx-auto text-cyan-200" size={54} />
                  <p className="mt-4 text-sm uppercase tracking-[0.28em] text-cyan-200">
                    Consultório
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    fala & escuta
                  </p>
                </div>
              </div>

              <div className="absolute bottom-8 left-1/2 h-16 w-[420px] -translate-x-1/2 rounded-[50%] border border-cyan-300/20 bg-cyan-300/10" />

              {points.map((point) => {
                const isSelected = point.id === selectedPoint?.id;
                const isViewed = viewedPoints.includes(point.id);

                return (
                  <button
                    key={point.id}
                    type="button"
                    onClick={() => markPointAsViewed(point.id)}
                    className="absolute z-20 -translate-x-1/2 -translate-y-1/2"
                    style={{
                      left: `${point.x_position}%`,
                      top: `${point.y_position}%`,
                    }}
                  >
                    <span
                      className={`flex h-16 w-16 items-center justify-center rounded-full border text-xs font-bold shadow-2xl transition ${
                        isSelected
                          ? "scale-110 border-white bg-white text-slate-950"
                          : "border-cyan-200 bg-cyan-300/20 text-white hover:scale-105"
                      }`}
                      style={{
                        boxShadow: `0 0 32px ${point.color}`,
                      }}
                    >
                      {isViewed ? <CheckCircle2 size={22} /> : point.order_index}
                    </span>

                    <span className="mt-2 block rounded-full border border-white/10 bg-black/50 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                      {point.title}
                    </span>
                  </button>
                );
              })}

              <div className="absolute right-5 top-5 rounded-full border border-white/10 bg-black/40 px-4 py-2 text-xs text-slate-200 backdrop-blur">
                Mapa visual introdutório
              </div>

              <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-cyan-300/20 bg-black/40 p-4 text-sm leading-6 text-slate-200 backdrop-blur">
                Esta imagem é simbólica. Ela representa o campo da fala, da
                escuta e do inconsciente, não uma localização anatômica.
              </div>
            </div>
          </section>

          <aside className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6">
            {selectedPoint ? (
              <div>
                <div className="inline-flex rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-semibold text-cyan-100">
                  Ponto {selectedPoint.order_index}
                </div>

                <h2 className="mt-4 text-2xl font-semibold">
                  {selectedPoint.title}
                </h2>

                {selectedPoint.short_text && (
                  <p className="mt-4 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4 text-sm leading-7 text-cyan-50">
                    {selectedPoint.short_text}
                  </p>
                )}

                {selectedPoint.full_text && (
                  <div className="mt-5">
                    <h3 className="font-semibold text-white">
                      Explicação da aula
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-slate-300">
                      {selectedPoint.full_text}
                    </p>
                  </div>
                )}

                {profile.role !== "student" && selectedPoint.teacher_note && (
                  <div className="mt-5 rounded-2xl border border-yellow-300/20 bg-yellow-300/10 p-4">
                    <h3 className="font-semibold text-yellow-100">
                      Nota para o professor
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-yellow-50">
                      {selectedPoint.teacher_note}
                    </p>
                  </div>
                )}

                {selectedPoint.reference_text && (
                  <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <div className="flex items-center gap-2 text-cyan-100">
                      <Quote size={18} />
                      <h3 className="font-semibold">Referências</h3>
                    </div>
                    <p className="mt-2 text-sm leading-7 text-slate-300">
                      {selectedPoint.reference_text}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-300">
                Nenhum ponto cadastrado para esta aula.
              </p>
            )}
          </aside>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href={backHref}
            className="rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Voltar para lista
          </Link>

          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-300/40 bg-cyan-300/10 px-5 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-300/20"
          >
            <Maximize2 size={18} />
            Modo telão em breve
          </button>
        </div>
      </section>
    </main>
  );
}