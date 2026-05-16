// MedFlow AI — Traducciones clínicas y helpers de semáforo

export type Signal = "green" | "amber" | "red" | null;

// ── Labels en español ─────────────────────────────────────────────────────────

export const COMORBIDITY_LABELS: Record<string, string> = {
  HTA:           "Hipertensión Arterial",
  DM2:           "Diabetes Mellitus tipo 2",
  DYSLIPIDEMIA:  "Dislipidemia",
  ISCHEMIC_HEART:"Cardiopatía isquémica",
  CKD:           "Insuficiencia Renal Crónica",
  COPD_ASTHMA:   "EPOC / Asma",
  LIVER_DISEASE: "Hepatopatía crónica",
  THYROID:       "Hipo/Hipertiroidismo",
  OBESITY:       "Obesidad",
};

export const COMORBIDITY_ICONS: Record<string, string> = {
  HTA: "❤️", DM2: "🩸", DYSLIPIDEMIA: "🧪", ISCHEMIC_HEART: "💔",
  CKD: "🫘", COPD_ASTHMA: "🫁", LIVER_DISEASE: "🫀", THYROID: "⚗️", OBESITY: "⚖️",
};

export const DIAGNOSIS_LABELS: Record<string, string> = {
  BPH:                 "Hiperplasia Prostática Benigna",
  PSA_ELEVATION:       "Elevación PSA / Sospecha CaP",
  PROSTATE_CANCER:     "Cáncer de Próstata",
  BLADDER_CANCER:      "Cáncer de Vejiga",
  KIDNEY_CANCER:       "Cáncer Renal",
  TESTICULAR_CANCER:   "Cáncer Testicular",
  RENAL_STONES:        "Litiasis Renal",
  URETERAL_STONES:     "Litiasis Ureteral",
  BLADDER_STONES:      "Litiasis Vesical",
  RECURRENT_UTI:       "ITU Recurrente",
  PROSTATITIS:         "Prostatitis",
  ERECTILE_DYSFUNCTION:"Disfunción Eréctil",
  HYPOGONADISM:        "Hipogonadismo",
  MALE_INFERTILITY:    "Infertilidad masculina",
  VARICOCELE:          "Varicocele",
  HYDROCELE:           "Hidrocele",
  PHIMOSIS:            "Fimosis",
  URINARY_INCONTINENCE:"Incontinencia urinaria",
  OVERACTIVE_BLADDER:  "Vejiga hiperactiva",
  POST_OP_FOLLOWUP:    "Control post-operatorio",
  OTHER:               "Otro",
};

export const LUTS_LABELS: Record<string, string> = {
  NOCTURIA:            "Nicturia",
  INCREASED_FREQUENCY: "Frecuencia diurna aumentada",
  URGENCY:             "Urgencia miccional",
  WEAK_STREAM:         "Chorro débil",
  INCOMPLETE_EMPTYING: "Vaciado incompleto",
  TERMINAL_DRIPPING:   "Goteo terminal",
  DYSURIA:             "Disuria",
  HEMATURIA:           "Hematuria",
  PELVIC_PAIN:         "Dolor pélvico/perineal",
};

export const LUTS_SEVERITY_LABELS: Record<string, string> = {
  MILD:     "Leve",
  MODERATE: "Moderada",
  SEVERE:   "Severa",
};

export const FAMILY_RELATIONSHIP_LABELS: Record<string, string> = {
  FATHER:      "Padre",
  MOTHER:      "Madre",
  BROTHER:     "Hermano",
  SISTER:      "Hermana",
  GRANDFATHER: "Abuelo",
  GRANDMOTHER: "Abuela",
  UNCLE:       "Tío",
  AUNT:        "Tía",
  OTHER:       "Otro familiar",
};

export const FAMILY_PATHOLOGY_LABELS: Record<string, string> = {
  PROSTATE_CANCER:  "Cáncer de Próstata",
  BLADDER_CANCER:   "Cáncer de Vejiga",
  KIDNEY_CANCER:    "Cáncer Renal",
  TESTICULAR_CANCER:"Cáncer Testicular",
  UROLITHIASIS:     "Litiasis urinaria",
  BPH:              "Hiperplasia Prostática Benigna",
  OTHER:            "Otra patología",
};

export const FAMILY_STATUS_LABELS: Record<string, string> = {
  ALIVE:    "Vivo",
  DECEASED: "Fallecido",
};

export const DRE_SIZE_LABELS: Record<string, string> = {
  GRADE_I:   "Grado I — < 25 cc",
  GRADE_II:  "Grado II — 25–50 cc",
  GRADE_III: "Grado III — 50–100 cc",
  GRADE_IV:  "Grado IV — > 100 cc",
};

export const DRE_CONSISTENCY_LABELS: Record<string, string> = {
  NORMAL:    "Normal",
  INCREASED: "Aumentada (elástica/firme)",
  STONY:     "Pétrea — alta sospecha maligna",
};

export const DRE_LOCATION_LABELS: Record<string, string> = {
  RIGHT_LOBE: "Lóbulo derecho",
  LEFT_LOBE:  "Lóbulo izquierdo",
  BILATERAL:  "Bilateral",
  APEX:       "Ápex",
};

export const SMOKING_LABELS: Record<string, string> = {
  NEVER:     "Nunca fumó",
  EX_SMOKER: "Ex-fumador",
  ACTIVE:    "Fumador activo",
};

export const ALCOHOL_LABELS: Record<string, string> = {
  NEVER:     "No consume",
  SOCIAL:    "Social",
  MODERATE:  "Moderado",
  EXCESSIVE: "Excesivo",
};

export const BLOOD_TYPE_LABELS: Record<string, string> = {
  A_POS: "A+", A_NEG: "A−",
  B_POS: "B+", B_NEG: "B−",
  AB_POS: "AB+", AB_NEG: "AB−",
  O_POS: "O+", O_NEG: "O−",
};

export const SEX_LABELS: Record<string, string> = {
  MALE: "Masculino", FEMALE: "Femenino", OTHER: "Otro",
};

export const MARITAL_LABELS: Record<string, string> = {
  SINGLE: "Soltero/a", MARRIED: "Casado/a",
  DIVORCED: "Divorciado/a", WIDOWED: "Viudo/a",
};

// ── Helpers de semáforo clínico ───────────────────────────────────────────────

export function psaTotalSignal(psa: number | null): Signal {
  if (psa === null) return null;
  if (psa > 10) return "red";
  if (psa > 4)  return "amber";
  return "green";
}

export function ratioLTSignal(ratio: number | null): Signal {
  if (ratio === null) return null;
  if (ratio < 15)  return "red";
  if (ratio < 20)  return "amber";
  return "green";
}

export function densitySignal(density: number | null): Signal {
  if (density === null) return null;
  if (density > 0.15)  return "red";
  if (density > 0.10)  return "amber";
  return "green";
}

export function ipssSignal(score: number | null): Signal {
  if (score === null) return null;
  if (score >= 20) return "red";
  if (score >= 8)  return "amber";
  return "green";
}

export function ipssLabel(score: number | null): string {
  if (score === null) return "—";
  if (score >= 20) return "Severo";
  if (score >= 8)  return "Moderado";
  return "Leve";
}

export function bmiSignal(bmi: number | null): Signal {
  if (bmi === null) return null;
  if (bmi >= 30)   return "red";
  if (bmi >= 25)   return "amber";
  if (bmi >= 18.5) return "green";
  return "amber";
}

export function bmiLabel(bmi: number | null): string {
  if (bmi === null) return "—";
  if (bmi >= 30)   return "Obesidad";
  if (bmi >= 25)   return "Sobrepeso";
  if (bmi >= 18.5) return "Normal";
  return "Bajo peso";
}

export function lutsSeveritySignal(severity: string | null): Signal {
  if (!severity) return null;
  if (severity === "SEVERE")   return "red";
  if (severity === "MODERATE") return "amber";
  return "green";
}

// ── Colores de badge según señal ──────────────────────────────────────────────

export function signalBadgeClass(s: Signal): string {
  if (s === "green") return "bg-medflow-emerald-light text-medflow-emerald border-medflow-emerald/20";
  if (s === "amber") return "bg-amber-50 text-amber-700 border-amber-200";
  if (s === "red")   return "bg-red-50 text-red-700 border-red-200";
  return "bg-slate-100 text-slate-500 border-slate-200";
}

export function signalEmoji(s: Signal): string {
  if (s === "green") return "🟢";
  if (s === "amber") return "🟡";
  if (s === "red")   return "🔴";
  return "";
}

// ── Helper: valor o "—" ───────────────────────────────────────────────────────

export function val(v: unknown, suffix = ""): string {
  if (v === null || v === undefined || v === "") return "—";
  return `${v}${suffix}`;
}
