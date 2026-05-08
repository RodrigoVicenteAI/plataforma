"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError("Erro ao criar conta. Tenta novamente.");
      setLoading(false);
      return;
    }

    if (data.user) {
      await supabase.from("profiles").insert({
        id: data.user.id,
        full_name: fullName,
        email: email,
        role: "client",
      });

      router.push("/dashboard");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-serif text-[#C8A96E] mb-2">◆ Platform</h1>
          <p className="text-[#7A7A85] text-sm">Cria a tua conta</p>
        </div>

        <div className="bg-[#111113] border border-[#1E1E24] rounded-2xl p-8">
          <form onSubmit={handleRegister} className="flex flex-col gap-5">
            <div>
              <label className="text-xs text-[#7A7A85] uppercase tracking-widest mb-2 block">
                Nome completo
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full bg-[#17171A] border border-[#2A2A32] rounded-xl px-4 py-3 text-sm text-[#F2F2F0] outline-none focus:border-[#C8A96E] transition-colors"
                placeholder="O teu nome"
              />
            </div>
            <div>
              <label className="text-xs text-[#7A7A85] uppercase tracking-widest mb-2 block">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[#17171A] border border-[#2A2A32] rounded-xl px-4 py-3 text-sm text-[#F2F2F0] outline-none focus:border-[#C8A96E] transition-colors"
                placeholder="o.teu@email.com"
              />
            </div>
            <div>
              <label className="text-xs text-[#7A7A85] uppercase tracking-widest mb-2 block">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full bg-[#17171A] border border-[#2A2A32] rounded-xl px-4 py-3 text-sm text-[#F2F2F0] outline-none focus:border-[#C8A96E] transition-colors"
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            {error && (
              <p className="text-[#EF4444] text-sm text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#C8A96E] text-[#0A0A0B] font-semibold py-3 rounded-xl text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "A criar conta..." : "Criar conta →"}
            </button>
          </form>

          <p className="text-center text-[#7A7A85] text-sm mt-6">
            Já tens conta?{" "}
            <a href="/login" className="text-[#C8A96E] hover:underline">
              Entra aqui
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}