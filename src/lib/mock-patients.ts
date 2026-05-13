import { Patient } from "./types";

export const MOCK_PATIENTS: Patient[] = [
  {
    id: "P001",
    name: "Carlos Eduardo Medina Rojas",
    cedula: "V-8.542.317",
    age: 68,
    birthDate: "1957-03-14",
    phone: "+58 424-415-8823",
    email: "c.medina@gmail.com",
    status: "pendiente-biopsia",
    lastVisit: "2025-05-08",
    primaryDiagnosis: "HBP + PSA en ascenso",
    prostaticVolume: 58,
    ipssScore: 18,
    notes:
      "Velocidad de PSA preocupante. Pendiente correlacionar con RM multiparamétrica.",
    psaHistory: [
      { date: "2023-05-01", psaTotal: 5.8,  psaFree: 1.22, label: "May 23" },
      { date: "2023-08-10", psaTotal: 6.9,  psaFree: 1.35, label: "Ago 23" },
      { date: "2023-11-05", psaTotal: 8.1,  psaFree: 1.47, label: "Nov 23" },
      { date: "2024-02-14", psaTotal: 9.3,  psaFree: 1.58, label: "Feb 24" },
      { date: "2024-05-20", psaTotal: 10.7, psaFree: 1.68, label: "May 24" },
      { date: "2024-08-12", psaTotal: 11.4, psaFree: 1.74, label: "Ago 24" },
      { date: "2024-11-18", psaTotal: 11.9, psaFree: 1.81, label: "Nov 24" },
      { date: "2025-02-07", psaTotal: 12.4, psaFree: 1.92, label: "Feb 25" },
      { date: "2025-05-08", psaTotal: 12.8, psaFree: 1.97, label: "May 25" },
    ],
    ecos: [
      {
        id: "E001",
        name: "Eco_Prostatica_Abdominal_May25.pdf",
        type: "application/pdf",
        size: 2340000,
        uploadedAt: "2025-05-08T10:30:00Z",
        category: "prostata",
      },
    ],
  },
  {
    id: "P002",
    name: "José Luis Torrealba Bravo",
    cedula: "V-6.214.880",
    age: 71,
    birthDate: "1954-09-22",
    phone: "+58 412-731-0045",
    status: "post-op",
    lastVisit: "2025-04-30",
    primaryDiagnosis: "Ca próstata pT2c — post prostatectomía radical",
    prostaticVolume: 0,
    ipssScore: 5,
    psaHistory: [
      { date: "2023-06-10", psaTotal: 18.2, psaFree: 2.10, label: "Jun 23" },
      { date: "2023-10-05", psaTotal: 16.8, psaFree: 1.95, label: "Oct 23" },
      { date: "2024-01-15", psaTotal: 0.08, psaFree: 0.01, label: "Ene 24" }, // post-op
      { date: "2024-04-20", psaTotal: 0.06, psaFree: 0.01, label: "Abr 24" },
      { date: "2024-07-18", psaTotal: 0.04, psaFree: 0.00, label: "Jul 24" },
      { date: "2024-10-10", psaTotal: 0.04, psaFree: 0.00, label: "Oct 24" },
      { date: "2025-01-22", psaTotal: 0.05, psaFree: 0.00, label: "Ene 25" },
      { date: "2025-04-30", psaTotal: 0.04, psaFree: 0.00, label: "Abr 25" },
    ],
    ecos: [],
  },
  {
    id: "P003",
    name: "Luis Fernando Gutiérrez Mora",
    cedula: "V-11.308.774",
    age: 59,
    birthDate: "1966-07-04",
    phone: "+58 416-562-3391",
    email: "lfgutierrez@hotmail.com",
    status: "control-psa",
    lastVisit: "2025-05-02",
    primaryDiagnosis: "HBP leve + Litiasis renal bilateral",
    prostaticVolume: 34,
    ipssScore: 9,
    psaHistory: [
      { date: "2024-01-10", psaTotal: 3.8, psaFree: 1.02, label: "Ene 24" },
      { date: "2024-05-08", psaTotal: 4.1, psaFree: 1.08, label: "May 24" },
      { date: "2024-09-15", psaTotal: 4.4, psaFree: 1.10, label: "Sep 24" },
      { date: "2025-01-20", psaTotal: 4.8, psaFree: 1.15, label: "Ene 25" },
      { date: "2025-05-02", psaTotal: 5.2, psaFree: 1.20, label: "May 25" },
    ],
    ecos: [
      {
        id: "E003a",
        name: "Eco_Renal_Bilateral_Ene25.dcm",
        type: "application/dicom",
        size: 8900000,
        uploadedAt: "2025-01-20T14:00:00Z",
        category: "renal",
      },
    ],
  },
  {
    id: "P004",
    name: "Miguel Ángel Soto Hernández",
    cedula: "V-14.720.513",
    age: 65,
    birthDate: "1961-01-30",
    phone: "+58 426-203-9912",
    status: "control-psa",
    lastVisit: "2025-04-15",
    primaryDiagnosis: "Seguimiento HBP moderada",
    prostaticVolume: 48,
    ipssScore: 14,
    psaHistory: [
      { date: "2024-04-10", psaTotal: 2.8, psaFree: 0.90, label: "Abr 24" },
      { date: "2024-10-08", psaTotal: 3.1, psaFree: 0.94, label: "Oct 24" },
      { date: "2025-04-15", psaTotal: 3.4, psaFree: 0.98, label: "Abr 25" },
    ],
    ecos: [],
  },
  {
    id: "P005",
    name: "Ramón Antonio Pérez Castillo",
    cedula: "V-4.891.206",
    age: 73,
    birthDate: "1952-11-08",
    phone: "+58 414-880-6674",
    status: "pendiente-biopsia",
    lastVisit: "2025-05-10",
    primaryDiagnosis: "PSA elevado + nódulo hipoecogénico",
    prostaticVolume: 72,
    ipssScore: 22,
    psaHistory: [
      { date: "2024-02-20", psaTotal: 6.2,  psaFree: 0.92, label: "Feb 24" },
      { date: "2024-06-14", psaTotal: 7.4,  psaFree: 1.00, label: "Jun 24" },
      { date: "2024-10-01", psaTotal: 8.1,  psaFree: 1.05, label: "Oct 24" },
      { date: "2025-02-18", psaTotal: 8.9,  psaFree: 1.09, label: "Feb 25" },
      { date: "2025-05-10", psaTotal: 8.7,  psaFree: 1.07, label: "May 25" },
    ],
    ecos: [],
  },
  {
    id: "P006",
    name: "Antonio José Flores Díaz",
    cedula: "V-9.103.558",
    age: 52,
    birthDate: "1973-04-17",
    phone: "+58 412-644-1283",
    email: "aflores@empresa.com.ve",
    status: "nuevo",
    lastVisit: "2025-05-13",
    primaryDiagnosis: "Cólico nefrítico — primera consulta",
    psaHistory: [
      { date: "2025-05-13", psaTotal: 2.1, psaFree: 0.62, label: "May 25" },
    ],
    ecos: [],
  },
];

export function getPatientById(id: string): Patient | undefined {
  return MOCK_PATIENTS.find((p) => p.id === id);
}

export function filterPsaHistory(
  history: Patient["psaHistory"],
  range: "6m" | "1y" | "2y"
): Patient["psaHistory"] {
  const now = new Date();
  const months = range === "6m" ? 6 : range === "1y" ? 12 : 24;
  const cutoff = new Date(now.setMonth(now.getMonth() - months));
  return history.filter((r) => new Date(r.date) >= cutoff);
}
