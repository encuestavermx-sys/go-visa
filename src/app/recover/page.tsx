"use client";

import { useState } from "react";
import Link from "next/link";

export default function RecoverPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Por favor ingresa tu correo electrónico.");
      return;
    }
    setLoading(true);
    setError("");

    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none z-0"></div>

      <div className="w-full max-w-[420px] space-y-8 bg-white border border-slate-200/80 shadow-md rounded-2xl p-8 md:p-10 relative z-10">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-4 hover:opacity-90 transition-opacity">
            <img src="/logo.png" alt="Go-Visa Logo" className="h-9 w-auto object-contain mx-auto" />
          </Link>
        </div>

        {success ? (
          <div className="space-y-6 text-center">
            <div className="w-16 h-16 bg-green-500/10 border border-green-500/20 text-green-600 rounded-full flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[32px]">mark_email_read</span>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-[#0b1c30]">Correo Enviado</h2>
              <p className="text-slate-600 text-sm">
                Hemos enviado las instrucciones para restablecer tu contraseña al correo <span className="text-[#0b1c30] font-semibold">{email}</span>.
              </p>
            </div>
            <Link
              href="/login"
              className="block w-full bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary/90 transition-all text-center text-sm shadow-sm"
            >
              Regresar al inicio de sesión
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-2 text-center">
              <h1 className="text-2xl font-bold tracking-tight text-[#0b1c30]">Recuperar Contraseña</h1>
              <p className="text-slate-600 text-sm">
                Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-600 p-3 rounded-lg text-xs flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">error</span>
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="email" className="text-xs font-semibold text-slate-700">Correo Electrónico</label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:border-primary outline-none transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Enviando...</span>
                  </>
                ) : (
                  "Enviar Enlace"
                )}
              </button>
            </form>

            <div className="text-center text-xs text-slate-500">
              ¿Recordaste tu contraseña?{" "}
              <Link href="/login" className="text-primary font-semibold hover:underline">
                Inicia sesión aquí
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
