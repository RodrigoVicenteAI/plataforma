"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function MessagesPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUser(user);

      const { data } = await supabase
        .from("conversations")
        .select("*")
        .eq("client_id", user.id)
        .order("last_message_at", { ascending: false });
      setConversations(data || []);
      setLoading(false);
    }
    load();
  }, []);

  async function newConversation() {
    const subject = prompt("Assunto da mensagem (ex: Quero encomendar um produto):");
    if (!subject) return;

    const { data } = await supabase.from("conversations").insert({
      client_id: user.id,
      subject,
      status: "open",
      last_message_at: new Date().toISOString(),
    }).select().single();

    if (data) router.push(`/messages/${data.id}`);
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0A0A0B" }}>
      <div style={{ color: "#C8A96E" }}>A carregar...</div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0B", color: "#F2F2F0", fontFamily: "sans-serif" }}>
      <header style={{ borderBottom: "1px solid #1E1E24", padding: "16px 40px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h1 style={{ color: "#C8A96E", fontFamily: "Georgia, serif", fontSize: "20px" }}>◆ Platform</h1>
        <a href="/dashboard" style={{ color: "#7A7A85", fontSize: "13px", textDecoration: "none" }}>← Dashboard</a>
      </header>

      <main style={{ maxWidth: "700px", margin: "0 auto", padding: "48px 40px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px" }}>
          <h2 style={{ fontFamily: "Georgia, serif", fontSize: "28px" }}>Mensagens</h2>
          <button onClick={newConversation}
            style={{ background: "#C8A96E", color: "#0A0A0B", border: "none", borderRadius: "10px", padding: "10px 20px", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}>
            + Nova mensagem
          </button>
        </div>

        {conversations.length === 0 ? (
          <div style={{ background: "#111113", border: "1px solid #1E1E24", borderRadius: "16px", padding: "60px", textAlign: "center" }}>
            <div style={{ fontSize: "40px", marginBottom: "12px" }}>💬</div>
            <h3 style={{ fontFamily: "Georgia, serif", fontSize: "18px", marginBottom: "8px" }}>Sem mensagens ainda</h3>
            <p style={{ color: "#7A7A85", fontSize: "14px", marginBottom: "20px" }}>Fala connosco para pedires um produto ou tirares duvidas</p>
            <button onClick={newConversation}
              style={{ background: "#C8A96E", color: "#0A0A0B", border: "none", borderRadius: "10px", padding: "10px 24px", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}>
              Iniciar conversa
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {conversations.map((conv) => (
              <a key={conv.id} href={`/messages/${conv.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                <div style={{ background: "#111113", border: "1px solid #1E1E24", borderRadius: "14px", padding: "18px 24px", display: "flex", alignItems: "center", gap: "16px", cursor: "pointer" }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = "#C8A96E")}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = "#1E1E24")}>
                  <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "#C8A96E20", border: "1px solid #C8A96E40", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0 }}>💬</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: "600", marginBottom: "4px" }}>{conv.subject}</div>
                    <div style={{ fontSize: "12px", color: "#7A7A85" }}>
                      {conv.last_message_at ? new Date(conv.last_message_at).toLocaleString("pt-PT") : "Sem mensagens"}
                    </div>
                  </div>
                  <span style={{ padding: "3px 10px", borderRadius: "100px", fontSize: "11px", background: conv.status === "open" ? "#2ECC8F20" : "#7A7A8520", color: conv.status === "open" ? "#2ECC8F" : "#7A7A85" }}>
                    {conv.status === "open" ? "Aberto" : "Resolvido"}
                  </span>
                  <div style={{ color: "#7A7A85" }}>→</div>
                </div>
              </a>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}