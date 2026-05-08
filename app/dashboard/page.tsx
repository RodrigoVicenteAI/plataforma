"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  const statusOptions: any = {
    pending: { label: "Pendente", color: "#7A7A85" },
    paid: { label: "Pago", color: "#60A5FA" },
    purchased: { label: "Comprado", color: "#C8A96E" },
    in_warehouse: { label: "Em Armazém", color: "#F59E0B" },
    shipped: { label: "Enviado", color: "#F59E0B" },
    in_transit: { label: "Em Trânsito", color: "#60A5FA" },
    delivered: { label: "Entregue", color: "#2ECC8F" },
    cancelled: { label: "Cancelado", color: "#EF4444" },
  };

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data: prof } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      setProfile(prof);
      const { data: ords } = await supabase.from("orders").select("*").eq("client_id", user.id).order("created_at", { ascending: false });
      setOrders(ords || []);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0A0A0B" }}>
      <div style={{ color: "#C8A96E" }}>A carregar...</div>
    </div>
  );

  const active = orders.filter(o => o.status !== "delivered" && o.status !== "cancelled");
  const delivered = orders.filter(o => o.status === "delivered");
  const inTransit = orders.filter(o => o.status === "in_transit");

  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0B", color: "#F2F2F0", fontFamily: "sans-serif" }}>
      <header style={{ borderBottom: "1px solid #1E1E24", padding: "16px 40px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h1 style={{ color: "#C8A96E", fontFamily: "Georgia, serif", fontSize: "20px" }}>◆ Platform</h1>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <span style={{ color: "#7A7A85", fontSize: "14px" }}>Olá, {profile?.full_name}</span>
          <button onClick={async () => { await supabase.auth.signOut(); router.push("/login"); }}
            style={{ color: "#7A7A85", fontSize: "12px", background: "none", border: "none", cursor: "pointer" }}>Sair</button>
        </div>
      </header>

      <main style={{ maxWidth: "1000px", margin: "0 auto", padding: "48px 40px" }}>
        <div style={{ marginBottom: "40px" }}>
          <h2 style={{ fontFamily: "Georgia, serif", fontSize: "32px", marginBottom: "8px" }}>Bem-vindo 👋</h2>
          <p style={{ color: "#7A7A85" }}>O teu painel de encomendas</p>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "40px" }}>
          {[
            { label: "Encomendas Ativas", value: active.length, color: "#F2F2F0" },
            { label: "Em Trânsito", value: inTransit.length, color: "#F59E0B" },
            { label: "Entregues", value: delivered.length, color: "#2ECC8F" },
          ].map((stat) => (
            <div key={stat.label} style={{ background: "#111113", border: "1px solid #1E1E24", borderRadius: "16px", padding: "24px" }}>
              <div style={{ color: "#7A7A85", fontSize: "11px", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "12px" }}>{stat.label}</div>
              <div style={{ fontSize: "32px", fontWeight: "600", color: stat.color }}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Encomendas */}
        <h3 style={{ fontFamily: "Georgia, serif", fontSize: "20px", marginBottom: "16px" }}>As tuas encomendas</h3>

        {orders.length === 0 ? (
          <div style={{ background: "#111113", border: "1px solid #1E1E24", borderRadius: "20px", padding: "80px 40px", textAlign: "center" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>📦</div>
            <h3 style={{ fontFamily: "Georgia, serif", fontSize: "22px", marginBottom: "8px" }}>Sem encomendas ainda</h3>
            <p style={{ color: "#7A7A85", fontSize: "14px" }}>As tuas encomendas aparecerão aqui</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {orders.map((order) => {
              const s = statusOptions[order.status];
              return (
                <a key={order.id} href={`/orders/${order.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                  <div style={{ background: "#111113", border: "1px solid #1E1E24", borderRadius: "16px", padding: "20px 24px", display: "flex", alignItems: "center", gap: "16px", cursor: "pointer", transition: "border-color 0.2s" }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = "#C8A96E")}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = "#1E1E24")}>
                    <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: `${s?.color}20`, border: `1px solid ${s?.color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", flexShrink: 0 }}>📦</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: "600", marginBottom: "4px" }}>{order.product_name}</div>
                      <div style={{ fontFamily: "monospace", fontSize: "12px", color: "#7A7A85" }}>{order.order_number}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontFamily: "monospace", color: "#C8A96E", marginBottom: "4px" }}>€{order.total_price_eur}</div>
                      <span style={{ padding: "3px 10px", borderRadius: "100px", fontSize: "11px", background: `${s?.color}20`, color: s?.color }}>{s?.label}</span>
                    </div>
                    <div style={{ color: "#7A7A85", fontSize: "18px" }}>→</div>
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