"use client";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter, useParams } from "next/navigation";

export default function AdminChatPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [conversation, setConversation] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const [newMessage, setNewMessage] = useState("");
  const [user, setUser] = useState<any>(null);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUser(user);

      const { data: conv } = await supabase
        .from("conversations")
        .select("*, profiles(full_name, email)")
        .eq("id", params.id)
        .single();
      setConversation(conv);
      setClient(conv?.profiles);

      const { data: msgs } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", params.id)
        .order("created_at", { ascending: true });
      setMessages(msgs || []);
    }
    load();
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel(`admin-messages-${params.id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${params.id}`,
      }, (payload) => {
        setMessages((prev) => [...prev, payload.new]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [params.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;
    setSending(true);

    await supabase.from("messages").insert({
      conversation_id: params.id,
      sender_id: user.id,
      sender_role: "admin",
      type: "text",
      content: newMessage.trim(),
    });

    await supabase.from("conversations").update({
      last_message_at: new Date().toISOString(),
    }).eq("id", params.id);

    // Notificar cliente
    await supabase.from("notifications").insert({
      user_id: conversation.client_id,
      type: "new_message",
      title: "Nova mensagem do suporte",
      body: newMessage.trim().substring(0, 100),
      data: { conversation_id: params.id },
    });

    setNewMessage("");
    setSending(false);
  }

  async function sendImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = `${params.id}/${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage.from("chat-media").upload(fileName, file);

    if (!error && data) {
      const { data: { publicUrl } } = supabase.storage.from("chat-media").getPublicUrl(fileName);
      await supabase.from("messages").insert({
        conversation_id: params.id,
        sender_id: user.id,
        sender_role: "admin",
        type: "image",
        media_url: publicUrl,
      });

      await supabase.from("conversations").update({
        last_message_at: new Date().toISOString(),
      }).eq("id", params.id);
    }
    e.target.value = "";
  }

  async function markResolved() {
    await supabase.from("conversations").update({ status: "resolved" }).eq("id", params.id);
    setConversation({ ...conversation, status: "resolved" });
  }

  const isAdmin = (msg: any) => msg.sender_role === "admin";

  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0B", color: "#F2F2F0", fontFamily: "sans-serif", display: "flex", flexDirection: "column" }}>
      <header style={{ borderBottom: "1px solid #1E1E24", padding: "16px 24px", display: "flex", alignItems: "center", gap: "16px", flexShrink: 0 }}>
        <a href="/admin/messages" style={{ color: "#7A7A85", fontSize: "18px", textDecoration: "none" }}>←</a>
        <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: "#C8A96E20", border: "1px solid #C8A96E40", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>
          {client?.full_name?.[0] || "?"}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: "600", fontSize: "15px" }}>{client?.full_name}</div>
          <div style={{ fontSize: "12px", color: "#7A7A85" }}>{conversation?.subject}</div>
        </div>
        {conversation?.status === "open" && (
          <button onClick={markResolved}
            style={{ background: "transparent", border: "1px solid #2A2A32", color: "#7A7A85", borderRadius: "8px", padding: "6px 14px", fontSize: "12px", cursor: "pointer" }}>
            Marcar resolvido
          </button>
        )}
      </header>

      <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "12px" }}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", color: "#7A7A85", marginTop: "40px" }}>Sem mensagens ainda</div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} style={{ display: "flex", justifyContent: isAdmin(msg) ? "flex-end" : "flex-start" }}>
            <div style={{
              maxWidth: "65%", padding: "10px 14px",
              borderRadius: isAdmin(msg) ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
              background: isAdmin(msg) ? "#C8A96E" : "#17171A",
              border: isAdmin(msg) ? "none" : "1px solid #2A2A32",
              color: isAdmin(msg) ? "#0A0A0B" : "#F2F2F0",
            }}>
              {msg.type === "image" ? (
                <img src={msg.media_url} alt="" style={{ maxWidth: "100%", borderRadius: "8px", display: "block" }} />
              ) : (
                <div style={{ fontSize: "14px", lineHeight: "1.5" }}>{msg.content}</div>
              )}
              <div style={{ fontSize: "10px", opacity: 0.6, marginTop: "4px", textAlign: "right" }}>
                {new Date(msg.created_at).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
                {isAdmin(msg) ? " · Tu" : ` · ${client?.full_name}`}
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div style={{ borderTop: "1px solid #1E1E24", padding: "16px 24px", flexShrink: 0 }}>
        <form onSubmit={sendMessage} style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <label style={{ cursor: "pointer", color: "#7A7A85", fontSize: "20px", flexShrink: 0 }}>
            📎
            <input type="file" accept="image/*" onChange={sendImage} style={{ display: "none" }} />
          </label>
          <input
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            placeholder="Responde ao cliente..."
            style={{ flex: 1, background: "#17171A", border: "1px solid #2A2A32", borderRadius: "12px", padding: "12px 16px", color: "#F2F2F0", fontSize: "14px", outline: "none", fontFamily: "sans-serif" }}
          />
          <button type="submit" disabled={sending || !newMessage.trim()}
            style={{ background: "#C8A96E", color: "#0A0A0B", border: "none", borderRadius: "10px", padding: "12px 20px", fontSize: "14px", fontWeight: "700", cursor: "pointer", opacity: sending ? 0.6 : 1 }}>
            →
          </button>
        </form>
      </div>
    </div>
  );
}