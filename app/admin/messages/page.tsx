"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function AdminMessagesPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data } = await supabase
        .from("conversations")
        .select("*, profiles(full_name, email)")
        .order("last_message_at", { ascending: false });
      setConversations(data || []);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0A0A0B" }}>
      <div style={{ color: "#C8A96E" }}>A carregar...</div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0B", color: "#F2F2F0", fontFamily: "sans-serif" }}>
      <header style={{ borderBottom: "1px solid #1E1E24", padding: "16px 40px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h1 style={{ color: "#C8A96E", fontFamily: "Georgia, serif", fontSize: "20px" }}>◆ Platform Admin</h1>
        <a href="/admin" style={{ color: "#7A7A85", fontSize: "13px", textDecoration: "none" }}>← Dashboard</a>
      </header>

      <main style={{ maxWidth: "700px", margin: "0 auto", padding: "48px 40px" }}>
        <h2 style={{ fontFamily: "Georgia, serif", fontSize: "28px", marginBottom: "32px" }}>Mensagens dos Clientes</h2>

        {conversations.length === 0 ? (
          <div style={{ background: "#111113", border: "1px solid #1E1E24", borderRadius: "16px", padding: "60px", textAlign: "center", color: "#7A7A85" }}>
            Sem mensagens ainda
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {conversations.map((conv) => (
              <a key={conv.id} href={`/admin/messages/${conv.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                <div style={{ background: "#111113", border: "1px solid #1E1E24", borderRadius: "14px", padding: "18px 24px", display: "flex", alignItems: "center", gap: "16px", cursor: "pointer" }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = "#C8A96E")}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = "#1E1E24")}>
                  <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "#C8A96E20", border: "1px solid #C8A96E40", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", flexShrink: 0 }}>
                    {conv.profiles?.full_name?.[0] || "?"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: "600", marginBottom: "2px" }}>{conv.profiles?.full_name}</div>
                    <div style={{ fontSize: "13px", color: "#7A7A85" }}>{conv.subject}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ padding: "3px 10px", borderRadius: "100px", fontSize: "11px", background: conv.status === "open" ? "#2ECC8F20" : "#7A7A8520", color: conv.status === "open" ? "#2ECC8F" : "#7A7A85" }}>
                      {conv.status === "open" ? "Aberto" : "Resolvido"}
                    </span>
                    <div style={{ fontSize: "11px", color: "#7A7A85", marginTop: "4px" }}>
                      {conv.last_message_at ? new Date(conv.last_message_at).toLocaleString("pt-PT") : ""}
                    </div>
                  </div>
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