"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { applicationService, waitTimeService } from "../../lib/dbService";
import { generateWhatsAppLink, formatDate } from "../../lib/utils";

export default function UserDashboard() {
  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [waitTimes, setWaitTimes] = useState<any[]>([]);
  const [selectedCityId, setSelectedCityId] = useState<string>("cdmx");
  const [showScoreModal, setShowScoreModal] = useState(false);

  useEffect(() => {
    // Get logged user
    if (typeof window !== "undefined") {
      const session = localStorage.getItem("go-visa_session");
      if (session) {
        const user = JSON.parse(session);
        applicationService.getApplication(user.uid).then((app) => {
          setApplication(app);
          setLoading(false);
        });
      }
    }

    waitTimeService.getWaitTimes().then((data) => {
      setWaitTimes(data);
    });
  }, []);

  const selectedCity = waitTimes.find((w) => w.id === selectedCityId) || {
    city: "Ciudad de México",
    casWaitDays: 5,
    interviewWaitDays: 450,
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

  // Determine current step index based on application status
  // 1: Cuestionario, 2: Revisión, 3: Citas, 4: Entrevista
  const getStepIndex = (status: string) => {
    switch (status) {
      case "Nuevo":
      case "DS-160 completado":
        return 1;
      case "En revisión":
        return 2;
      case "Pago pendiente":
      case "Cita agendada":
        return 3;
      case "Entrevista pendiente":
      case "Visa aprobada":
      case "Visa rechazada":
        return 4;
      default:
        return 1;
    }
  };

  const currentStep = getStepIndex(application?.status || "Nuevo");
  const scoreData = application?.visaScore || {
    score: 50,
    level: "Medio",
    recommendations: ["Completa tu formulario DS-160 para obtener recomendaciones detalladas."],
    risks: ["Sin datos cargados."],
  };

  // SVG circular properties
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (scoreData.score / 100) * circumference;

  const scoreColors = {
    Alto: { text: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/20", ring: "stroke-green-500" },
    Medio: { text: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500/20", ring: "stroke-yellow-500" },
    Bajo: { text: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20", ring: "stroke-red-500" },
  }[scoreData.level as "Alto" | "Medio" | "Bajo"];

  const getStatusBadge = (status: string) => {
    const badges: any = {
      Nuevo: "bg-primary/10 text-primary border-primary/20",
      "En revisión": "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20",
      "DS-160 completado": "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
      "Pago pendiente": "bg-[#EAB308]/10 text-[#EAB308] border-[#EAB308]/20",
      "Cita agendada": "bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20",
      "Entrevista pendiente": "bg-purple-500/10 text-purple-500 border-purple-500/20",
      "Visa aprobada": "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
      "Visa rechazada": "bg-red-500/10 text-red-500 border-red-500/20",
    };
    return badges[status] || "bg-slate-100 text-slate-700 border-slate-200";
  };

  return (
    <div className="p-6 md:p-10 max-w-container-max mx-auto space-y-8">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-outline tracking-wider uppercase">Panel de Control</span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-on-background mt-1">
            ¡Hola, {application?.userName || "Usuario"}!
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Aquí puedes ver el avance de tu solicitud y contactar a tu asesor.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-on-surface-variant font-medium">Estado del Trámite:</span>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(application?.status || "Nuevo")}`}>
            {application?.status || "Nuevo"}
          </span>
        </div>
      </div>

      {/* Stepper Progress Visualizer */}
      <div className="bg-white rounded-2xl border border-outline-variant/30 p-6 md:p-8 shadow-level-1">
        <h2 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-6">Línea de Progreso</h2>
        <div className="relative flex flex-col md:flex-row justify-between gap-6 md:gap-4">
          {/* Connector Line - Desktop only */}
          <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-slate-200 -translate-y-1/2 hidden md:block z-0"></div>
          
          {[
            { stepNum: 1, title: "Llenar Cuestionario", icon: "edit_document", desc: "Formulario DS-160 en español." },
            { stepNum: 2, title: "Revisión Experta", icon: "person_search", desc: "Corregimos inconsistencias." },
            { stepNum: 3, title: "Pago y Citas", icon: "calendar_month", desc: "Reservamos tus fechas." },
            { stepNum: 4, title: "Entrevista Consular", icon: "co-present", desc: "Asesoría y simulacro final." },
          ].map((item) => {
            const isCompleted = currentStep > item.stepNum;
            const isActive = currentStep === item.stepNum;
            const isPending = currentStep < item.stepNum;

            return (
              <div key={item.stepNum} className="relative z-10 flex md:flex-col items-center md:text-center gap-4 md:gap-3 flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border transition-all ${
                    isCompleted
                      ? "bg-primary-container text-white border-primary-container shadow-md"
                      : isActive
                      ? "bg-primary text-white border-primary shadow-level-1 ring-4 ring-primary/10"
                      : "bg-slate-100 text-slate-400 border-slate-200"
                  }`}
                >
                  {isCompleted ? (
                    <span className="material-symbols-outlined text-[18px]">check</span>
                  ) : (
                    item.stepNum
                  )}
                </div>
                <div className="flex flex-col md:items-center">
                  <span className={`text-sm font-bold ${isActive ? "text-primary" : "text-on-surface"}`}>
                    {item.title}
                  </span>
                  <span className="text-[11px] text-outline mt-0.5 max-w-[150px]">
                    {item.desc}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Contextual Card + Visa Score + Wait times */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Contextual Alert & Quick Links (col-span-2) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Contextual Action Card */}
          <div className="bg-gradient-to-br from-[#0b1c30] to-[#152e4b] rounded-2xl p-6 md:p-8 text-white shadow-level-2 relative overflow-hidden flex flex-col justify-between min-h-[220px]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[60px] pointer-events-none"></div>
            
            <div className="space-y-4 relative z-10">
              <span className="bg-primary-container/30 text-primary-fixed border border-primary-container/40 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider w-fit block">
                Siguiente Paso Obligatorio
              </span>
              
              {application?.status === "Nuevo" && (
                <>
                  <h3 className="text-xl md:text-2xl font-bold">Completa la información del DS-160</h3>
                  <p className="text-white/60 text-xs md:text-sm leading-relaxed max-w-[500px]">
                    Actualmente tu formulario se encuentra en el paso <span className="font-semibold text-white">{(application?.step || 1)} de 6</span>. Completa las preguntas personales, laborales y de antecedentes en español. Tus datos se guardan solos.
                  </p>
                  <Link
                    href="/dashboard/ds160"
                    className="inline-flex items-center gap-2 bg-primary-container text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-primary transition-all w-fit shadow-lg shadow-primary-container/20 mt-2"
                  >
                    <span>Llenar Formulario</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </Link>
                </>
              )}

              {application?.status === "En revisión" && (
                <>
                  <h3 className="text-xl md:text-2xl font-bold">Tu cuestionario está en revisión</h3>
                  <p className="text-white/60 text-xs md:text-sm leading-relaxed max-w-[500px]">
                    Nuestros asesores expertos están validando cada respuesta de tu DS-160 para prevenir errores. También puedes subir tus documentos de soporte en el Centro de Documentos para acelerar tu expediente.
                  </p>
                  <Link
                    href="/dashboard/documents"
                    className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/10 px-6 py-3 rounded-xl text-sm font-semibold transition-all w-fit mt-2"
                  >
                    <span>Subir Documentos</span>
                    <span className="material-symbols-outlined text-[16px]">cloud_upload</span>
                  </Link>
                </>
              )}

              {application?.status === "Pago pendiente" && (
                <>
                  <h3 className="text-xl md:text-2xl font-bold">Valida el pago de derechos consulares</h3>
                  <p className="text-white/60 text-xs md:text-sm leading-relaxed max-w-[500px]">
                    El costo oficial es de $185 USD. Te hemos enviado la ficha de pago por correo o mensajes. Sube una fotografía o PDF de tu recibo de depósito bancario para agendar tus citas.
                  </p>
                  <Link
                    href="/dashboard/documents"
                    className="inline-flex items-center gap-2 bg-primary-container text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-primary transition-all w-fit shadow-lg shadow-primary-container/20 mt-2"
                  >
                    <span>Cargar Recibo de Pago</span>
                    <span className="material-symbols-outlined text-[16px]">upload_file</span>
                  </Link>
                </>
              )}

              {application?.status === "Cita agendada" && (
                <>
                  <h3 className="text-xl md:text-2xl font-bold">¡Tus citas han sido agendadas!</h3>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2.5 max-w-[550px] text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-white/50">Lugar de Cita:</span>
                      <span className="font-semibold text-white uppercase">{application.appointment?.location || "CDMX"}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-white/5 pt-2">
                      <span className="text-white/50">Cita CAS (Biométricos):</span>
                      <span className="font-semibold text-white">{formatDate(application.appointment?.casDate)} a las {application.appointment?.casTime} hrs</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-white/5 pt-2">
                      <span className="text-white/50">Entrevista Consular:</span>
                      <span className="font-semibold text-yellow-400">{formatDate(application.appointment?.interviewDate)} a las {application.appointment?.interviewTime} hrs</span>
                    </div>
                  </div>
                  <p className="text-white/60 text-xs leading-relaxed max-w-[500px] mt-2">
                    Tu asesor asignado te contactará 48 horas antes para tu sesión de simulacro de entrevista y revisión de documentos impresos.
                  </p>
                </>
              )}

              {application?.status === "Visa aprobada" && (
                <>
                  <h3 className="text-xl md:text-2xl font-bold text-emerald-400">¡Felicidades, Visa Aprobada!</h3>
                  <p className="text-white/60 text-xs md:text-sm leading-relaxed max-w-[500px]">
                    El cónsul ha autorizado tu visa B1/B2. En un plazo de 10 a 20 días hábiles podrás recoger tu pasaporte con la visa adherida o la tarjeta láser en la oficina de DHL seleccionada. ¡Que disfrutes tu viaje!
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Quick Access Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              href="/dashboard/ds160"
              className="bg-white p-5 rounded-2xl border border-outline-variant/30 hover:border-primary/20 transition-all flex flex-col justify-between h-36 shadow-level-1 group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined">edit_document</span>
              </div>
              <div>
                <h4 className="font-bold text-sm">Formulario DS-160</h4>
                <p className="text-[11px] text-outline mt-1">Completa tus respuestas en español de forma interactiva.</p>
              </div>
            </Link>

            <Link
              href="/dashboard/documents"
              className="bg-white p-5 rounded-2xl border border-outline-variant/30 hover:border-primary/20 transition-all flex flex-col justify-between h-36 shadow-level-1 group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/10 text-[#F59E0B] flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined">cloud_upload</span>
              </div>
              <div>
                <h4 className="font-bold text-sm">Centro de Documentación</h4>
                <p className="text-[11px] text-outline mt-1">Carga pasaporte, INE y recibos. Revisa validaciones.</p>
              </div>
            </Link>

            <Link
              href="/dashboard/messages"
              className="bg-white p-5 rounded-2xl border border-outline-variant/30 hover:border-primary/20 transition-all flex flex-col justify-between h-36 shadow-level-1 group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform relative">
                <span className="material-symbols-outlined">forum</span>
                {/* Simulated notification dot */}
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
              </div>
              <div>
                <h4 className="font-bold text-sm">Chat de Soporte</h4>
                <p className="text-[11px] text-outline mt-1">Habla con tu asesor asignado en tiempo real.</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Right Column: Visa Score (Circular Arc) + Waittimes Selector */}
        <div className="space-y-8">
          
          {/* Circular Visa Score Card */}
          <div className="bg-white rounded-2xl border border-outline-variant/30 p-6 text-center flex flex-col items-center shadow-level-1">
            <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-4 w-full text-left">
              Viabilidad de Aprobación
            </h3>
            
            <div className="relative w-36 h-36 flex items-center justify-center mt-2">
              <svg className="w-full h-full transform -rotate-90">
                {/* Background Ring */}
                <circle cx="72" cy="72" r={radius} stroke="#E2E8F0" strokeWidth="8" fill="transparent" />
                {/* Active Ring */}
                <circle
                  cx="72"
                  cy="72"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className={`${scoreColors?.ring} transition-all duration-700`}
                />
              </svg>
              
              <div className="absolute flex flex-col items-center">
                <span className="text-3xl font-black text-on-background">{scoreData.score}</span>
                <span className={`text-[9px] font-bold px-2 py-0.2 rounded-full uppercase border ${scoreColors?.bg} ${scoreColors?.text} ${scoreColors?.border} mt-1`}>
                  {scoreData.level}
                </span>
              </div>
            </div>
            
            <p className="text-xs text-on-surface-variant mt-4 leading-normal px-2">
              Tu puntaje indica una viabilidad <span className="font-bold">{scoreData.level}</span> de aprobación basado en la estabilidad e historial declarados.
            </p>
            
            <button
              onClick={() => setShowScoreModal(true)}
              className="mt-6 w-full py-2.5 border border-primary/20 text-primary text-xs font-semibold rounded-xl hover:bg-primary/5 transition-colors flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">info</span>
              Ver consejos de la entrevista
            </button>
          </div>

          {/* Waittimes Lookup Widget */}
          <div className="bg-white rounded-2xl border border-outline-variant/30 p-6 shadow-level-1 space-y-4">
            <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">
              Tiempos de Espera Consulares
            </h3>
            
            <div className="space-y-1">
              <label className="text-[10px] text-outline uppercase font-semibold">Seleccionar Sede</label>
              <div className="relative">
                <select
                  value={selectedCityId}
                  onChange={(e) => setSelectedCityId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:border-primary outline-none cursor-pointer appearance-none"
                >
                  {waitTimes.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.city}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[18px]">expand_more</span>
              </div>
            </div>

            <div className="space-y-4 border-t border-slate-100 pt-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-on-surface-variant flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-primary">fingerprint</span>
                  Datos (CAS):
                </span>
                <span className="font-bold text-on-background">{selectedCity.casWaitDays} {selectedCity.casWaitDays === 1 ? "día" : "días"}</span>
              </div>
              
              <div className="flex justify-between items-center text-xs">
                <span className="text-on-surface-variant flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-[#F59E0B]">group_work</span>
                  Entrevista Consular:
                </span>
                <span className="font-bold text-on-background">{selectedCity.interviewWaitDays} días</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating help WhatsApp Action */}
      <div className="bg-white rounded-2xl border border-outline-variant/30 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-level-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-500/10 text-green-600 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-[24px]">support_agent</span>
          </div>
          <div>
            <h4 className="font-bold text-sm">¿Tienes alguna duda con tu trámite?</h4>
            <p className="text-xs text-on-surface-variant">Conéctate directamente con nuestro equipo de asistencia por WhatsApp.</p>
          </div>
        </div>
        <a
          href={generateWhatsAppLink(`Hola Go-Visa, soy ${application?.userName || "cliente"} (ID: ${application?.userId || ""}). Necesito ayuda con mi solicitud de visa.`)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-[#25D366] text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-[#128C7E] transition-colors w-fit self-start md:self-auto"
        >
          <span className="material-symbols-outlined text-[18px]">chat</span>
          WhatsApp Soporte
        </a>
      </div>

      {/* Visa Approval Score Details Modal */}
      {showScoreModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-[600px] w-full max-h-[80vh] overflow-y-auto shadow-level-2 border border-slate-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[24px]">verified_user</span>
                <h3 className="font-bold text-lg text-on-background">Reporte Inteligente de Probabilidad</h3>
              </div>
              <button
                onClick={() => setShowScoreModal(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-outline"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Score summary */}
              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="w-16 h-16 rounded-full bg-primary-container/10 flex items-center justify-center text-primary-container font-black text-xl flex-shrink-0">
                  {scoreData.score}%
                </div>
                <div>
                  <h4 className="font-bold text-sm">Nivel de Viabilidad: <span className={`${scoreColors?.text}`}>{scoreData.level}</span></h4>
                  <p className="text-xs text-on-surface-variant mt-0.5">El cálculo se actualiza automáticamente con tus respuestas en el DS-160.</p>
                </div>
              </div>

              {/* Risks */}
              {scoreData.risks && scoreData.risks.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-red-500 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">warning</span>
                    Puntos de Riesgo / Atención
                  </h4>
                  <ul className="space-y-2 text-xs text-on-surface-variant list-disc pl-5 leading-normal">
                    {scoreData.risks.map((risk: string, i: number) => (
                      <li key={i}>{risk}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-green-600 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">task_alt</span>
                  Consejos para tu Entrevista Consular
                </h4>
                <ul className="space-y-2.5 text-xs text-on-surface-variant pl-4 border-l-2 border-green-500/30 leading-normal">
                  {scoreData.recommendations.map((rec: string, i: number) => (
                    <li key={i} className="relative pl-1">
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end bg-slate-50 rounded-b-2xl">
              <button
                onClick={() => setShowScoreModal(false)}
                className="bg-primary-container text-white px-5 py-2.5 rounded-xl text-xs font-semibold hover:bg-primary transition-colors"
              >
                Cerrar Reporte
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
