"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data: prof } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (!prof || prof.role !== "admin") { router.push("/dashboard"); return; }
      setProfile(prof);
      const { data: ords } = await supabase.from("orders").select("*, profiles(full_name, email)").order("created_at", { ascending: false });
      setOrders(ords || []);
      const { data: cls } = await supabase.from("profiles").select("*").eq("role", "client").order("created_at", { ascending: false });
      setClients(cls || []);
      setLoading(false);
    }
    load();
  }, []);

  const statusLabel: any = {
    pending: { label: "Pendente", color: "#7A7A85" },
    paid: { label: "Pago", color: "#60A5FA" },
    purchased: { label: "Comprado", color: "#C8A96E" },
    in_warehouse: { label: "Em Armazém", color: "#F59E0B" },
    shipped: { label: "Enviado", color: "#F59E0B" },
    in_transit: { label: "Em Trânsito", color: "#60A5FA" },
    delivered: { label: "Entregue", color: "#2ECC8F" },
    cancelled: { label: "Cancelado", color: "#EF4444" },
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0A0A0B" }}>
      <div style={{ color: "#C8A96E" }}>A carregar...</div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0B", color: "#F2F2F0", fontFamily: "sans-serif" }}>
      {/* Header Mobile-friendly */}
      <header style={{ borderBottom: "1px solid #1E1E24", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h1 style={{ color: "#C8A96E", fontFamily: "Georgia, serif", fontSize: "18px" }}>◆ Admin</h1>
        <button onClick={() => setMenuOpen(!menuOpen)}
          style={{ background: "none", border: "1px solid #2A2A32", borderRadius: "8px", color: "#F2F2F0", padding: "8px 12px", cursor: "pointer", fontSize: "18px" }}>
          ☰
        </button>
      </header>

      {/* Menu dropdown mobile */}
      {menuOpen && (
        <div style={{ background: "#111113", border: "1px solid #1E1E24", margin: "0 20px", borderRadius: "12px", padding: "8px", marginBottom: "8px" }}>
          {[
            { label: "Dashboard", href: "/admin" },
            { label: "Nova Encomenda", href: "/admin/orders/new" },
            { label: "Mensagens", href: "/admin/messages" },
          ].map(item => (
            <a key={item.label} href={item.href} style={{ display: "block", padding: "12px 16px", color: "#F2F2F0", textDecoration: "none", borderRadius: "8px", fontSize: "14px" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#1E1E24")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
              {item.label}
            </a>
          ))}
          <button onClick={async () => { await supabase.auth.signOut(); router.push("/login"); }}
            style={{ width: "100%", padding: "12px 16px", color: "#EF4444", background: "none", border: "none", textAlign: "left", cursor: "pointer", fontSize: "14px", borderRadius: "8px" }}>
            Sair
          </button>
        </div>
      )}

      <main style={{ padding: "24px 20px", maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ marginBottom: "28px" }}>
          <h2 style={{ fontFamily: "Georgia, serif", fontSize: "24px", marginBottom: "4px" }}>Dashboard</h2>
          <p style={{ color: "#7A7A85", fontSize: "14px" }}>Bem-vindo, {profile?.full_name}</p>
        </div>

        {/* Stats — 2x2 no mobile */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "32px" }}>
          {[
            { label: "Total Encomendas", value: orders.length, color: "#F2F2F0" },
            { label: "Pendentes", value: orders.filter(o => o.status === "pending").length, color: "#F59E0B" },
            { label: "Em Trânsito", value: orders.filter(o => o.status === "in_transit").length, color: "#60A5FA" },
            { label: "Clientes", value: clients.length, color: "#C8A96E" },
          ].map((stat) => (
            <div key={stat.label} style={{ background: "#111113", border: "1px solid #1E1E24", borderRadius: "14px", padding: "20px 16px" }}>
              <div style={{ color: "#7A7A85", fontSize: "10px", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>{stat.label}</div>
              <div style={{ fontSize: "32px", fontWeight: "700", color: stat.color }}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Encomendas */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <h3 style={{ fontFamily: "Georgia, serif", fontSize: "18px" }}>Encomendas</h3>
            <a href="/admin/orders/new" style={{ background: "#C8A96E", color: "#0A0A0B", padding: "8px 16px", borderRadius: "10px", fontSize: "13px", fontWeight: "600", textDecoration: "none" }}>
              + Nova
            </a>
          </div>

          {orders.length === 0 ? (
            <div style={{ background: "#111113", border: "1px solid #1E1E24", borderRadius: "14px", padding: "40px", textAlign: "center", color: "#7A7A85" }}>
              Sem encomendas ainda
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {orders.map((order) => {
                const s = statusLabel[order.status];
                return (
                  <a key={order.id} href={`/admin/orders/${order.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                    <div style={{ background: "#111113", border: "1px solid #1E1E24", borderRadius: "14px", padding: "16px" }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = "#C8A96E")}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = "#1E1E24")}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                        <span style={{ fontFamily: "monospace", fontSize: "12px", color: "#C8A96E" }}>{order.order_number}</span>
                        <span style={{ padding: "3px 10px", borderRadius: "100px", fontSize: "11px", background: `${s?.color}20`, color: s?.color }}>{s?.label}</span>
                      </div>
                      <div style={{ fontWeight: "600", marginBottom: "4px" }}>{order.product_name}</div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "13px", color: "#7A7A85" }}>{order.profiles?.full_name}</span>
                        <span style={{ fontFamily: "monospace", color: "#C8A96E", fontWeight: "600" }}>€{parseFloat(order.total_price_eur).toFixed(2)}</span>
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </div>

        {/* Clientes */}
        <div>
          <h3 style={{ fontFamily: "Georgia, serif", fontSize: "18px", marginBottom: "16px" }}>Clientes</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {clients.length === 0 ? (
              <div style={{ background: "#111113", border: "1px solid #1E1E24", borderRadius: "14px", padding: "40px", textAlign: "center", color: "#7A7A85" }}>
                Sem clientes ainda
              </div>
            ) : (
              clients.map((client) => (
                <div key={client.id} style={{ background: "#111113", border: "1px solid #1E1E24", borderRadius: "14px", padding: "16px" }}>
                  <div style={{ fontWeight: "600", marginBottom: "4px" }}>{client.full_name}</div>
                  <div style={{ fontSize: "13px", color: "#7A7A85" }}>{client.email}</div>
                  <div style={{ fontSize: "11px", color: "#55555E", marginTop: "4px" }}>{new Date(client.created_at).toLocaleDateString("pt-PT")}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}