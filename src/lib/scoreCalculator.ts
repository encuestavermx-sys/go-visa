export interface VisaScoreResult {
  score: number;
  level: "Bajo" | "Medio" | "Alto";
  recommendations: string[];
  risks: string[];
}

export function calculateVisaScore(formData: any): VisaScoreResult {
  let score = 50; // Base score
  const recommendations: string[] = [];
  const risks: string[] = [];

  if (!formData) {
    return {
      score: 50,
      level: "Medio",
      recommendations: ["Completa el formulario DS-160 para calcular tu puntaje de viabilidad."],
      risks: ["Información incompleta."],
    };
  }

  // 1. Employment and Stability (Max +30, Min 0)
  const occupation = formData.occupation || "";
  const employmentYears = parseFloat(formData.employmentYears) || 0;
  const isStudent = occupation.toLowerCase() === "estudiante";
  const isRetired = occupation.toLowerCase() === "jubilado" || occupation.toLowerCase() === "pensionado";
  const isHomemaker = occupation.toLowerCase() === "ama de casa" || occupation.toLowerCase() === "hogar";
  const isUnemployed = occupation.toLowerCase() === "desempleado" || occupation.toLowerCase() === "ninguno";

  if (isUnemployed) {
    score -= 15;
    risks.push("Actualmente sin empleo registrado, lo cual representa un riesgo de arraigo débil.");
    recommendations.push(
      "Si estudias o realizas trabajo independiente, regístralo detalladamente en el campo de ocupación.",
      "Si dependes económicamente de un familiar directo (cónyuge o padres), presenta sus estados de cuenta e INE en la entrevista."
    );
  } else if (isStudent) {
    score += 15;
    recommendations.push(
      "Llevar constancia de estudios vigente y boleta de calificaciones sellada por la institución académica.",
      "Presentar estados de cuenta financieros de tus padres o tutores que solventarán el viaje."
    );
  } else if (isRetired) {
    score += 20;
    recommendations.push(
      "Llevar tu comprobante de jubilación (resolución del IMSS/ISSSTE o equivalente) y los últimos estados de cuenta de depósito de pensión."
    );
  } else if (isHomemaker) {
    score += 10;
    recommendations.push(
      "Llevar acta de matrimonio e identificación oficial de tu cónyuge junto con sus comprobantes laborales e ingresos."
    );
  } else {
    // Employed or Business Owner
    if (employmentYears >= 3) {
      score += 25;
    } else if (employmentYears >= 1) {
      score += 15;
    } else {
      score += 5;
      risks.push("Poca antigüedad en el empleo o negocio actual (menor a 1 año).");
      recommendations.push(
        "Llevar contrato de trabajo anterior para demostrar continuidad laboral y estabilidad en el mismo ramo.",
        "Obtener una carta patronal membretada indicando tu fecha de ingreso, puesto e ingresos mensuales."
      );
    }
  }

  // 2. Income (Max +20, Min 0)
  const monthlyIncome = parseFloat(formData.monthlyIncome) || 0;
  if (monthlyIncome >= 35000) {
    score += 20;
  } else if (monthlyIncome >= 20000) {
    score += 15;
  } else if (monthlyIncome >= 12000) {
    score += 10;
  } else if (monthlyIncome > 0) {
    score += 2;
    risks.push("Ingresos declarados menores a $12,000 MXN mensuales, lo cual puede ser percibido como presupuesto ajustado.");
    recommendations.push(
      "Llevar estados de cuenta bancarios que demuestren solvencia y un ahorro sólido acumulado en los últimos 3 meses.",
      "Evitar depósitos atípicos de última hora antes de la entrevista."
    );
  }

  // 3. Travel History (Max +20, Min 0)
  const hasTravelHistory = formData.hasTravelHistory === "yes" || formData.hasTravelHistory === true;
  const traveledCountries = formData.traveledCountries || "";
  
  if (hasTravelHistory) {
    score += 15;
    const countriesLower = traveledCountries.toLowerCase();
    if (
      countriesLower.includes("europa") ||
      countriesLower.includes("españa") ||
      countriesLower.includes("francia") ||
      countriesLower.includes("inglaterra") ||
      countriesLower.includes("canadá") ||
      countriesLower.includes("canada") ||
      countriesLower.includes("japon") ||
      countriesLower.includes("japón") ||
      countriesLower.includes("alemania")
    ) {
      score += 5; // Extra boost for strong travel history
      recommendations.push(
        "Llevar pasaportes anteriores con los sellos y visados de tus viajes internacionales previos."
      );
    } else {
      recommendations.push(
        "Mencionar con naturalidad tus viajes anteriores si el cónsul te pregunta."
      );
    }
  } else {
    score += 0;
    risks.push("Sin historial de viajes internacionales registrados en el pasaporte actual.");
    recommendations.push(
      "Enfocarse fuertemente en demostrar que viajas por motivos puramente turísticos o de negocios temporales y que tienes fuertes lazos en México."
    );
  }

  // 4. Family and Ties in Mexico (Max +15, Min -15)
  const maritalStatus = formData.maritalStatus || "";
  const hasFamilyInUS = formData.hasFamilyInUS === "yes" || formData.hasFamilyInUS === true;
  const familyStatusInUS = formData.familyStatusInUS || ""; // e.g. "citizen", "resident", "nonimmigrant", "undocumented"

  if (maritalStatus === "married" || maritalStatus === "casado" || maritalStatus === "union_libre") {
    score += 10;
  } else {
    score += 5;
  }

  if (hasFamilyInUS) {
    if (familyStatusInUS === "undocumented" || familyStatusInUS === "ilegal") {
      score -= 20;
      risks.push("Tiene familiares directos en EE. UU. en situación migratoria irregular o no especificada.");
      recommendations.push(
        "En la entrevista, responde siempre con la verdad. Negar tener familiares si ellos tienen bases de datos cruzadas es motivo de rechazo automático por fraude.",
        "Preparar argumentos claros de que tus intenciones son volver y que no pretendes quedarte a vivir con tu familiar."
      );
    } else {
      score -= 5;
      risks.push("Tiene familiares directos residiendo en EE. UU.");
      recommendations.push(
        "Explicar claramente que tienes tu vida formalizada en México (trabajo, escuela, patrimonio) y que el viaje es estrictamente vacacional."
      );
    }
  }

  // 5. Purpose and Travel Funding (Max +15)
  const travelPurpose = formData.travelPurpose || "";
  const travelFundedBy = formData.travelFundedBy || "";

  if (travelFundedBy === "self" || travelFundedBy === "propio") {
    score += 10;
  } else {
    score += 5;
    recommendations.push(
      "Llevar carta firmada del patrocinador del viaje comprometiéndose a cubrir los gastos, junto con sus comprobantes de ingresos y copia de INE."
    );
  }

  // 6. Security & Visa Denials (Critical Penalties)
  const hasVisaDenials = formData.hasVisaDenials === "yes" || formData.hasVisaDenials === true;
  if (hasVisaDenials) {
    score -= 15;
    risks.push("Historial previo de visa denegada.");
    recommendations.push(
      "Identificar qué ha cambiado positivamente en tu perfil laboral, económico o familiar desde tu última entrevista para podérselo explicar al cónsul.",
      "Llevar la hoja de rechazo previa (214b o similar) si aún la conservas."
    );
  }

  // Clamp score between 10 and 98 (to keep it realistic, nobody has a 100% guarantee)
  score = Math.max(10, Math.min(98, score));

  let level: "Bajo" | "Medio" | "Alto" = "Medio";
  if (score >= 80) {
    level = "Alto";
  } else if (score < 50) {
    level = "Bajo";
  }

  // Standard premium advice for everyone
  recommendations.push(
    "Vestir de manera formal-casual y cómoda el día de la entrevista.",
    "Responder únicamente lo que el cónsul te pregunte de forma clara, directa y segura, sin extender explicaciones innecesarias."
  );

  return {
    score,
    level,
    recommendations: Array.from(new Set(recommendations)),
    risks: Array.from(new Set(risks)),
  };
}
