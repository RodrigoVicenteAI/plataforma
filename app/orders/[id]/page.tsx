"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter, useParams } from "next/navigation";

export default function ClientOrderPage() {
  const [order, setOrder] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();

  const statusOptions = [
    { value: "pending", label: "Pendente", color: "#7A7A85" },
    { value: "paid", label: "Pago", color: "#60A5FA" },
    { value: "purchased", label: "Comprado", color: "#C8A96E" },
    { value: "in_warehouse", label: "Em Armazém", color: "#F59E0B" },
    { value: "shipped", label: "Enviado", color: "#F59E0B" },
    { value: "in_transit", label: "Em Trânsito", color: "#60A5FA" },
    { value: "delivered", label: "Entregue", color: "#2ECC8F" },
    { value: "cancelled", label: "Cancelado", color: "#EF4444" },
  ];

  const allSteps = ["pending", "paid", "purchased", "in_warehouse", "shipped", "in_transit", "delivered"];

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: ord } = await supabase.from("orders").select("*").eq("id", params.id).single();
      if (!ord) { router.push("/dashboard"); return; }
      setOrder(ord);

      const { data: tl } = await supabase.from("order_timeline").select("*").eq("order_id", params.id).order("created_at", { ascending: true });
      setTimeline(tl || []);

      const { data: ph } = await supabase.from("order_photos").select("*").eq("order_id", params.id).order("created_at", { ascending: false });
      setPhotos(ph || []);

      setLoading(false);
    }
    load();
  }, []);

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0A0A0B" }}>
      <div style={{ color: "#C8A96E" }}>A carregar...</div>
    </div>
  );

  const currentStatus = statusOptions.find(s => s.value === order?.status);
  const currentStepIndex = allSteps.indexOf(order?.status);

  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0B", color: "#F2F2F0", fontFamily: "sans-serif" }}>
      {/* Header */}
      <header style={{ borderBottom: "1px solid #1E1E24", padding: "16px 40px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h1 style={{ color: "#C8A96E", fontFamily: "Georgia, serif", fontSize: "20px" }}>◆ Platform</h1>
        <div style={{ display: "flex", gap: "16px" }}>
          <a href="/messages" style={{ color: "#7A7A85", fontSize: "13px", textDecoration: "none" }}>💬 Mensagens</a>
          <a href="/dashboard" style={{ color: "#7A7A85", fontSize: "13px", textDecoration: "none" }}>← Dashboard</a>
        </div>
      </header>

      <main style={{ maxWidth: "900px", margin: "0 auto", padding: "48px 40px" }}>
        {/* Header encomenda */}
        <div style={{ marginBottom: "40px" }}>
          <div style={{ fontFamily: "monospace", color: "#C8A96E", fontSize: "13px", marginBottom: "8px" }}>{order?.order_number}</div>
          <h2 style={{ fontFamily: "Georgia, serif", fontSize: "32px", marginBottom: "12px" }}>{order?.product_name}</h2>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
            <span style={{ padding: "6px 16px", borderRadius: "100px", fontSize: "13px", background: `${currentStatus?.color}20`, color: currentStatus?.color, border: `1px solid ${currentStatus?.color}40` }}>
              {currentStatus?.label}
            </span>
            <span style={{ color: "#7A7A85", fontSize: "14px" }}>€{order?.total_price_eur} · {order?.quantity} unidade(s)</span>
            <span style={{ color: "#7A7A85", fontSize: "13px" }}>{new Date(order?.created_at).toLocaleDateString("pt-PT")}</span>
          </div>
        </div>

        {/* Barra de progresso */}
        <div style={{ background: "#111113", border: "1px solid #1E1E24", borderRadius: "20px", padding: "32px", marginBottom: "24px" }}>
          <h3 style={{ fontFamily: "Georgia, serif", fontSize: "16px", marginBottom: "24px", color: "#7A7A85" }}>Estado da encomenda</h3>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", position: "relative" }}>
            <div style={{ position: "absolute", left: "14px", right: "14px", top: "14px", height: "2px", background: "#2A2A32", zIndex: 0 }} />
            <div style={{ position: "absolute", left: "14px", top: "14px", height: "2px", background: "#C8A96E", zIndex: 1, width: `${Math.max(0, (currentStepIndex / (allSteps.length - 1)) * 100)}%`, transition: "width 0.5s ease" }} />
            {allSteps.map((step, i) => {
              const s = statusOptions.find(o => o.value === step);
              const done = i <= currentStepIndex;
              return (
                <div key={step} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", zIndex: 2, flex: 1 }}>
                  <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: done ? "#C8A96E" : "#17171A", border: `2px solid ${done ? "#C8A96E" : "#2A2A32"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", color: done ? "#0A0A0B" : "#7A7A85" }}>
                    {done ? "✓" : i + 1}
                  </div>
                  <div style={{ fontSize: "10px", color: done ? "#C8A96E" : "#7A7A85", textAlign: "center", lineHeight: "1.3" }}>{s?.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "20px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

            {/* Tracking */}
            {order?.tracking_number && (
              <div style={{ background: "#111113", border: "1px solid #1E1E24", borderRadius: "16px", padding: "24px" }}>
                <h3 style={{ fontFamily: "Georgia, serif", fontSize: "18px", marginBottom: "16px" }}>Tracking</h3>
                <div style={{ fontFamily: "monospace", color: "#C8A96E", fontSize: "18px", marginBottom: "4px" }}>{order.tracking_number}</div>
                <div style={{ color: "#7A7A85", fontSize: "13px", marginBottom: "12px" }}>{order.tracking_carrier}</div>
              </div>
            )}

            {/* Fotos */}
            {photos.length > 0 && (
              <div style={{ background: "#111113", border: "1px solid #1E1E24", borderRadius: "16px", padding: "24px" }}>
                <h3 style={{ fontFamily: "Georgia, serif", fontSize: "18px", marginBottom: "16px" }}>Fotos do Produto</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
                  {photos.map((photo) => (
                    <img key={photo.id} src={photo.url} alt="" style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: "10px", border: "1px solid #2A2A32", cursor: "pointer" }}
                      onClick={() => window.open(photo.url, "_blank")} />
                  ))}
                </div>
              </div>
            )}

            {/* Falar com suporte */}
            <div style={{ background: "#111113", border: "1px solid #C8A96E30", borderRadius: "16px", padding: "24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontWeight: "600", marginBottom: "4px" }}>Tens alguma duvida?</div>
                <div style={{ fontSize: "13px", color: "#7A7A85" }}>Fala connosco sobre esta encomenda</div>
              </div>
              <a href="/messages" style={{ background: "#C8A96E", color: "#0A0A0B", padding: "10px 20px", borderRadius: "10px", fontSize: "13px", fontWeight: "700", textDecoration: "none" }}>
                Falar com suporte
              </a>
            </div>
          </div>

          {/* Timeline */}
          <div style={{ background: "#111113", border: "1px solid #1E1E24", borderRadius: "16px", padding: "24px" }}>
            <h3 style={{ fontFamily: "Georgia, serif", fontSize: "18px", marginBottom: "20px" }}>Historico</h3>
            {timeline.length === 0 ? (
              <div style={{ color: "#7A7A85", fontSize: "13px" }}>Sem actualizacoes ainda</div>
            ) : (
              <div style={{ position: "relative", paddingLeft: "24px" }}>
                <div style={{ position: "absolute", left: "8px", top: "0", bottom: "0", width: "1px", background: "#2A2A32" }} />
                {timeline.map((item, i) => (
                  <div key={item.id} style={{ position: "relative", marginBottom: "20px" }}>
                    <div style={{ position: "absolute", left: "-20px", top: "4px", width: "14px", height: "14px", borderRadius: "50%", background: i === timeline.length - 1 ? "#C8A96E" : "#2ECC8F", border: "2px solid #0A0A0B" }} />
                    <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "2px" }}>{item.title}</div>
                    <div style={{ fontSize: "11px", color: "#7A7A85" }}>{new Date(item.created_at).toLocaleString("pt-PT")}</div>
                    {item.description && <div style={{ fontSize: "12px", color: "#55555E", marginTop: "2px" }}>{item.description}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}