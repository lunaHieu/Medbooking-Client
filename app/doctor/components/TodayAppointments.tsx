
"use client";

import { Search, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import type { ReactNode } from "react";
import type {
  DoctorDashboardAppointment as Appointment,
  DoctorQueuePatient as Patient,
  PatientDetail,
  DoctorDashboardMedicalRecord as MedicalRecord,
} from "@/lib/model"

interface TodayAppointmentsProps {
  appointments: Appointment[];
  waitingPatients: Patient[];
  medicalRecords: MedicalRecord[];
  searchTerm: string;
  statusFilter: string;
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
  paginatedAppointments: Appointment[];
  getStatusInfo: (status: string) => { cls: string; text: string; icon?: ReactNode };
  getPriorityColor: (priority: string) => string;
  getPriorityText: (priority: string) => string;
  setSearchTerm: (term: string) => void;
  setStatusFilter: (filter: string) => void;
  setCurrentPage: (page: number | ((prev: number) => number)) => void;
  onViewPatientDetail?: (patient: Patient) => void;
  handleStartExam: (patient: PatientDetail) => void;
  handleViewAppointmentDetail?: (id: number) => void;
}

export default function TodayAppointments({
  waitingPatients,
  medicalRecords,
  searchTerm,
  statusFilter,
  currentPage,
  totalPages,
  paginatedAppointments,
  getStatusInfo,
  getPriorityColor,
  getPriorityText,
  setSearchTerm,
  setStatusFilter,
  setCurrentPage,
  handleViewAppointmentDetail,
  handleStartExam,
}: TodayAppointmentsProps) {
  const handlePrevPage = () => setCurrentPage((prev) => Math.max(1, prev - 1));
  const handleNextPage = () => setCurrentPage((prev) => Math.min(totalPages, prev + 1));

  const renderPaginationButtons = () => {
    const buttons = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);

    for (let i = start; i <= end; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => setCurrentPage(i)}
          className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${i === currentPage
            ? "bg-blue-600 text-white shadow-md"
            : "border border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
        >
          {i}
        </button>
      );
    }
    return buttons;
  };

  return (
    <div className="bg-white rounded-2xl shadow border p-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Lịch hẹn hôm nay</h2>
          <p className="text-slate-600">Quản lý và theo dõi lịch khám trong ngày</p>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 lg:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm bệnh nhân..."
              className="pl-10 pr-4 py-2 border rounded-lg w-full lg:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="waiting">Đang chờ / Đã xác nhận</option>
            <option value="checked_in">Đã check-in</option>
            <option value="in_progress">Đang khám</option>
            <option value="completed">Đã khám</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {paginatedAppointments.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Không có lịch hẹn nào</p>
            <p className="text-sm">Hôm nay chưa có bệnh nhân nào đặt lịch</p>
          </div>
        ) : (
          paginatedAppointments.map((appt) => {
            const fullPatient = waitingPatients.find(p => p.id === appt.id);
            const statusInfo = getStatusInfo(appt.status);

            return (
              <div
                key={appt.id}
                className="border border-slate-200 rounded-xl p-4 hover:shadow-md transition-all cursor-pointer"
                onClick={() => {
                  if (handleViewAppointmentDetail) {
                    handleViewAppointmentDetail(appt.id);
                  }
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold ${appt.status === "checked_in" ? "bg-green-500" :
                      appt.status === "in_progress" ? "bg-blue-500" :
                        "bg-gray-400"
                      }`}>
                      {appt.patientName?.charAt(0) || "?"}
                    </div>

                    <div>
                      <h3 className="font-semibold text-lg">
                        {appt.patientName || "Không có tên"}
                      </h3>
                      <p className="text-sm text-slate-600">
                        {appt.patientAge || 0} tuổi • {appt.patientPhone || "Chưa có SĐT"}
                      </p>
                      <p className="text-sm text-slate-500 mt-1">
                        Giờ hẹn: {appt.appointmentTime ?
                          (() => {
                            try {
                              const date = new Date(appt.appointmentTime);
                              if (isNaN(date.getTime())) return "Giờ không hợp lệ";
                              return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                            } catch {
                              return "Giờ không hợp lệ";
                            }
                          })()
                          : "Chưa có giờ hẹn"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${statusInfo.cls}`}>
                        {statusInfo.icon}
                        <span>{statusInfo.text}</span>
                      </div>
                      {fullPatient && fullPatient.priority !== 'low' && (
                        <div className={`mt-1 inline-flex px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(fullPatient.priority)}`}>
                          {getPriorityText(fullPatient.priority)}
                        </div>
                      )}
                    </div>

                    {(appt.status === "checked_in" || appt.status === "waiting") && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (fullPatient) {
                            const detail: PatientDetail = {
                              ...fullPatient,
                              medicalRecords: medicalRecords.filter(r => r.patientName === fullPatient.name)
                            };
                            handleStartExam(detail);
                          }
                        }}
                        className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                      >
                        Bắt đầu khám
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 pt-4 border-t flex items-center justify-center gap-6">
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-slate-50 transition"
          >
            <ChevronLeft className="w-4 h-4" />
            Trước
          </button>

          <div className="flex gap-2">
            {renderPaginationButtons()}
          </div>

          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-slate-50 transition"
          >
            Sau
            <ChevronRight className="w-4 h-4" />
          </button>

          <span className="text-sm text-slate-600">
            Trang {currentPage} / {totalPages}
          </span>
        </div>
      )}
    </div>
  );
}
