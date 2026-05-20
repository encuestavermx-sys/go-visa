"use client";

import { useEffect, useState } from "react";
import { waitTimeService } from "../../../lib/dbService";

export default function WaitTimesManager() {
  const [waitTimes, setWaitTimes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    waitTimeService.getWaitTimes().then((data) => {
      setWaitTimes(data);
      setLoading(false);
    });
  }, []);

  const handleInputChange = (cityId: string, field: "casWaitDays" | "interviewWaitDays", value: number) => {
    setWaitTimes((prev) =>
      prev.map((item) => {
        if (item.id === cityId) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  const handleSave = async (cityId: string) => {
    const cityData = waitTimes.find((w) => w.id === cityId);
    if (!cityData) return;

    setUpdatingId(cityId);
    try {
      await waitTimeService.updateWaitTime(cityId, cityData.casWaitDays, cityData.interviewWaitDays);
      alert(`Tiempos de espera de ${cityData.city} guardados con éxito.`);
    } catch (e) {
      alert("Error al actualizar tiempos de espera.");
    } finally {
      setUpdatingId(null);
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
      {/* Header */}
      <div>
        <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase">Panel de Configuración</span>
        <h1 className="text-2xl md:text-3xl font-extrabold text-[#0b1c30] mt-1">Gestión de Tiempos de Espera</h1>
        <p className="text-xs text-slate-500 mt-1">
          Ajusta las estimaciones oficiales de retraso en días para citas CAS (Biométricos) e Entrevistas en los Consulados de México.
        </p>
      </div>

      {/* Grid of Consulates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {waitTimes.map((item) => {
          const isSaving = updatingId === item.id;
          return (
            <div
              key={item.id}
              className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col justify-between space-y-6 shadow-sm"
            >
              <div>
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">distance</span>
                  <span>{item.city}</span>
                </h3>
                <p className="text-[10px] text-slate-400 mt-1 font-mono uppercase">ID Sede: {item.id}</p>
              </div>

              <div className="space-y-4 border-t border-slate-100 pt-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 font-semibold uppercase">Cita CAS (Días)</label>
                  <input
                    type="number"
                    min="0"
                    value={item.casWaitDays}
                    onChange={(e) => handleInputChange(item.id, "casWaitDays", Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:border-primary outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 font-semibold uppercase">Entrevista Consular (Días)</label>
                  <input
                    type="number"
                    min="0"
                    value={item.interviewWaitDays}
                    onChange={(e) => handleInputChange(item.id, "interviewWaitDays", Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:border-primary outline-none transition-colors"
                  />
                </div>
              </div>

              <button
                onClick={() => handleSave(item.id)}
                disabled={isSaving}
                className="w-full bg-primary text-white py-2 rounded-xl text-xs font-bold hover:bg-primary/95 transition-all flex items-center justify-center gap-1.5 shadow-sm"
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">save</span>
                    <span>Guardar Cambios</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
