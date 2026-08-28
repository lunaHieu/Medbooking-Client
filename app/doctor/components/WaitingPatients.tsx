"use client"

import { User } from "lucide-react"
import type { ReactNode } from "react"
import type {
  DoctorQueuePatient as Patient,
  PatientDetail,
  DoctorDashboardMedicalRecord as MedicalRecord,
} from "@/lib/model"

interface WaitingPatientsProps {
  waitingPatients: Patient[]
  medicalRecords: MedicalRecord[]
  getStatusInfo: (status: string) => { cls: string; text: string; icon?: ReactNode }
  getPriorityColor: (priority: string) => string
  getPriorityText: (priority: string) => string
  handleViewPatientDetail: (id: number) => void
  handleStartExam: (patient: PatientDetail) => void;
}

export default function WaitingPatients({
  waitingPatients,
  getStatusInfo,
  getPriorityColor,
  getPriorityText,
  handleViewPatientDetail,
}: WaitingPatientsProps) {
  const checkedInPatients = waitingPatients.filter(patient => patient.status === "CheckedIn")

  return (
    <div className="bg-white rounded-2xl shadow border p-4 mb-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">
        Bệnh nhân đang chờ ({checkedInPatients.length})
      </h3>
      <div className="space-y-3">
        {checkedInPatients.length > 0 ? (
          checkedInPatients.map((patient) => {
            const statusInfo = getStatusInfo(patient.status)
            return (
              <div
                key={patient.id}
                className={`flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-all duration-200 ${patient.priority === 'emergency' ? 'border-red-200 bg-red-50' :
                  patient.priority === 'high' ? 'border-orange-200 bg-orange-50' :
                    'border-slate-200'
                  }`}
              >
                <div
                  className="flex items-center gap-4 flex-1 cursor-pointer"
                  onClick={() => handleViewPatientDetail(patient.id)}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${patient.priority === 'emergency' ? 'bg-red-100' :
                    patient.priority === 'high' ? 'bg-orange-100' :
                      'bg-blue-100'
                    }`}>
                    <User className={`w-6 h-6 ${patient.priority === 'emergency' ? 'text-red-600' :
                      patient.priority === 'high' ? 'text-orange-600' :
                        'text-blue-600'
                      }`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="font-semibold text-slate-900">{patient.name}</h4>
                      <span className="text-sm text-slate-500">{patient.age} tuổi</span>
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${statusInfo.cls}`}>
                        {statusInfo.icon}
                        <span>{statusInfo.text}</span>
                      </div>
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(patient.priority)}`}>
                        {getPriorityText(patient.priority)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mb-1">Triệu chứng: {patient.symptoms}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>📞 {patient.phone}</span>
                      <span>🕒 Check-in: {patient.checkInTime}</span>
                      <span>⏰ Lịch hẹn: {patient.appointmentTime}</span>
                    </div>
                  </div>
                </div>

                <button
                  // onClick={(e) => {
                  //   e.stopPropagation();
                  //   const patientDetail: PatientDetail = {
                  //     id: patient.id,
                  //     name: patient.name,
                  //     age: patient.age,
                  //     gender: patient.gender,
                  //     phone: patient.phone,
                  //     symptoms: patient.symptoms,
                  //     appointmentId: patient.patientId || patient.id,
                  //     allergies: patient.allergies,
                  //     medicalHistory: patient.medicalHistory,
                  //     priority: patient.priority,
                  //     medicalRecords: medicalRecords.filter(r => r.patientName === patient.name)
                  //   };
                  //   handleStartExam(patientDetail);
                  // }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Bắt đầu khám
                </button>
              </div>
            )
          })
        ) : (
          <div className="p-8 text-center text-slate-500 border border-slate-200 rounded-lg">
            <User className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">Không có bệnh nhân nào đang chờ</p>
            <p className="text-sm text-slate-500 mt-1">Tất cả bệnh nhân đã được khám hoặc chưa check-in</p>
          </div>
        )}
      </div>
    </div>
  )
}
