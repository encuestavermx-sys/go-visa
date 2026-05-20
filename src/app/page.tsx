"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { authService, waitTimeService } from "../lib/dbService";
import { generateWhatsAppLink } from "../lib/utils";

export default function LandingPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [waitTimes, setWaitTimes] = useState<any[]>([]);
  // Removed selectedCityId state to display all cities in parallel
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // States for Calculator
  const [passport, setPassport] = useState<string>("si_valida");
  const [age, setAge] = useState<string>("26_40");
  const [work, setWork] = useState<string>("empleado");
  const [income, setIncome] = useState<string>("10_25");
  const [travel, setTravel] = useState<string>("no");
  const [ties, setTies] = useState<string>("moderados");
  const [evaluated, setEvaluated] = useState<boolean>(false);
  const [loadingEvaluate, setLoadingEvaluate] = useState<boolean>(false);
  const [resultScore, setResultScore] = useState<number>(0);
  const [resultLevel, setResultLevel] = useState<string>("");
  const [resultRecs, setResultRecs] = useState<string[]>([]);

  useEffect(() => {
    // Check session
    authService.onAuthChange((user) => {
      setCurrentUser(user);
    });

    // Load wait times
    waitTimeService.getWaitTimes().then((data) => {
      setWaitTimes(data);
    });
  }, []);

  // Removed selectedCity calculation since all cities are displayed in a grid

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const handleEvaluate = (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingEvaluate(true);

    setTimeout(() => {
      // Points calculation
      let passportPoints = 0;
      if (passport === "si_valida") passportPoints = 5;
      else if (passport === "si_corta") passportPoints = 2;

      let agePoints = 0;
      if (age === "menos_18") agePoints = 3;
      else if (age === "18_25") agePoints = 2;
      else if (age === "26_40") agePoints = 6;
      else if (age === "41_60") agePoints = 6;
      else if (age === "mas_60") agePoints = 5;

      let workPoints = 0;
      if (work === "empleado") workPoints = 8;
      else if (work === "empresario") workPoints = 7;
      else if (work === "estudiante") workPoints = 5;
      else if (work === "jubilado") workPoints = 7;
      else if (work === "desempleado") workPoints = 2;

      let incomePoints = 0;
      if (income === "menos_10") incomePoints = 1;
      else if (income === "10_25") incomePoints = 5;
      else if (income === "25_50") incomePoints = 8;
      else if (income === "mas_50") incomePoints = 10;

      let travelPoints = 0;
      if (travel === "no") travelPoints = 0;
      else if (travel === "latam") travelPoints = 4;
      else if (travel === "top") travelPoints = 9;

      let tiesPoints = 0;
      if (ties === "fuertes") tiesPoints = 8;
      else if (ties === "moderados") tiesPoints = 5;
      else if (ties === "debiles") tiesPoints = 1;

      // Base score 65, capped at 98. Minimum worst profile score is 71 (encouraging minimum)
      const rawScore = 65 + (passportPoints + agePoints + workPoints + incomePoints + travelPoints + tiesPoints);
      const finalScore = Math.min(98, rawScore);

      setResultScore(finalScore);

      // Determine level
      let level = "Perfil Fuerte";
      if (finalScore < 76) {
        level = "Perfil Moderado";
      } else if (finalScore < 88) {
        level = "Perfil Favorable con Soporte";
      }
      setResultLevel(level);

      // Recommendations
      const recs: string[] = [];

      if (passport === "no" || passport === "si_corta") {
        recs.push(
          "Es indispensable contar con un pasaporte con vigencia mayor a 6 meses. Te asesoraremos para renovar o tramitar tu pasaporte prioritariamente."
        );
      }
      if (travel === "no") {
        recs.push(
          "Al no tener historial de viajes previos, cobra vital importancia destacar la estabilidad de tus lazos de retorno (empleo y propiedades)."
        );
      }
      if (ties === "debiles") {
        recs.push(
          "Tus lazos de retorno registrados son bajos. Estructuraremos tus comprobantes de nómina, estados de cuenta y arraigos familiares para presentarlos sólidamente ante el cónsul."
        );
      }
      if (work === "desempleado" || work === "estudiante") {
        recs.push(
          "Al no poseer empleo de nómina formal, es clave la designación de un aval o patrocinador económico. Te ayudaremos a fundamentar las cartas de patrocinio correspondientes."
        );
      }
      if (income === "menos_10") {
        recs.push(
          "Tus ingresos comprobables netos son bajos. Nos enfocaremos en fortalecer la presentación de otros activos familiares o justificar el viaje mediante un patrocinador."
        );
      }

      // Add a general positive tip if recommendations is empty
      if (recs.length === 0) {
        recs.push(
          "¡Tu perfil es muy sólido! Sin embargo, la mayoría de rechazos en perfiles fuertes se deben a discrepancias involuntarias al llenar el DS-160 o nerviosismo en la entrevista consular. Te prepararemos con un simulacro interactivo."
        );
      }

      setResultRecs(recs);
      setEvaluated(true);
      setLoadingEvaluate(false);
    }, 1000);
  };

  const faqs = [
    {
      q: "¿Qué documentos necesito para comenzar?",
      a: "Para iniciar solo necesitas tu pasaporte mexicano vigente. Posteriormente te guiaremos para subir tu INE, comprobantes de ingresos y fotografías infantiles si son necesarias.",
    },
    {
      q: "¿Cuánto tiempo tarda el trámite de visa?",
      a: "El tiempo depende de la disponibilidad de citas en los consulados de EE. UU. en México (puede variar de 6 a 15 meses para la entrevista). Nosotros monitoreamos constantemente las fechas para conseguirte la cita más cercana posible.",
    },
    {
      q: "¿Qué pasa si nunca he viajado al extranjero?",
      a: "No te preocupes. Nuestro algoritmo calculará tu puntaje de viabilidad y te daremos recomendaciones específicas sobre cómo demostrar tus lazos económicos y familiares en México ante el cónsul.",
    },
    {
      q: "¿Cómo funciona la garantía de revisión humana?",
      a: "Antes de enviar tu formulario oficial DS-160 a la Embajada, un experto de nuestro equipo administrativo revisará cada una de tus respuestas para corregir errores ortográficos, inconsistencias u omisiones que puedan ser motivo de rechazo.",
    },
  ];

  return (
    <div className="bg-[#f8f9ff] text-[#0b1c30] min-h-screen selection:bg-primary/20 selection:text-primary flex flex-col overflow-x-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px] pointer-events-none z-0"></div>

      {/* Navbar */}
      <header className="relative z-10 w-full max-w-container-max mx-auto px-margin-mobile md:px-gutter h-20 flex items-center justify-between border-b border-slate-200/60">
        <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <img src="/logo.png" alt="Go-Visa Logo" className="h-9 w-auto object-contain" />
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <a href="#como-funciona" className="hover:text-primary transition-colors">Cómo funciona</a>
          <a href="#beneficios" className="hover:text-primary transition-colors">Beneficios</a>
          <a href="#tiempos-espera" className="hover:text-primary transition-colors">Citas y Esperas</a>
          <a href="#preguntas-frecuentes" className="hover:text-primary transition-colors">Preguntas Frecuentes</a>
        </nav>

        <div className="flex items-center gap-4">
          {currentUser ? (
            <Link
              href={currentUser.role === "admin" ? "/admin" : "/dashboard"}
              className="bg-primary text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/10"
            >
              Ir a mi Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-sm font-semibold hover:text-primary transition-all px-3 py-2 text-slate-600">
                Iniciar sesión
              </Link>
              <Link
                href="/register"
                className="bg-primary text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/10"
              >
                Comenzar Trámite
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 w-full max-w-[1000px] mx-auto px-margin-mobile md:px-gutter pt-16 md:pt-28 pb-16 text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-xs font-semibold text-primary mb-8 shadow-sm">
          <span className="material-symbols-outlined text-[16px] text-primary">verified_user</span>
          <span>98.6% de Aprobación en Visas Asesoradas</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.1] text-[#0b1c30] max-w-[850px] mb-6">
          Tramita tu visa americana de forma{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">
            fácil, guiada y sin estrés.
          </span>
        </h1>

        <p className="text-base md:text-xl text-slate-600 max-w-[700px] mb-10 leading-relaxed">
          El acompañamiento experto y digital que necesitas. Evaluamos tu perfil consular, llenamos tu DS-160 sin errores y gestionamos tu cita más rápida en México.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
          <Link
            href={currentUser ? (currentUser.role === "admin" ? "/admin" : "/dashboard") : "/register"}
            className="w-full sm:w-auto bg-primary text-white px-8 py-4 rounded-xl text-base font-semibold hover:bg-primary/90 hover:scale-[1.03] active:scale-[0.98] transition-all shadow-lg shadow-primary/20 text-center"
          >
            {currentUser ? "Iniciar Trámite" : "Iniciar mi Solicitud"}
          </Link>
          <a
            href="#calculadora-factibilidad"
            className="w-full sm:w-auto bg-white text-slate-800 border border-slate-200 px-8 py-4 rounded-xl text-base font-semibold hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-center shadow-sm"
          >
            <span className="material-symbols-outlined text-[20px] text-primary">analytics</span>
            Medir Factibilidad
          </a>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px] text-primary">check_circle</span>
            Formulario DS-160 Simplificado
          </span>
          <span className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px] text-primary">check_circle</span>
            Revisión Humana Incluida
          </span>
          <span className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px] text-primary">check_circle</span>
            Monitoreo Activo de Citas
          </span>
        </div>
      </section>

      {/* Steps Onboarding ("Cómo funciona") */}
      <section id="como-funciona" className="relative z-10 w-full max-w-container-max mx-auto px-margin-mobile md:px-gutter py-20 border-t border-slate-200/60">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-[#0b1c30]">El camino más simple hacia tu visa</h2>
          <p className="text-slate-600 max-w-[600px] mx-auto">Olvídate de formularios complejos en inglés e instructivos confusos. Nosotros nos encargamos de todo el proceso en 4 sencillos pasos.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {[
            {
              step: "01",
              title: "Registro y Cuestionario",
              desc: "Completa nuestro sencillo cuestionario digital en español. Te llevará solo 15 minutos en lugar de horas en el portal oficial.",
              icon: "edit_note"
            },
            {
              step: "02",
              title: "Revisión Humana",
              desc: "Un asesor experto analiza tu perfil minuciosamente, corrigiendo cualquier detalle que pueda despertar dudas en el cónsul.",
              icon: "person_search"
            },
            {
              step: "03",
              title: "Pago y Citas",
              desc: "Te entregamos los formatos oficiales de pago y reservamos tus citas en el CAS y el Consulado optimizando fechas.",
              icon: "calendar_month"
            },
            {
              step: "04",
              title: "Asesoría Final",
              desc: "Te preparamos con un temario personalizado y simulacro de preguntas comunes según tu perfil de viabilidad.",
              icon: "co-present"
            }
          ].map((item, index) => (
            <div key={index} className="bg-white border border-slate-200/60 rounded-2xl p-6 hover:shadow-md hover:border-slate-300 transition-all flex flex-col group shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <span className="text-4xl font-black text-slate-200 group-hover:text-primary transition-colors">{item.step}</span>
                <span className="material-symbols-outlined text-primary bg-blue-50 p-2.5 rounded-xl text-[24px]">
                  {item.icon}
                </span>
              </div>
              <h3 className="text-lg font-bold mb-2 text-[#0b1c30]">{item.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bento Grid Benefits Section */}
      <section id="beneficios" className="relative z-10 w-full max-w-container-max mx-auto px-margin-mobile md:px-gutter py-20 border-t border-slate-200/60">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-[#0b1c30]">Diseñado para tu tranquilidad</h2>
          <p className="text-slate-600 max-w-[600px] mx-auto">Creamos herramientas intuitivas y seguras para eliminar el estrés y maximizar tus probabilidades de éxito.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 - Long Bento */}
          <div className="md:col-span-2 bg-white border border-slate-200/60 rounded-2xl p-8 flex flex-col md:flex-row items-center gap-8 hover:border-slate-300 transition-all shadow-sm">
            <div className="space-y-4 flex-1">
              <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border border-blue-100">Único en el mercado</span>
              <h3 className="text-xl md:text-2xl font-bold text-[#0b1c30]">Calculadora de Probabilidad de Visa (Score)</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Nuestra plataforma analiza en tiempo real variables clave de arraigo (estabilidad laboral, ingresos, lazos familiares) y calcula un puntaje del 0 al 100 con consejos personalizados de mejora para tu entrevista.
              </p>
            </div>
            <div className="w-full md:w-[220px] bg-slate-50 border border-slate-200 rounded-xl p-5 text-center flex flex-col items-center flex-shrink-0">
              <span className="text-[11px] text-slate-500 uppercase tracking-widest font-semibold mb-2">Simulador de Score</span>
              <div className="text-4xl font-black text-primary mb-1">84%</div>
              <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-3 py-0.5 rounded-full font-bold">PERFIL SÓLIDO</span>
              <div className="border-t border-slate-200 w-full mt-4 pt-3 text-[10px] text-slate-500 text-left space-y-1">
                <div>• +15 pts: Antigüedad laboral</div>
                <div>• +20 pts: Historial de viajes</div>
              </div>
            </div>
          </div>

          {/* Card 2 - Square Bento */}
          <div className="bg-white border border-slate-200/60 rounded-2xl p-8 hover:border-slate-300 transition-all flex flex-col justify-between shadow-sm">
            <span className="material-symbols-outlined text-primary bg-blue-50 p-3 rounded-xl w-fit text-[28px] mb-6">
              security
            </span>
            <div>
              <h3 className="text-lg font-bold mb-2 text-[#0b1c30]">Tus Datos 100% Seguros</h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                Encriptamos toda la información sensible del cuestionario DS-160 y tus documentos con tecnología SSL y bases de datos seguras.
              </p>
            </div>
          </div>

          {/* Card 3 - Square Bento */}
          <div className="bg-white border border-slate-200/60 rounded-2xl p-8 hover:border-slate-300 transition-all flex flex-col justify-between shadow-sm">
            <span className="material-symbols-outlined text-primary bg-blue-50 p-3 rounded-xl w-fit text-[28px] mb-6">
              support_agent
            </span>
            <div>
              <h3 className="text-lg font-bold mb-2 text-[#0b1c30]">Acompañamiento Humano</h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                No estás solo en esto. Además del panel, cuentas con chat integrado en tiempo real y soporte directo por WhatsApp a un clic.
              </p>
            </div>
          </div>

          {/* Card 4 - Long Bento */}
          <div className="md:col-span-2 bg-white border border-slate-200/60 rounded-2xl p-8 flex flex-col md:flex-row items-center gap-8 hover:border-slate-300 transition-all shadow-sm">
            <div className="space-y-4 flex-1">
              <span className="bg-yellow-50 text-yellow-700 border border-yellow-200 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">Cero Estrés</span>
              <h3 className="text-xl md:text-2xl font-bold text-[#0b1c30]">Monitoreo de Citas Cercanas</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                El sistema consular puede tardar meses. Nuestro equipo monitorea diariamente cancelaciones y aperturas de fechas prioritarias para adelantarte la cita en el consulado que tú elijas.
              </p>
            </div>
            <div className="w-full md:w-[220px] bg-slate-50 border border-slate-200 rounded-xl p-5 text-center flex-shrink-0">
              <div className="text-[10px] text-yellow-600 font-bold tracking-widest uppercase mb-1">¡Alerta de Fecha!</div>
              <div className="text-xs font-bold text-[#0b1c30] mb-2">Cita Liberada en Hermosillo</div>
              <div className="bg-yellow-50 text-yellow-800 border border-yellow-200 p-2 rounded text-xs font-semibold">Agosto 14, 2026</div>
              <span className="text-[9px] text-slate-500 mt-1.5 block">Fecha original: Octubre 2026</span>
            </div>
          </div>
        </div>
      </section>

      {/* Consulate Wait Times Grid Widget */}
      <section id="tiempos-espera" className="relative z-10 w-full max-w-container-max mx-auto px-margin-mobile md:px-gutter py-20 border-t border-slate-200/60">
        {/* Title Section */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
          <div className="bg-blue-50 text-blue-600 border border-blue-100 text-[10px] font-bold px-3.5 py-1 rounded-full uppercase tracking-wider inline-block">
            Planificación de Citas
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#0b1c30] tracking-tight">
            Tiempos de espera oficiales actualizados (U.S. Embassy)
          </h2>
          <p className="text-slate-600 leading-relaxed text-sm md:text-base">
            Considera estos tiempos para la cita presencial en el consulado y en el Centro de Atención a Solicitantes (CAS) en México.
          </p>
        </div>

        {/* Grid of Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...waitTimes]
            .filter((item) => ["cdmx", "gdl", "mty", "tij", "cdj", "mer", "her", "nld"].includes(item.id))
            .sort((a, b) => {
              const cityOrder = ["cdmx", "gdl", "mty", "tij", "cdj", "mer", "her", "nld"];
              return cityOrder.indexOf(a.id) - cityOrder.indexOf(b.id);
            })
            .map((item) => {
              const getDemandInfo = (days: number) => {
                if (days >= 250) {
                  return { text: "Demanda Alta", style: "bg-red-50 text-red-650 border border-red-100" };
                } else if (days >= 130) {
                  return { text: "Demanda Media", style: "bg-emerald-50 text-emerald-600 border border-emerald-100" };
                } else {
                  return { text: "Demanda Baja", style: "bg-emerald-50 text-emerald-600 border border-emerald-100" };
                }
              };

              const getApprovalRate = (id: string) => {
                const rates: Record<string, number> = {
                  cdmx: 92,
                  gdl: 91,
                  mty: 94,
                  tij: 89,
                  cdj: 89,
                  mer: 90,
                  her: 93,
                  nld: 88,
                };
                return rates[id] || item.approvalRate || 90;
              };

              const demand = getDemandInfo(item.interviewWaitDays);

              return (
                <div
                  key={item.id}
                  className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    {/* Card Header */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="material-symbols-outlined text-[20px] text-blue-500 flex-shrink-0">location_on</span>
                        <span className="text-sm font-extrabold text-[#0b1c30] truncate">{item.city}</span>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-lg border flex-shrink-0 ${demand.style}`}>
                        {demand.text}
                      </span>
                    </div>

                    {/* Card Wait Days */}
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Trámite CAS:</span>
                        <span className="font-extrabold text-[#0b1c30]">
                          {item.casWaitDays} {item.casWaitDays === 1 ? "Día hábil" : "Días hábiles"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Entrevista Consular:</span>
                        <span className="font-extrabold text-[#0b1c30]">
                          {item.interviewWaitDays} Días
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Approval Rate */}
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Tasa Aprobación Promedio:</span>
                      <span className="font-bold text-emerald-600">{getApprovalRate(item.id)}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </section>

      {/* Calculadora de Factibilidad Section */}
      <section id="calculadora-factibilidad" className="relative z-10 w-full max-w-container-max mx-auto px-margin-mobile md:px-gutter py-20 border-t border-slate-200/60">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column - Information */}
          <div className="lg:col-span-5 space-y-6">
            <span className="bg-blue-50 text-blue-600 border border-blue-100 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider inline-block">
              Tecnología Inteligente
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#0b1c30]">
              Pre-evalúa tu probabilidad con nuestro algoritmo
            </h2>
            <p className="text-slate-600 leading-relaxed text-sm md:text-base">
              Muchos rechazos consulares ocurren porque el solicitante no sabe cómo manifestar lazos consistentes. Nuestro asesor de perfil calcula el peso socioeconómico que verá el cónsul.
            </p>
            
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-slate-700 text-sm">
                <span className="material-symbols-outlined text-blue-500 text-[20px] flex-shrink-0 mt-0.5">check_circle</span>
                <span>Basado en manuales consulares reales de EE.UU.</span>
              </li>
              <li className="flex items-start gap-3 text-slate-700 text-sm">
                <span className="material-symbols-outlined text-blue-500 text-[20px] flex-shrink-0 mt-0.5">check_circle</span>
                <span>Analiza tu arraigo escolar, laboral, mercantil y familiar</span>
              </li>
              <li className="flex items-start gap-3 text-slate-700 text-sm">
                <span className="material-symbols-outlined text-blue-500 text-[20px] flex-shrink-0 mt-0.5">check_circle</span>
                <span>Tips locales para Ciudad de México y provincia</span>
              </li>
            </ul>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 flex items-start gap-3.5 leading-normal">
              <span className="material-symbols-outlined text-emerald-500 text-[24px] flex-shrink-0 mt-0.5">verified_user</span>
              <p className="text-xs text-slate-500">
                Cumplimos rigurosamente la Ley Federal de Protección de Datos Personales en Posesión de Particulares. Tus respuestas son de carácter confidencial.
              </p>
            </div>
          </div>

          {/* Right Column - Form Card */}
          <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-3xl p-6 md:p-8 shadow-sm relative overflow-hidden">
            <h3 className="text-lg font-bold text-[#0b1c30] flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
              <span className="material-symbols-outlined text-blue-500 animate-pulse">auto_awesome</span>
              Calculadora de Idoneidad B1/B2
            </h3>
            
            <form onSubmit={handleEvaluate} className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Question 1 */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-500 font-bold">¿Tienes pasaporte mexicano vigente?</label>
                <div className="relative">
                  <select
                    value={passport}
                    onChange={(e) => setPassport(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-[#0b1c30] focus:border-blue-500 outline-none cursor-pointer appearance-none"
                  >
                    <option value="si_valida">Sí (Vigencia mayor a 6 meses)</option>
                    <option value="si_corta">Sí (Vigencia menor a 6 meses)</option>
                    <option value="no">No (Tengo que tramitarlo)</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[18px]">expand_more</span>
                </div>
              </div>

              {/* Question 2 */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-500 font-bold">Rango de edad</label>
                <div className="relative">
                  <select
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-[#0b1c30] focus:border-blue-500 outline-none cursor-pointer appearance-none"
                  >
                    <option value="menos_18">Menos de 18 años</option>
                    <option value="18_25">18 a 25 años</option>
                    <option value="26_40">26 a 40 años</option>
                    <option value="41_60">41 a 60 años</option>
                    <option value="mas_60">Más de 60 años</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[18px]">expand_more</span>
                </div>
              </div>

              {/* Question 3 */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-500 font-bold">Situación Laboral / Académica</label>
                <div className="relative">
                  <select
                    value={work}
                    onChange={(e) => setWork(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-[#0b1c30] focus:border-blue-500 outline-none cursor-pointer appearance-none"
                  >
                    <option value="empleado">Empleado (Nómina estable)</option>
                    <option value="empresario">Empresario / Socio / Autoempleado</option>
                    <option value="estudiante">Estudiante</option>
                    <option value="jubilado">Jubilado / Pensionado</option>
                    <option value="desempleado">Desempleado / Labores del hogar</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[18px]">expand_more</span>
                </div>
              </div>

              {/* Question 4 */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-500 font-bold">Ingresos mensuales netos (MXN)</label>
                <div className="relative">
                  <select
                    value={income}
                    onChange={(e) => setIncome(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-[#0b1c30] focus:border-blue-500 outline-none cursor-pointer appearance-none"
                  >
                    <option value="menos_10">Menos de $10,000 netos</option>
                    <option value="10_25">$10,000 - $25,000 netos</option>
                    <option value="25_50">$25,000 - $50,000 netos</option>
                    <option value="mas_50">Más de $50,000 netos</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[18px]">expand_more</span>
                </div>
              </div>

              {/* Question 5 */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-500 font-bold">Historial de viajes al extranjero</label>
                <div className="relative">
                  <select
                    value={travel}
                    onChange={(e) => setTravel(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-[#0b1c30] focus:border-blue-500 outline-none cursor-pointer appearance-none"
                  >
                    <option value="no">No (Sería primer salida internacional)</option>
                    <option value="latam">Sí (Solo América Latina / Caribe)</option>
                    <option value="top">Sí (EE.UU., Europa, Asia o Canadá)</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[18px]">expand_more</span>
                </div>
              </div>

              {/* Question 6 */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-500 font-bold">Lazos de retorno (Propiedades, Activos)</label>
                <div className="relative">
                  <select
                    value={ties}
                    onChange={(e) => setTies(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-[#0b1c30] focus:border-blue-500 outline-none cursor-pointer appearance-none"
                  >
                    <option value="fuertes">Fuertes (Propiedades, negocio propio, empleo estable)</option>
                    <option value="moderados">Moderados (Estudios vigentes, renta estable)</option>
                    <option value="debiles">Débiles (Sin bienes ni empleo formal actualmente)</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[18px]">expand_more</span>
                </div>
              </div>

              <div className="md:col-span-2 pt-2">
                <button
                  type="submit"
                  disabled={loadingEvaluate}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-500/10 cursor-pointer active:scale-[0.98]"
                >
                  {loadingEvaluate ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Analizando perfil...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                      Evaluar Perfil Ahora
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Results section */}
            {evaluated && (
              <div className="mt-8 border border-emerald-200 bg-emerald-50/40 rounded-2xl p-5 md:p-6 space-y-4 animate-fade-in">
                <div className="flex items-center justify-between border-b border-emerald-100 pb-3 flex-wrap gap-2">
                  <div className="text-xs font-bold text-emerald-800 tracking-wide uppercase">
                    DIAGNÓSTICO CONSULAR PRÓVIDO:
                  </div>
                  <div className="bg-emerald-100 text-emerald-800 text-[11px] font-extrabold px-3 py-1 rounded-full border border-emerald-250">
                    SCORE: {resultScore}/100
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[#0b1c30] font-extrabold text-base">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  {resultLevel}
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-[#0b1c30]">Puntos clave para afianzar en tu trámite:</h4>
                  <ul className="space-y-2.5">
                    {resultRecs.map((rec, i) => (
                      <li key={i} className="text-xs text-slate-700 flex items-start gap-2 leading-relaxed">
                        <span className="material-symbols-outlined text-amber-500 text-[16px] mt-0.5">warning</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2">
                  <Link
                    href={`/register?score=${resultScore}`}
                    className="w-full bg-[#0c2045] hover:bg-[#0c2045]/90 text-white py-3.5 px-6 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-sm text-sm active:scale-[0.98]"
                  >
                    Guardar Perfil y Comenzar Roadmap de Visa-Go
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="preguntas-frecuentes" className="relative z-10 w-full max-w-[800px] mx-auto px-margin-mobile md:px-gutter py-20 border-t border-slate-200/60">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-[#0b1c30]">Preguntas Frecuentes</h2>
          <p className="text-slate-600 text-sm">Todo lo que necesitas saber antes de iniciar tu trámite con nosotros.</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white border border-slate-200/60 rounded-xl overflow-hidden transition-all duration-300 shadow-sm">
              <button
                onClick={() => toggleFaq(index)}
                className="w-full px-6 py-5 flex items-center justify-between text-left font-semibold hover:bg-slate-50 transition-colors text-[#0b1c30]"
              >
                <span>{faq.q}</span>
                <span className={`material-symbols-outlined transition-transform duration-300 text-slate-400 ${openFaq === index ? "rotate-180" : ""}`}>
                  expand_more
                </span>
              </button>
              <div
                className={`transition-all duration-300 overflow-hidden ${
                  openFaq === index ? "max-h-40 border-t border-slate-100" : "max-h-0"
                }`}
              >
                <p className="px-6 py-5 text-sm text-slate-600 leading-relaxed bg-slate-50/50">{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 w-full max-w-container-max mx-auto px-margin-mobile md:px-gutter pb-28">
        <div className="bg-gradient-to-br from-[#0c2045] to-[#060c18] border border-blue-900/30 rounded-3xl p-8 md:p-16 text-center space-y-8 relative overflow-hidden flex flex-col items-center text-white">
          <div className="absolute top-0 right-0 w-80 h-80 bg-primary/20 rounded-full blur-[100px] pointer-events-none"></div>
          
          <h2 className="text-3xl md:text-5xl font-extrabold max-w-[700px] leading-tight">
            ¿Listo para iniciar tu viaje sin complicaciones?
          </h2>
          <p className="text-white/70 max-w-[600px] text-sm md:text-base leading-relaxed">
            Regístrate hoy mismo, completa el cuestionario simplificado en español y deja que nuestro equipo de expertos se encargue del trabajo pesado.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
            <Link
              href={currentUser ? (currentUser.role === "admin" ? "/admin" : "/dashboard") : "/register"}
              className="w-full sm:w-auto bg-primary-container text-white px-8 py-4 rounded-xl text-base font-semibold hover:bg-primary hover:scale-[1.03] active:scale-[0.98] transition-all shadow-lg shadow-primary-container/30 text-center"
            >
              {currentUser ? "Iniciar Trámite" : "Comenzar mi Trámite"}
            </Link>
            <a
              href="#calculadora-factibilidad"
              className="w-full sm:w-auto bg-white/5 text-white border border-white/10 px-8 py-4 rounded-xl text-base font-semibold hover:bg-white/10 hover:border-white/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-center"
            >
              <span className="material-symbols-outlined text-[20px] text-blue-400">analytics</span>
              Medir Factibilidad
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-container-max mx-auto px-margin-mobile md:px-gutter py-12 border-t border-slate-200/60 text-slate-400 text-xs md:text-sm">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-lg">
            <img src="/logo.png" alt="Go-Visa Logo" className="h-7 w-auto object-contain" />
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-slate-500">
            <a href="#como-funciona" className="hover:text-primary transition-colors">Cómo funciona</a>
            <a href="#beneficios" className="hover:text-primary transition-colors">Beneficios</a>
            <a href="#tiempos-espera" className="hover:text-primary transition-colors">Tiempos de espera</a>
            <a href="#preguntas-frecuentes" className="hover:text-primary transition-colors">Ayuda</a>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-[11px] md:text-xs text-slate-400">
          <span>&copy; {new Date().getFullYear()} Go-Visa. Todos los derechos reservados.</span>
          <div className="flex gap-4">
            <span className="hover:text-slate-600 cursor-pointer">Términos y Condiciones</span>
            <span className="hover:text-slate-600 cursor-pointer">Aviso de Privacidad</span>
          </div>
        </div>
        
        <div className="mt-8 text-center text-[10px] text-slate-400/60 leading-relaxed">
          Disclaimer: Go-Visa es un portal de asesoría e intermediación independiente. No estamos afiliados con el Departamento de Estado de los EE. UU. ni con ninguna representación consular oficial. El otorgamiento final de la visa americana es facultad exclusiva de las autoridades consulares estadounidenses.
        </div>
      </footer>
    </div>
  );
}
