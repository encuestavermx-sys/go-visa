"use client";

import { useEffect, useState, useRef } from "react";
import { applicationService } from "../../../lib/dbService";

export default function DS160Form() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<any>({
    firstName: "",
    lastName: "",
    birthDate: "",
    gender: "",
    maritalStatus: "",
    nationality: "mexicana",
    phone: "",
    email: "",
    address: "",
    occupation: "",
    monthlyIncome: "",
    employmentYears: "",
    passportNumber: "",
    passportIssueDate: "",
    passportExpiryDate: "",
    passportCity: "",
    travelPurpose: "Tourism",
    travelFundedBy: "self",
    travelArrivalDate: "",
    travelDuration: "",
    hasTravelHistory: "no",
    traveledCountries: "",
    hasFamilyInUS: "no",
    familyStatusInUS: "",
    hasVisaDenials: "no",
  });
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error">("saved");
  const [validationError, setValidationError] = useState("");
  const userIdRef = useRef("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const session = localStorage.getItem("go-visa_session");
      if (session) {
        const user = JSON.parse(session);
        userIdRef.current = user.uid;
        applicationService.getApplication(user.uid).then((app) => {
          if (app) {
            setFormData((prev: any) => ({ ...prev, ...app.formData }));
            setStep(app.step || 1);
          }
          setLoading(false);
        });
      }
    }
  }, []);

  const saveProgress = async (nextStep: number, customData = formData) => {
    if (!userIdRef.current) return;
    setSaveStatus("saving");
    try {
      await applicationService.saveApplication(userIdRef.current, nextStep, customData);
      setSaveStatus("saved");
    } catch (e) {
      console.error(e);
      setSaveStatus("error");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => {
      const updated = { ...prev, [name]: value };
      return updated;
    });
  };

  const handleBlur = () => {
    saveProgress(step);
  };

  const validateStep = () => {
    setValidationError("");
    if (step === 1) {
      if (!formData.firstName || !formData.lastName || !formData.birthDate || !formData.gender || !formData.maritalStatus) {
        setValidationError("Por favor completa todos los campos obligatorios.");
        return false;
      }
    } else if (step === 2) {
      if (!formData.phone || !formData.email || !formData.address || !formData.occupation) {
        setValidationError("Por favor completa los campos de contacto y ocupación.");
        return false;
      }
    } else if (step === 3) {
      if (!formData.passportNumber || !formData.passportIssueDate || !formData.passportExpiryDate || !formData.passportCity) {
        setValidationError("Por favor ingresa los datos de tu pasaporte.");
        return false;
      }
    } else if (step === 4) {
      if (!formData.travelPurpose || !formData.travelFundedBy) {
        setValidationError("Por favor completa los detalles del viaje.");
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    const nextStep = step + 1;
    setStep(nextStep);
    saveProgress(nextStep);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePrev = () => {
    const prevStep = step - 1;
    setStep(prevStep);
    saveProgress(prevStep);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFinalSubmit = async () => {
    if (!userIdRef.current) return;
    setSaveStatus("saving");
    try {
      // Set application status to 'En revisión' or 'DS-160 completado'
      await applicationService.updateStatus(userIdRef.current, "DS-160 completado");
      setSaveStatus("saved");
      alert("¡Formulario finalizado con éxito! Tu expediente ha sido enviado a revisión del asesor.");
      // Redirect to main dashboard
      window.location.href = "/dashboard";
    } catch (e) {
      setSaveStatus("error");
    }
  };

  const stepHelpTips = [
    {
      title: "Información Personal",
      tips: [
        "Ingresa tus nombres y apellidos exactamente como aparecen en tu pasaporte mexicano vigente.",
        "Si tu estado civil es Unión Libre, selecciona 'Otro' o 'Soltero' y detalla en la entrevista, o selecciona el equivalente legal.",
        "La fecha de nacimiento debe coincidir exactamente con tu acta de nacimiento.",
      ],
    },
    {
      title: "Datos de Contacto",
      tips: [
        "Proporciona un teléfono celular donde podamos localizarte fácilmente.",
        "Declara tus ingresos reales mensuales. Esta cantidad influye directamente en el cálculo de tu arraigo económico.",
        "Si eres estudiante o jubilado, selecciona tu ocupación actual para adaptar los consejos patronales.",
      ],
    },
    {
      title: "Detalles del Pasaporte",
      tips: [
        "El número de pasaporte consta de letras y números, captúralo sin espacios.",
        "Tu pasaporte debe tener una vigencia mínima de 6 meses posteriores a tu fecha proyectada de viaje.",
        "El lugar de expedición es el estado o municipio donde tramitaste el documento.",
      ],
    },
    {
      title: "Itinerario de Viaje",
      tips: [
        "Si no tienes planes específicos, indica una fecha tentativa aproximada (por ejemplo, dentro de 8 meses).",
        "El propósito de viaje para turismo y compras es 'B1/B2'.",
        "Si alguien más financia tu viaje (cónyuge o padres), recuerda preparar sus comprobantes de ingresos.",
      ],
    },
    {
      title: "Seguridad y Antecedentes",
      tips: [
        "Declara honestamente si has tenido rechazos previos de visa americana. Mentir al respecto es motivo de penalización por varios años.",
        "Si tienes parientes en EE. UU., aclara su estatus legal. Ocultar familiares registrados es detectable en el sistema consular.",
      ],
    },
    {
      title: "Revisión Final",
      tips: [
        "Verifica que no existan errores ortográficos.",
        "Al dar clic en 'Enviar a revisión', bloquearemos el formulario momentáneamente para que un asesor valide las respuestas.",
      ],
    },
  ];

  const activeHelp = stepHelpTips[step - 1] || { title: "Formulario DS-160", tips: [] };

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
    <div className="p-6 md:p-10 max-w-container-max mx-auto">
      {/* Top Banner */}
      <div className="flex items-center justify-between border-b border-outline-variant/30 pb-4 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-on-background">Solicitud DS-160</h1>
          <p className="text-xs text-on-surface-variant mt-1">Completa el formulario en español. Se guarda de forma automática.</p>
        </div>

        {/* Sync Status Badge */}
        <div className="flex items-center gap-1.5 text-xs">
          {saveStatus === "saving" && (
            <span className="text-[#F59E0B] flex items-center gap-1">
              <span className="animate-spin h-3.5 w-3.5 border-2 border-amber-500 border-t-transparent rounded-full"></span>
              Guardando borrador...
            </span>
          )}
          {saveStatus === "saved" && (
            <span className="text-[#10B981] flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">cloud_done</span>
              Borrador guardado
            </span>
          )}
          {saveStatus === "error" && (
            <span className="text-red-500 flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">cloud_off</span>
              Error de conexión
            </span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-slate-200 h-2 rounded-full mb-8 overflow-hidden">
        <div
          className="bg-primary-container h-full rounded-full transition-all duration-500"
          style={{ width: `${(step / 6) * 100}%` }}
        ></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Container (col-span-2) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-outline-variant/30 p-6 md:p-8 shadow-level-1 space-y-6">
          {validationError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{validationError}</span>
            </div>
          )}

          {/* STEP 1: Personal Details */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-base font-bold text-on-background border-b pb-2">1. Datos Personales</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant">Nombres (como en pasaporte) *</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-primary focus:bg-white outline-none transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant">Apellidos *</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-primary focus:bg-white outline-none transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant">Fecha de Nacimiento *</label>
                  <input
                    type="date"
                    name="birthDate"
                    value={formData.birthDate}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-primary focus:bg-white outline-none transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant">Género *</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-primary focus:bg-white outline-none transition-colors cursor-pointer"
                  >
                    <option value="">Selecciona...</option>
                    <option value="male">Masculino</option>
                    <option value="female">Femenino</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant">Estado Civil *</label>
                  <select
                    name="maritalStatus"
                    value={formData.maritalStatus}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-primary focus:bg-white outline-none transition-colors cursor-pointer"
                  >
                    <option value="">Selecciona...</option>
                    <option value="single">Soltero(a)</option>
                    <option value="married">Casado(a)</option>
                    <option value="divorced">Divorciado(a)</option>
                    <option value="widowed">Viudo(a)</option>
                    <option value="union_libre">Unión Libre</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant">Nacionalidad</label>
                  <input
                    type="text"
                    name="nationality"
                    value={formData.nationality}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-primary focus:bg-white outline-none transition-colors"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Contact & Occupation */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-base font-bold text-on-background border-b pb-2">2. Contacto y Ocupación</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant">Teléfono Celular *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    placeholder="10 dígitos"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-primary focus:bg-white outline-none transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant">Correo Electrónico *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-primary focus:bg-white outline-none transition-colors"
                  />
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant">Dirección Completa Actual *</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    placeholder="Calle, Número, Colonia, C.P., Ciudad, Estado"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-primary focus:bg-white outline-none transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant">Ocupación o Profesión Actual *</label>
                  <input
                    type="text"
                    name="occupation"
                    value={formData.occupation}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    placeholder="e.g. Ingeniero, Comerciante, Ama de Casa, Jubilado"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-primary focus:bg-white outline-none transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant">Ingresos Mensuales Estimados (MXN) *</label>
                  <input
                    type="number"
                    name="monthlyIncome"
                    value={formData.monthlyIncome}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    placeholder="e.g. 18000"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-primary focus:bg-white outline-none transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant">Antigüedad Laboral en Años</label>
                  <input
                    type="number"
                    name="employmentYears"
                    value={formData.employmentYears}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    placeholder="e.g. 3"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-primary focus:bg-white outline-none transition-colors"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Passport Details */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-base font-bold text-on-background border-b pb-2">3. Pasaporte Mexicano</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant">Número de Pasaporte *</label>
                  <input
                    type="text"
                    name="passportNumber"
                    value={formData.passportNumber}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    placeholder="MX123456"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-primary focus:bg-white outline-none transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant">Ciudad/Estado de Expedición *</label>
                  <input
                    type="text"
                    name="passportCity"
                    value={formData.passportCity}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    placeholder="e.g. Hermosillo, Sonora"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-primary focus:bg-white outline-none transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant">Fecha de Expedición *</label>
                  <input
                    type="date"
                    name="passportIssueDate"
                    value={formData.passportIssueDate}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-primary focus:bg-white outline-none transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant">Fecha de Expiración *</label>
                  <input
                    type="date"
                    name="passportExpiryDate"
                    value={formData.passportExpiryDate}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-primary focus:bg-white outline-none transition-colors"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Travel itinerary */}
          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-base font-bold text-on-background border-b pb-2">4. Propósito de Viaje</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant">Propósito del Viaje *</label>
                  <select
                    name="travelPurpose"
                    value={formData.travelPurpose}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-primary focus:bg-white outline-none transition-colors cursor-pointer"
                  >
                    <option value="Tourism">Turismo o Compras (B1/B2)</option>
                    <option value="Business">Negocios temporales (B1)</option>
                    <option value="Student">Estudios (F1/J1)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant">¿Quién financia el viaje? *</label>
                  <select
                    name="travelFundedBy"
                    value={formData.travelFundedBy}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-primary focus:bg-white outline-none transition-colors cursor-pointer"
                  >
                    <option value="self">Financiado por mí mismo</option>
                    <option value="parents">Padres o tutores</option>
                    <option value="spouse">Cónyuge</option>
                    <option value="company">Empresa / Patrocinador</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant">Fecha Estimada de Llegada</label>
                  <input
                    type="date"
                    name="travelArrivalDate"
                    value={formData.travelArrivalDate}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-primary focus:bg-white outline-none transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant">Duración Estimada del Viaje</label>
                  <input
                    type="text"
                    name="travelDuration"
                    value={formData.travelDuration}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    placeholder="e.g. 5 días, 1 semana"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-primary focus:bg-white outline-none transition-colors"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Background checks */}
          {step === 5 && (
            <div className="space-y-6">
              <h2 className="text-base font-bold text-on-background border-b pb-2">5. Antecedentes e Historial</h2>
              <div className="space-y-5">
                
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-on-surface-variant block">
                    ¿Has viajado fuera de México en los últimos 5 años? *
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="radio"
                        name="hasTravelHistory"
                        value="yes"
                        checked={formData.hasTravelHistory === "yes"}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        className="text-primary-container focus:ring-primary"
                      />
                      Sí
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="radio"
                        name="hasTravelHistory"
                        value="no"
                        checked={formData.hasTravelHistory === "no"}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        className="text-primary-container focus:ring-primary"
                      />
                      No
                    </label>
                  </div>
                </div>

                {formData.hasTravelHistory === "yes" && (
                  <div className="space-y-1.5 animate-fadeIn">
                    <label className="text-xs font-semibold text-on-surface-variant">Países Visitados (separados por comas)</label>
                    <input
                      type="text"
                      name="traveledCountries"
                      value={formData.traveledCountries}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      placeholder="e.g. España, Francia, Canadá"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-primary focus:bg-white outline-none transition-colors"
                    />
                  </div>
                )}

                <div className="space-y-2 border-t border-slate-100 pt-4">
                  <label className="text-xs font-semibold text-on-surface-variant block">
                    ¿Tienes familiares directos residiendo en EE. UU.? *
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="radio"
                        name="hasFamilyInUS"
                        value="yes"
                        checked={formData.hasFamilyInUS === "yes"}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        className="text-primary-container focus:ring-primary"
                      />
                      Sí
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="radio"
                        name="hasFamilyInUS"
                        value="no"
                        checked={formData.hasFamilyInUS === "no"}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        className="text-primary-container focus:ring-primary"
                      />
                      No
                    </label>
                  </div>
                </div>

                {formData.hasFamilyInUS === "yes" && (
                  <div className="space-y-1.5 animate-fadeIn">
                    <label className="text-xs font-semibold text-on-surface-variant">Estatus Migratorio de tu Familiar en EE. UU.</label>
                    <select
                      name="familyStatusInUS"
                      value={formData.familyStatusInUS}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-primary focus:bg-white outline-none transition-colors cursor-pointer"
                    >
                      <option value="">Selecciona...</option>
                      <option value="citizen">Ciudadano Americano</option>
                      <option value="resident">Residente Legal (Green Card)</option>
                      <option value="nonimmigrant">Visa de estudiante/trabajo temporal</option>
                      <option value="undocumented">No documentado / irregular</option>
                    </select>
                  </div>
                )}

                <div className="space-y-2 border-t border-slate-100 pt-4">
                  <label className="text-xs font-semibold text-on-surface-variant block">
                    ¿Te han denegado la visa americana anteriormente? *
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="radio"
                        name="hasVisaDenials"
                        value="yes"
                        checked={formData.hasVisaDenials === "yes"}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        className="text-primary-container focus:ring-primary"
                      />
                      Sí
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="radio"
                        name="hasVisaDenials"
                        value="no"
                        checked={formData.hasVisaDenials === "no"}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        className="text-primary-container focus:ring-primary"
                      />
                      No
                    </label>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* STEP 6: Review Summary */}
          {step === 6 && (
            <div className="space-y-6">
              <h2 className="text-base font-bold text-on-background border-b pb-2">6. Revisión Final de Datos</h2>
              <p className="text-xs text-on-surface-variant">Revisa con atención que toda tu información sea correcta antes de enviarla a revisión.</p>
              
              <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-2 space-y-4">
                {/* Personal Section */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2 text-xs">
                  <h3 className="font-bold text-primary flex items-center justify-between">
                    <span>1. Datos Personales</span>
                    <button onClick={() => setStep(1)} className="text-[10px] underline text-outline hover:text-primary">Editar</button>
                  </h3>
                  <div><span className="text-outline">Nombre:</span> {formData.firstName} {formData.lastName}</div>
                  <div><span className="text-outline">F. Nacimiento:</span> {formData.birthDate}</div>
                  <div><span className="text-outline">Género / Civil:</span> {formData.gender === "male" ? "Masculino" : "Femenino"} / {formData.maritalStatus}</div>
                </div>

                {/* Contact Section */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2 text-xs">
                  <h3 className="font-bold text-primary flex items-center justify-between">
                    <span>2. Contacto y Ocupación</span>
                    <button onClick={() => setStep(2)} className="text-[10px] underline text-outline hover:text-primary">Editar</button>
                  </h3>
                  <div><span className="text-outline">Teléfono / Email:</span> {formData.phone} / {formData.email}</div>
                  <div><span className="text-outline">Dirección:</span> {formData.address}</div>
                  <div><span className="text-outline">Ocupación / Ingresos:</span> {formData.occupation} / ${formData.monthlyIncome} MXN (Antigüedad: {formData.employmentYears} años)</div>
                </div>

                {/* Passport Section */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2 text-xs">
                  <h3 className="font-bold text-primary flex items-center justify-between">
                    <span>3. Pasaporte</span>
                    <button onClick={() => setStep(3)} className="text-[10px] underline text-outline hover:text-primary">Editar</button>
                  </h3>
                  <div><span className="text-outline">N. Pasaporte:</span> {formData.passportNumber} (Expedido en {formData.passportCity})</div>
                  <div><span className="text-outline">Vigencia:</span> {formData.passportIssueDate} al {formData.passportExpiryDate}</div>
                </div>

                {/* Travel Section */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2 text-xs">
                  <h3 className="font-bold text-primary flex items-center justify-between">
                    <span>4. Viaje</span>
                    <button onClick={() => setStep(4)} className="text-[10px] underline text-outline hover:text-primary">Editar</button>
                  </h3>
                  <div><span className="text-outline">Propósito / Financiamiento:</span> {formData.travelPurpose === "Tourism" ? "Turismo B1/B2" : formData.travelPurpose} / {formData.travelFundedBy === "self" ? "Propio" : formData.travelFundedBy}</div>
                  <div><span className="text-outline">Fecha tentativa:</span> {formData.travelArrivalDate} ({formData.travelDuration})</div>
                </div>

                {/* Background Section */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2 text-xs">
                  <h3 className="font-bold text-primary flex items-center justify-between">
                    <span>5. Antecedentes</span>
                    <button onClick={() => setStep(5)} className="text-[10px] underline text-outline hover:text-primary">Editar</button>
                  </h3>
                  <div><span className="text-outline">Viajes internacionales:</span> {formData.hasTravelHistory === "yes" ? `Sí (${formData.traveledCountries})` : "No"}</div>
                  <div><span className="text-outline">Familiares en EE. UU.:</span> {formData.hasFamilyInUS === "yes" ? `Sí (${formData.familyStatusInUS})` : "No"}</div>
                  <div><span className="text-outline">Negación previa:</span> {formData.hasVisaDenials === "yes" ? "Sí" : "No"}</div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between items-center border-t border-slate-100 pt-6">
            {step > 1 ? (
              <button
                type="button"
                onClick={handlePrev}
                className="bg-slate-100 text-[#0b1c30] px-5 py-3 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-colors flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                Atrás
              </button>
            ) : (
              <div></div>
            )}

            {step < 6 ? (
              <button
                type="button"
                onClick={handleNext}
                className="bg-primary-container text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-primary transition-colors flex items-center gap-1.5"
              >
                Siguiente
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinalSubmit}
                className="bg-emerald-600 text-white px-8 py-3 rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors flex items-center gap-1.5 shadow-lg shadow-emerald-600/10"
              >
                <span className="material-symbols-outlined text-[18px]">verified_user</span>
                Enviar a Revisión de Asesor
              </button>
            )}
          </div>
        </div>

        {/* Sidebar Help Column */}
        <div className="space-y-6">
          {/* Active step help tips */}
          <div className="bg-white rounded-2xl border border-outline-variant/30 p-6 shadow-level-1 space-y-4">
            <div className="flex items-center gap-2 text-primary font-bold text-sm border-b pb-2">
              <span className="material-symbols-outlined">lightbulb</span>
              <h4>Consejo de Asesor ({activeHelp.title})</h4>
            </div>
            <ul className="space-y-3 text-xs text-on-surface-variant list-disc pl-4 leading-normal">
              {activeHelp.tips.map((tip, i) => (
                <li key={i}>{tip}</li>
              ))}
            </ul>
          </div>

          {/* Secure badge */}
          <div className="bg-[#eff4ff] rounded-2xl border border-primary-fixed-dim/30 p-5 flex gap-3 text-xs leading-normal">
            <span className="material-symbols-outlined text-primary text-[22px] flex-shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>
              security
            </span>
            <div>
              <h5 className="font-bold text-on-background">Encriptación SSL Segura</h5>
              <p className="text-outline text-[11px] mt-1">
                Toda tu información personal, de contacto y de viaje es almacenada con protección militar de datos. Nunca compartiremos tus datos con terceros.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
