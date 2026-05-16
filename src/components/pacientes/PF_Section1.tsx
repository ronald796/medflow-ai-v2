"use client";

import { Field, Grid2, Grid3, inputCls, inputErrCls } from "./PF_Shared";
import type { PatientFormState, FormErrors } from "@/types/patient-form";

interface Props {
  form: PatientFormState;
  setField: <K extends keyof PatientFormState>(field: K, value: PatientFormState[K]) => void;
  errors: FormErrors;
  edad: number | null;
}

const SEX_OPTIONS = [
  { value: "MALE", label: "Masculino" },
  { value: "FEMALE", label: "Femenino" },
  { value: "OTHER", label: "Otro" },
];

const MARITAL_OPTIONS = [
  { value: "", label: "Seleccionar..." },
  { value: "SINGLE", label: "Soltero/a" },
  { value: "MARRIED", label: "Casado/a" },
  { value: "DIVORCED", label: "Divorciado/a" },
  { value: "WIDOWED", label: "Viudo/a" },
];

const BLOOD_TYPES = [
  { value: "", label: "Seleccionar..." },
  { value: "A_POS", label: "A+" }, { value: "A_NEG", label: "A-" },
  { value: "B_POS", label: "B+" }, { value: "B_NEG", label: "B-" },
  { value: "AB_POS", label: "AB+" }, { value: "AB_NEG", label: "AB-" },
  { value: "O_POS", label: "O+" }, { value: "O_NEG", label: "O-" },
];

export default function Section1Personales({ form, setField, errors, edad }: Props) {
  const inp = (field: keyof PatientFormState) =>
    errors[field] ? inputErrCls : inputCls;

  return (
    <div className="space-y-4">
      <Grid2>
        <Field label="Nombre completo" required error={errors.nombre}>
          <input
            type="text" value={form.nombre}
            onChange={e => setField("nombre", e.target.value)}
            placeholder="Ej: Carlos Eduardo Medina Rodríguez"
            className={inp("nombre")}
          />
        </Field>
        <Field label="Cédula de identidad" error={errors.cedula} hint="Formato: V-12345678">
          <input
            type="text" value={form.cedula}
            onChange={e => setField("cedula", e.target.value.toUpperCase())}
            placeholder="V-12345678"
            className={inp("cedula")}
          />
        </Field>
      </Grid2>

      <Grid3>
        <Field label="Sexo" required error={errors.sex}>
          <select value={form.sex} onChange={e => setField("sex", e.target.value as PatientFormState["sex"])} className={inp("sex")}>
            <option value="">Seleccionar...</option>
            {SEX_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </Field>
        <Field label="Fecha de nacimiento" required error={errors.fecha_nacimiento}>
          <input
            type="date" value={form.fecha_nacimiento} max={new Date().toISOString().slice(0, 10)}
            onChange={e => setField("fecha_nacimiento", e.target.value)}
            className={inp("fecha_nacimiento")}
          />
        </Field>
        <Field label="Edad">
          <input
            type="text" value={edad !== null ? `${edad} años` : "—"} disabled
            className={`${inputCls} bg-slate-100 text-slate-500 cursor-default`}
          />
        </Field>
      </Grid3>

      <Grid2>
        <Field label="Estado civil">
          <select value={form.marital_status} onChange={e => setField("marital_status", e.target.value as PatientFormState["marital_status"])} className={inputCls}>
            {MARITAL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </Field>
        <Field label="Ocupación">
          <input type="text" value={form.occupation} onChange={e => setField("occupation", e.target.value)} placeholder="Ej: Ingeniero, Docente..." className={inputCls} />
        </Field>
      </Grid2>

      <Grid2>
        <Field label="Teléfono móvil" required error={errors.telefono}>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 pointer-events-none">+58</span>
            <input
              type="tel" value={form.telefono}
              onChange={e => setField("telefono", e.target.value)}
              placeholder="414-1234567"
              className={`${inp("telefono")} pl-10`}
            />
          </div>
        </Field>
        <Field label="Teléfono alternativo">
          <input type="tel" value={form.alternative_phone} onChange={e => setField("alternative_phone", e.target.value)} placeholder="+58 212-0000000" className={inputCls} />
        </Field>
      </Grid2>

      <Grid2>
        <Field label="Correo electrónico" error={errors.email}>
          <input type="email" value={form.email} onChange={e => setField("email", e.target.value)} placeholder="paciente@correo.com" className={inp("email")} />
        </Field>
        <Field label="Grupo sanguíneo">
          <select value={form.blood_type} onChange={e => setField("blood_type", e.target.value as PatientFormState["blood_type"])} className={inputCls}>
            {BLOOD_TYPES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </Field>
      </Grid2>

      <Field label="Dirección">
        <textarea rows={2} value={form.address} onChange={e => setField("address", e.target.value)} placeholder="Urb., Calle, Municipio, Estado..." className={inputCls} />
      </Field>

      <Grid2>
        <Field label="Compañía aseguradora">
          <input type="text" value={form.insurance_company} onChange={e => setField("insurance_company", e.target.value)} placeholder="Ej: Seguros Caracas" className={inputCls} />
        </Field>
        <Field label="N° de póliza">
          <input type="text" value={form.insurance_policy} onChange={e => setField("insurance_policy", e.target.value)} placeholder="N° de póliza" className={inputCls} />
        </Field>
      </Grid2>

      <div className="border-t border-slate-50 pt-4">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-3">Contacto de emergencia</p>
        <Grid3>
          <Field label="Nombre">
            <input type="text" value={form.emergency_contact_name} onChange={e => setField("emergency_contact_name", e.target.value)} placeholder="Nombre completo" className={inputCls} />
          </Field>
          <Field label="Teléfono">
            <input type="tel" value={form.emergency_contact_phone} onChange={e => setField("emergency_contact_phone", e.target.value)} placeholder="+58 414-..." className={inputCls} />
          </Field>
          <Field label="Parentesco">
            <input type="text" value={form.emergency_contact_relationship} onChange={e => setField("emergency_contact_relationship", e.target.value)} placeholder="Ej: Cónyuge, Hijo/a" className={inputCls} />
          </Field>
        </Grid3>
      </div>
    </div>
  );
}
