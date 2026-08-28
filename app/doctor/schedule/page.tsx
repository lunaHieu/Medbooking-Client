"use client";

import { useState, useEffect } from "react"
import {
  Calendar,
  Download,
  Printer,
  Filter,
  RefreshCw,
  Eye,
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  Search,
  Users
} from "lucide-react"
import {
  format, startOfWeek, endOfWeek, isSameDay, parseISO, getMonth, getYear
} from 'date-fns'
import { vi } from 'date-fns/locale'
import type { Appointment, MedicalRecord } from "@/lib/model"
import { doctorService } from "@/app/services/doctorService";
import { FaPhoneAlt } from "react-icons/fa";


// ==================== COMPONENTS ====================
function LoadingState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      <p className="mt-4 text-gray-600">{message}</p>
    </div>
  )
}

function AppointmentDetailModal({
  appointment,
  onClose,
}: {
  appointment: Appointment | null
  onClose: () => void
}) {
  const [activeTab, setActiveTab] = useState<"info" | "history">("info")
  const [patientHistory, setPatientHistory] = useState<MedicalRecord[]>([])

  useEffect(() => {
    if (!appointment?.PatientID) {
      setPatientHistory([])
      return
    }

    let active = true
    doctorService.getPatientHistory(appointment.PatientID)
      .then((response) => {
        if (active) setPatientHistory(response.success ? response.data : [])
      })
      .catch(() => {
        if (active) setPatientHistory([])
      })

    return () => { active = false }
  }, [appointment])

  if (!appointment) return null

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "CheckedIn":
        return {
          cls: "bg-green-100 text-green-800 border-green-200",
          icon: <Clock className="w-4 h-4" />,
          text: "Đã check-in"
        }
      case "InProgress":
        return {
          cls: "bg-blue-100 text-blue-800 border-blue-200",
          icon: <Loader2 className="w-4 h-4 animate-spin" />,
          text: "Đang khám"
        }
      case "Completed":
        return {
          cls: "bg-gray-100 text-gray-800 border-gray-200",
          icon: <CheckCircle className="w-4 h-4" />,
          text: "Hoàn thành"
        }
      case "Cancelled":
        return {
          cls: "bg-red-100 text-red-800 border-red-200",
          icon: <XCircle className="w-4 h-4" />,
          text: "Đã hủy"
        }
      default:
        return {
          cls: "bg-yellow-100 text-yellow-800 border-yellow-200",
          icon: <AlertCircle className="w-4 h-4" />,
          text: "Chờ"
        }
    }
  }

  const statusInfo = getStatusInfo(appointment.Status)
  // const priorityInfo = getPriorityInfo(appointment.priority || "medium")
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Chi tiết lịch hẹn</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab("info")}
            className={`flex-1 py-3 text-center font-medium transition-colors ${activeTab === "info"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
              }`}
          >
            Thông tin
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 py-3 text-center font-medium transition-colors ${activeTab === "history"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
              }`}
          >
            Lịch sử khám
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === "info" ? (
            <div className="space-y-6">
              {/* Patient Info */}
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                   {(appointment.PatientName || appointment.patient?.FullName || "P").charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                   <h3 className="text-lg font-semibold text-gray-900">{appointment.PatientName || appointment.patient?.FullName || "Bệnh nhân không tên"}</h3>
                  <p className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                    <span className="font-medium">Giới tính:</span> {appointment.patient?.Gender}
                  </p>
                  <p className="flex items-center gap-2 text-sm text-gray-600">
                    <FaPhoneAlt className="text-blue-500 w-3.5 h-3.5" />
                    {appointment.patient?.PhoneNumber}
                  </p>
                </div>
              </div>

              {/* Status & Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Trạng thái</p>
                  <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${statusInfo.cls}`}>
                    {statusInfo.icon}
                    <span className="font-medium">{statusInfo.text}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Mức độ ưu tiên</p>
                  {/* <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${priorityInfo.cls}`}>
                    <span className="font-medium">{priorityInfo.text}</span>
                  </div> */}
                </div>
              </div>

              {/* Appointment Time */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Thời gian hẹn</p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  {(() => {
                    // 1. Lấy StartTime và chuyển đổi định dạng có dấu 'T'
                    const timeStr = appointment.StartTime ? appointment.StartTime.replace(' ', 'T') : "";
                    const dateObj = new Date(timeStr);

                    // 2. Kiểm tra nếu ngày hợp lệ thì mới format
                    if (!isNaN(dateObj.getTime())) {
                      return (
                        <>
                          <p className="text-lg font-semibold text-gray-900">
                            {format(dateObj, 'EEEE, dd/MM/yyyy', { locale: vi })}
                          </p>
                          <p className="text-gray-600">
                            {format(dateObj, 'HH:mm')}
                          </p>
                        </>
                      );
                    }
                    return <p className="text-gray-500 font-medium italic">Giờ hẹn không hợp lệ</p>;
                  })()}
                  {/* <p className="text-gray-600">
                    {(() => {
                      const timeStr = appointment.StartTime ? appointment.StartTime.replace(' ', 'T') : "";
                      const dateObj = new Date(timeStr);

                      return !isNaN(dateObj.getTime()) ? format(dateObj, 'HH:mm') : "--:--";
                    })()}

                    {appointment.checkInTime && ` • Check-in: ${appointment.checkInTime}`}
                  </p> */}
                </div>
              </div>

              {/* Symptoms */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Triệu chứng/Lý do khám</p>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <p className="text-gray-800">{appointment.InitialSymptoms}</p>
                </div>
              </div>

              {/* Service Info */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Dịch vụ</p>
                <div className="bg-gray-50 p-3 rounded-lg">
                  {/* <p className="text-gray-800">{appointment.serviceName || "Khám tổng quát"}</p> */}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {patientHistory.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Chưa có lịch sử khám</p>
                </div>
              ) : (
                patientHistory.map((record) => (
                   <div key={record.RecordID} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                       <span className="font-semibold text-gray-900">{record.Diagnosis}</span>
                      <span className="text-sm text-gray-500">
                         {format(parseISO(record.created_at), 'dd/MM/yyyy')}
                      </span>
                    </div>
                     <p className="text-sm text-gray-600 mb-3">{record.Notes || "Không có ghi chú"}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}
const ITEMS_PER_PAGE = 10;
//  MAIN COMPONENT 
export default function SchedulePage() {
  // STATES 
  const [loading, setLoading] = useState(false)
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("week")
  const [filterStatus, setFilterStatus] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [actionType, setActionType] = useState<"refresh" | "export" | "print" | "">("")
  const [currentPage, setCurrentPage] = useState(1);
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentItems = filteredAppointments.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredAppointments.length / ITEMS_PER_PAGE);
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, searchTerm, viewMode, currentWeek]);
  const fetchAppointments = async () => {
    setLoading(true);
    try {
       const res = await doctorService.getSchedule();
       setAppointments(res.data);
       setFilteredAppointments(res.data);
    } catch (error) {
      console.error("Lỗi API:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  // FILTERING 
  useEffect(() => {

    if (!Array.isArray(appointments)) {
      setFilteredAppointments([]);
      return;
    }

    let filtered = [...appointments];

    if (filterStatus !== "all") {
      filtered = filtered.filter(appt => (appt?.Status || "").toLowerCase() === (filterStatus || "").toLowerCase());
    }

    if (searchTerm.trim()) {
      const term = (searchTerm || "").toLowerCase();
      filtered = filtered.filter(appt =>
        (appt?.PatientName || appt?.patient?.FullName || "").toLowerCase().includes(term) ||
        (appt?.patient?.PhoneNumber || "").includes(term) ||
        (appt?.InitialSymptoms || "").toLowerCase().includes(term)
      );
    }

    // 3. Lọc theo ngày (Dùng StartTime và sửa định dạng MySQL)
    filtered = filtered.filter(appt => {
      if (!appt.StartTime) return false;
      const apptDate = new Date(appt.StartTime.replace(' ', 'T'));

      if (viewMode === "day") {
        return isSameDay(apptDate, currentWeek);
      } else if (viewMode === "week") {
        const weekStart = startOfWeek(currentWeek, { locale: vi });
        const weekEnd = endOfWeek(currentWeek, { locale: vi });
        return apptDate >= weekStart && apptDate <= weekEnd;
      } else {
        return getMonth(apptDate) === getMonth(currentWeek) && getYear(apptDate) === getYear(currentWeek);
      }
    });

    // 4. Sắp xếp theo giờ khám
    filtered.sort((a, b) => {
      const dateA = new Date(a.StartTime?.replace(' ', 'T')).getTime();
      const dateB = new Date(b.StartTime?.replace(' ', 'T')).getTime();
      return dateA - dateB;
    });
    setFilteredAppointments(filtered);
  }, [appointments, filterStatus, searchTerm, viewMode, currentWeek]);

  const handleToday = () => {
    setCurrentWeek(new Date())
  }

  const handleRefresh = () => {
    setActionType("refresh")
    setShowConfirmation(true)
  }

  const handlePrint = () => {
    setActionType("print")
    setShowConfirmation(true)
  }

  const handleExport = () => {
    setActionType("export")
    setShowConfirmation(true)
  }

  const confirmAction = async () => {
    setLoading(true);

    try {
      switch (actionType) {
        case "refresh":
          // Gọi lại API thay vì dùng generateMockPatients()
          const res = await doctorService.getSchedule();

          if (res.success) {
            setAppointments(res.data);
            setFilteredAppointments(res.data);
          }
          break;

        case "print":
          window.print();
          break;

        case "export":
          exportToJSON();
          break;
      }
    } catch (error) {
      console.error("Lỗi khi thực hiện thao tác:", error);
    } finally {
      setLoading(false);
      setShowConfirmation(false);
      setActionType("");
    }
  };

  const handleViewAppointmentDetail = (id: number) => {
    const appt = appointments.find(a => a.AppointmentID === id);
    if (appt) {
      setSelectedAppointment(appt);
      setShowDetailModal(true);
    }
  }

  //  HELPER FUNCTIONS
  const getStatusInfo = (status: string) => {
    switch (status) {
      case "CheckedIn":
        return {
          cls: "bg-green-100 text-green-800 border-green-200",
          icon: <Clock className="w-4 h-4" />,
          text: "Đã check-in",
          bg: "bg-green-50"
        }
       case "InProgress":
        return {
          cls: "bg-blue-100 text-blue-800 border-blue-200",
          icon: <Loader2 className="w-4 h-4 animate-spin" />,
          text: "Đang khám",
          bg: "bg-blue-50"
        }
      case "Completed":
        return {
          cls: "bg-gray-100 text-gray-800 border-gray-200",
          icon: <CheckCircle className="w-4 h-4" />,
          text: "Hoàn thành",
          bg: "bg-gray-50"
        }
      case "Cancelled":
        return {
          cls: "bg-red-100 text-red-800 border-red-200",
          icon: <XCircle className="w-4 h-4" />,
          text: "Đã hủy",
          bg: "bg-red-50"
        }
      default:
        return {
          cls: "bg-yellow-100 text-yellow-800 border-yellow-200",
          icon: <AlertCircle className="w-4 h-4" />,
          text: "Chờ",
          bg: "bg-yellow-50"
        }
    }
  }

  const exportToJSON = () => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      viewMode,
      currentDate: currentWeek.toISOString(),
      totalAppointments: filteredAppointments.length,
      appointments: filteredAppointments.map(appt => ({
        id: appt.AppointmentID,
        patient: appt.PatientName || appt.patient?.FullName,
        phone: appt.patient?.PhoneNumber,
        symptoms: appt.InitialSymptoms,
        appointmentTime: appt.StartTime,
        status: appt.Status,
        service: appt.ServiceName || appt.service?.ServiceName,
      }))
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `lich-lam-viec-${format(new Date(), 'yyyy-MM-dd-HH-mm')}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getDateRangeText = () => {
    if (viewMode === "day") {
      return format(currentWeek, "EEEE, dd/MM/yyyy", { locale: vi })
    } else if (viewMode === "week") {
      const start = startOfWeek(currentWeek, { locale: vi })
      const end = endOfWeek(currentWeek, { locale: vi })
      return `${format(start, 'dd/MM')} - ${format(end, 'dd/MM/yyyy')}`
    } else {
      return format(currentWeek, "MMMM yyyy", { locale: vi })
    }
  }

  // RENDER 
  if (loading && appointments.length === 0) {
    return <LoadingState message="Đang tải lịch làm việc..." />
  }

  const stats = {
    total: filteredAppointments?.length || 0,
    waiting: filteredAppointments?.filter(a => (a?.Status || "").toLowerCase() === "pending").length || 0,
    checkedIn: filteredAppointments?.filter(a => (a?.Status || "").toLowerCase() === "checkedin").length || 0,
    inProgress: filteredAppointments?.filter(a => (a?.Status || "").toLowerCase() === "inprogress").length || 0,
    completed: filteredAppointments?.filter(a => (a?.Status || "").toLowerCase() === "completed").length || 0,
    cancelled: filteredAppointments?.filter(a => (a?.Status || "").toLowerCase() === "cancelled").length || 0
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-white rounded-2xl p-6 border border-blue-100">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Calendar className="w-8 h-8 text-blue-600" />
              Lịch làm việc
            </h1>
            <p className="text-gray-600 mt-2">Quản lý và theo dõi lịch hẹn bệnh nhân</p>

            <div className="mt-4 flex items-center gap-4">
              <div className="px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm">
                <span className="font-semibold text-gray-800">
                  {viewMode === "day" ? "Ngày" : viewMode === "week" ? "Tuần" : "Tháng"}: {getDateRangeText()}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Users className="w-4 h-4" />
                <span>{filteredAppointments?.length} lịch hẹn</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleRefresh}
              className="px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors"
              disabled={loading}
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              {loading ? "Đang xử lý..." : "Làm mới"}
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors"
            >
              <Printer className="w-5 h-5" />
              In lịch
            </button>
            <button
              onClick={handleExport}
              className="px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors"
            >
              <Download className="w-5 h-5" />
              Xuất file
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-6 flex flex-wrap gap-4">
          {/* View Mode */}
          <div className="flex border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            {([
              { mode: "day", label: "Ngày" },
              { mode: "week", label: "Tuần" },
              { mode: "month", label: "Tháng" }
            ] as const).map(({ mode, label }) => (
              <button
                key={mode}
                onClick={() => {
                  setViewMode(mode)
                  if (mode === "day") setCurrentWeek(new Date())
                }}
                className={`px-4 py-2 transition-colors ${viewMode === mode
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Tìm bệnh nhân, SĐT, triệu chứng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="Pending">Đang chờ</option>
              <option value="CheckedIn">Đã check-in</option>
              <option value="Completed">Đã hoàn thành</option>
              <option value="Cancelled">Đã hủy</option>
            </select>
          </div>

          {/* Navigation */}
          <div className="flex gap-2">
            <button
              onClick={handleToday}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Tuần này
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          <div className="text-sm text-gray-600">Tổng lịch hẹn</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-2xl font-bold text-yellow-600">{stats.waiting}</div>
          <div className="text-sm text-gray-600">Đang chờ</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-2xl font-bold text-green-600">{stats.checkedIn}</div>
          <div className="text-sm text-gray-600">Đã check-in</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
          <div className="text-sm text-gray-600">Đang khám</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-2xl font-bold text-gray-600">{stats.completed}</div>
          <div className="text-sm text-gray-600">Đã hoàn thành</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
          <div className="text-sm text-gray-600">Đã hủy</div>
        </div>
      </div>

      {/* Schedule Content */}
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        {filteredAppointments?.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium text-gray-600">Không có lịch hẹn nào</p>
            <p className="text-sm text-gray-500 mt-1">
              {searchTerm ? "Thử tìm kiếm với từ khóa khác" :
                viewMode === "day" ? "Hôm nay" : viewMode === "week" ? "Tuần này" : "Tháng này"} chưa có lịch hẹn
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">

              {currentItems?.map((appointment) => {
                const statusInfo = getStatusInfo(appointment.Status)
                // const priorityInfo = getPriorityInfo(appointment.priority)
                const timeStr = appointment.StartTime ? appointment.StartTime.replace(' ', 'T') : "";
                const apptDate = new Date(timeStr);

                return (
                  <div
                    key={`appointment-${appointment.AppointmentID}`}
                    className="flex items-center justify-between p-4 rounded-lg hover:shadow-md transition-all cursor-pointer border"
                    style={{
                      background: statusInfo.bg,
                      borderColor: statusInfo.cls.split(' ')[1].replace('border-', '')
                    }}
                    onClick={() => handleViewAppointmentDetail(appointment.AppointmentID)}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      {/* Time */}
                      <div className="flex flex-col items-center min-w-[80px]">
                        <div className="text-2xl font-bold text-gray-900">
                          {!isNaN(apptDate.getTime()) ? format(apptDate, 'HH:mm') : "--:--"}
                        </div>
                        <div className="text-sm text-gray-600">
                          {!isNaN(apptDate.getTime()) ? format(apptDate, 'dd/MM') : "--/--"}
                        </div>
                      </div>

                      {/* Patient Avatar */}
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg">
                        {(appointment.PatientName || appointment.patient?.FullName || "P").charAt(0).toUpperCase()}
                      </div>

                      {/* Patient Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="font-semibold text-lg text-gray-900">
                            {appointment.PatientName || appointment.patient?.FullName || "Bệnh nhân không tên"}
                          </h4>
                          <span className="text-sm text-gray-600 bg-white px-2 py-1 rounded">
                            {appointment.patient?.Gender}
                          </span>
                          {/* {priorityInfo && (
                            <span className={`text-xs px-2 py-1 rounded ${priorityInfo.cls}`}>
                              {priorityInfo.text}
                            </span>
                          )} */}
                        </div>

                        <p className="flex items-center gap-2 text-sm text-gray-600">
                          <FaPhoneAlt className="text-blue-500 w-3.5 h-3.5" />
                          {appointment.patient?.PhoneNumber}
                        </p>

                        <p className="text-gray-700 text-sm">
                          <span className="font-medium">Triệu chứng:</span> {appointment.InitialSymptoms || "Khám tổng quát"}
                        </p>
                      </div>
                    </div>

                    {/* Status & Actions */}
                    <div className="flex flex-col items-end gap-3">
                      <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${statusInfo.cls}`}>
                        {statusInfo.icon}
                        <span className="font-medium">{statusInfo.text}</span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewAppointmentDetail(appointment.AppointmentID);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg flex items-center gap-1 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        <span className="text-sm">Chi tiết</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
            {/* PHÂN TRANG*/}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-between border-t pt-6">
                <p className="text-sm text-gray-500">
                  Hiển thị {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredAppointments.length)} trong số {filteredAppointments.length} lịch hẹn
                </p>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <div className="flex gap-1">
                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`w-10 h-10 rounded-lg border font-bold transition-all ${currentPage === i + 1
                          ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                          : "bg-white text-gray-600 hover:bg-gray-50 border-gray-200"
                          }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Legend */}
      < div className="bg-gray-50 rounded-xl p-4 border border-gray-200" >
        <h3 className="font-semibold text-gray-800 mb-3">Chú thích trạng thái</h3>
        <div className="flex flex-wrap gap-4">
          {[
            { status: "Confirm", text: "Đang chờ" },
            { status: "Completed", text: "Đã hoàn thành" },
            { status: "CheckedIn", text: "Đã check-in" },
            { status: "Cancelled", text: "Đã hủy" },
          ].map((item) => {
            const info = getStatusInfo(item.status)
            return (
              <div key={item.status} className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded ${info.cls.split(' ')[0]}`}></div>
                <span className="text-sm text-gray-600">{item.text}</span>
              </div>
            )
          })}
        </div>

        {/* Confirmation Modal */}
        {
          showConfirmation && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl p-6 max-w-md w-full">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {actionType === "refresh" && "Làm mới dữ liệu"}
                  {actionType === "print" && "In lịch làm việc"}
                  {actionType === "export" && "Xuất file dữ liệu"}
                </h3>

                <p className="text-gray-600 mb-6">
                  {actionType === "refresh" && "Bạn có chắc muốn làm mới dữ liệu? Dữ liệu hiện tại sẽ được cập nhật."}
                  {actionType === "print" && "Bạn có chắc muốn in lịch làm việc hiện tại?"}
                  {actionType === "export" && `Bạn có chắc muốn xuất ${filteredAppointments?.length} lịch hẹn ra file JSON?`}
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowConfirmation(false)
                      setActionType("")
                    }}
                    className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={confirmAction}
                    className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Đang xử lý...
                      </span>
                    ) : (
                      "Xác nhận"
                    )}
                  </button>
                </div>
              </div>
            </div>
          )
        }

        {/* Detail Modal */}
        {
          showDetailModal && (
            <AppointmentDetailModal
              appointment={selectedAppointment}
              onClose={() => {
                setShowDetailModal(false)
                setSelectedAppointment(null)
              }}
            />
          )
        }
      </div >
    </div>
  )
}
