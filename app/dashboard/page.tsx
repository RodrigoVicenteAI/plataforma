"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  const statusOptions: any = {
    pending: { label: "Pendente", color: "#7A7A85", icon: "⏳" },
    paid: { label: "Pago", color: "#60A5FA", icon: "✓" },
    purchased: { label: "Comprado", color: "#C8A96E", icon: "🛒" },
    in_warehouse: { label: "Em Armazém", color: "#F59E0B", icon: "🏭" },
    shipped: { label: "Enviado", color: "#F59E0B", icon: "📦" },
    in_transit: { label: "Em Trânsito", color: "#60A5FA", icon: "✈️" },
    delivered: { label: "Entregue", color: "#2ECC8F", icon: "✅" },
    cancelled: { label: "Cancelado", color: "#EF4444", icon: "✕" },
  };

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data: prof } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      setProfile(prof);
      const { data: ords } = await supabase.from("orders").select("*").eq("client_id", user.id).order("created_at", { ascending: false });
      setOrders(ords || []);

      // Contar mensagens não lidas
      const { data: convs } = await supabase.from("conversations").select("id").eq("client_id", user.id);
      if (convs && convs.length > 0) {
        const convIds = convs.map((c: any) => c.id);
        const { count } = await supabase.from("messages").select("*", { count: "exact", head: true })
          .in("conversation_id", convIds).eq("sender_role", "admin").is("read_at", null);
        setUnreadMessages(count || 0);
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0A0A0B" }}>
      <div style={{ color: "#C8A96E", fontFamily: "sans-serif" }}>A carregar...</div>
    </div>
  );

  const active = orders.filter(o => o.status !== "delivered" && o.status !== "cancelled");
  const delivered = orders.filter(o => o.status === "delivered");
  const inTransit = orders.filter(o => o.status === "in_transit");

  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0B", color: "#F2F2F0", fontFamily: "sans-serif" }}>
      {/* Header */}
      <header style={{ borderBottom: "1px solid #1E1E24", padding: "16px 40px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h1 style={{ color: "#C8A96E", fontFamily: "Georgia, serif", fontSize: "20px" }}>◆ Platform</h1>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <a href="/messages" style={{ position: "relative", padding: "8px 16px", borderRadius: "10px", background: unreadMessages > 0 ? "#C8A96E20" : "transparent", border: `1px solid ${unreadMessages > 0 ? "#C8A96E40" : "#2A2A32"}`, color: unreadMessages > 0 ? "#C8A96E" : "#7A7A85", fontSize: "13px", textDecoration: "none", display: "flex", alignItems: "center", gap: "6px" }}>
            💬 Mensagens
            {unreadMessages > 0 && (
              <span style={{ background: "#C8A96E", color: "#0A0A0B", borderRadius: "100px", fontSize: "10px", fontWeight: "700", padding: "1px 6px" }}>{unreadMessages}</span>
            )}
          </a>
          <span style={{ color: "#7A7A85", fontSize: "14px", marginLeft: "8px" }}>Olá, {profile?.full_name?.split(" ")[0]}</span>
          <button onClick={async () => { await supabase.auth.signOut(); router.push("/login"); }}
            style={{ color: "#7A7A85", fontSize: "12px", background: "none", border: "none", cursor: "pointer", marginLeft: "4px" }}>Sair</button>
        </div>
      </header>

      <main style={{ maxWidth: "1000px", margin: "0 auto", padding: "48px 40px" }}>
        {/* Boas vindas */}
        <div style={{ marginBottom: "40px" }}>
          <h2 style={{ fontFamily: "Georgia, serif", fontSize: "32px", marginBottom: "8px" }}>Bem-vindo, {profile?.full_name?.split(" ")[0]} 👋</h2>
          <p style={{ color: "#7A7A85" }}>Acompanha as tuas encomendas em tempo real</p>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "40px" }}>
          {[
            { label: "Encomendas Ativas", value: active.length, color: "#F2F2F0", bg: "#17171A" },
            { label: "Em Trânsito", value: inTransit.length, color: "#F59E0B", bg: "#F59E0B15" },
            { label: "Entregues", value: delivered.length, color: "#2ECC8F", bg: "#2ECC8F15" },
          ].map((stat) => (
            <div key={stat.label} style={{ background: stat.bg, border: "1px solid #1E1E24", borderRadius: "16px", padding: "24px" }}>
              <div style={{ color: "#7A7A85", fontSize: "11px", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "12px" }}>{stat.label}</div>
              <div style={{ fontSize: "36px", fontWeight: "700", color: stat.color }}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Banner pedir produto */}
        <div style={{ background: "linear-gradient(135deg, #C8A96E15, #C8A96E05)", border: "1px solid #C8A96E30", borderRadius: "16px", padding: "24px 32px", marginBottom: "32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: "18px", marginBottom: "4px" }}>Queres encomendar algo?</div>
            <div style={{ fontSize: "13px", color: "#7A7A85" }}>Fala connosco e tratamos de tudo por ti</div>
          </div>
          <a href="/messages" style={{ background: "#C8A96E", color: "#0A0A0B", padding: "12px 24px", borderRadius: "12px", fontSize: "14px", fontWeight: "700", textDecoration: "none", whiteSpace: "nowrap" }}>
            Pedir produto →
          </a>
        </div>

        {/* Encomendas */}
        <h3 style={{ fontFamily: "Georgia, serif", fontSize: "20px", marginBottom: "16px" }}>As tuas encomendas</h3>

        {orders.length === 0 ? (
          <div style={{ background: "#111113", border: "1px solid #1E1E24", borderRadius: "20px", padding: "60px 40px", textAlign: "center" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>📦</div>
            <h3 style={{ fontFamily: "Georgia, serif", fontSize: "22px", marginBottom: "8px" }}>Sem encomendas ainda</h3>
            <p style={{ color: "#7A7A85", fontSize: "14px", marginBottom: "24px" }}>Fala connosco para fazeres o teu primeiro pedido</p>
            <a href="/messages" style={{ display: "inline-block", background: "#C8A96E", color: "#0A0A0B", fontWeight: "700", padding: "12px 28px", borderRadius: "12px", fontSize: "14px", textDecoration: "none" }}>
              Fazer pedido
            </a>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {orders.map((order) => {
              const s = statusOptions[order.status];
              return (
                <a key={order.id} href={`/orders/${order.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                  <div style={{ background: "#111113", border: "1px solid #1E1E24", borderRadius: "16px", padding: "20px 24px", display: "flex", alignItems: "center", gap: "16px", cursor: "pointer", transition: "all 0.2s" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "#C8A96E"; e.currentTarget.style.background = "#151515"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "#1E1E24"; e.currentTarget.style.background = "#111113"; }}>
                    <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: `${s?.color}15`, border: `1px solid ${s?.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", flexShrink: 0 }}>
                      {s?.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: "600", fontSize: "15px", marginBottom: "4px" }}>{order.product_name}</div>
                      <div style={{ fontFamily: "monospace", fontSize: "12px", color: "#7A7A85" }}>{order.order_number} · {new Date(order.created_at).toLocaleDateString("pt-PT")}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontFamily: "monospace", color: "#C8A96E", fontSize: "16px", fontWeight: "600", marginBottom: "6px" }}>€{parseFloat(order.total_price_eur).toFixed(2)}</div>
                      <span style={{ padding: "4px 12px", borderRadius: "100px", fontSize: "11px", background: `${s?.color}20`, color: s?.color, border: `1px solid ${s?.color}30` }}>{s?.label}</span>
                    </div>
                    <div style={{ color: "#C8A96E", fontSize: "18px", marginLeft: "8px" }}>→</div>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}