"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Receipt } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function ComprovantePage() {
  const [financialCode, setFinancialCode] = useState("");
  const [payerName, setPayerName] = useState("");
  const [payerEmail, setPayerEmail] = useState("");
  const [payerWhatsapp, setPayerWhatsapp] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [discountClaimed, setDiscountClaimed] = useState(false);
  const [discountAmount, setDiscountAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  async function handleEnviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro("");
    setMensagem("");

    const codigo = financialCode.trim();
    const nome = payerName.trim();
    const valor = Number(amountPaid.replace(",", "."));
    const desconto = Number(discountAmount.replace(",", ".")) || 0;

    if (!codigo) {
      setErro("Informe o código financeiro ou código da turma.");
      return;
    }

    if (!nome) {
      setErro("Informe o nome de quem realizou o pagamento.");
      return;
    }

    if (!valor || valor <= 0) {
      setErro("Informe um valor pago válido.");
      return;
    }

    if (!paymentDate) {
      setErro("Informe a data do pagamento.");
      return;
    }

    if (!receiptFile) {
      setErro("Anexe o comprovante de pagamento.");
      return;
    }
    
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    
    if (!allowedTypes.includes(receiptFile.type)) {
      setErro("Envie um arquivo em JPG, PNG, WEBP ou PDF.");
      return;
    }
    
    const maxSizeInMb = 8;
    const maxSizeInBytes = maxSizeInMb * 1024 * 1024;
    
    if (receiptFile.size > maxSizeInBytes) {
      setErro(`O arquivo precisa ter no máximo ${maxSizeInMb}MB.`);
      return;
    }

    setEnviando(true);

    const { data: paymentPlan } = await supabase
    .from("payment_plans")
    .select("id, student_id, class_id")
    .eq("financial_code", codigo)
    .maybeSingle();
  
  let installmentId: string | null = null;
  
  if (paymentPlan) {
    const { data: installment } = await supabase
      .from("payment_installments")
      .select("id")
      .eq("payment_plan_id", paymentPlan.id)
      .order("due_date", { ascending: true })
      .limit(1)
      .maybeSingle();
  
    installmentId = installment?.id ?? null;
  }
  
  const fileExtension = receiptFile.name.split(".").pop()?.toLowerCase() || "file";
const safeCode = codigo.replace(/[^a-zA-Z0-9-_]/g, "-");
const fileName = `${safeCode}/${Date.now()}-${crypto.randomUUID()}.${fileExtension}`;

const { error: uploadError } = await supabase.storage
  .from("payment-receipts")
  .upload(fileName, receiptFile, {
    cacheControl: "3600",
    upsert: false,
  });

if (uploadError) {
  setEnviando(false);
  setErro(uploadError.message);
  return;
}

const { data: publicUrlData } = supabase.storage
  .from("payment-receipts")
  .getPublicUrl(fileName);

const { error } = await supabase.from("payment_receipts").insert({
  student_id: paymentPlan?.student_id ?? null,
  class_id: paymentPlan?.class_id ?? null,
  installment_id: installmentId,
  financial_code: codigo,
  payer_name: nome,
  payer_email: payerEmail.trim() || null,
  payer_whatsapp: payerWhatsapp.trim() || null,
  amount_paid: valor,
  payment_date: paymentDate,
  payment_method: paymentMethod,
  discount_claimed: discountClaimed,
  discount_amount: discountClaimed ? desconto : 0,
  notes: notes.trim() || null,
  receipt_url: publicUrlData.publicUrl,
  status: "pending_review",
});

    if (error) {
      setEnviando(false);
      setErro(error.message);
      return;
    }

    setMensagem(
      "Comprovante registrado. A administração fará a conferência do pagamento."
    );

    setFinancialCode("");
    setPayerName("");
    setPayerEmail("");
    setPayerWhatsapp("");
    setAmountPaid("");
    setPaymentDate("");
    setPaymentMethod("pix");
    setDiscountClaimed(false);
    setDiscountAmount("");
    setNotes("");
    setReceiptFile(null);
    setEnviando(false);
  }

  return (
    <main className="min-h-screen bg-[#070B14] px-6 py-8 text-white">
      <section className="mx-auto w-full max-w-3xl">
        <Link href="/" className="text-sm font-semibold text-cyan-200">
          ← Voltar para início
        </Link>

        <div className="mt-8 rounded-[2rem] border border-cyan-300/20 bg-white/[0.06] p-6 shadow-2xl shadow-cyan-950/30 backdrop-blur md:p-8">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-cyan-300/10 p-3 text-cyan-200">
              <Receipt size={28} />
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">
                Financeiro
              </p>

              <h1 className="mt-3 text-3xl font-semibold">
                Enviar comprovante
              </h1>

              <p className="mt-3 text-sm leading-7 text-slate-300">
                Informe o código financeiro recebido, os dados do pagamento e
                envie as informações para conferência da administração.
              </p>
            </div>
          </div>

          <form onSubmit={handleEnviar} className="mt-8 space-y-5">
            <div>
              <label className="text-sm font-medium text-slate-200">
                Código financeiro ou código da turma
              </label>
              <input
                value={financialCode}
                onChange={(event) => setFinancialCode(event.target.value)}
                required
                disabled={enviando}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300"
                placeholder="Ex: API-2026-000123"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-200">
                Nome de quem pagou
              </label>
              <input
                value={payerName}
                onChange={(event) => setPayerName(event.target.value)}
                required
                disabled={enviando}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300"
                placeholder="Nome completo"
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-200">
                  E-mail
                </label>
                <input
                  type="email"
                  value={payerEmail}
                  onChange={(event) => setPayerEmail(event.target.value)}
                  disabled={enviando}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300"
                  placeholder="opcional"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-200">
                  WhatsApp
                </label>
                <input
                  value={payerWhatsapp}
                  onChange={(event) => setPayerWhatsapp(event.target.value)}
                  disabled={enviando}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300"
                  placeholder="opcional"
                />
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-200">
                  Valor pago
                </label>
                <input
                  value={amountPaid}
                  onChange={(event) => setAmountPaid(event.target.value)}
                  required
                  disabled={enviando}
                  inputMode="decimal"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300"
                  placeholder="Ex: 150,00"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-200">
                  Data do pagamento
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(event) => setPaymentDate(event.target.value)}
                  required
                  disabled={enviando}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition focus:border-cyan-300"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-200">
                Forma de pagamento
              </label>
              <select
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value)}
                disabled={enviando}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-[#111827] px-4 py-3 text-white outline-none transition focus:border-cyan-300"
              >
                <option value="pix">Pix</option>
                <option value="transferencia">Transferência</option>
                <option value="dinheiro">Dinheiro</option>
                <option value="cartao">Cartão</option>
                <option value="outro">Outro</option>
              </select>
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-200">
              <input
                type="checkbox"
                checked={discountClaimed}
                onChange={(event) => setDiscountClaimed(event.target.checked)}
                disabled={enviando}
                className="mt-1"
              />
              <span>Tenho desconto combinado com a administração.</span>
            </label>

            {discountClaimed && (
              <div>
                <label className="text-sm font-medium text-slate-200">
                  Valor do desconto
                </label>
                <input
                  value={discountAmount}
                  onChange={(event) => setDiscountAmount(event.target.value)}
                  disabled={enviando}
                  inputMode="decimal"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300"
                  placeholder="Ex: 50,00"
                />
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-slate-200">
                Observações
              </label>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                disabled={enviando}
                rows={4}
                className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300"
                placeholder="Ex: pagamento referente à mensalidade de junho"
              />
            </div>

            <div>
  <label className="text-sm font-medium text-slate-200">
    Arquivo do comprovante
  </label>

  <input
    type="file"
    accept="image/jpeg,image/png,image/webp,application/pdf"
    onChange={(event) => setReceiptFile(event.target.files?.[0] ?? null)}
    disabled={enviando}
    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none file:mr-4 file:rounded-xl file:border-0 file:bg-cyan-300 file:px-4 file:py-2 file:font-semibold file:text-slate-950 hover:file:bg-cyan-200"
  />

  <p className="mt-2 text-xs leading-5 text-slate-400">
    Formatos aceitos: JPG, PNG, WEBP ou PDF. Tamanho máximo: 8MB.
  </p>

  {receiptFile && (
    <div className="mt-3 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-3 text-sm text-cyan-100">
      Arquivo selecionado: {receiptFile.name}
    </div>
  )}
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
              className="w-full rounded-2xl bg-cyan-300 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {enviando ? "Enviando..." : "Registrar comprovante"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}