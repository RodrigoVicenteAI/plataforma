"use client";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter, useParams } from "next/navigation";

export default function ChatPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [conversation, setConversation] = useState<any>(null);
  const [newMessage, setNewMessage] = useState("");
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [sending, setSending] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUser(user);
      const { data: prof } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      setProfile(prof);
      const { data: conv } = await supabase.from("conversations").select("*").eq("id", params.id).single();
      setConversation(conv);
      const { data: msgs } = await supabase.from("messages").select("*").eq("conversation_id", params.id).order("created_at", { ascending: true });
      setMessages(msgs || []);
    }
    load();
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel(`messages-${params.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${params.id}` },
        (payload) => { setMessages((prev) => [...prev, payload.new]); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [params.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setPendingFiles(prev => [...prev, ...files]);
    const newPreviews = files.map(f => URL.createObjectURL(f));
    setPreviews(prev => [...prev, ...newPreviews]);
    e.target.value = "";
  }

  function removeFile(index: number) {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if ((!newMessage.trim() && pendingFiles.length === 0) || sending) return;
    setSending(true);

    // Enviar texto
    if (newMessage.trim()) {
      await supabase.from("messages").insert({
        conversation_id: params.id,
        sender_id: user.id,
        sender_role: profile?.role || "client",
        type: "text",
        content: newMessage.trim(),
      });
    }

    // Enviar imagens
    for (const file of pendingFiles) {
      const fileName = `${params.id}/${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage.from("chat-media").upload(fileName, file);
      if (!error && data) {
        const { data: { publicUrl } } = supabase.storage.from("chat-media").getPublicUrl(fileName);
        await supabase.from("messages").insert({
          conversation_id: params.id,
          sender_id: user.id,
          sender_role: profile?.role || "client",
          type: "image",
          media_url: publicUrl,
        });
      }
    }

    await supabase.from("conversations").update({ last_message_at: new Date().toISOString() }).eq("id", params.id);

    setNewMessage("");
    setPendingFiles([]);
    setPreviews([]);
    setSending(false);
  }

  const isMe = (msg: any) => msg.sender_id === user?.id;

  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0B", color: "#F2F2F0", fontFamily: "sans-serif", display: "flex", flexDirection: "column" }}>
      <header style={{ borderBottom: "1px solid #1E1E24", padding: "16px 24px", display: "flex", alignItems: "center", gap: "16px", flexShrink: 0 }}>
        <a href="/messages" style={{ color: "#7A7A85", fontSize: "18px", textDecoration: "none" }}>←</a>
        <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: "#C8A96E20", border: "1px solid #C8A96E40", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>S</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: "600", fontSize: "15px" }}>Suporte Platform</div>
          <div style={{ fontSize: "12px", color: "#2ECC8F" }}>● Online</div>
        </div>
        <div style={{ fontSize: "13px", color: "#7A7A85" }}>{conversation?.subject}</div>
      </header>

      <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "12px" }}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", color: "#7A7A85", marginTop: "40px" }}>
            <div style={{ fontSize: "40px", marginBottom: "8px" }}>👋</div>
            <p>Inicia a conversa abaixo</p>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} style={{ display: "flex", justifyContent: isMe(msg) ? "flex-end" : "flex-start" }}>
            <div style={{ maxWidth: "65%", padding: "10px 14px", borderRadius: isMe(msg) ? "16px 16px 4px 16px" : "16px 16px 16px 4px", background: isMe(msg) ? "#C8A96E" : "#17171A", border: isMe(msg) ? "none" : "1px solid #2A2A32", color: isMe(msg) ? "#0A0A0B" : "#F2F2F0" }}>
              {msg.type === "image" ? (
                <img src={msg.media_url} alt="" style={{ maxWidth: "100%", borderRadius: "8px", display: "block", cursor: "pointer" }} onClick={() => window.open(msg.media_url, "_blank")} />
              ) : (
                <div style={{ fontSize: "14px", lineHeight: "1.5" }}>{msg.content}</div>
              )}
              <div style={{ fontSize: "10px", opacity: 0.6, marginTop: "4px", textAlign: "right" }}>
                {new Date(msg.created_at).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Preview de ficheiros */}
      {previews.length > 0 && (
        <div style={{ padding: "12px 24px", borderTop: "1px solid #1E1E24", display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {previews.map((preview, i) => (
            <div key={i} style={{ position: "relative" }}>
              <img src={preview} alt="" style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "8px", border: "1px solid #2A2A32" }} />
              <button onClick={() => removeFile(i)} style={{ position: "absolute", top: "-6px", right: "-6px", width: "18px", height: "18px", borderRadius: "50%", background: "#EF4444", border: "none", color: "white", fontSize: "10px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ borderTop: "1px solid #1E1E24", padding: "16px 24px", flexShrink: 0 }}>
        <form onSubmit={handleSend} style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <label style={{ cursor: "pointer", color: "#7A7A85", fontSize: "20px", flexShrink: 0, padding: "8px", borderRadius: "8px", border: "1px solid #2A2A32", background: previews.length > 0 ? "#C8A96E20" : "transparent" }}>
            📎
            <input type="file" accept="image/*" multiple onChange={handleFileSelect} style={{ display: "none" }} />
          </label>
          <input
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            placeholder="Escreve uma mensagem..."
            style={{ flex: 1, background: "#17171A", border: "1px solid #2A2A32", borderRadius: "12px", padding: "12px 16px", color: "#F2F2F0", fontSize: "14px", outline: "none", fontFamily: "sans-serif" }}
          />
          <button type="submit" disabled={sending || (!newMessage.trim() && pendingFiles.length === 0)}
            style={{ background: "#C8A96E", color: "#0A0A0B", border: "none", borderRadius: "10px", padding: "12px 20px", fontSize: "14px", fontWeight: "700", cursor: "pointer", opacity: (sending || (!newMessage.trim() && pendingFiles.length === 0)) ? 0.5 : 1 }}>
            {sending ? "..." : "→"}
          </button>
        </form>
      </div>
    </div>
  );
}