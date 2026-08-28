"use client"

import { User, Clock, Calendar, Stethoscope } from "lucide-react"
import {
  type DoctorDashboardAppointment as Appointment,
  type DoctorQueuePatient as Patient,
  type PatientDetail,
  type DoctorDashboardMedicalRecord as MedicalRecord,
  PriorityLevel,
  AppointmentStatus,
} from "@/lib/model"

interface ExamInProgressProps {
  appointments: Appointment[]
  waitingPatients: Patient[]
  medicalRecords: MedicalRecord[]
  currentDoctor?: { FullName?: string }
  getPriorityColor: (priority: string) => string
  getPriorityText: (priority: string) => string
  handleStartExam: (patient: PatientDetail) => void
}

export default function ExamInProgress({
  appointments,
  waitingPatients,
  medicalRecords,
  getPriorityColor,
  getPriorityText,
  handleStartExam
}: ExamInProgressProps) {
  const inProgressAppointments = appointments.filter(appt => appt.status === "in_progress")

  return (
    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl shadow-lg border-2 border-blue-300 p-4 mb-6 transform hover:scale-[1.01] transition-all duration-200">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
          <User className="w-4 h-4 text-white" />
        </div>
        <h3 className="text-lg font-bold text-blue-900">ĐANG KHÁM</h3>
        <div className="ml-auto bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
          {inProgressAppointments.length} bệnh nhân
        </div>
      </div>

      <div className="space-y-3">
        {inProgressAppointments.length > 0 ? (
          inProgressAppointments.map((appointment) => {
            // Tìm patient tương ứng
            const fullPatient = waitingPatients.find(p =>
              p.id === appointment.patientId ||
              p.id === appointment.id ||
              p.name === appointment.patientName
            )

            // Tạo patientDetail từ appointment và patient
            const patientDetail: PatientDetail = {
              id: fullPatient?.id || appointment.patientId || appointment.id,
              name: fullPatient?.name || appointment.patientName,
              age: fullPatient?.age || appointment.patientAge || 0,
              gender: fullPatient?.gender || 'other',
              phone: fullPatient?.phone || appointment.patientPhone || '',
              symptoms: fullPatient?.symptoms || appointment.symptoms || '',
              appointmentTime: fullPatient?.appointmentTime || appointment.appointmentTime,
              appointmentId: appointment.id,
              allergies: fullPatient?.allergies || [],
              medicalHistory: fullPatient?.medicalHistory || [],
              // priority: fullPatient?.priority || 'medium',
              medicalRecords: medicalRecords.filter(r => r.patientName === (fullPatient?.name || appointment.patientName)
              ),
              patientId: 0,
              status: AppointmentStatus.CONFIRMED,
              initialSymptoms: "",
              checkInTime: "",
              priority: PriorityLevel.LOW
            }

            return (
              <div key={appointment.id} className="bg-white rounded-xl p-4 border-2 border-blue-400 shadow-md hover:shadow-lg transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="relative">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                        <User className="w-6 h-6" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-bold text-lg text-slate-900">{appointment.patientName}</h4>
                        <span className="text-sm text-slate-600 bg-slate-100 px-2 py-1 rounded">
                          {appointment.patientAge || 0} tuổi
                        </span>

                        <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold bg-blue-100 text-blue-800 border border-blue-300">
                          <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                          <span>ĐANG KHÁM</span>
                        </div>

                        {fullPatient && (
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold border ${getPriorityColor(fullPatient.priority)}`}>
                            {fullPatient.priority === 'emergency' && '🚨'}
                            {fullPatient.priority === 'high' && '⚠️'}
                            {getPriorityText(fullPatient.priority)}
                          </span>
                        )}
                      </div>

                      <p className="text-slate-700 mb-2 font-medium">
                        <span className="text-slate-600">Triệu chứng: </span>
                        {appointment.symptoms || 'Không có thông tin'}
                      </p>

                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <span className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          📞 {appointment.patientPhone || 'Chưa có SĐT'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4 text-blue-500" />
                          Bắt đầu: {appointment.checkInTime || 'Vừa bắt đầu'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-blue-500" />
                          {appointment.appointmentTime ?
                            new Date(appointment.appointmentTime).toLocaleTimeString('vi-VN', {
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : '--:--'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => {
                        // Gọi hàm handleStartExam với patientDetail đã tạo
                        handleStartExam(patientDetail)
                      }}
                      className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold shadow-md hover:shadow-lg flex items-center gap-2"
                    >
                      <Stethoscope className="w-4 h-4" />
                      Tiếp tục khám
                    </button>

                    <div className="text-xs text-slate-500 text-center">
                      Đã khám: 15 phút
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <div className="text-center py-12 text-slate-500 bg-white rounded-xl border-2 border-dashed border-blue-200">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-10 h-10 text-blue-300" />
            </div>
            <p className="text-lg font-medium text-slate-600 mb-2">Không có bệnh nhân đang khám</p>
            <p className="text-sm text-slate-500">Bệnh nhân sẽ xuất hiện ở đây khi bạn bắt đầu khám</p>
          </div>
        )}
      </div>
    </div>
  )
}
