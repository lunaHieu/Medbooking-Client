"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import * as Api from "@/lib/ApiClient";
import * as Model from "@/lib/model";
import { Doctor } from "@/lib/model";

// --- 1. CONFIG PAGINATION ---
const ITEMS_PER_PAGE = 10; // Số lượng dòng trên mỗi trang (áp dụng cho cả 2 tab)

const parseSafeDate = (dateStr: string | Date | null | undefined) => {
  if (!dateStr) return null;
  const s = dateStr.toString().replace(" ", "T");
  const d = new Date(s);
  if (isNaN(d.getTime())) return null;
  return d;
};

const getStatusBadge = (status: string) => {
  const configs: Record<string, { label: string; className: string }> = {
    Pending: { label: "Chờ duyệt", className: "text-yellow-700 bg-yellow-100" },
    Confirmed: { label: "Đã xác nhận", className: "text-blue-700 bg-blue-100" },
    Completed: {
      label: "Hoàn thành",
      className: "text-green-700 bg-green-100",
    },
    Cancelled: { label: "Đã hủy", className: "text-red-700 bg-red-100" },
    CheckedIn: {
      label: "Đã Check-in",
      className: "text-purple-700 bg-purple-100",
    },
    available: { label: "Còn trống", className: "text-green-700 bg-green-100" },
  };

  const config = configs[status];
  if (!config) {
    return (
      <span className="px-2 py-1 text-xs text-gray-700 bg-gray-100 rounded-full">
        {status}
      </span>
    );
  }
  return (
    <span
      className={`px-2 py-1 text-xs font-bold rounded-full ${config.className}`}
    >
      {config.label}
    </span>
  );
};

export default function AppointmentsPage() {
  const [viewMode, setViewMode] = useState<"list" | "schedule">("list");

  // --- TAB 1 STATE ---
  const [appointments, setAppointments] = useState<Model.Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1); // Page của Tab 1

  // --- TAB 2 STATE ---
  const [doctorsList, setDoctorsList] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [doctorSchedule, setDoctorSchedule] = useState<Model.AdminScheduleSlot[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [schedulePage, setSchedulePage] = useState(1); // Page của Tab 2 (Mới thêm)

  // --- COMMON STATE ---
  const [selectedAppt, setSelectedAppt] = useState<Model.Appointment | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [cancelReason, setCancelReason] = useState<string>("");

  // --- DATA LOADING ---
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await Api.getAllAppointments();
      const sortedData = [...data].sort(
        (a, b) =>
          new Date(b.StartTime).getTime() - new Date(a.StartTime).getTime()
      );
      setAppointments(sortedData);
    } catch (error) {
      console.error("Lỗi tải lịch hẹn:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDoctors = async () => {
    try {
      const doctors = await Api.getDoctors();
      setDoctorsList(doctors);
    } catch (error) {
      console.error("Lỗi lấy danh sách bác sĩ", error);
    }
  };

  const handleViewSchedule = async () => {
    if (!selectedDoctorId) return;
    setScheduleLoading(true);
    try {
      const res = await Api.getDoctorScheduleAdmin(
        selectedDoctorId,
        selectedDate
      );
      setDoctorSchedule(res);
      setSchedulePage(1); // Reset về trang 1 khi load dữ liệu mới
    } catch {
      alert("Không tải được lịch làm việc");
    } finally {
      setScheduleLoading(false);
    }
  };

  const refreshCurrentView = () => {
    if (viewMode === "list") loadData();
    else handleViewSchedule();
  };

  const currentSelectedDoctor = useMemo(() => {
    return doctorsList.find((d) => d.DoctorID === selectedDoctorId);
  }, [doctorsList, selectedDoctorId]);

  useEffect(() => {
    loadData();
    fetchDoctors();
  }, [loadData]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, searchTerm]); // Reset page Tab 1 khi filter

  // --- ACTIONS ---
  const openModal = (appt: Model.Appointment) => {
    setSelectedAppt(appt);
    setCancelReason("");
    setIsModalOpen(true);
  };

  const handleConfirm = async () => {
    if (!selectedAppt) return;
    try {
      await Api.confirmAppointment(selectedAppt.AppointmentID);
      alert(`Đã duyệt #${selectedAppt.AppointmentID}`);
      setIsModalOpen(false);
      refreshCurrentView();
    } catch {
      alert("Thất bại.");
    }
  };

  const handleCheckIn = async () => {
    if (!selectedAppt) return;
    try {
      await Api.checkInAppointment(selectedAppt.AppointmentID);
      alert(`Đã check-in #${selectedAppt.AppointmentID}`);
      setIsModalOpen(false);
      refreshCurrentView();
    } catch {
      alert("Thất bại.");
    }
  };

  const handleCancel = async () => {
    if (!selectedAppt) return;
    if (!cancelReason.trim()) return alert("Nhập lý do hủy!");
    try {
      await Api.adminCancelAppointment(
        selectedAppt.AppointmentID,
        cancelReason
      );
      alert(`Đã hủy #${selectedAppt.AppointmentID}`);
      setIsModalOpen(false);
      refreshCurrentView();
    } catch {
      alert("Thất bại.");
    }
  };

  // --- LOGIC PHÂN TRANG TAB 1 ---
  const filteredAppointments = useMemo(() => {
    return appointments.filter((item) => {
      const statusMatch =
        filterStatus === "all" || item.Status === filterStatus;
      const pName = (item.patient?.FullName || "").toLowerCase();
      const dName = (item.doctor?.user?.FullName || "").toLowerCase();
      const idStr = item.AppointmentID.toString();
      const search = (searchTerm || "").toLowerCase();
      return (
        statusMatch &&
        (pName.includes(search) ||
          dName.includes(search) ||
          idStr.includes(search))
      );
    });
  }, [appointments, filterStatus, searchTerm]);

  const totalPagesTab1 = Math.ceil(
    filteredAppointments.length / ITEMS_PER_PAGE
  );
  const currentAppointments = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAppointments.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAppointments, currentPage]);

  // --- LOGIC PHÂN TRANG TAB 2 (MỚI THÊM) ---
  const totalPagesTab2 = Math.ceil(doctorSchedule.length / ITEMS_PER_PAGE);
  const currentScheduleSlots = useMemo(() => {
    const start = (schedulePage - 1) * ITEMS_PER_PAGE;
    return doctorSchedule.slice(start, start + ITEMS_PER_PAGE);
  }, [doctorSchedule, schedulePage]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
      <section className="max-w-7xl w-full mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 min-h-[80vh]">
          {/* HEADER */}
          <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Quản lý Lịch Hẹn
              </h1>
              <p className="text-gray-500 mt-1">
                Xem và xử lý các yêu cầu đặt khám.
              </p>
            </div>
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode("list")}
                className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${
                  viewMode === "list"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Danh sách
              </button>
              <button
                onClick={() => setViewMode("schedule")}
                className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${
                  viewMode === "schedule"
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Tra cứu lịch
              </button>
            </div>
          </div>

          {/* TAB 1 CONTENT */}
          {viewMode === "list" && (
            <div className="animate-fade-in">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6 flex flex-wrap gap-4 items-center">
                <div className="relative flex-grow max-w-md">
                  <input
                    type="text"
                    placeholder="Tìm kiếm..."
                    className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <span className="absolute left-3 top-2.5 text-gray-400"></span>
                </div>
                <select
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="Pending">Chờ duyệt</option>
                  <option value="Confirmed">Đã xác nhận</option>
                  <option value="CheckedIn">Đã Check-in</option>
                  <option value="Completed">Hoàn thành</option>
                  <option value="Cancelled">Đã hủy</option>
                </select>
                <button
                  onClick={loadData}
                  className="text-blue-600 hover:underline text-sm ml-auto"
                >
                  Làm mới dữ liệu
                </button>
              </div>

              <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
                {loading ? (
                  <div className="p-12 text-center text-gray-500">
                    Loading...
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">
                            Mã
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">
                            Bệnh nhân
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">
                            Bác sĩ
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">
                            Thời gian
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">
                            Trạng thái
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">
                            Thao tác
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {currentAppointments.map((item) => {
                          const apptId = item.AppointmentID;
                          const patientName = item.patient?.FullName || "N/A";
                          const patientPhone = item.patient?.PhoneNumber || "N/A";
                          const doctorName = item.doctor?.user?.FullName || "N/A";
                          const specialtyName = item.doctor?.specialty?.SpecialtyName || "---";
                          const apptStatus = item.Status || "Pending";
                          const startTimeObj = parseSafeDate(item.StartTime);
                          return (
                            <tr
                              key={apptId}
                              className="hover:bg-blue-50 transition"
                            >
                              <td className="px-6 py-4 text-sm font-bold">
                                #{apptId}
                              </td>
                              <td className="px-6 py-4">
                                <div className="font-bold text-sm">
                                  {patientName}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {patientPhone}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm font-medium text-blue-700">
                                  BS. {doctorName}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {specialtyName}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {startTimeObj ? startTimeObj.toLocaleDateString("vi-VN") : "N/A"}{" "}
                                <br />
                                <span className="text-xs text-gray-500">
                                  {startTimeObj ? startTimeObj.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "N/A"}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                {getStatusBadge(apptStatus)}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <button
                                  onClick={() => openModal(item)}
                                  className="text-blue-600 font-bold hover:underline text-sm"
                                >
                                  Chi tiết
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                        {currentAppointments.length === 0 && (
                          <tr>
                            <td
                              colSpan={6}
                              className="text-center py-12 text-gray-500"
                            >
                              Không có dữ liệu
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* PAGINATION TAB 1 */}
              {!loading && filteredAppointments.length > 0 && (
                <div className="mt-6 flex justify-end gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                    className="px-3 py-1 border rounded bg-white disabled:opacity-50 hover:bg-gray-100"
                  >
                    Trước
                  </button>
                  <span className="px-3 py-1 font-bold text-gray-600 bg-white border rounded">
                    Trang {currentPage} / {totalPagesTab1 || 1}
                  </span>
                  <button
                    disabled={currentPage >= totalPagesTab1}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className="px-3 py-1 border rounded bg-white disabled:opacity-50 hover:bg-gray-100"
                  >
                    Sau
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2 CONTENT */}
          {viewMode === "schedule" && (
            <div className="animate-fade-in h-full flex flex-col">
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 w-full">
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Chọn Bác sĩ
                  </label>
                  <select
                    className="w-full border rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
                    value={selectedDoctorId || ""}
                    onChange={(e) => {
                      setSelectedDoctorId(Number(e.target.value));
                      setDoctorSchedule([]);
                    }}
                  >
                    <option value="">-- Chọn bác sĩ --</option>
                    {doctorsList.map((dItem) => {
                      const docId = dItem.DoctorID;
                      const docName = dItem.user?.FullName || "Chưa cập nhật";
                      const specName = dItem.specialty?.SpecialtyName || "";
                      return (
                        <option key={docId} value={docId}>
                          BS. {docName} {specName ? `- Khoa ${specName}` : ""}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div className="w-full md:w-56">
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Chọn Ngày
                  </label>
                  <input
                    type="date"
                    className="border rounded-lg px-3 py-2.5 w-full outline-none focus:ring-2 focus:ring-indigo-500"
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setDoctorSchedule([]);
                    }}
                  />
                </div>
                <button
                  onClick={handleViewSchedule}
                  disabled={!selectedDoctorId}
                  className={`px-6 py-2.5 rounded-lg font-bold text-white shadow-md transition ${
                    !selectedDoctorId
                      ? "bg-gray-400"
                      : "bg-indigo-600 hover:bg-indigo-700"
                  }`}
                >
                  Xem lịch
                </button>
              </div>

              <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 flex-1">
                {scheduleLoading ? (
                  <div className="p-12 text-center text-gray-500">
                    Đang tải...
                  </div>
                ) : doctorSchedule.length === 0 ? (
                  <div className="p-12 text-center text-gray-500">
                    <span className="text-2xl block mb-2"></span>Vui lòng chọn
                    Bác sĩ và Ngày.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">
                            Mã
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">
                            Bệnh nhân
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">
                            Bác sĩ
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">
                            Thời gian
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">
                            Trạng thái
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">
                            Thao tác
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {/* Dùng currentScheduleSlots thay vì doctorSchedule */}
                        {currentScheduleSlots.map((slotItem) => {
                          const slotId = slotItem.SlotID;
                          const appt = slotItem.appointment;
                          const apptId = appt?.AppointmentID;
                          const apptStatus = appt?.Status;
                          const patient = appt?.patient;
                          const patientName = patient?.FullName;
                          const patientPhone = patient?.PhoneNumber;
                          const slotStatus = slotItem.Status.toLowerCase();
                          const dStart = parseSafeDate(slotItem.StartTime);
                          const dEnd = parseSafeDate(slotItem.EndTime);
                          const startStr = dStart ? dStart.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false }) : "";
                          const endStr = dEnd ? dEnd.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false }) : "";
                          
                          const docName = currentSelectedDoctor?.user?.FullName || "N/A";
                          const specName = currentSelectedDoctor?.specialty?.SpecialtyName || "---";

                          return (
                            <tr
                              key={slotId}
                              className={`transition ${
                                slotStatus === "available"
                                  ? "hover:bg-green-50"
                                  : "hover:bg-blue-50"
                              }`}
                            >
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">
                                #{appt ? apptId : slotId}
                              </td>
                              <td className="px-6 py-4">
                                {patient ? (
                                  <>
                                    <div className="font-bold text-sm">
                                      {patientName}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {patientPhone}
                                    </div>
                                  </>
                                ) : (
                                  <span className="text-sm text-gray-400 italic">
                                    -- Chưa đặt --
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm font-medium text-blue-700">
                                  BS. {docName}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {specName}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {dStart ? dStart.toLocaleDateString("vi-VN") : "N/A"}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {startStr} - {endStr}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {slotStatus === "available"
                                  ? getStatusBadge("available")
                                  : getStatusBadge(apptStatus || slotStatus)}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <button
                                  onClick={() => appt && openModal(appt)}
                                  disabled={!appt}
                                  className={`font-bold text-sm ${
                                    appt
                                      ? "text-blue-600 hover:underline"
                                      : "text-gray-300"
                                  }`}
                                >
                                  Chi tiết
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* PAGINATION TAB 2 (MỚI THÊM) */}
              {!scheduleLoading && doctorSchedule.length > 0 && (
                <div className="mt-6 flex justify-end gap-2">
                  <button
                    disabled={schedulePage === 1}
                    onClick={() => setSchedulePage((p) => p - 1)}
                    className="px-3 py-1 border rounded bg-white disabled:opacity-50 hover:bg-gray-100"
                  >
                    Trước
                  </button>
                  <span className="px-3 py-1 font-bold text-gray-600 bg-white border rounded">
                    Trang {schedulePage} / {totalPagesTab2 || 1}
                  </span>
                  <button
                    disabled={schedulePage >= totalPagesTab2}
                    onClick={() => setSchedulePage((p) => p + 1)}
                    className="px-3 py-1 border rounded bg-white disabled:opacity-50 hover:bg-gray-100"
                  >
                    Sau
                  </button>
                </div>
              )}
            </div>
          )}

          {/* MODAL */}
          {isModalOpen && selectedAppt && (() => {
            const appt = selectedAppt;
            return (
              <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden transform transition-all scale-100">
                  <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="text-lg font-bold text-gray-900">
                      Chi tiết Lịch hẹn #{appt.AppointmentID}
                    </h3>
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="text-gray-400 hover:text-gray-600 text-2xl"
                    >
                      &times;
                    </button>
                  </div>
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-800">
                    <div className="col-span-1 md:col-span-2 bg-blue-50 p-4 rounded-lg border border-blue-100">
                      <p className="text-xs text-blue-600 font-bold uppercase mb-1">
                        Ghi chú
                      </p>
                      <p className="font-medium text-gray-800">
                         {appt.InitialSymptoms || "Không có mô tả"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-bold mb-1">
                        Bệnh nhân
                      </p>
                      <p className="font-bold text-lg">
                         {appt.patient?.FullName || "Chưa cập nhật"}
                      </p>
                      <p className="text-sm text-gray-600">
                         {appt.patient?.PhoneNumber || "Chưa cập nhật"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-bold mb-1">
                        Bác sĩ
                      </p>
                      <p className="font-bold text-lg text-blue-700">
                         {appt.doctor?.user?.FullName || "Chưa cập nhật"}
                      </p>
                      <p className="text-sm text-gray-600">
                         {appt.doctor?.specialty?.SpecialtyName || "Chưa cập nhật"}
                      </p>
                    </div>
                    {appt.file_path && (
                      <div className="col-span-1 md:col-span-2">
                        <a
                          href={appt.file_path}
                          target="_blank"
                          className="text-blue-600 hover:underline"
                        >
                          Xem file đính kèm
                        </a>
                      </div>
                    )}
                    {["Pending", "Confirmed"].includes(appt.Status) && (
                      <div className="col-span-1 md:col-span-2 mt-4 pt-6 border-t border-gray-100">
                        <div className="flex gap-3 mb-4">
                          {appt.Status === "Pending" && (
                            <button
                              onClick={handleConfirm}
                              className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold"
                            >
                              Duyệt
                            </button>
                          )}
                          {appt.Status === "Confirmed" && (
                            <button
                              onClick={handleCheckIn}
                              className="flex-1 bg-purple-600 text-white py-2 rounded-lg font-bold"
                            >
                              Check-in
                            </button>
                          )}
                        </div>
                        <div className="bg-red-50 p-3 rounded-lg border border-red-100 flex gap-2">
                          <input
                            type="text"
                            placeholder="Lý do hủy..."
                            className="flex-1 border rounded px-3"
                            onChange={(e) => setCancelReason(e.target.value)}
                          />
                          <button
                            onClick={handleCancel}
                            className="bg-red-600 text-white px-4 rounded font-bold"
                          >
                            Hủy
                          </button>
                        </div>
                      </div>
                    )}
                    {appt.Status === "Cancelled" && (
                      <div className="col-span-1 md:col-span-2 bg-gray-100 p-3 rounded text-red-600">
                        Đã hủy: {appt.CancellationReason}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </section>
    </div>
  );
}
