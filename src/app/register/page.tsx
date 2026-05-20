"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authService } from "../../lib/dbService";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError("Por favor completa todos los campos.");
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      let initialScore: number | undefined = undefined;
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const scoreParam = params.get("score");
        if (scoreParam) initialScore = parseInt(scoreParam);
      }

      const user = await authService.register(email, name, "user", initialScore);
      // Save session locally in mock mode
      if (typeof window !== "undefined") {
        localStorage.setItem("go-visa_session", JSON.stringify(user));
      }
      
      router.push("/dashboard");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error al crear la cuenta. Intenta con otro correo.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setLoading(true);
    setError("");
    try {
      // Simulation of Google Register
      const mockGoogleUser = {
        uid: "user-google-1",
        email: "carlos.mendez.google@gmail.com",
        role: "user",
        displayName: "Carlos Méndez (Google)",
      };
      
      if (typeof window !== "undefined") {
        localStorage.setItem("go-visa_session", JSON.stringify(mockGoogleUser));
      }
      
      router.push("/dashboard");
    } catch (err: any) {
      setError("Ocurrió un error al registrarse con Google.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] flex flex-col md:flex-row relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none z-0"></div>

      {/* Column 1: Info Branding (hidden on mobile) */}
      <div className="hidden md:flex md:w-[45%] bg-slate-50 border-r border-slate-200 p-12 flex-col justify-between relative z-10">
        <div>
          <Link href="/" className="inline-flex items-center gap-2 mb-16 hover:opacity-90 transition-opacity">
            <img src="/logo.png" alt="Go-Visa Logo" className="h-9 w-auto object-contain" />
          </Link>

          <div className="space-y-6 max-w-[400px] mt-10">
            <h2 className="text-4xl font-extrabold leading-tight text-[#0b1c30]">Comienza tu trámite en minutos</h2>
            <p className="text-slate-600 leading-relaxed">
              Crea tu cuenta de acceso seguro para llenar tu cuestionario simplificado, realizar un seguimiento visual paso a paso de tu estado, y subir tus documentos.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-start gap-4 p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
            <span className="material-symbols-outlined text-primary mt-0.5">travel_explore</span>
            <div>
              <p className="text-sm font-semibold text-slate-800">Cuestionario en Español</p>
              <p className="text-xs text-slate-500 mt-1">Llenarás la información con asistencia contextual explicada en tu propio idioma.</p>
            </div>
          </div>
          <span className="text-xs text-slate-400 block">Soporte Técnico: ayuda@govisa.mx</span>
        </div>
      </div>

      {/* Column 2: Register Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 relative z-10">
        <div className="w-full max-w-[420px] space-y-8 bg-white border border-slate-200/80 shadow-md p-8 md:p-10 rounded-2xl">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#0b1c30]">Crear Cuenta</h1>
            <p className="text-slate-600 text-sm">Regístrate para iniciar tu proceso.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-600 p-3 rounded-lg text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">error</span>
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="name" className="text-xs font-semibold text-slate-700">Nombre Completo</label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Carlos Méndez"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:border-primary outline-none transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-semibold text-slate-700">Correo Electrónico</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="carlos@example.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:border-primary outline-none transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-semibold text-slate-700">Contraseña</label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:border-primary outline-none transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2 shadow-sm"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Creando cuenta...</span>
                </>
              ) : (
                "Registrarme"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-4 text-slate-400 text-xs uppercase tracking-wider">o</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {/* Social signup */}
          <button
            onClick={handleGoogleRegister}
            disabled={loading}
            className="w-full bg-white border border-slate-200 py-3 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 transition-all flex items-center justify-center gap-3 shadow-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69a5.74 5.74 0 0 1-2.49 3.77v3.12h4.01c2.34-2.15 3.69-5.32 3.69-8.74z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-4.01-3.12c-1.12.75-2.54 1.19-3.92 1.19-3.02 0-5.58-2.04-6.49-4.79H1.42v3.22C3.4 21.67 7.42 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.51 14.37A7.16 7.16 0 0 1 5.1 12c0-.82.14-1.63.4-2.37V6.42H1.42A11.96 11.96 0 0 0 0 12c0 2.12.55 4.12 1.42 5.87l4.09-3.5z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.43C17.95 1.19 15.24 0 12 0 7.42 0 3.4 2.33 1.42 6.42l4.09 3.51c.91-2.75 3.47-4.79 6.49-4.79z"
              />
            </svg>
            <span>Registrarse con Google</span>
          </button>

          {/* Footer link */}
          <div className="text-center text-xs text-slate-500 mt-4">
            ¿Ya tienes una cuenta?{" "}
            <Link href="/login" className="text-primary font-semibold hover:underline">
              Inicia sesión aquí
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
