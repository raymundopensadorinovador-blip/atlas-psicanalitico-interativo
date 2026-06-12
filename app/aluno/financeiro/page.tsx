"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Receipt,
  RefreshCw,
  Wallet,
  XCircle,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { getCurrentProfile, getDashboardPath, type Profile } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

type ReceiptStatus =
  | "pending_review"
  | "approved"
  | "rejected"
  | "needs_correction";

type PaymentPlan = {
  id: string;
  class_id: string;
  course_id: string;
  financial_code: string;
  plan_type: string;
  total_amount: number;
  discount_amount: number;
  final_amount: number;
  status: string;
  classes: {
    title: string;
    courses: {
      title: string;
    } | null;
  } | null;
};

type PaymentReceipt = {
    id: string;
    class_id: string | null;
    financial_code: string | null;
    payer_name: string;
    amount_paid: number;
    payment_date: string;
    payment_method: string | null;
    discount_claimed: boolean;
    discount_amount: number;
    notes: string | null;
    receipt_url: string | null;
    status: ReceiptStatus;
    admin_note: string | null;
    created_at: string;
  };

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0);
}

function statusLabel(status: ReceiptStatus) {
  if (status === "approved") return "Aprovado";
  if (status === "rejected") return "Recusado";
  if (status === "needs_correction") return "Correção solicitada";
  return "Em análise";
}

function statusClasses(status: ReceiptStatus) {
  if (status === "approved") {
    return "border-emerald-400/30 bg-emerald-500/10 text-emerald-100";
  }

  if (status === "rejected") {
    return "border-red-400/30 bg-red-500/10 text-red-100";
  }

  if (status === "needs_correction") {
    return "border-yellow-300/30 bg-yellow-300/10 text-yellow-100";
  }

  return "border-cyan-300/30 bg-cyan-300/10 text-cyan-100";
}

function statusIcon(status: ReceiptStatus) {
  if (status === "approved") return <CheckCircle2 size={18} />;
  if (status === "rejected") return <XCircle size={18} />;
  if (status === "needs_correction") return <RefreshCw size={18} />;
  return <Clock size={18} />;
}

export default function AlunoFinanceiroPage() {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [paymentPlans, setPaymentPlans] = useState<PaymentPlan[]>([]);
  const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
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

      const { data: plansData, error: plansError } = await supabase
        .from("payment_plans")
        .select(
          `
          id,
          class_id,
          course_id,
          financial_code,
          plan_type,
          total_amount,
          discount_amount,
          final_amount,
          status,
          classes (
            title,
            courses (
              title
            )
          )
        `
        )
        .eq("student_id", loadedProfile.id)
        .order("created_at", { ascending: false });

      if (plansError) {
        setErro(plansError.message);
        setLoading(false);
        return;
      }

      const { data: receiptsData, error: receiptsError } = await supabase
        .from("payment_receipts")
        .select(
          `
          id,
          class_id,
          financial_code,
          payer_name,
          amount_paid,
          payment_date,
          payment_method,
          discount_claimed,
          discount_amount,
          notes,
          receipt_url,
          status,
          admin_note,
          created_at
        `
        )
        .eq("student_id", loadedProfile.id)
        .order("created_at", { ascending: false });

      if (receiptsError) {
        setErro(receiptsError.message);
        setLoading(false);
        return;
      }

      setPaymentPlans((plansData ?? []) as unknown as PaymentPlan[]);
      setReceipts((receiptsData ?? []) as PaymentReceipt[]);
      setLoading(false);
    }

    carregar();
  }, [router]);

  const resumo = useMemo(() => {
    const aprovados = receipts.filter((receipt) => receipt.status === "approved");
    const pendentes = receipts.filter(
      (receipt) => receipt.status === "pending_review"
    );
    const recusados = receipts.filter((receipt) => receipt.status === "rejected");
    const correcao = receipts.filter(
      (receipt) => receipt.status === "needs_correction"
    );

    const totalAprovado = aprovados.reduce(
      (sum, receipt) => sum + Number(receipt.amount_paid || 0),
      0
    );

    const totalEmAnalise = pendentes.reduce(
      (sum, receipt) => sum + Number(receipt.amount_paid || 0),
      0
    );

    return {
      aprovados: aprovados.length,
      pendentes: pendentes.length,
      recusados: recusados.length,
      correcao: correcao.length,
      totalAprovado,
      totalEmAnalise,
    };
  }, [receipts]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#070B14] px-6 text-white">
        <p className="text-sm text-slate-300">Carregando financeiro...</p>
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
            Financeiro do aluno
          </p>

          <h1 className="mt-3 text-3xl font-semibold">
            Meus pagamentos e comprovantes
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
            Acompanhe seus códigos financeiros, comprovantes enviados e status
            de análise da administração.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/comprovante"
              className="rounded-2xl bg-cyan-300 px-5 py-3 text-center text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
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

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            icon={<Wallet size={20} />}
            title="Total aprovado"
            value={formatCurrency(resumo.totalAprovado)}
          />

          <SummaryCard
            icon={<Clock size={20} />}
            title="Em análise"
            value={formatCurrency(resumo.totalEmAnalise)}
          />

          <SummaryCard
            icon={<Receipt size={20} />}
            title="Comprovantes enviados"
            value={String(receipts.length)}
          />

          <SummaryCard
            icon={<CheckCircle2 size={20} />}
            title="Aprovados"
            value={String(resumo.aprovados)}
          />
        </div>

        <section className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.06] p-6">
          <h2 className="text-xl font-semibold">Meus códigos financeiros</h2>
          <p className="mt-1 text-sm text-slate-300">
            Use o código correto ao enviar comprovantes de pagamento.
          </p>

          <div className="mt-6 space-y-3">
            {paymentPlans.length === 0 && (
              <div className="rounded-2xl border border-yellow-300/20 bg-yellow-300/10 p-5 text-sm leading-6 text-yellow-100">
                Nenhum código financeiro encontrado. Entre em uma turma para
                gerar seu código.
              </div>
            )}

            {paymentPlans.map((plan) => (
              <article
                key={plan.id}
                className="rounded-3xl border border-white/10 bg-[#07101D] p-5"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {plan.classes?.title ?? "Turma não encontrada"}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      Curso:{" "}
                      {plan.classes?.courses?.title ?? "Curso não encontrado"}
                    </p>

                    <p className="text-sm leading-6 text-slate-300">
                      Status financeiro: {plan.status}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-cyan-300/10 bg-cyan-300/5 p-4">
                    <p className="text-xs uppercase tracking-[0.25em] text-cyan-300">
                      Código financeiro
                    </p>
                    <strong className="mt-2 block break-all text-lg text-white">
                      {plan.financial_code}
                    </strong>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.06] p-6">
          <h2 className="text-xl font-semibold">Histórico de comprovantes</h2>
          <p className="mt-1 text-sm text-slate-300">
            Aqui aparecem os comprovantes que foram associados ao seu código
            financeiro.
          </p>

          <div className="mt-6 space-y-3">
            {receipts.length === 0 && (
              <div className="rounded-2xl border border-yellow-300/20 bg-yellow-300/10 p-5 text-sm leading-6 text-yellow-100">
                Nenhum comprovante encontrado ainda. Envie um comprovante usando
                seu código financeiro.
              </div>
            )}

            {receipts.map((receipt) => (
              <article
                key={receipt.id}
                className="rounded-3xl border border-white/10 bg-[#07101D] p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${statusClasses(
                        receipt.status
                      )}`}
                    >
                      {statusIcon(receipt.status)}
                      {statusLabel(receipt.status)}
                    </div>

                    <h3 className="mt-4 text-lg font-semibold">
                      {formatCurrency(Number(receipt.amount_paid))}
                    </h3>

                    <div className="mt-2 space-y-1 text-sm leading-6 text-slate-300">
                      <p>Data do pagamento: {receipt.payment_date}</p>
                      <p>
                        Forma de pagamento:{" "}
                        {receipt.payment_method ?? "Não informada"}
                      </p>
                      <p>
                        Código financeiro:{" "}
                        <span className="font-semibold text-cyan-100">
                          {receipt.financial_code ?? "Não informado"}
                        </span>
                      </p>

                      {receipt.discount_claimed && (
                        <p>
                          Desconto informado:{" "}
                          {formatCurrency(Number(receipt.discount_amount))}
                        </p>
                      )}

                      {receipt.notes && <p>Observação: {receipt.notes}</p>}

                      {receipt.admin_note && (
                        <p className="text-cyan-100">
                          Resposta administrativa: {receipt.admin_note}
                        </p>
                      )}

{receipt.receipt_url && (
  <p>
    Comprovante:{" "}
    <a
      href={receipt.receipt_url}
      target="_blank"
      rel="noreferrer"
      className="font-semibold text-cyan-200 underline underline-offset-4"
    >
      abrir arquivo enviado
    </a>
  </p>
)}
                    </div>
                  </div>

                  {receipt.status === "needs_correction" && (
                    <div className="rounded-2xl border border-yellow-300/20 bg-yellow-300/10 p-4 text-sm leading-6 text-yellow-100 lg:max-w-sm">
                      A administração solicitou correção deste comprovante.
                      Envie novamente com as informações ajustadas.
                    </div>
                  )}

                  {receipt.status === "rejected" && (
                    <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm leading-6 text-red-100 lg:max-w-sm">
                      Este comprovante foi recusado. Confira os dados ou entre
                      em contato com a administração.
                    </div>
                  )}

                  {receipt.status === "approved" && (
                    <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm leading-6 text-emerald-100 lg:max-w-sm">
                      Pagamento aprovado pela administração.
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
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