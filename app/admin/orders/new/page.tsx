"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function NewOrderPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    client_id: "",
    product_name: "",
    quantity: "1",
    unit_price_eur: "",
    tracking_number: "",
    tracking_carrier: "",
    status: "pending",
    payment_status: "unpaid",
    order_type: "catalog",
    client_notes: "",
    admin_notes: "",
  });
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadClients() {
      const { data } = await supabase.from("profiles").select("*").eq("role", "client");
      setClients(data || []);
    }
    loadClients();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const orderNumber = `ORD-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
    const total = parseFloat(form.unit_price_eur) * parseInt(form.quantity);

    const { data, error } = await supabase.from("orders").insert({
      order_number: orderNumber,
      client_id: form.client_id,
      product_name: form.product_name,
      quantity: parseInt(form.quantity),
      unit_price_eur: parseFloat(form.unit_price_eur),
      total_price_eur: total,
      tracking_number: form.tracking_number || null,
      tracking_carrier: form.tracking_carrier || null,
      status: form.status,
      payment_status: form.payment_status,
      order_type: form.order_type,
      client_notes: form.client_notes || null,
      admin_notes: form.admin_notes || null,
    }).select().single();

    if (error) {
      alert("Erro: " + error.message);
      setLoading(false);
      return;
    }

    // Criar entrada na timeline
    await supabase.from("order_timeline").insert({
      order_id: data.id,
      status: form.status,
      title: "Encomenda criada",
      description: "Encomenda criada pelo admin",
      created_by: (await supabase.auth.getUser()).data.user?.id,
    });

    router.push("/admin");
  }

  const inputStyle = {
    width: "100%", background: "#17171A", border: "1px solid #2A2A32",
    borderRadius: "10px", padding: "10px 14px", color: "#F2F2F0",
    fontSize: "14px", outline: "none", fontFamily: "sans-serif"
  };
  const labelStyle = { fontSize: "11px", color: "#7A7A85", textTransform: "uppercase" as const, letterSpacing: "2px", marginBottom: "6px", display: "block" };

  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0B", color: "#F2F2F0", fontFamily: "sans-serif" }}>
      <header style={{ borderBottom: "1px solid #1E1E24", padding: "16px 40px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h1 style={{ color: "#C8A96E", fontFamily: "Georgia, serif", fontSize: "20px" }}>◆ Platform Admin</h1>
        <a href="/admin" style={{ color: "#7A7A85", fontSize: "13px", textDecoration: "none" }}>← Voltar</a>
      </header>

      <main style={{ maxWidth: "800px", margin: "0 auto", padding: "48px 40px" }}>
        <h2 style={{ fontFamily: "Georgia, serif", fontSize: "28px", marginBottom: "8px" }}>Nova Encomenda</h2>
        <p style={{ color: "#7A7A85", marginBottom: "40px" }}>Cria uma encomenda manualmente para um cliente</p>

        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
            {/* Cliente */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Cliente *</label>
              <select required value={form.client_id} onChange={e => setForm({ ...form, client_id: e.target.value })} style={{ ...inputStyle }}>
                <option value="">Selecciona um cliente</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.full_name} — {c.email}</option>)}
              </select>
            </div>

            {/* Produto */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Nome do Produto *</label>
              <input required value={form.product_name} onChange={e => setForm({ ...form, product_name: e.target.value })} style={inputStyle} placeholder="ex: Smartwatch Pro X9" />
            </div>

            {/* Quantidade e Preço */}
            <div>
              <label style={labelStyle}>Quantidade *</label>
              <input required type="number" min="1" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Preço Unitário (EUR) *</label>
              <input required type="number" step="0.01" value={form.unit_price_eur} onChange={e => setForm({ ...form, unit_price_eur: e.target.value })} style={inputStyle} placeholder="89.90" />
            </div>

            {/* Status */}
            <div>
              <label style={labelStyle}>Estado</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={inputStyle}>
                <option value="pending">Pendente</option>
                <option value="paid">Pago</option>
                <option value="purchased">Comprado</option>
                <option value="in_warehouse">Em Armazém</option>
                <option value="shipped">Enviado</option>
                <option value="in_transit">Em Trânsito</option>
                <option value="delivered">Entregue</option>
              </select>
            </div>

            {/* Pagamento */}
            <div>
              <label style={labelStyle}>Estado Pagamento</label>
              <select value={form.payment_status} onChange={e => setForm({ ...form, payment_status: e.target.value })} style={inputStyle}>
                <option value="unpaid">Não Pago</option>
                <option value="paid">Pago</option>
                <option value="refunded">Reembolsado</option>
              </select>
            </div>

            {/* Tracking */}
            <div>
              <label style={labelStyle}>Número de Tracking</label>
              <input value={form.tracking_number} onChange={e => setForm({ ...form, tracking_number: e.target.value })} style={inputStyle} placeholder="YT2025011512345CN" />
            </div>
            <div>
              <label style={labelStyle}>Transportadora</label>
              <input value={form.tracking_carrier} onChange={e => setForm({ ...form, tracking_carrier: e.target.value })} style={inputStyle} placeholder="CTT, DHL, etc." />
            </div>

            {/* Notas */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Notas Admin (internas)</label>
              <textarea value={form.admin_notes} onChange={e => setForm({ ...form, admin_notes: e.target.value })} style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }} placeholder="Notas internas sobre esta encomenda..." />
            </div>
          </div>

          {form.unit_price_eur && form.quantity && (
            <div style={{ background: "#111113", border: "1px solid #1E1E24", borderRadius: "12px", padding: "16px", marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#7A7A85" }}>Total da encomenda</span>
              <span style={{ fontSize: "20px", fontWeight: "700", color: "#C8A96E", fontFamily: "monospace" }}>
                € {(parseFloat(form.unit_price_eur || "0") * parseInt(form.quantity || "1")).toFixed(2)}
              </span>
            </div>
          )}

          <button type="submit" disabled={loading} style={{ width: "100%", background: "#C8A96E", color: "#0A0A0B", fontWeight: "700", padding: "14px", borderRadius: "12px", fontSize: "15px", border: "none", cursor: "pointer", opacity: loading ? 0.6 : 1 }}>
            {loading ? "A criar..." : "Criar Encomenda"}
          </button>
        </form>
      </main>
    </div>
  );
}