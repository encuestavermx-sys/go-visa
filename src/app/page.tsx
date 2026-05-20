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
    <div className="bg-[#f8f9ff] bg-grid-pattern text-[#0b1c30] min-h-screen selection:bg-primary/20 selection:text-primary flex flex-col overflow-x-hidden relative">
      
      {/* Upper Dark Container for Navbar, Hero and Trust Banner */}
      <div className="bg-[#030712] text-white relative overflow-hidden bg-grid-dark border-b border-white/5">
        {/* Dark Background Glows */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[150px] pointer-events-none z-0"></div>

        {/* Navbar */}
        <header className="relative z-10 w-full max-w-container-max mx-auto px-margin-mobile md:px-gutter h-20 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
              <img src="/logo.png" alt="Go-Visa Logo" className="h-9 w-auto object-contain brightness-0 invert" />
            </Link>
            <span className="bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
              B1/B2
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#como-funciona" className="hover:text-white transition-colors">¿Cómo funciona?</a>
            <a href="#calculadora-factibilidad" className="hover:text-white transition-colors">Evaluador Inteligente</a>
            <a href="#tiempos-espera" className="hover:text-white transition-colors">Tiempos de Espera</a>
            <a href="#testimonios" className="hover:text-white transition-colors">Testimonios</a>
          </nav>

          <div className="flex items-center gap-4">
            {currentUser ? (
              <Link
                href={currentUser.role === "admin" ? "/admin" : "/dashboard"}
                className="bg-blue-600 hover:bg-blue-550 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 active:scale-[0.98] shadow-lg shadow-blue-600/10"
              >
                Iniciar Trámite
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm font-semibold hover:text-white transition-all px-3 py-2 text-slate-300">
                  Iniciar sesión
                </Link>
                <Link
                  href="/register"
                  className="bg-blue-600 hover:bg-blue-550 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 active:scale-[0.98] shadow-lg shadow-blue-600/10"
                >
                  Iniciar Trámite
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </Link>
              </>
            )}
          </div>
        </header>

        {/* Hero Section */}
        <section className="relative z-10 w-full max-w-container-max mx-auto px-margin-mobile md:px-gutter pt-12 md:pt-24 pb-16 md:pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Columna Izquierda: Información */}
            <div className="lg:col-span-6 space-y-8 flex flex-col items-start text-left">
              <h1 className="text-4xl md:text-[52px] font-black tracking-tight leading-[1.1] text-white">
                Tu visa americana,<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-400">
                  sin complicaciones.
                </span>
              </h1>

              <p className="text-base md:text-lg text-slate-350 max-w-[540px] leading-relaxed">
                Te guiamos paso a paso y nos encargamos del proceso para que tú solo te preocupes por tu viaje.
              </p>

              {/* Checklist de beneficios */}
              <div className="space-y-3.5 w-full">
                {[
                  "Asistencia personalizada",
                  "Menos errores, más seguridad",
                  "Seguimiento por WhatsApp",
                  "Ahorra tiempo y evita estrés"
                ].map((benefit, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-blue-500/10 border border-blue-500/30">
                      <span className="material-symbols-outlined text-[14px] text-blue-400 font-extrabold">check</span>
                    </div>
                    <span className="text-sm md:text-base text-slate-200 font-medium">{benefit}</span>
                  </div>
                ))}
              </div>

              {/* Botón y Prueba Social */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 w-full pt-4">
                <Link
                  href={currentUser ? (currentUser.role === "admin" ? "/admin" : "/dashboard") : "/register"}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl text-base font-semibold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-blue-500/20 text-center"
                >
                  Comenzar mi trámite
                </Link>

                <div className="flex items-center gap-3">
                  {/* Overlapping Avatars */}
                  <div className="flex -space-x-3">
                    <img src="/sofia.png" alt="Sofía" className="w-9 h-9 rounded-full object-cover border-2 border-[#030712] shadow-md" />
                    <img src="/alejandro.png" alt="Alejandro" className="w-9 h-9 rounded-full object-cover border-2 border-[#030712] shadow-md" />
                    <img src="/gabriela.png" alt="Gabriela" className="w-9 h-9 rounded-full object-cover border-2 border-[#030712] shadow-md" />
                  </div>
                  <div className="text-xs md:text-sm">
                    <div className="text-white font-bold tracking-wide">+2,500 personas</div>
                    <div className="text-slate-400">ya viajaron con Go-Visa</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Columna Derecha: Ilustración Interactiva */}
            <div className="lg:col-span-6 relative flex justify-center items-center h-[420px] md:h-[500px] mt-10 lg:mt-0">
              
              {/* Contenedor relativo de la composición */}
              <div className="relative w-full max-w-[450px] h-full flex justify-center items-center">
                
                {/* 1. Avión volando con trayecto */}
                <div className="absolute top-2 left-6 w-[280px] h-[160px] pointer-events-none z-10">
                  {/* Trayectoria del avión */}
                  <svg className="w-full h-full" viewBox="0 0 280 160" fill="none">
                    <path
                      d="M20,140 Q100,60 260,20"
                      stroke="rgba(255, 255, 255, 0.2)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeDasharray="6 6"
                      className="animate-dash"
                    />
                  </svg>
                  {/* Avión flotante al final del trayecto */}
                  <div className="absolute top-[8px] right-[4px] animate-float-plane">
                    <svg className="w-8 h-8 text-white filter drop-shadow-md" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L14 20.5V13.5L21 16z" />
                    </svg>
                  </div>
                </div>

                {/* 2. Pasaporte detrás del teléfono */}
                <div className="absolute left-4 top-24 w-[160px] md:w-[190px] h-[220px] md:h-[260px] animate-float-passport z-0">
                  <div className="w-full h-full bg-gradient-to-br from-[#003d29] to-[#012519] rounded-xl border border-[#005e3f]/40 p-4 shadow-2xl flex flex-col justify-between text-left select-none relative overflow-hidden">
                    {/* Glow inside passport */}
                    <div className="absolute -top-12 -left-12 w-28 h-28 bg-[#d4af37]/5 rounded-full blur-xl"></div>
                    
                    {/* Passport content */}
                    <div className="space-y-1.5">
                      <div className="text-[10px] md:text-xs font-serif tracking-[0.2em] text-[#d4af37] font-semibold opacity-90 uppercase">MÉXICO</div>
                      <div className="w-8 h-[1px] bg-[#d4af37]/40"></div>
                    </div>
                    
                    {/* Passport Emblem (Mexican Style) */}
                    <div className="my-auto flex justify-center py-2 text-[#d4af37]/80 text-center">
                      <svg className="w-16 h-16 md:w-[76px] md:h-[76px] mx-auto" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.2">
                        {/* Outer circular pattern */}
                        <circle cx="50" cy="50" r="38" strokeDasharray="3 3" />
                        <circle cx="50" cy="50" r="32" opacity="0.4" />
                        
                        {/* Stylized eagle silhouette in gold */}
                        <path d="M50 28c1.5-1.5 3-2 5-2s3.5.5 4 1.5-1.5 3-4 4-5-1.5-5-3.5z" fill="currentColor" fillOpacity="0.25" />
                        
                        {/* Wings and tail feathers */}
                        <path strokeLinecap="round" d="M43 38c-5-2-9.5.5-12 4.5 4-1 8-1.5 12-1M57 38c5-2 9.5.5 12 4.5-4-1-8-1.5-12-1" />
                        <path strokeLinecap="round" d="M45 42c-2 4-3 8-3 12 4-1.5 8-2 11-1M55 42c2 4 3 8 3 12-4-1.5-8-2-11-1" />
                        
                        {/* Snake and beak */}
                        <path strokeLinecap="round" strokeLinejoin="round" d="M49 32c-1.5 2-1 4 .5 5s3.5-1.5 4-.5-1.5 3.5-2.5 4.5.5 2.5 1.5 1.5" />
                        
                        {/* Cactus pads base */}
                        <path strokeLinecap="round" d="M38 62c6 2 18 2 24 0M45 62v10M50 62v10M55 62v10" />
                        
                        {/* Laurel branches */}
                        <path strokeLinecap="round" d="M28 58c-2-8 .5-16.5 5.5-21M72 58c2-8-.5-16.5-5.5-21" strokeDasharray="2 2" />
                      </svg>
                    </div>

                    <div className="space-y-1">
                      <div className="text-[10px] md:text-xs font-serif tracking-[0.22em] text-[#d4af37]/90 font-semibold uppercase">PASAPORTE</div>
                    </div>
                  </div>
                </div>

                {/* 3. Mockup de teléfono con Chat de WhatsApp */}
                <div className="absolute right-4 md:right-8 top-12 w-[220px] md:w-[245px] bg-[#070a13] rounded-[36px] p-2.5 border-4 border-slate-800 shadow-2xl z-20 animate-float-phone">
                  {/* Phone screen inner */}
                  <div className="w-full bg-[#f0f2f5] rounded-[28px] overflow-hidden flex flex-col aspect-[9/18.5] text-left text-slate-800 relative">
                    
                    {/* Notch / Dynamic Island */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-4.5 bg-black rounded-b-xl z-35 flex items-center justify-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-900 absolute left-4"></span>
                    </div>

                    {/* Chat Header */}
                    <div className="bg-[#0b1c30] pt-6 pb-2.5 px-3 flex items-center gap-2 border-b border-slate-200 shadow-sm relative z-25">
                      <span className="material-symbols-outlined text-[16px] text-white cursor-pointer">arrow_back</span>
                      
                      {/* Avatar / App Logo */}
                      <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center">
                        <svg className="w-4.5 h-4.5 text-white" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                        </svg>
                      </div>

                      <div className="min-w-0">
                        <div className="text-[11px] font-bold text-white leading-tight">Go-Visa</div>
                        <div className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span className="text-[8px] text-slate-350">En línea</span>
                        </div>
                      </div>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 p-2.5 space-y-2 overflow-y-auto bg-[#efeae2] text-[9.5px] leading-relaxed relative">
                      {/* Message 1: Received */}
                      <div className="max-w-[85%] bg-white rounded-lg p-2 shadow-sm rounded-tl-none space-y-0.5">
                        <p className="text-slate-800">
                          ¡Hola Carlos! 👋 Te damos la bienvenida a Go-Visa.
                        </p>
                        <span className="text-[7.5px] text-slate-400 block text-right">11:45 AM</span>
                      </div>

                      {/* Message 2: Received */}
                      <div className="max-w-[85%] bg-white rounded-lg p-2 shadow-sm rounded-tl-none space-y-0.5">
                        <p className="text-slate-800">
                          Estamos aquí para ayudarte a obtener tu visa americana de forma simple y rápida.
                        </p>
                        <span className="text-[7.5px] text-slate-400 block text-right">11:45 AM</span>
                      </div>

                      {/* Message 3: Sent */}
                      <div className="max-w-[85%] bg-[#d9fdd3] rounded-lg p-2 shadow-sm rounded-tr-none space-y-0.5 ml-auto">
                        <p className="text-slate-850 font-medium">
                          ¡Perfecto! ¿Cómo comenzamos?
                        </p>
                        <div className="flex items-center justify-end gap-0.5">
                          <span className="text-[7.5px] text-slate-500">11:46 AM</span>
                          <span className="material-symbols-outlined text-[10px] text-blue-500 font-black">done_all</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Tarjeta Flotante de Datos Protegidos */}
                <div className="absolute bottom-6 right-[-24px] md:right-[-32px] w-[180px] bg-white border border-slate-100 rounded-xl p-3 shadow-xl flex items-start gap-2.5 z-25 transform hover:scale-[1.03] transition-transform duration-350 select-none">
                  <div className="bg-blue-50 rounded-lg p-1.5 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-[18px] text-blue-600">lock</span>
                  </div>
                  <div className="text-[9.5px] leading-snug text-left text-slate-800">
                    <div className="font-extrabold">Tus datos están 100% protegidos</div>
                    <div className="text-slate-450 mt-0.5">Privacidad y seguridad garantizadas.</div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </section>

        {/* Confidence Bottom Banner */}
        <div className="relative z-10 w-full max-w-container-max mx-auto px-margin-mobile md:px-gutter pb-12 md:pb-16 pt-4">
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 md:p-8 backdrop-blur-md">
            <h3 className="text-xs md:text-sm font-semibold tracking-wider text-slate-400 text-center uppercase mb-6">
              Con la confianza de miles de clientes
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-4 items-center">
              {[
                { title: "Proceso seguro y confiable", icon: "verified_user" },
                { title: "Información protegida", icon: "lock" },
                { title: "Asesoría especializada", icon: "support_agent" },
                { title: "Respaldo en cada paso", icon: "how_to_reg" }
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 justify-center md:justify-start px-2">
                  <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <span className="material-symbols-outlined text-[18px] text-blue-400">{item.icon}</span>
                  </div>
                  <span className="text-xs md:text-sm text-slate-200 font-bold text-left leading-snug">{item.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Steps Onboarding ("Cómo funciona") */}
      <section id="como-funciona" className="relative z-10 w-full max-w-container-max mx-auto px-margin-mobile md:px-gutter py-20 border-t border-slate-200/60">
        
        {/* Parte 1: Stepper Horizontal */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-3 text-[#0b1c30]">¿Cómo funciona?</h2>
          <p className="text-slate-500 font-medium text-base">Un proceso simple en 4 pasos</p>
        </div>

        {/* Stepper container */}
        <div className="relative mb-28">
          {/* Connector Line (Desktop) */}
          <div className="hidden md:block absolute top-[43px] left-[12%] right-[12%] h-[2px] border-t-2 border-dashed border-blue-100/80 -z-10"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-4 lg:gap-12">
            {[
              {
                step: 1,
                title: "Responde",
                desc: "Completa nuestro cuestionario en línea.",
                icon: (
                  <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 7.5h6" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 16.5h6" />
                  </svg>
                )
              },
              {
                step: 2,
                title: "Revisamos",
                desc: "Nuestro equipo revisa tu información.",
                icon: (
                  <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                )
              },
              {
                step: 3,
                title: "Agendamos tu cita",
                desc: "Nos encargamos de todo y conseguimos tu cita.",
                icon: (
                  <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )
              },
              {
                step: 4,
                title: "Te notificamos",
                desc: "Te avisamos por WhatsApp con todos los detalles.",
                icon: (
                  <svg className="w-7 h-7 text-emerald-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.031 2c-5.514 0-9.99 4.476-9.99 9.99 0 1.763.459 3.486 1.332 5.006L2 22l5.166-1.354c1.47.8 3.119 1.22 4.865 1.22h.004c5.514 0 9.99-4.476 9.99-9.99 0-2.673-1.04-5.186-2.93-7.078C17.202 2.94 14.7 2 12.03 2zm6.059 13.99c-.266.751-1.35 1.365-1.849 1.455-.499.09-1.01.162-3.197-.696-2.793-1.096-4.577-3.95-4.718-4.135-.14-.186-1.144-1.524-1.144-2.91 0-1.385.728-2.066 1.014-2.353.287-.287.624-.359.832-.359.208 0 .416.002.597.01.187.008.437-.033.686.568.257.618.882 2.148.959 2.302.077.155.129.336.026.542-.104.207-.156.336-.312.518-.156.181-.326.402-.467.54-.156.155-.319.324-.136.638.182.314.81 1.332 1.737 2.158.927.826 1.705 1.082 2.02 1.238.314.156.499.129.686-.088.187-.217.81-.942 1.026-1.267.217-.326.434-.272.733-.162.299.11 1.902.894 2.228 1.057.325.162.542.245.625.385.083.14.083.812-.183 1.563z"/>
                  </svg>
                )
              }
            ].map((item, index) => (
              <div key={index} className="flex flex-col items-center text-center group px-4">
                {/* Icon wrapper with circular badge */}
                <div className="relative mb-5">
                  {/* Blue Numbered Badge */}
                  <div className="absolute -top-1.5 -left-1.5 w-6 h-6 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center text-[11px] font-bold text-white shadow-sm z-10">
                    {item.step}
                  </div>
                  
                  {/* Icon Circle */}
                  <div className="w-[86px] h-[86px] rounded-full bg-white border border-slate-200/50 flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:border-slate-300 transition-all duration-300 relative">
                    <div className="absolute inset-1.5 rounded-full bg-blue-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative z-10 flex items-center justify-center">
                      {item.icon}
                    </div>
                  </div>
                </div>
                
                <h3 className="text-base font-bold text-[#0b1c30] mb-2">{item.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed max-w-[220px]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Parte 2: Propuesta de valor y Beneficios ("¿Por qué Go-Visa?") */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pt-20 border-t border-slate-200/40">
          {/* Columna Izquierda */}
          <div className="lg:col-span-5 flex flex-col justify-center space-y-6">
            <span className="bg-blue-50 text-blue-600 text-xs font-bold px-3.5 py-1.5 rounded-full uppercase tracking-wider border border-blue-100 w-fit">
              ¿Por qué Go-Visa?
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#0b1c30] leading-tight tracking-tight">
              Hacemos el proceso fácil, rápido y seguro.
            </h2>
            <p className="text-slate-600 text-base leading-relaxed">
              Combinamos tecnología y asesoría experta para brindarte la mejor experiencia.
            </p>
            <a
              href="#beneficios"
              className="bg-[#0b1c30] text-white hover:bg-opacity-90 px-6 py-3 rounded-full text-sm font-semibold w-fit transition-all duration-200 shadow-sm inline-flex items-center gap-2 group/btn"
            >
              Conoce nuestros servicios
              <svg className="w-4 h-4 transform group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>

          {/* Columna Derecha */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              {
                title: "Rápido",
                desc: "Optimizamos cada paso para ahorrar tu tiempo.",
                icon: (
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                )
              },
              {
                title: "Seguro",
                desc: "Protegemos tu información y tu proceso.",
                icon: (
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                )
              },
              {
                title: "Acompañamiento",
                desc: "Te asesoramos en todo momento por expertos.",
                icon: (
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12c0-4.97 4.03-9 9-9s9 4.03 9 9m-18 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H3a2 2 0 00-2 2v2a2 2 0 002 2zm14 0h2a2 2 0 002-2v-2a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 16v1a3 3 0 01-3 3h-2" />
                  </svg>
                )
              },
              {
                title: "Transparente",
                desc: "Sin sorpresas, sabes siempre en qué etapa vas.",
                icon: (
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V13m4 3V10m4 6V7m4 9v-5" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12l4-4 4 3 6-5" />
                  </svg>
                )
              }
            ].map((item, index) => (
              <div key={index} className="bg-white border border-slate-200/50 hover:border-slate-300 rounded-2xl p-6 hover:shadow-md transition-all duration-300 flex flex-col justify-between shadow-sm relative overflow-hidden group">
                <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-blue-50/20 rounded-full blur-xl group-hover:bg-blue-50/40 transition-colors duration-300"></div>
                
                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div className="bg-blue-50/60 p-3 rounded-xl w-fit mb-5">
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="text-base font-bold mb-2 text-[#0b1c30]">{item.title}</h3>
                    <p className="text-slate-500 text-xs leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
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
      <section id="calculadora-factibilidad" className="relative z-10 w-full bg-[#0c2045] py-20 overflow-hidden">
        {/* Glow decoration inside dark section */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="w-full max-w-container-max mx-auto px-margin-mobile md:px-gutter relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column - Information */}
            <div className="lg:col-span-5 space-y-6">
              <span className="bg-blue-500/20 text-blue-200 border border-blue-400/30 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider inline-block">
                Tecnología Inteligente
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
                Pre-evalúa tu probabilidad con nuestro algoritmo
              </h2>
              <p className="text-slate-300 leading-relaxed text-sm md:text-base">
                Muchos rechazos consulares ocurren porque el solicitante no sabe cómo manifestar lazos consistentes. Nuestro asesor de perfil calcula el peso socioeconómico que verá el cónsul.
              </p>
              
              <ul className="space-y-4">
                <li className="flex items-start gap-3 text-slate-200 text-sm">
                  <span className="material-symbols-outlined text-blue-400 text-[20px] flex-shrink-0 mt-0.5">check_circle</span>
                  <span>Basado en manuales consulares reales de EE.UU.</span>
                </li>
                <li className="flex items-start gap-3 text-slate-200 text-sm">
                  <span className="material-symbols-outlined text-blue-400 text-[20px] flex-shrink-0 mt-0.5">check_circle</span>
                  <span>Analiza tu arraigo escolar, laboral, mercantil y familiar</span>
                </li>
                <li className="flex items-start gap-3 text-slate-200 text-sm">
                  <span className="material-symbols-outlined text-blue-400 text-[20px] flex-shrink-0 mt-0.5">check_circle</span>
                  <span>Tips locales para Ciudad de México y provincia</span>
                </li>
              </ul>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-start gap-3.5 leading-normal">
                <span className="material-symbols-outlined text-emerald-400 text-[24px] flex-shrink-0 mt-0.5">verified_user</span>
                <p className="text-xs text-slate-300">
                  Cumplimos rigurosamente la Ley Federal de Protección de Datos Personales en Posesión de Particulares. Tus respuestas son de carácter confidencial.
                </p>
              </div>
            </div>

            {/* Right Column - Form Card */}
            <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
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
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonios" className="relative z-10 w-full max-w-container-max mx-auto px-margin-mobile md:px-gutter py-20 border-t border-slate-200/60">
        <div className="text-center mb-16 max-w-[800px] mx-auto">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4 text-[#0b1c30] tracking-tight">
            La seguridad que necesitas, respaldada por casos de éxito
          </h2>
          <p className="text-slate-600 text-sm md:text-base">
            Cientos de solicitantes que usaron nuestra plataforma lograron su visa americana sin costosos asesores tradicionales.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="bg-white border border-slate-200/60 rounded-3xl p-8 flex flex-col justify-between shadow-[0_8px_30px_rgb(0,0,0,0.015)] hover:-translate-y-1.5 hover:shadow-[0_12px_40px_rgb(0,0,0,0.04)] transition-all duration-300">
            <div className="space-y-4">
              <div className="flex gap-1 text-amber-500 text-lg">
                <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
              </div>
              <p className="text-slate-600 text-sm md:text-base italic leading-relaxed">
                &ldquo;Estaba aterrorizada por la entrevista. Usar el simulador de IA de Go-Visa me ayudó a practicar mis respuestas de ingresos y lazos fuertes con México. Llegué segura y me la otorgaron sin problemas.&rdquo;
              </p>
            </div>
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100 gap-2">
              <div className="flex items-center gap-3">
                <img
                  src="/sofia.png"
                  alt="Sofía Martínez"
                  className="w-10 h-10 rounded-full object-cover border border-slate-100 shadow-sm"
                />
                <div>
                  <h4 className="font-bold text-[#0b1c30] text-sm md:text-base leading-tight">Sofía Martínez</h4>
                  <p className="text-[11px] text-slate-400">Jalisco (Cita en Guadalajara)</p>
                </div>
              </div>
              <span className="bg-[#e6f7ed] text-[#0d7a3c] text-[10px] md:text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
                Aprobada
              </span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white border border-slate-200/60 rounded-3xl p-8 flex flex-col justify-between shadow-[0_8px_30px_rgb(0,0,0,0.015)] hover:-translate-y-1.5 hover:shadow-[0_12px_40px_rgb(0,0,0,0.04)] transition-all duration-300">
            <div className="space-y-4">
              <div className="flex gap-1 text-amber-500 text-lg">
                <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
              </div>
              <p className="text-slate-600 text-sm md:text-base italic leading-relaxed">
                &ldquo;La DS-160 en el sitio oficial es una pesadilla de caídas y mala traducción. El cuestionario simplificado de Go-Visa me guió paso a paso y me guardaron todo ordenado. Excelente servicio.&rdquo;
              </p>
            </div>
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100 gap-2">
              <div className="flex items-center gap-3">
                <img
                  src="/alejandro.png"
                  alt="Alejandro Ruiz"
                  className="w-10 h-10 rounded-full object-cover border border-slate-100 shadow-sm"
                />
                <div>
                  <h4 className="font-bold text-[#0b1c30] text-sm md:text-base leading-tight">Alejandro Ruiz</h4>
                  <p className="text-[11px] text-slate-400">Nuevo León (Cita Monterrey)</p>
                </div>
              </div>
              <span className="bg-[#e6f7ed] text-[#0d7a3c] text-[10px] md:text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
                Aprobada
              </span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white border border-slate-200/60 rounded-3xl p-8 flex flex-col justify-between shadow-[0_8px_30px_rgb(0,0,0,0.015)] hover:-translate-y-1.5 hover:shadow-[0_12px_40px_rgb(0,0,0,0.04)] transition-all duration-300">
            <div className="space-y-4">
              <div className="flex gap-1 text-amber-500 text-lg">
                <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
              </div>
              <p className="text-slate-600 text-sm md:text-base italic leading-relaxed">
                &ldquo;Mi visa venció hace un año, no sabía si requería entrevista presencial de nuevo. El test de elegibilidad me confirmó que era elegible para exención. Ahorré muchísimo estrés.&rdquo;
              </p>
            </div>
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100 gap-2">
              <div className="flex items-center gap-3">
                <img
                  src="/gabriela.png"
                  alt="Gabriela Torres"
                  className="w-10 h-10 rounded-full object-cover border border-slate-100 shadow-sm"
                />
                <div>
                  <h4 className="font-bold text-[#0b1c30] text-sm md:text-base leading-tight">Gabriela Torres</h4>
                  <p className="text-[11px] text-slate-400">CDMX (Cita en CDMX)</p>
                </div>
              </div>
              <span className="bg-[#e6f7ed] text-[#0d7a3c] text-[10px] md:text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
                Renovada
              </span>
            </div>
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
