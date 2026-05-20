"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { applicationService, documentService, messageService } from "../../../../lib/dbService";

export default function AdminClientReview() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;

  const [application, setApplication] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Tab
  const [activeTab, setActiveTab] = useState<"ds160" | "documents" | "chat">("ds160");

  // Admin controls local state
  const [status, setStatus] = useState("Nuevo");
  const [score, setScore] = useState(50);
  const [scoreLevel, setScoreLevel] = useState("Medio");
  const [risksText, setRisksText] = useState("");
  const [recsText, setRecsText] = useState("");
  
  // Appointment state
  const [location, setLocation] = useState("cdmx");
  const [casDate, setCasDate] = useState("");
  const [casTime, setCasTime] = useState("");
  const [interviewDate, setInterviewDate] = useState("");
  const [interviewTime, setInterviewTime] = useState("");

  // Chat state
  const [chatInput, setChatInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!clientId) return;

    // Load client application
    Promise.all([
      applicationService.getApplication(clientId),
      documentService.getDocuments(clientId)
    ]).then(([app, docs]) => {
      if (app) {
        setApplication(app);
        setStatus(app.status);
        setScore(app.visaScore?.score || 50);
        setScoreLevel(app.visaScore?.level || "Medio");
        setRisksText(app.visaScore?.risks?.join("\n") || "");
        setRecsText(app.visaScore?.recommendations?.join("\n") || "");
        
        if (app.appointment) {
          setLocation(app.appointment.location || "cdmx");
          setCasDate(app.appointment.casDate || "");
          setCasTime(app.appointment.casTime || "");
          setInterviewDate(app.appointment.interviewDate || "");
          setInterviewTime(app.appointment.interviewTime || "");
        }
      }
      setDocuments(docs);
      setLoading(false);
    });

    // Real-time chat sync
    const unsubscribeChat = messageService.onMessages(clientId, (data) => {
      setMessages(data);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    });

    return () => unsubscribeChat();
  }, [clientId]);

  // Handle Document updates (Approve / Reject)
  const handleDocStatus = async (docId: string, docStatus: "Aprobado" | "Rechazado", feedback = "") => {
    try {
      await documentService.updateDocumentStatus(docId, docStatus, feedback);
      // Re-fetch documents
      const docs = await documentService.getDocuments(clientId);
      setDocuments(docs);
    } catch (e) {
      alert("Error al actualizar estado del documento.");
    }
  };

  // Send Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const text = chatInput.trim();
    setChatInput("");
    try {
      await messageService.sendMessage(clientId, "admin", text);
    } catch (e) {
      alert("Error al enviar mensaje.");
    }
  };

  // Save all settings
  const handleSaveAdminSettings = async () => {
    setSaving(true);
    try {
      const risks = risksText.split("\n").filter((r) => r.trim() !== "");
      const recommendations = recsText.split("\n").filter((r) => r.trim() !== "");
      
      const updateData: any = {
        status,
        visaScore: {
          score,
          level: scoreLevel,
          risks,
          recommendations,
        },
      };

      if (status === "Cita agendada") {
        updateData.appointment = {
          location,
          casDate,
          casTime,
          interviewDate,
          interviewTime,
        };
      }

      await applicationService.adminUpdateApplication(clientId, updateData);
      
      // Update local application state
      const updatedApp = await applicationService.getApplication(clientId);
      setApplication(updatedApp);
      
      alert("Configuraciones del cliente guardadas con éxito.");
    } catch (e) {
      alert("Ocurrió un error al guardar los cambios.");
    } finally {
      setSaving(false);
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

  const getStatusBadge = (status: string) => {
    const badges: any = {
      Nuevo: "bg-blue-50 text-blue-600 border-blue-100",
      "En revisión": "bg-amber-55 text-amber-700 border-amber-150",
      "DS-160 completado": "bg-indigo-50 text-indigo-600 border-indigo-100",
      "Pago pendiente": "bg-yellow-50 text-yellow-700 border-yellow-150",
      "Cita agendada": "bg-emerald-50 text-emerald-600 border-emerald-100",
      "Entrevista pendiente": "bg-purple-50 text-purple-600 border-purple-100",
      "Visa aprobada": "bg-green-50 text-green-600 border-green-100",
      "Visa rechazada": "bg-red-50 text-red-600 border-red-100",
    };
    return badges[status] || "bg-slate-50 text-slate-650 border-slate-150";
  };

  return (
    <div className="p-6 md:p-10 max-w-container-max mx-auto space-y-8">
      {/* Top navigation header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="w-10 h-10 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center justify-center transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </Link>
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-800 flex items-center gap-2">
              <span>{application?.userName}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${getStatusBadge(application?.status || "Nuevo")}`}>
                {application?.status}
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">ID: {clientId} | Correo: {application?.formData?.email || "Sin registrar"}</p>
          </div>
        </div>

        <button
          onClick={handleSaveAdminSettings}
          disabled={saving}
          className="bg-primary text-white px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-primary/95 transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Guardar Configuraciones"}
        </button>
      </div>

      {/* Main split grid: Review Workspace vs Admin Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Workspace tabs (col-span-2) */}
        <div className="lg:col-span-2 flex flex-col space-y-6">
          {/* Tab Header Selector */}
          <div className="flex border-b border-slate-200 gap-4">
            {[
              { id: "ds160", name: "Formulario DS-160", icon: "assignment" },
              { id: "documents", name: "Documentos Soporte", icon: "folder" },
              { id: "chat", name: "Chat con Cliente", icon: "forum" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 font-bold text-xs transition-all ${
                  activeTab === tab.id
                    ? "border-primary text-slate-800 font-bold"
                    : "border-transparent text-slate-400 hover:text-slate-650"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </div>

          {/* Tab Workspace content */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 flex-1 min-h-[450px] shadow-sm">
            
            {/* TAB 1: DS-160 Answers */}
            {activeTab === "ds160" && (
              <div className="space-y-6 text-xs text-slate-700">
                <h3 className="text-sm font-bold text-slate-800 mb-4">Respuestas Declaradas</h3>
                
                {!application?.formData?.firstName ? (
                  <div className="p-8 text-center text-slate-400">
                    El usuario aún no ha guardado datos en su formulario.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 leading-relaxed">
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2">
                      <h4 className="font-bold text-primary border-b border-slate-200 pb-1 mb-2">Personales</h4>
                      <div><span className="text-slate-400">Nombres:</span> {application.formData.firstName}</div>
                      <div><span className="text-slate-400">Apellidos:</span> {application.formData.lastName}</div>
                      <div><span className="text-slate-400">F. Nacimiento:</span> {application.formData.birthDate}</div>
                      <div><span className="text-slate-400">Género:</span> {application.formData.gender === "male" ? "Masculino" : "Femenino"}</div>
                      <div><span className="text-slate-400">Edo. Civil:</span> {application.formData.maritalStatus}</div>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2">
                      <h4 className="font-bold text-primary border-b border-slate-200 pb-1 mb-2">Contacto y Ocupación</h4>
                      <div><span className="text-slate-400">Teléfono:</span> {application.formData.phone}</div>
                      <div><span className="text-slate-400">Email:</span> {application.formData.email}</div>
                      <div><span className="text-slate-400">Dirección:</span> {application.formData.address}</div>
                      <div><span className="text-slate-400">Puesto:</span> {application.formData.occupation}</div>
                      <div><span className="text-slate-400">Ingresos:</span> ${application.formData.monthlyIncome} MXN</div>
                      <div><span className="text-slate-400">Antigüedad:</span> {application.formData.employmentYears} años</div>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2">
                      <h4 className="font-bold text-primary border-b border-slate-200 pb-1 mb-2">Pasaporte</h4>
                      <div><span className="text-slate-400">N. Pasaporte:</span> {application.formData.passportNumber}</div>
                      <div><span className="text-slate-400">Expedido en:</span> {application.formData.passportCity}</div>
                      <div><span className="text-slate-400">Expedición:</span> {application.formData.passportIssueDate}</div>
                      <div><span className="text-slate-400">Expiración:</span> {application.formData.passportExpiryDate}</div>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2">
                      <h4 className="font-bold text-primary border-b border-slate-200 pb-1 mb-2">Itinerario y Antecedentes</h4>
                      <div><span className="text-slate-400">Propósito:</span> {application.formData.travelPurpose}</div>
                      <div><span className="text-slate-400">Financia:</span> {application.formData.travelFundedBy}</div>
                      <div><span className="text-slate-400">Fecha Viaje:</span> {application.formData.travelArrivalDate} ({application.formData.travelDuration})</div>
                      <div><span className="text-slate-400">Viajes previos 5 años:</span> {application.formData.hasTravelHistory === "yes" ? `Sí (${application.formData.traveledCountries})` : "No"}</div>
                      <div><span className="text-slate-400">Familiares EE.UU.:</span> {application.formData.hasFamilyInUS === "yes" ? `Sí (${application.formData.familyStatusInUS})` : "No"}</div>
                      <div><span className="text-slate-450 font-semibold text-red-650">¿Rechazos de Visa?:</span> {application.formData.hasVisaDenials === "yes" ? "SÍ" : "NO"}</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Supporting Documents */}
            {activeTab === "documents" && (
              <div className="space-y-6">
                <h3 className="text-sm font-bold text-slate-800 mb-4">Validación de Expediente</h3>
                {documents.map((doc) => {
                  const hasFile = doc.status !== "Pendiente";
                  return (
                    <div
                      key={doc.id}
                      className="bg-slate-50/50 border border-slate-200 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">{doc.name}</span>
                          <span className={`text-[9px] font-bold px-2 rounded-full uppercase border ${
                            doc.status === "Aprobado"
                              ? "bg-green-50 text-green-600 border-green-150"
                              : doc.status === "Rechazado"
                              ? "bg-red-50 text-red-600 border-red-150"
                              : doc.status === "En revisión"
                              ? "bg-amber-55 text-amber-700 border-amber-150"
                              : "bg-slate-50 text-slate-500 border-slate-200"
                          }`}>
                            {doc.status}
                          </span>
                        </div>
                        {hasFile && (
                          <div className="text-slate-500 text-[10px]">
                            Archivo: <span className="text-slate-700 font-mono">{doc.fileName}</span> ({doc.uploadDate})
                          </div>
                        )}
                        {doc.feedback && (
                          <div className="text-red-650 text-[10px] italic">Retroalimentación: {doc.feedback}</div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {hasFile ? (
                          <>
                            <button
                              onClick={() => handleDocStatus(doc.id, "Aprobado")}
                              disabled={doc.status === "Aprobado"}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] transition-colors disabled:opacity-30 shadow-sm"
                            >
                              Aprobar
                            </button>
                            <button
                              onClick={() => {
                                const feedback = prompt("Escribe el motivo del rechazo del documento:", doc.feedback || "");
                                if (feedback !== null) {
                                  handleDocStatus(doc.id, "Rechazado", feedback);
                                }
                              }}
                              className="bg-red-50 border border-red-200 hover:bg-red-100 text-red-600 font-bold px-3 py-1.5 rounded-lg text-[10px] transition-colors shadow-sm"
                            >
                              Rechazar
                            </button>
                          </>
                        ) : (
                          <span className="text-slate-400 text-[10px]">Esperando carga del cliente</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB 3: Admin Real-time Chat Support */}
            {activeTab === "chat" && (
              <div className="flex flex-col h-[400px]">
                <div className="flex-grow overflow-y-auto pr-2 space-y-4 mb-4">
                  {messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                      No hay mensajes todavía. Envía un saludo.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((msg) => {
                        const isMe = msg.sender === "admin";
                        return (
                          <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                            <div
                              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs leading-normal ${
                                isMe
                                  ? "bg-primary text-white rounded-tr-none shadow-sm"
                                  : "bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-none"
                              }`}
                            >
                              {msg.text}
                            </div>
                            <span className="text-[9px] text-slate-400 mt-1 px-1">
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Escribe un mensaje al cliente..."
                    className="flex-grow bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-primary transition-colors"
                  />
                  <button
                    type="submit"
                    className="bg-primary hover:bg-primary/95 text-white px-4 rounded-xl flex items-center justify-center shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[18px]">send</span>
                  </button>
                </form>
              </div>
            )}

          </div>
        </div>

        {/* Right Side: Admin Controls panel */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-850 border-b border-slate-100 pb-2">Panel Administrativo</h3>
            
            {/* Status Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-500 uppercase font-semibold">Estado de la Solicitud</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-primary cursor-pointer transition-colors"
              >
                <option value="Nuevo">Nuevo</option>
                <option value="En revisión">En revisión</option>
                <option value="DS-160 completado">DS-160 completado</option>
                <option value="Pago pendiente">Pago pendiente</option>
                <option value="Cita agendada">Cita agendada</option>
                <option value="Entrevista pendiente">Entrevista pendiente</option>
                <option value="Visa aprobada">Visa aprobada</option>
                <option value="Visa rechazada">Visa rechazada</option>
              </select>
            </div>

            {/* If Citas, render scheduler */}
            {status === "Cita agendada" && (
              <div className="space-y-4 bg-slate-50/50 border border-slate-200 p-4 rounded-xl animate-fadeIn">
                <h4 className="text-[11px] font-bold text-primary uppercase tracking-wider">Agendar Citas</h4>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 font-semibold">Ciudad / Sede</label>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-850 outline-none cursor-pointer"
                  >
                    <option value="cdmx">Ciudad de México</option>
                    <option value="hermosillo">Hermosillo</option>
                    <option value="guadalajara">Guadalajara</option>
                    <option value="monterrey">Monterrey</option>
                    <option value="tijuana">Tijuana</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-500 font-semibold">Cita CAS (Fecha)</label>
                    <input
                      type="date"
                      value={casDate}
                      onChange={(e) => setCasDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-500 font-semibold">CAS (Hora)</label>
                    <input
                      type="time"
                      value={casTime}
                      onChange={(e) => setCasTime(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-500 font-semibold">Consulado (Fecha)</label>
                    <input
                      type="date"
                      value={interviewDate}
                      onChange={(e) => setInterviewDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-500 font-semibold">Consulado (Hora)</label>
                    <input
                      type="time"
                      value={interviewTime}
                      onChange={(e) => setInterviewTime(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Visa score editing */}
            <div className="space-y-4 border-t border-slate-100 pt-4">
              <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">Ajuste de Visa Score</h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 font-semibold">Puntaje (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={score}
                    onChange={(e) => setScore(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 font-semibold">Nivel</label>
                  <select
                    value={scoreLevel}
                    onChange={(e) => setScoreLevel(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none cursor-pointer"
                  >
                    <option value="Bajo">Bajo</option>
                    <option value="Medio">Medio</option>
                    <option value="Alto">Alto</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 font-semibold">Riesgos Identificados (un riesgo por línea)</label>
                <textarea
                  rows={3}
                  value={risksText}
                  onChange={(e) => setRisksText(e.target.value)}
                  placeholder="e.g. Ingresos bajos&#10;Historial de rechazo previo"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-850 outline-none focus:border-primary resize-y font-sans leading-relaxed transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 font-semibold">Recomendaciones (una por línea)</label>
                <textarea
                  rows={4}
                  value={recsText}
                  onChange={(e) => setRecsText(e.target.value)}
                  placeholder="e.g. Presentar constancia laboral original&#10;Enfocarse en explicar su arraigo laboral"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-850 outline-none focus:border-primary resize-y font-sans leading-relaxed transition-colors"
                />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
