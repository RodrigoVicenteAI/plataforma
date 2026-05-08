"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter, useParams } from "next/navigation";

export default function OrderDetailPage() {
  const [order, setOrder] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();
  const params = useParams();
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

  useEffect(() => {
    async function load() {
      const { data: ord } = await supabase
        .from("orders")
        .select("*, profiles(full_name, email)")
        .eq("id", params.id)
        .single();
      setOrder(ord);

      const { data: tl } = await supabase
        .from("order_timeline")
        .select("*")
        .eq("order_id", params.id)
        .order("created_at", { ascending: true });
      setTimeline(tl || []);

      const { data: ph } = await supabase
        .from("order_photos")
        .select("*")
        .eq("order_id", params.id)
        .order("created_at", { ascending: false });
      setPhotos(ph || []);

      setLoading(false);
    }
    load();
  }, []);

  async function updateStatus(newStatus: string) {
    setSaving(true);
    const statusLabel = statusOptions.find(s => s.value === newStatus)?.label || newStatus;
    
    await supabase.from("orders").update({ status: newStatus, updated_at: new Date().toISOString() }).eq("id", params.id);
    
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("order_timeline").insert({
      order_id: params.id,
      status: newStatus,
      title: statusLabel,
      description: `Estado actualizado para ${statusLabel}`,
      created_by: user?.id,
    });

    // Criar notificação para o cliente
    await supabase.from("notifications").insert({
      user_id: order.client_id,
      type: "order_update",
      title: `Encomenda ${order.order_number}`,
      body: `O estado foi actualizado para: ${statusLabel}`,
      data: { order_id: params.id },
    });

    setOrder({ ...order, status: newStatus });
    const { data: tl } = await supabase.from("order_timeline").select("*").eq("order_id", params.id).order("created_at", { ascending: true });
    setTimeline(tl || []);
    setSaving(false);
  }

  async function updateTracking(tracking: string, carrier: string) {
    await supabase.from("orders").update({ tracking_number: tracking, tracking_carrier: carrier }).eq("id", params.id);
    setOrder({ ...order, tracking_number: tracking, tracking_carrier: carrier });
    alert("Tracking guardado!");
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);

    const { data: { user } } = await supabase.auth.getUser();

    for (const file of Array.from(files)) {
      const fileName = `${params.id}/${Date.now()}-${file.name}`;
      const { data: uploadData, error } = await supabase.storage.from("order-photos").upload(fileName, file);
      
      if (!error && uploadData) {
        const { data: { publicUrl } } = supabase.storage.from("order-photos").getPublicUrl(fileName);
        await supabase.from("order_photos").insert({
          order_id: params.id,
          url: publicUrl,
          uploaded_by: user?.id,
        });
      }
    }

    // Notificar cliente
    await supabase.from("notifications").insert({
      user_id: order.client_id,
      type: "new_photos",
      title: `Novas fotos da tua encomenda!`,
      body: `Foram adicionadas novas fotos à encomenda ${order.order_number}`,
      data: { order_id: params.id },
    });

    const { data: ph } = await supabase.from("order_photos").select("*").eq("order_id", params.id).order("created_at", { ascending: false });
    setPhotos(ph || []);
    setUploading(false);
  }

  const inputStyle = { width: "100%", background: "#17171A", border: "1px solid #2A2A32", borderRadius: "10px", padding: "10px 14px", color: "#F2F2F0", fontSize: "14px", outline: "none", fontFamily: "sans-serif" };

  if (loading) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0A0A0B" }}><div style={{ color: "#C8A96E" }}>A carregar...</div></div>;

  const currentStatus = statusOptions.find(s => s.value === order?.status);

  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0B", color: "#F2F2F0", fontFamily: "sans-serif" }}>
      <header style={{ borderBottom: "1px solid #1E1E24", padding: "16px 40px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h1 style={{ color: "#C8A96E", fontFamily: "Georgia, serif", fontSize: "20px" }}>◆ Platform Admin</h1>
        <a href="/admin" style={{ color: "#7A7A85", fontSize: "13px", textDecoration: "none" }}>← Voltar ao Admin</a>
      </header>

      <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "48px 40px" }}>
        {/* Header da encomenda */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "40px" }}>
          <div>
            <div style={{ fontFamily: "monospace", color: "#C8A96E", fontSize: "14px", marginBottom: "8px" }}>{order?.order_number}</div>
            <h2 style={{ fontFamily: "Georgia, serif", fontSize: "28px", marginBottom: "4px" }}>{order?.product_name}</h2>
            <p style={{ color: "#7A7A85" }}>Cliente: {order?.profiles?.full_name} — {order?.profiles?.email}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "28px", fontWeight: "700", color: "#C8A96E", fontFamily: "monospace" }}>€{order?.total_price_eur}</div>
            <span style={{ padding: "4px 16px", borderRadius: "100px", fontSize: "13px", background: `${currentStatus?.color}20`, color: currentStatus?.color }}>
              {currentStatus?.label}
            </span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "24px" }}>
          {/* Coluna principal */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* Actualizar Estado */}
            <div style={{ background: "#111113", border: "1px solid #1E1E24", borderRadius: "16px", padding: "24px" }}>
              <h3 style={{ fontFamily: "Georgia, serif", fontSize: "18px", marginBottom: "16px" }}>Actualizar Estado</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
                {statusOptions.map((s) => (
                  <button key={s.value} onClick={() => updateStatus(s.value)} disabled={saving}
                    style={{ padding: "10px", borderRadius: "10px", border: `1px solid ${order?.status === s.value ? s.color : "#2A2A32"}`, background: order?.status === s.value ? `${s.color}20` : "transparent", color: order?.status === s.value ? s.color : "#7A7A85", fontSize: "12px", cursor: "pointer", fontWeight: order?.status === s.value ? "700" : "400" }}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tracking */}
            <div style={{ background: "#111113", border: "1px solid #1E1E24", borderRadius: "16px", padding: "24px" }}>
              <h3 style={{ fontFamily: "Georgia, serif", fontSize: "18px", marginBottom: "16px" }}>Tracking</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                <div>
                  <label style={{ fontSize: "11px", color: "#7A7A85", textTransform: "uppercase" as const, letterSpacing: "1px", marginBottom: "6px", display: "block" }}>Número</label>
                  <input defaultValue={order?.tracking_number || ""} id="tracking-number" style={inputStyle} placeholder="YT2025011512345CN" />
                </div>
                <div>
                  <label style={{ fontSize: "11px", color: "#7A7A85", textTransform: "uppercase" as const, letterSpacing: "1px", marginBottom: "6px", display: "block" }}>Transportadora</label>
                  <input defaultValue={order?.tracking_carrier || ""} id="tracking-carrier" style={inputStyle} placeholder="CTT, DHL..." />
                </div>
              </div>
              <button onClick={() => {
                const n = (document.getElementById("tracking-number") as HTMLInputElement).value;
                const c = (document.getElementById("tracking-carrier") as HTMLInputElement).value;
                updateTracking(n, c);
              }} style={{ background: "#C8A96E", color: "#0A0A0B", border: "none", borderRadius: "10px", padding: "10px 20px", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}>
                Guardar Tracking
              </button>
            </div>

            {/* Upload de Fotos */}
            <div style={{ background: "#111113", border: "1px solid #1E1E24", borderRadius: "16px", padding: "24px" }}>
              <h3 style={{ fontFamily: "Georgia, serif", fontSize: "18px", marginBottom: "16px" }}>Fotos do Produto</h3>
              
              <label style={{ display: "block", border: "2px dashed #2A2A32", borderRadius: "12px", padding: "32px", textAlign: "center", cursor: "pointer", marginBottom: "16px" }}>
                <input type="file" multiple accept="image/*" onChange={handlePhotoUpload} style={{ display: "none" }} />
                <div style={{ fontSize: "32px", marginBottom: "8px" }}>📸</div>
                <div style={{ color: "#7A7A85", fontSize: "14px" }}>{uploading ? "A fazer upload..." : "Clica para adicionar fotos"}</div>
              </label>

              {photos.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
                  {photos.map((photo) => (
                    <img key={photo.id} src={photo.url} alt="" style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: "8px", border: "1px solid #2A2A32" }} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div style={{ background: "#111113", border: "1px solid #1E1E24", borderRadius: "16px", padding: "24px" }}>
            <h3 style={{ fontFamily: "Georgia, serif", fontSize: "18px", marginBottom: "20px" }}>Timeline</h3>
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
          </div>
        </div>
      </main>
    </div>
  );
}