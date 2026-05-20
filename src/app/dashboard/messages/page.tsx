"use client";

import { useEffect, useState, useRef } from "react";
import { messageService } from "../../../lib/dbService";

export default function MessageCenter() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const userIdRef = useRef("");

  useEffect(() => {
    let unsubscribe = () => {};

    if (typeof window !== "undefined") {
      const session = localStorage.getItem("go-visa_session");
      if (session) {
        const user = JSON.parse(session);
        userIdRef.current = user.uid;

        unsubscribe = messageService.onMessages(user.uid, (data) => {
          setMessages(data);
          setLoading(false);
          // Scroll to bottom
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
          }, 100);
        });
      }
    }

    return () => unsubscribe();
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !userIdRef.current) return;

    const text = inputText.trim();
    setInputText("");

    try {
      await messageService.sendMessage(userIdRef.current, "user", text);
      // Scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (e) {
      alert("Error al enviar mensaje.");
    }
  };

  const formatMessageTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return "";
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center h-full">
        <svg className="animate-spin h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] md:h-screen flex flex-col bg-[#F8FAFC]">
      {/* Chat Header */}
      <header className="bg-white border-b border-outline-variant/30 px-6 py-4 flex items-center justify-between flex-shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-[#0b1c30] text-white flex items-center justify-center font-bold text-sm">
              AT
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#10B981] border-2 border-white rounded-full"></span>
          </div>
          <div>
            <h3 className="font-bold text-sm text-on-background">Lic. Alejandro Torres</h3>
            <p className="text-[10px] text-outline flex items-center gap-1">
              <span>Asesor de Trámites Go-Visa</span>
              <span>•</span>
              <span className="text-[#10B981] font-semibold">En línea</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-slate-100 text-slate-600 font-semibold px-2.5 py-1 rounded-full border border-slate-200 hidden sm:inline-block">
            Soporte Activo B1/B2
          </span>
        </div>
      </header>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
            <span className="material-symbols-outlined text-outline text-[48px]">forum</span>
            <h4 className="font-bold text-sm text-on-background">Tu chat de soporte</h4>
            <p className="text-xs text-on-surface-variant max-w-[280px]">Envía un mensaje para ponerte en contacto directo con tu asesor asignado.</p>
          </div>
        ) : (
          <div className="space-y-4 max-w-[700px] mx-auto">
            {messages.map((msg) => {
              const isAdmin = msg.sender === "admin";
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isAdmin ? "items-start" : "items-end"} animate-fadeIn`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-sm ${
                      isAdmin
                        ? "bg-white text-on-background border border-outline-variant/30 rounded-tl-none"
                        : "bg-primary-container text-white rounded-tr-none"
                    }`}
                  >
                    <p>{msg.text}</p>
                  </div>
                  <span className="text-[9px] text-outline mt-1 px-1.5 font-medium">
                    {formatMessageTime(msg.timestamp)}
                  </span>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Chat Footer Input */}
      <footer className="bg-white border-t border-outline-variant/30 px-6 py-4 flex-shrink-0">
        <form onSubmit={handleSend} className="max-w-[700px] mx-auto flex gap-3">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Escribe tu duda aquí..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs focus:border-primary focus:bg-white outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="bg-primary-container text-white px-4 rounded-xl hover:bg-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              send
            </span>
          </button>
        </form>
      </footer>
    </div>
  );
}
