"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import DeleteConfirmationModal from "./DeleteConfirmationModal";

interface Props {
  patientId: string;
  patientName: string;
  isTestPatient: boolean;
}

export default function DeletePatientButton({ patientId, patientName, isTestPatient }: Props) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="bg-red-50 border border-red-100 rounded-2xl p-5">
        <p className="text-xs font-bold text-red-600 uppercase tracking-wide mb-1">Zona de peligro</p>
        <p className="text-xs text-red-500 mb-4">
          Las acciones en esta sección tienen consecuencias importantes sobre los registros clínicos.
        </p>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all shadow-sm"
        >
          <Trash2 className="w-4 h-4" />
          Eliminar paciente
        </button>
      </div>

      {showModal && (
        <DeleteConfirmationModal
          patientId={patientId}
          patientName={patientName}
          isTestPatient={isTestPatient}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
