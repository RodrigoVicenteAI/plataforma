"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("Email ou password incorrectos.");
      setLoading(false);
      return;
    }

    // Verificar role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    if (profile?.role === "admin") {
      router.push("/admin");
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-serif text-[#C8A96E] mb-2">◆ Platform</h1>
          <p className="text-[#7A7A85] text-sm">Acede à tua conta</p>
        </div>

        <div className="bg-[#111113] border border-[#1E1E24] rounded-2xl p-8">
          <form onSubmit={handleLogin} className="flex flex-col gap-5">
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
                className="w-full bg-[#17171A] border border-[#2A2A32] rounded-xl px-4 py-3 text-sm text-[#F2F2F0] outline-none focus:border-[#C8A96E] transition-colors"
                placeholder="••••••••"
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
              {loading ? "A entrar..." : "Entrar →"}
            </button>
          </form>

          <p className="text-center text-[#7A7A85] text-sm mt-6">
            Não tens conta?{" "}
            <a href="/register" className="text-[#C8A96E] hover:underline">
              Regista-te
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}