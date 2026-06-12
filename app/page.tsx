import Link from "next/link";
import {
  Brain,
  GraduationCap,
  Presentation,
  ShieldCheck,
  Receipt,
  Award,
} from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#070B14] text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8">
        <header className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">
              Plataforma educacional
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
              Atlas Psicanalítico Interativo
            </h1>
          </div>

          <div className="hidden rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100 md:block">
            Aulas visuais, atividades e certificação
          </div>
        </header>

        <div className="grid flex-1 items-center gap-10 py-16 lg:grid-cols-[1.05fr_0.95fr]">
          <section>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100">
              <Brain size={16} />
              Ensino visual de psicanálise
            </div>

            <h2 className="mt-8 max-w-4xl text-4xl font-semibold leading-tight md:text-6xl">
              Mapas holográficos para ensinar Freud com clareza, profundidade e
              impacto.
            </h2>

            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 md:text-lg">
              Uma plataforma para professores, alunos e administradores
              organizarem aulas, turmas, atividades, progresso, financeiro e
              certificados em um só lugar.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
  <Link
    href="/login"
    className="rounded-2xl bg-cyan-300 px-6 py-3 text-center font-semibold text-slate-950 transition hover:bg-cyan-200"
  >
    Entrar na plataforma
  </Link>

  <Link
    href="/cadastro"
    className="rounded-2xl border border-cyan-300/40 bg-cyan-300/10 px-6 py-3 text-center font-semibold text-cyan-100 transition hover:bg-cyan-300/20"
  >
    Criar conta
  </Link>

  <Link
    href="/comprovante"
    className="rounded-2xl border border-white/15 bg-white/5 px-6 py-3 text-center font-semibold text-white transition hover:bg-white/10"
  >
    Enviar comprovante
  </Link>
</div> 
          </section>

          <section className="relative">
            <div className="absolute inset-0 rounded-[3rem] bg-cyan-400/20 blur-3xl" />

            <div className="relative overflow-hidden rounded-[3rem] border border-cyan-300/20 bg-white/[0.06] p-6 shadow-2xl shadow-cyan-950/40 backdrop-blur">
              <div className="rounded-[2rem] border border-cyan-300/20 bg-[#06111F] p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-cyan-200">Curso inicial</p>
                    <h3 className="mt-1 text-2xl font-semibold">
                      Introdução Visual à Psicanálise Freudiana
                    </h3>
                  </div>

                  <div className="rounded-2xl bg-cyan-300/10 p-3 text-cyan-200">
                    <Presentation size={28} />
                  </div>
                </div>

                <div className="mt-8 grid gap-4">
                  <FeatureCard
                    icon={<GraduationCap size={20} />}
                    title="Modo Professor"
                    text="Turmas, aulas guiadas, modo telão, atividades e acompanhamento dos alunos."
                  />

                  <FeatureCard
                    icon={<Brain size={20} />}
                    title="Sala do Aluno"
                    text="Mapas interativos, progresso, quizzes, tarefas e percurso de aprendizagem."
                  />

                  <FeatureCard
                    icon={<Receipt size={20} />}
                    title="Financeiro do Administrador"
                    text="Comprovantes, mensalidades, descontos, pendências e resumo financeiro."
                  />

                  <FeatureCard
                    icon={<Award size={20} />}
                    title="Certificação"
                    text="Certificados com pontuação, critérios pedagógicos e validação."
                  />
                </div>

                <div className="mt-8 rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-5">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-1 text-cyan-200" size={22} />
                    <p className="text-sm leading-7 text-slate-200">
                      O app será construído como plataforma séria de ensino:
                      conteúdo em ordem pedagógica, gestão de turmas, desempenho
                      dos alunos, progresso dos professores e controle financeiro.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
      <div className="flex gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-cyan-300/10 text-cyan-200">
          {icon}
        </div>

        <div className="min-w-0">
          <h4 className="font-semibold text-white">{title}</h4>
          <p className="mt-1 text-sm leading-6 text-slate-300">{text}</p>
        </div>
      </div>
    </div>
  );
}