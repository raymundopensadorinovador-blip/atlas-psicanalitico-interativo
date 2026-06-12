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

type PaymentReceipt = {
  id: string;
  student_id: string | null;
  class_id: string | null;
  installment_id: string | null;
  financial_code: string | null;
  payer_name: string;
  payer_email: string | null;
  payer_whatsapp: string | null;
  amount_paid: number;
  payment_date: string;
  payment_method: string | null;
  discount_claimed: boolean;
  discount_amount: number;
  notes: string | null;
  receipt_url: string | null;
  status: ReceiptStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
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
  return "Pendente";
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

export default function AdminFinanceiroPage() {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  async function carregarComprovantes() {
    setErro("");

    const { data, error } = await supabase
      .from("payment_receipts")
      .select(
        `
        id,
        student_id,
        class_id,
        installment_id,
        financial_code,
        payer_name,
        payer_email,
        payer_whatsapp,
        amount_paid,
        payment_date,
        payment_method,
        discount_claimed,
        discount_amount,
        notes,
        receipt_url,
        status,
        reviewed_by,
        reviewed_at,
        admin_note,
        created_at
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      setErro(error.message);
      return;
    }

    setReceipts((data ?? []) as PaymentReceipt[]);
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
      await carregarComprovantes();
      setLoading(false);
    }

    iniciar();
  }, [router]);

  async function atualizarStatus(
    receiptId: string,
    status: ReceiptStatus,
    adminNote: string
  ) {
    if (!profile) return;

    setErro("");
    setMensagem("");
    setUpdatingId(receiptId);

    const { error } = await supabase
      .from("payment_receipts")
      .update({
        status,
        reviewed_by: profile.id,
        reviewed_at: new Date().toISOString(),
        admin_note: adminNote,
      })
      .eq("id", receiptId);

    if (error) {
      setErro(error.message);
      setUpdatingId(null);
      return;
    }

    setMensagem(`Comprovante marcado como: ${statusLabel(status)}.`);
    await carregarComprovantes();
    setUpdatingId(null);
  }

  const resumo = useMemo(() => {
    const pendentes = receipts.filter(
      (receipt) => receipt.status === "pending_review"
    );

    const aprovados = receipts.filter((receipt) => receipt.status === "approved");

    const recusados = receipts.filter((receipt) => receipt.status === "rejected");

    const correcao = receipts.filter(
      (receipt) => receipt.status === "needs_correction"
    );

    const totalAprovado = aprovados.reduce(
      (sum, receipt) => sum + Number(receipt.amount_paid || 0),
      0
    );

    const totalPendente = pendentes.reduce(
      (sum, receipt) => sum + Number(receipt.amount_paid || 0),
      0
    );

    return {
      pendentes: pendentes.length,
      aprovados: aprovados.length,
      recusados: recusados.length,
      correcao: correcao.length,
      totalAprovado,
      totalPendente,
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
          href="/admin"
          className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-200"
        >
          <ArrowLeft size={18} />
          Voltar ao painel
        </Link>

        <header className="mt-6 rounded-[2rem] border border-cyan-300/20 bg-white/[0.06] p-6">
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">
            Financeiro do administrador
          </p>

          <h1 className="mt-3 text-3xl font-semibold">
            Comprovantes e recebimentos
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
            Acompanhe comprovantes enviados pelos alunos, aprove pagamentos,
            recuse inconsistências e solicite correções quando necessário.
          </p>
        </header>

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

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            icon={<Wallet size={20} />}
            title="Recebido aprovado"
            value={formatCurrency(resumo.totalAprovado)}
          />

          <SummaryCard
            icon={<Clock size={20} />}
            title="Valor em análise"
            value={formatCurrency(resumo.totalPendente)}
          />

          <SummaryCard
            icon={<Receipt size={20} />}
            title="Pendentes"
            value={String(resumo.pendentes)}
          />

          <SummaryCard
            icon={<CheckCircle2 size={20} />}
            title="Aprovados"
            value={String(resumo.aprovados)}
          />
        </div>

        <section className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.06] p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Comprovantes recebidos</h2>
              <p className="mt-1 text-sm text-slate-300">
                Lista geral de comprovantes enviados para conferência.
              </p>
            </div>

            <button
              type="button"
              onClick={carregarComprovantes}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              <RefreshCw size={16} />
              Atualizar
            </button>
          </div>

          <div className="mt-6 space-y-3">
            {receipts.length === 0 && (
              <div className="rounded-2xl border border-yellow-300/20 bg-yellow-300/10 p-5 text-sm leading-6 text-yellow-100">
                Nenhum comprovante enviado ainda.
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
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusClasses(
                        receipt.status
                      )}`}
                    >
                      {statusLabel(receipt.status)}
                    </div>

                    <h3 className="mt-4 text-lg font-semibold">
                      {receipt.payer_name}
                    </h3>

                    <div className="mt-2 space-y-1 text-sm leading-6 text-slate-300">
                      <p>
                        Código financeiro:{" "}
                        <span className="font-semibold text-cyan-100">
                          {receipt.financial_code ?? "Não informado"}
                        </span>
                      </p>

                      <p>
                        Valor pago:{" "}
                        <span className="font-semibold text-white">
                          {formatCurrency(Number(receipt.amount_paid))}
                        </span>
                      </p>

                      <p>Data do pagamento: {receipt.payment_date}</p>

                      <p>
                        Forma de pagamento:{" "}
                        {receipt.payment_method ?? "Não informada"}
                      </p>

                      {receipt.discount_claimed && (
                        <p>
                          Desconto informado:{" "}
                          {formatCurrency(Number(receipt.discount_amount))}
                        </p>
                      )}

                      {receipt.payer_email && <p>E-mail: {receipt.payer_email}</p>}

                      {receipt.payer_whatsapp && (
                        <p>WhatsApp: {receipt.payer_whatsapp}</p>
                      )}

                      {receipt.notes && <p>Observação: {receipt.notes}</p>}

                      {receipt.admin_note && (
                        <p className="text-cyan-100">
                          Nota administrativa: {receipt.admin_note}
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
      abrir arquivo
    </a>
  </p>
)}

                    </div>
                  </div>

                  <div className="min-w-full rounded-2xl border border-white/10 bg-white/[0.04] p-4 lg:min-w-[280px]">
                    <p className="text-sm font-semibold text-white">
                      Ações administrativas
                    </p>

                    <div className="mt-4 grid gap-2">
                      <button
                        type="button"
                        disabled={updatingId === receipt.id}
                        onClick={() =>
                          atualizarStatus(
                            receipt.id,
                            "approved",
                            "Pagamento aprovado pelo administrador."
                          )
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <CheckCircle2 size={16} />
                        Aprovar
                      </button>

                      <button
                        type="button"
                        disabled={updatingId === receipt.id}
                        onClick={() =>
                          atualizarStatus(
                            receipt.id,
                            "needs_correction",
                            "A administração solicitou correção deste comprovante."
                          )
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-yellow-300 px-4 py-3 text-sm font-semibold text-yellow-950 transition hover:bg-yellow-200 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <RefreshCw size={16} />
                        Pedir correção
                      </button>

                      <button
                        type="button"
                        disabled={updatingId === receipt.id}
                        onClick={() =>
                          atualizarStatus(
                            receipt.id,
                            "rejected",
                            "Comprovante recusado pelo administrador."
                          )
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-400 px-4 py-3 text-sm font-semibold text-red-950 transition hover:bg-red-300 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <XCircle size={16} />
                        Recusar
                      </button>
                    </div>

                    {updatingId === receipt.id && (
                      <p className="mt-3 text-center text-xs text-slate-300">
                        Atualizando...
                      </p>
                    )}
                  </div>
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