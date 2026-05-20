"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { applicationService } from "../../lib/dbService";
import { formatDate } from "../../lib/utils";

export default function AdminDashboard() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");

  useEffect(() => {
    applicationService.getAllApplications().then((data) => {
      setApplications(data);
      setLoading(false);
    });
  }, []);

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

  const getScoreColorClass = (level: string) => {
    switch (level) {
      case "Alto":
        return "text-green-600";
      case "Medio":
        return "text-amber-600";
      case "Bajo":
        return "text-red-600";
      default:
        return "text-slate-500";
    }
  };

  // Metrics calculations
  const totalClients = applications.length;
  const inReviewCount = applications.filter((app) => app.status === "En revisión" || app.status === "DS-160 completado").length;
  const scheduledCount = applications.filter((app) => app.status === "Cita agendada").length;
  
  const avgScore = totalClients > 0 
    ? Math.round(applications.reduce((acc, app) => acc + (app.visaScore?.score || 50), 0) / totalClients) 
    : 0;

  // Filters
  const filteredApps = applications.filter((app) => {
    const matchesSearch =
      app.userName.toLowerCase().includes(search.toLowerCase()) ||
      app.userId.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === "Todos" || app.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

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
      {/* Top title */}
      <div>
        <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase">Backoffice Administrativo</span>
        <h1 className="text-2xl md:text-3xl font-extrabold text-[#0b1c30] mt-1">Clientes y Solicitudes</h1>
        <p className="text-xs text-slate-500 mt-1">Supervisa expedientes, valida documentos de soporte y chatea con los solicitantes.</p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Total Clientes</span>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{totalClients}</h3>
          </div>
          <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined">groups</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Por Revisar</span>
            <h3 className="text-2xl font-black text-amber-600 mt-1">{inReviewCount}</h3>
          </div>
          <div className="w-10 h-10 bg-amber-500/10 text-amber-600 rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined">rule</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Citas Agendadas</span>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">{scheduledCount}</h3>
          </div>
          <div className="w-10 h-10 bg-emerald-500/10 text-emerald-600 rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined">event_available</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Score Promedio</span>
            <h3 className="text-2xl font-black text-primary mt-1">{avgScore}%</h3>
          </div>
          <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined">speed</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative max-w-sm w-full">
          <input
            type="text"
            placeholder="Buscar por nombre o ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-primary outline-none transition-colors"
          />
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
        </div>

        {/* Filter status */}
        <div className="flex flex-wrap items-center gap-2">
          {["Todos", "Nuevo", "En revisión", "DS-160 completado", "Pago pendiente", "Cita agendada", "Visa aprobada"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                statusFilter === status
                  ? "bg-primary border-primary text-white shadow-sm"
                  : "bg-slate-50 border-slate-200 text-slate-650 hover:text-slate-800 hover:bg-slate-100"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {filteredApps.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No se encontraron solicitudes que coincidan con los filtros.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  <th className="px-6 py-4">Cliente / ID</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4">Paso Formulario</th>
                  <th className="px-6 py-4">Visa Score</th>
                  <th className="px-6 py-4">Última Modificación</th>
                  <th className="px-6 py-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredApps.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{app.userName}</div>
                      <div className="text-[10px] text-slate-450 mt-0.5">{app.userId}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(app.status)}`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-primary h-full" style={{ width: `${(app.step / 6) * 100}%` }}></div>
                        </div>
                        <span className="font-mono text-slate-500">{app.step}/6</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-mono font-bold ${getScoreColorClass(app.visaScore?.level || "Medio")}`}>
                        {app.visaScore?.score || 50}% ({app.visaScore?.level || "Medio"})
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {formatDate(app.updatedAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/admin/review/${app.userId}`}
                        className="inline-flex items-center gap-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all shadow-sm"
                      >
                        <span>Revisar Trámite</span>
                        <span className="material-symbols-outlined text-[14px]">edit</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
