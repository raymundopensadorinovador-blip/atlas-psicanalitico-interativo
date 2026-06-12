"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function CadastroPage() {
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);

  function emailValido(valor: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor.trim());
  }

  async function handleCadastro(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro("");
    setMensagem("");

    const nomeLimpo = nome.trim();
    const emailLimpo = email.trim().toLowerCase();

    if (!nomeLimpo) {
      setErro("Informe seu nome.");
      return;
    }

    if (!emailValido(emailLimpo)) {
      setErro("Informe um e-mail válido.");
      return;
    }

    if (senha.length < 6) {
      setErro("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    setEnviando(true);

    const { data, error } = await supabase.auth.signUp({
      email: emailLimpo,
      password: senha,
    });

    if (error) {
      setEnviando(false);
      setErro(error.message);
      return;
    }

    const userId = data.user?.id;

    if (!userId) {
      setEnviando(false);
      setErro("Não foi possível criar o usuário.");
      return;
    }

    const { error: profileError } = await supabase.from("profiles").insert({
      user_id: userId,
      name: nomeLimpo,
      email: emailLimpo,
      role,
    });

    if (profileError) {
      setEnviando(false);
      setErro(profileError.message);
      return;
    }

    setMensagem("Cadastro criado com sucesso. Você já pode entrar.");
    setEnviando(false);

    setTimeout(() => {
      router.push("/login");
    }, 900);
  }

  return (
    <main className="min-h-screen bg-[#070B14] px-6 py-8 text-white">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center justify-center">
        <div className="w-full max-w-xl rounded-[2rem] border border-cyan-300/20 bg-white/[0.06] p-6 shadow-2xl shadow-cyan-950/30 backdrop-blur md:p-8">
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">
            Atlas Psicanalítico
          </p>

          <h1 className="mt-3 text-3xl font-semibold">
            Criar acesso
          </h1>

          <p className="mt-3 text-sm leading-7 text-slate-300">
            Crie sua conta para acessar a plataforma como aluno ou professor.
            O perfil de administrador será definido diretamente no banco por
            segurança.
          </p>

          <form onSubmit={handleCadastro} className="mt-8 space-y-5">
            <div>
              <label className="text-sm font-medium text-slate-200">
                Nome completo
              </label>
              <input
                value={nome}
                onChange={(event) => setNome(event.target.value)}
                required
                disabled={enviando}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300"
                placeholder="Seu nome"
                autoComplete="name"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-200">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                disabled={enviando}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300"
                placeholder="seuemail@exemplo.com"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-200">
                Senha
              </label>
              <div className="mt-2 flex rounded-2xl border border-white/10 bg-white/10 focus-within:border-cyan-300">
                <input
                  type={mostrarSenha ? "text" : "password"}
                  value={senha}
                  onChange={(event) => setSenha(event.target.value)}
                  required
                  disabled={enviando}
                  className="min-w-0 flex-1 bg-transparent px-4 py-3 text-white outline-none placeholder:text-slate-500"
                  placeholder="Mínimo de 6 caracteres"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha((valor) => !valor)}
                  className="px-4 text-slate-300 hover:text-white"
                  aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                >
                  {mostrarSenha ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-200">
                Tipo de acesso
              </label>
              <select
                value={role}
                onChange={(event) =>
                  setRole(event.target.value as "student" | "teacher")
                }
                disabled={enviando}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-[#111827] px-4 py-3 text-white outline-none transition focus:border-cyan-300"
              >
                <option value="student">Aluno</option>
                <option value="teacher">Professor</option>
              </select>
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
              {enviando ? "Criando conta..." : "Criar conta"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-300">
            Já tem conta?{" "}
            <Link href="/login" className="font-semibold text-cyan-200">
              Entrar
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}