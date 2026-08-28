"use client";

import { Users, Clock, ChevronLeft, ChevronRight } from "lucide-react"
import type {
  Appointment,
  DoctorQueuePatient as Patient,
  DoctorScheduleDay as ScheduleDay,
} from "@/lib/model"
type StatusInfo = { cls: string; text: string }

interface ScheduleTabProps {
  currentWeek: Date
  setCurrentWeek: (date: Date) => void
  appointments: Appointment[]
  waitingPatients: Patient[]
  handleViewAppointmentDetail: (id: number) => void
  getStatusInfo: (status: string) => StatusInfo
  getPriorityColor: (priority: string) => string
  getPriorityText: (priority: string) => string
  doctorId?: number
  currentDoctor?: { workingHours?: string[] }
}

const ScheduleTab = ({
  currentWeek,
  setCurrentWeek,
  appointments,
  handleViewAppointmentDetail,
  getStatusInfo,
  doctorId,
  currentDoctor
}: ScheduleTabProps) => {

  // --- CÁC HÀM HELPER GIỮ NGUYÊN ---
  const calculateTimeRemaining = (appointmentTime: string): string => {
    try {
      const now = new Date()
      const timeStr = appointmentTime.replace(' ', 'T');
      const apptTime = new Date(timeStr);
      if (isNaN(apptTime.getTime())) return "giờ không hợp lệ"
      const diffMs = apptTime.getTime() - now.getTime()
      const diffMins = Math.floor(diffMs / (1000 * 60))
      if (diffMins < 0) return "quá hẹn"
      if (diffMins < 60) return `${diffMins} phút`
      const diffHours = Math.floor(diffMins / 60)
      return `${diffHours} giờ`
    } catch {
      return "lỗi tính giờ"
    }
  }

  const getTimeSlotsForDay = (date: Date): string[] => {
    const dayOfWeek = date.getDay()
    const defaultSlots = ["08:00-12:00", "13:30-17:00"]
    if (dayOfWeek === 0 || dayOfWeek === 6) return ["08:00-12:00"]
    if (currentDoctor?.workingHours) return currentDoctor.workingHours
    return defaultSlots
  }

  const getWeekSchedule = (date: Date): ScheduleDay[] => {
    const startOfWeekDate = new Date(date);
    startOfWeekDate.setDate(date.getDate() - date.getDay());

    return Array.from({ length: 7 }).map((_, i) => {
      const day = new Date(startOfWeekDate);
      day.setDate(startOfWeekDate.getDate() + i);

      const dayAppointments = appointments.filter(appt => {
        try {
          const timeStr = appt.StartTime ? appt.StartTime.replace(' ', 'T') : "";
          const apptDate = new Date(timeStr);

          if (isNaN(apptDate.getTime())) return false;

          const isSameDay = apptDate.toDateString() === day.toDateString();

          const isSameDoctor = !doctorId || appt.DoctorID == doctorId;

          return isSameDay && isSameDoctor;
        } catch {
          return false;
        }
      });

      return {
        id: i + 1,
        date: day.toISOString().split('T')[0],
        appointments: dayAppointments.length,
        timeSlots: getTimeSlotsForDay(day),
        appointmentsList: dayAppointments
      };
    });
  };

  const currentWeekSchedule = getWeekSchedule(currentWeek)

  const getSafeAppointmentTime = (appointmentTime: string): string => {
    try {
      // Sửa định dạng chuỗi trước khi parse
      const timeStr = appointmentTime.replace(' ', 'T');
      const date = new Date(timeStr);

      if (isNaN(date.getTime())) return "Giờ lỗi";

      return date.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return "Lỗi định dạng";
    }
  }

  // --- PHẦN HIỂN THỊ (RENDER) ---
  return (
    <div className="bg-white rounded-2xl shadow-lg border p-6">
      {/* 1. Header & Điều hướng */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Lịch làm việc của tôi</h2>
          <p className="text-slate-600 mt-1">Quản lý lịch hẹn và thời gian làm việc</p>

          <div className="flex flex-wrap gap-2 mt-3">
            <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
              Tổng: {appointments.length} lịch
            </div>
            <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
              Tuần này: {currentWeekSchedule.reduce((sum, day) => sum + day.appointments, 0)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-4 lg:mt-0">
          <button
            onClick={() => {
              const newDate = new Date(currentWeek);
              newDate.setDate(currentWeek.getDate() - 7);
              setCurrentWeek(newDate);
            }}
            className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>

          <div className="text-center min-w-[150px]">
            <span className="font-semibold text-slate-900 text-lg">
              {currentWeek.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
            </span>
            <p className="text-sm text-slate-600">
              {new Date(currentWeekSchedule[0].date).toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' })} - {new Date(currentWeekSchedule[6].date).toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' })}
            </p>
          </div>

          <button
            onClick={() => {
              const newDate = new Date(currentWeek);
              newDate.setDate(currentWeek.getDate() + 7);
              setCurrentWeek(newDate);
            }}
            className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
          >
            <ChevronRight className="w-5 h-5 text-slate-600" />
          </button>

          <button
            onClick={() => setCurrentWeek(new Date())}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
          >
            Hôm nay
          </button>
        </div>
      </div>
      {/*Lưới lịch */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4 mb-8">
        {currentWeekSchedule.map((day) => {
          const isToday = new Date(day.date).toDateString() === new Date().toDateString();
          const isWeekend = new Date(day.date).getDay() === 0 || new Date(day.date).getDay() === 6;

          return (
            <div
              key={day.date}
              className={`flex flex-col min-h-[450px] rounded-xl border transition-all ${isToday ? 'bg-blue-50/50 border-blue-200 ring-1 ring-blue-100' : 'bg-white border-slate-200'
                } ${isWeekend ? 'bg-slate-50/30' : ''}`}
            >
              {/* Header ngày */}
              <div className={`p-3 text-center border-b ${isToday ? 'bg-blue-600 text-white rounded-t-xl' : 'text-slate-700'}`}>
                <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                  {new Date(day.date).toLocaleDateString('vi-VN', { weekday: 'short' })}
                </p>
                <p className="text-xl font-black">
                  {new Date(day.date).getDate()}
                </p>
              </div>

              {/* Danh sách thẻ lịch hẹn */}
              <div className="p-2 space-y-3 flex-1 overflow-y-auto max-h-[400px]">
                {day.appointmentsList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full opacity-20 py-10">
                    <Clock className="w-6 h-6 mb-1" />
                    <p className="text-[9px] font-bold">TRỐNG</p>
                  </div>
                ) : (
                  day.appointmentsList.map((appt) => {
                    const normalizedStatus = (appt?.Status || "").toLowerCase();
                    const statusInfo = getStatusInfo(normalizedStatus);

                    return (
                      <div
                        key={appt.AppointmentID}
                        onClick={() => handleViewAppointmentDetail(appt.AppointmentID)}
                        className="group relative p-3 bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md hover:border-blue-400 transition-all cursor-pointer"
                      >
                        {/* <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg ${getPriorityColor(appt.Priority || "medium")}`}></div> */}

                        <div className="flex justify-between items-start mb-1 gap-1">
                          <span className="text-[10px] font-black text-blue-700">
                            {/* Dùng StartTime thay vì appointmentTime */}
                            {getSafeAppointmentTime(appt.StartTime)}
                          </span>
                          <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase ${statusInfo?.cls}`}>
                            {statusInfo?.text || appt.Status}
                          </span>
                        </div>

                        <p className="text-xs font-bold text-slate-900 truncate">
                          {/* Lấy từ object patient lồng bên trong JSON */}
                           {appt.PatientName || appt.patient?.FullName || "Bệnh nhân chưa có tên"}
                        </p>

                        <div className="flex items-center gap-1 text-[9px] text-slate-500 mt-1">
                          <Users className="w-3 h-3 flex-shrink-0" />
                          {/* Dùng InitialSymptoms từ JSON */}
                          <span className="truncate">{appt.InitialSymptoms || "Khám tổng quát"}</span>
                        </div>

                        {/* Thời gian thực tế */}
                        <div className="mt-2 flex items-center justify-between border-t pt-2 border-slate-100">
                          <span className="text-[9px] text-orange-600 font-bold flex items-center gap-1">
                            <Clock className="w-2 h-2" />
                            {/* Dùng StartTime để tính thời gian còn lại */}
                            {calculateTimeRemaining(appt.StartTime)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Chú thích (Giữ nguyên) */}
      <div className="mt-6 pt-4 border-t border-slate-200">
        <div className="flex flex-wrap gap-4 justify-center text-xs text-slate-600 font-medium">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded"></div>
            <span>Hôm nay</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-slate-100 border border-slate-200 rounded"></div>
            <span>Ngày thường</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-50 border border-orange-200 rounded"></div>
            <span>Cuối tuần</span>
          </div>
          {/* Legend cho trạng thái */}
          <div className="flex items-center gap-2">
            <div className="w-1 h-3 bg-red-500 rounded"></div>
            <span>Cấp cứu</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1 h-3 bg-green-500 rounded"></div>
            <span>Bình thường</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ScheduleTab
