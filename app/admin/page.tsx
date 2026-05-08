"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
      {/* Header */}
      <header style={{ borderBottom: "1px solid #1E1E24", padding: "16px 40px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
          <h1 style={{ color: "#C8A96E", fontFamily: "Georgia, serif", fontSize: "20px" }}>◆ Platform Admin</h1>
          <nav style={{ display: "flex", gap: "8px" }}>
            {["Dashboard", "Encomendas", "Clientes", "Mensagens"].map((item) => (
              <a key={item} href={item === "Encomendas" ? "/admin/orders" : "#"}
                style={{ padding: "6px 16px", borderRadius: "8px", fontSize: "13px", color: "#7A7A85", textDecoration: "none", background: "transparent" }}>
                {item}
              </a>
            ))}
          </nav>
        </div>
        <button onClick={async () => { await supabase.auth.signOut(); router.push("/login"); }}
          style={{ color: "#7A7A85", fontSize: "12px", background: "none", border: "none", cursor: "pointer" }}>
          Sair
        </button>
      </header>

      <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "48px 40px" }}>
        <div style={{ marginBottom: "40px" }}>
          <h2 style={{ fontFamily: "Georgia, serif", fontSize: "28px", marginBottom: "8px" }}>Dashboard Admin</h2>
          <p style={{ color: "#7A7A85" }}>Bem-vindo, {profile?.full_name}</p>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "48px" }}>
          {[
            { label: "Total Encomendas", value: orders.length, color: "#F2F2F0" },
            { label: "Pendentes", value: orders.filter(o => o.status === "pending").length, color: "#F59E0B" },
            { label: "Em Trânsito", value: orders.filter(o => o.status === "in_transit").length, color: "#60A5FA" },
            { label: "Clientes", value: clients.length, color: "#C8A96E" },
          ].map((stat) => (
            <div key={stat.label} style={{ background: "#111113", border: "1px solid #1E1E24", borderRadius: "16px", padding: "24px" }}>
              <div style={{ color: "#7A7A85", fontSize: "11px", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "12px" }}>{stat.label}</div>
              <div style={{ fontSize: "36px", fontWeight: "700", color: stat.color }}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Encomendas recentes */}
        <div style={{ marginBottom: "48px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
            <h3 style={{ fontFamily: "Georgia, serif", fontSize: "20px" }}>Encomendas Recentes</h3>
            <a href="/admin/orders/new" style={{ background: "#C8A96E", color: "#0A0A0B", padding: "8px 20px", borderRadius: "10px", fontSize: "13px", fontWeight: "600", textDecoration: "none" }}>
              + Nova Encomenda
            </a>
          </div>

          {orders.length === 0 ? (
            <div style={{ background: "#111113", border: "1px solid #1E1E24", borderRadius: "16px", padding: "40px", textAlign: "center", color: "#7A7A85" }}>
              Sem encomendas ainda
            </div>
          ) : (
            <div style={{ background: "#111113", border: "1px solid #1E1E24", borderRadius: "16px", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #1E1E24" }}>
                    {["Nº Encomenda", "Cliente", "Produto", "Total", "Estado", "Acções"].map((h) => (
                      <th key={h} style={{ padding: "14px 20px", textAlign: "left", fontSize: "11px", color: "#7A7A85", textTransform: "uppercase", letterSpacing: "1px" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} style={{ borderBottom: "1px solid #17171A" }}>
                      <td style={{ padding: "16px 20px", fontSize: "13px", fontFamily: "monospace", color: "#C8A96E" }}>{order.order_number}</td>
                      <td style={{ padding: "16px 20px", fontSize: "13px" }}>{order.profiles?.full_name || "-"}</td>
                      <td style={{ padding: "16px 20px", fontSize: "13px", color: "#7A7A85" }}>{order.product_name}</td>
                      <td style={{ padding: "16px 20px", fontSize: "13px", fontFamily: "monospace" }}>€{order.total_price_eur}</td>
                      <td style={{ padding: "16px 20px" }}>
                        <span style={{ padding: "4px 12px", borderRadius: "100px", fontSize: "12px", background: `${statusLabel[order.status]?.color}20`, color: statusLabel[order.status]?.color }}>
                          {statusLabel[order.status]?.label}
                        </span>
                      </td>
                      <td style={{ padding: "16px 20px" }}>
                        <a href={`/admin/orders/${order.id}`} style={{ color: "#C8A96E", fontSize: "13px", textDecoration: "none" }}>Ver →</a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Clientes */}
        <div>
          <h3 style={{ fontFamily: "Georgia, serif", fontSize: "20px", marginBottom: "20px" }}>Clientes</h3>
          <div style={{ background: "#111113", border: "1px solid #1E1E24", borderRadius: "16px", overflow: "hidden" }}>
            {clients.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#7A7A85" }}>Sem clientes ainda</div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #1E1E24" }}>
                    {["Nome", "Email", "Desde"].map((h) => (
                      <th key={h} style={{ padding: "14px 20px", textAlign: "left", fontSize: "11px", color: "#7A7A85", textTransform: "uppercase", letterSpacing: "1px" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client) => (
                    <tr key={client.id} style={{ borderBottom: "1px solid #17171A" }}>
                      <td style={{ padding: "16px 20px", fontSize: "13px" }}>{client.full_name}</td>
                      <td style={{ padding: "16px 20px", fontSize: "13px", color: "#7A7A85" }}>{client.email}</td>
                      <td style={{ padding: "16px 20px", fontSize: "13px", color: "#7A7A85" }}>{new Date(client.created_at).toLocaleDateString("pt-PT")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}