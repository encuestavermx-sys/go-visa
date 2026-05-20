"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { documentService } from "../../../lib/dbService";

export default function DocumentCenter() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const userIdRef = useRef("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const session = localStorage.getItem("go-visa_session");
      if (session) {
        const user = JSON.parse(session);
        userIdRef.current = user.uid;
        documentService.getDocuments(user.uid).then((docs) => {
          setDocuments(docs);
          setLoading(false);
        });
      }
    }
  }, []);

  const handleUploadClick = (docId: string) => {
    // Open hidden file picker
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,application/pdf";
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Check size limit: 5MB
      if (file.size > 5 * 1024 * 1024) {
        alert("El archivo excede el límite de 5MB. Vuelve a intentarlo.");
        return;
      }

      setUploadingId(docId);
      setUploadProgress(10);

      // Simulation of uploading progress
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 20;
        });
      }, 150);

      try {
        // Mock save
        setTimeout(async () => {
          clearInterval(interval);
          setUploadProgress(100);
          
          await documentService.uploadDocument(userIdRef.current, docId, file.name);
          
          // Re-fetch documents
          const updatedDocs = await documentService.getDocuments(userIdRef.current);
          setDocuments(updatedDocs);
          setUploadingId(null);
          setUploadProgress(0);
        }, 1000);
      } catch (err) {
        clearInterval(interval);
        setUploadingId(null);
        alert("Ocurrió un error al cargar el archivo.");
      }
    };
    input.click();
  };

  const getStatusBadge = (status: string) => {
    const badges: any = {
      Pendiente: "bg-slate-100 text-slate-500 border-slate-200",
      "En revisión": "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20",
      Aprobado: "bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20",
      Rechazado: "bg-red-500/10 text-red-500 border-red-500/20",
    };
    return badges[status] || badges.Pendiente;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Aprobado":
        return <span className="material-symbols-outlined text-[#10B981]">verified</span>;
      case "Rechazado":
        return <span className="material-symbols-outlined text-red-500">cancel</span>;
      case "En revisión":
        return <span className="material-symbols-outlined text-[#F59E0B] animate-pulse">pending</span>;
      default:
        return <span className="material-symbols-outlined text-slate-400">hourglass_empty</span>;
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
    <div className="p-6 md:p-10 max-w-container-max mx-auto space-y-8">
      {/* Top Banner */}
      <div className="border-b border-outline-variant/30 pb-4">
        <h1 className="text-2xl font-extrabold text-on-background">Centro de Documentos</h1>
        <p className="text-xs text-on-surface-variant mt-1">Sube tus documentos de soporte. Formatos aceptados: PDF, JPG, PNG de máximo 5MB.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Document Checklist (col-span-2) */}
        <div className="lg:col-span-2 space-y-6">
          {documents.map((doc) => {
            const isUploading = uploadingId === doc.id;
            const hasFile = doc.status !== "Pendiente";
            
            return (
              <div
                key={doc.id}
                className={`bg-white rounded-2xl border p-5 md:p-6 shadow-level-1 transition-all ${
                  doc.status === "Rechazado" ? "border-red-200 bg-red-50/[0.01]" : "border-outline-variant/30"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Icon & Title */}
                  <div className="flex items-start gap-4">
                    <div className="mt-1 flex-shrink-0">{getStatusIcon(doc.status)}</div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-bold text-sm text-on-background">{doc.name}</h4>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border ${getStatusBadge(doc.status)}`}>
                          {doc.status}
                        </span>
                        {doc.required ? (
                          <span className="text-[9px] bg-red-500/10 text-red-500 font-semibold px-2 py-0.5 rounded-full border border-red-500/20">
                            Obligatorio
                          </span>
                        ) : (
                          <span className="text-[9px] bg-slate-100 text-slate-500 font-semibold px-2 py-0.5 rounded-full border border-slate-200">
                            Opcional
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-on-surface-variant mt-1 max-w-[450px] leading-relaxed">
                        {doc.description}
                      </p>
                      
                      {hasFile && (
                        <div className="flex items-center gap-2 mt-3 text-xs bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5 w-fit">
                          <span className="material-symbols-outlined text-[16px] text-outline">description</span>
                          <span className="text-[#0b1c30] font-medium truncate max-w-[200px]">{doc.fileName}</span>
                          <span className="text-outline text-[10px]">({doc.uploadDate})</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions / Upload button */}
                  <div className="flex-shrink-0 self-end sm:self-center">
                    {isUploading ? (
                      <div className="w-[120px] space-y-1.5">
                        <div className="flex justify-between text-[10px] font-semibold text-primary">
                          <span>Subiendo...</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-primary h-full transition-all duration-150" style={{ width: `${uploadProgress}%` }}></div>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleUploadClick(doc.id)}
                        disabled={doc.status === "Aprobado"}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                          doc.status === "Aprobado"
                            ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                            : "bg-[#0b1c30] text-white hover:bg-primary transition-colors cursor-pointer"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px]">cloud_upload</span>
                        <span>{hasFile ? "Volver a subir" : "Subir archivo"}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Admin Feedback for Rejection */}
                {doc.status === "Rechazado" && doc.feedback && (
                  <div className="mt-4 bg-red-500/5 border border-red-500/10 rounded-xl p-4 flex gap-2.5 text-xs text-red-600 leading-normal animate-fadeIn">
                    <span className="material-symbols-outlined text-[18px] text-red-500 mt-0.5">feedback</span>
                    <div>
                      <span className="font-bold">Motivo del rechazo de tu asesor:</span>
                      <p className="mt-1 font-medium">{doc.feedback}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right Help Column */}
        <div className="space-y-6">
          {/* Advice card */}
          <div className="bg-white rounded-2xl border border-outline-variant/30 p-6 shadow-level-1 space-y-4">
            <div className="flex items-center gap-2 text-primary font-bold text-sm border-b pb-2">
              <span className="material-symbols-outlined">lightbulb</span>
              <h4>Consejos de Captura</h4>
            </div>
            <ul className="space-y-3.5 text-xs text-on-surface-variant list-disc pl-4 leading-normal">
              <li>
                <span className="font-semibold text-on-background">Fotografías Legibles:</span> Asegúrate de que las esquinas no salgan cortadas y que no haya reflejos de luz sobre las caras plásticas.
              </li>
              <li>
                <span className="font-semibold text-on-background">PDFs Completos:</span> Si cargas comprobantes de pago bancarios, sube la página completa emitida por la ventanilla.
              </li>
              <li>
                <span className="font-semibold text-on-background">Vigencia del Pasaporte:</span> Tu pasaporte debe estar vigente durante el trámite. Si estás renovando, sube el pasaporte anterior y el recibo del nuevo trámite.
              </li>
            </ul>
          </div>

          {/* Contact help */}
          <div className="bg-gradient-to-br from-[#0b1c30] to-[#152e4b] rounded-2xl p-6 text-white shadow-level-1 space-y-4">
            <h4 className="font-bold text-sm">¿Tienes problemas para subir archivos?</h4>
            <p className="text-white/60 text-xs leading-normal">
              Si tu archivo pesa mucho o la plataforma da error, puedes enviarle tus documentos directamente a tu asesor asignado por el chat de soporte o por correo electrónico.
            </p>
            <Link
              href="/dashboard/messages"
              className="inline-flex items-center gap-1.5 text-primary-fixed hover:underline text-xs font-semibold"
            >
              <span>Ir al Chat de Soporte</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
