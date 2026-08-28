"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { AxiosError } from "axios";
import * as Api from "@/lib/ApiClient";
import * as Model from "@/lib/model";

type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "checked-in";

interface AppointmentUI {
  id: string;
  realId: number;
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  doctorName: string;
  doctorId: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  reason: string;
}

export default function AppointmentManagement() {
  const [appointments, setAppointments] = useState<AppointmentUI[]>([]);
  const [doctors, setDoctors] = useState<Model.Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  // State cho tính năng chọn Slot
  const [doctorSlots, setDoctorSlots] = useState<Model.AvailabilitySlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [viewMode, setViewMode] = useState<"calendar" | "table">("calendar");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterDoctor, setFilterDoctor] = useState<string>("all");

  // Form State
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    address: "",
    temporaryPassword: "",
    doctorId: "",
    slotId: 0,
    date: "",
    time: "",
    reason: "",
  });

  // --- LOAD DATA ---
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [apptData, docData] = await Promise.all([
        Api.getAllAppointments(),
        Api.getDoctors(),
      ]);

      const mapped: AppointmentUI[] = apptData.map((item) => {
        const dateObj = new Date(item.StartTime);
        return {
          id: `APT${item.AppointmentID}`,
          realId: item.AppointmentID,
          patientName: item.patient?.FullName || "Khách vãng lai",
          patientPhone: item.patient?.PhoneNumber || "",
          patientEmail: item.patient?.Email || "",
          doctorName: item.doctor?.user?.FullName || "Chưa xếp",
          doctorId: item.doctor?.DoctorID.toString() || "",
          date: dateObj.toLocaleDateString("en-CA"),
          time: dateObj.toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          status: item.Status.toLowerCase() as AppointmentStatus,
          reason: item.InitialSymptoms || "",
        };
      });

      setAppointments(mapped.reverse());
      setDoctors(docData);
    } catch (error) {
      console.error("Lỗi tải dữ liệu:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // --- SLOT LOGIC ---
  const handleDoctorChange = async (docId: string) => {
    setFormData((prev) => ({
      ...prev,
      doctorId: docId,
      slotId: 0,
      date: "",
      time: "",
    }));
    if (!docId) {
      setDoctorSlots([]);
      return;
    }

    setLoadingSlots(true);
    try {
      const slots = await Api.getDoctorAvailability(parseInt(docId));
      const availableSlots = slots
        .filter((s) => s.Status === "Available")
        .sort(
          (a, b) =>
            new Date(a.StartTime).getTime() - new Date(b.StartTime).getTime()
        );
      setDoctorSlots(availableSlots);
    } catch (error) {
      console.error(error);
      setDoctorSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleSelectSlot = (slot: Model.AvailabilitySlot) => {
    const dateObj = new Date(slot.StartTime);
    const dateStr = dateObj.toLocaleDateString("en-CA");
    const timeStr = dateObj.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });

    setFormData((prev) => ({
      ...prev,
      slotId: slot.SlotID,
      date: dateStr,
      time: timeStr,
    }));
  };

  const groupedSlots = useMemo(() => {
    const groups: Record<string, Model.AvailabilitySlot[]> = {};
    doctorSlots.forEach((slot) => {
      const date = new Date(slot.StartTime).toLocaleDateString("vi-VN", {
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      if (!groups[date]) groups[date] = [];
      groups[date].push(slot);
    });
    return groups;
  }, [doctorSlots]);

  // --- CREATE HANDLER (FIX 422 Error) ---
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.slotId || !formData.doctorId) {
      alert("Vui lòng chọn bác sĩ và khung giờ khám!");
      return;
    }

    try {
      // 1. TÌM HOẶC  TẠO BỆNH NHÂN
      let patientId = null;

      // Tìm user theo số điện thoại (Admin API hỗ trợ search)
      const existingUsers = await Api.adminGetUsers(undefined, formData.phone);
      // Lọc chính xác SĐT (vì search có thể trả về kết quả gần đúng)
      const foundPatient = existingUsers.find(
        (u) => u.PhoneNumber === formData.phone
      );

      if (foundPatient) {
        patientId = foundPatient.UserID;
      } else {
        if (formData.temporaryPassword.length < 8) {
          alert("Bệnh nhân mới cần mật khẩu tạm thời tối thiểu 8 ký tự.");
          return;
        }
        // Nếu chưa có -> Tạo mới user (Role: BenhNhan)
        const newPatientData = new FormData();
        const fullName = formData.fullName.trim();

        newPatientData.append("FullName", fullName);
        newPatientData.append("PhoneNumber", formData.phone);
        if (formData.email.trim()) {
          newPatientData.append("Email", formData.email.trim());
        }
        newPatientData.append("Username", formData.phone); // Username là SĐT
        newPatientData.append("Status", "HoatDong");
        newPatientData.append("password", formData.temporaryPassword);

        await Api.adminCreatePatient(newPatientData);

        // Tìm lại để lấy ID (do hàm create có thể chỉ trả về message)
        const usersAfterCreate = await Api.adminGetUsers(
          undefined,
          formData.phone
        );
        const createdUser = usersAfterCreate.find(
          (u) => u.PhoneNumber === formData.phone
        );

        if (createdUser) {
          patientId = createdUser.UserID;
        } else {
          throw new Error(
            "Không thể tạo hồ sơ bệnh nhân tự động. Vui lòng tạo thủ công trước."
          );
        }
      }

      // 2. GỬI API TẠO LỊCH HẸN
      const apptData = new FormData();
      apptData.append("PatientID", patientId.toString()); // <--- QUAN TRỌNG: Đã có ID
      apptData.append("DoctorID", formData.doctorId);
      apptData.append("SlotID", formData.slotId.toString());
      apptData.append("InitialSymptoms", formData.reason);

      // [UPDATE] Bổ sung Status để tránh lỗi 422
      apptData.append("Status", "Pending");

      await Api.staffCreateAppointment(apptData);

      alert(
        `✅ Đã tạo lịch hẹn thành công cho bệnh nhân: ${formData.fullName}`
      );
      setShowCreateModal(false);
      loadData();

      // Reset form
      setFormData({
        fullName: "",
        phone: "",
        email: "",
        address: "",
        temporaryPassword: "",
        doctorId: "",
        slotId: 0,
        date: "",
        time: "",
        reason: "",
      });
      setDoctorSlots([]);
    } catch (error: unknown) {
      console.error(error);
      const responseData = error instanceof AxiosError ? error.response?.data : undefined;
      const apiError = responseData as { message?: string; errors?: unknown } | undefined;
      const msg =
        apiError?.message ||
        JSON.stringify(apiError?.errors) ||
        "Lỗi khi tạo lịch hẹn";
      alert("❌ " + msg);
    }
  };

  // Helper UI & Handlers cũ giữ nguyên
  const getStatusColor = (status: AppointmentStatus) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "confirmed":
        return "bg-green-100 text-green-800 border-green-200";
      case "cancelled":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "checked-in":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "completed":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusText = (status: AppointmentStatus) => {
    switch (status) {
      case "pending":
        return "Chờ xác nhận";
      case "confirmed":
        return "Đã xác nhận";
      case "cancelled":
        return "Đã hủy";
      case "checked-in":
        return "Đã check-in";
      case "completed":
        return "Hoàn thành";
      default:
        return status;
    }
  };

  const updateAppointmentStatus = async (
    realId: number,
    newStatus: AppointmentStatus
  ) => {
    try {
      if (newStatus === "confirmed") await Api.confirmAppointment(realId);
      else if (newStatus === "checked-in") await Api.checkInAppointment(realId);
      else if (newStatus === "cancelled") {
        const r = prompt("Lý do hủy:");
        if (r) await Api.adminCancelAppointment(realId, r);
        else return;
      }
      alert("Thành công!");
      loadData();
    } catch {
      alert("Lỗi thao tác!");
    }
  };

  const filteredAppointments = appointments.filter((apt) => {
    const matchesSearch =
      apt.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || apt.status === filterStatus;
    const matchesDoctor =
      filterDoctor === "all" || apt.doctorId === filterDoctor;
    return matchesSearch && matchesStatus && matchesDoctor;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý lịch hẹn</h1>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý tất cả lịch hẹn của bệnh nhân
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          <span>Tạo lịch hẹn mới</span>
        </button>
      </div>

      {/* Filters and View Toggle */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Tìm kiếm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border p-2 rounded"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="pending">Chờ xác nhận</option>
            <option value="confirmed">Đã xác nhận</option>
            <option value="checked-in">Đã check-in</option>
            <option value="cancelled">Đã hủy</option>
            <option value="completed">Hoàn thành</option>
          </select>
          <select
            value={filterDoctor}
            onChange={(e) => setFilterDoctor(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="all">Tất cả bác sĩ</option>
            {doctors.map((doc) => (
              <option key={doc.DoctorID} value={doc.DoctorID}>
                {doc.user?.FullName}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode("calendar")}
              className={`flex-1 rounded ${viewMode === "calendar"
                ? "bg-blue-600 text-white"
                : "bg-gray-100"
                }`}
            >
              Lịch
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`flex-1 rounded ${viewMode === "table" ? "bg-blue-600 text-white" : "bg-gray-100"
                }`}
            >
              Bảng
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">
          Đang tải dữ liệu...
        </div>
      ) : viewMode === "calendar" ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filteredAppointments.map((apt) => (
            <div
              key={apt.id}
              className={`border p-4 rounded-lg bg-white shadow-sm ${getStatusColor(
                apt.status
              )}`}
            >
              <div className="flex justify-between">
                <span className="font-bold text-sm">
                  {apt.status.toUpperCase()}
                </span>
                <span className="text-xs text-gray-500">{apt.id}</span>
              </div>
              <h3 className="font-bold text-lg mt-2">{apt.patientName}</h3>
              <p className="text-sm">👨‍⚕️ {apt.doctorName}</p>
              <p className="text-sm">
                🕒 {apt.date} - {apt.time}
              </p>
              <div className="flex gap-2 mt-3">
                {apt.status === "pending" && (
                  <button
                    onClick={() =>
                      updateAppointmentStatus(apt.realId, "confirmed")
                    }
                    className="bg-green-500 text-white px-2 py-1 rounded text-xs"
                  >
                    Duyệt
                  </button>
                )}
                {apt.status === "confirmed" && (
                  <button
                    onClick={() =>
                      updateAppointmentStatus(apt.realId, "checked-in")
                    }
                    className="bg-blue-500 text-white px-2 py-1 rounded text-xs"
                  >
                    Check-in
                  </button>
                )}
                {["pending", "confirmed"].includes(apt.status) && (
                  <button
                    onClick={() =>
                      updateAppointmentStatus(apt.realId, "cancelled")
                    }
                    className="bg-red-500 text-white px-2 py-1 rounded text-xs"
                  >
                    Hủy
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded shadow overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="p-3">ID</th>
                <th className="p-3">Bệnh nhân</th>
                <th className="p-3">Bác sĩ</th>
                <th className="p-3">Thời gian</th>
                <th className="p-3">Trạng thái</th>
                <th className="p-3">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.map((apt) => (
                <tr key={apt.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{apt.id}</td>
                  <td className="p-3 font-medium">
                    {apt.patientName}
                    <br />
                    <span className="text-xs text-gray-500">
                      {apt.patientPhone}
                    </span>
                  </td>
                  <td className="p-3">{apt.doctorName}</td>
                  <td className="p-3">
                    {apt.date} {apt.time}
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold ${getStatusColor(
                        apt.status
                      )}`}
                    >
                      {getStatusText(apt.status)}
                    </span>
                  </td>
                  <td className="p-3">
                    {apt.status === "pending" && (
                      <button
                        onClick={() =>
                          updateAppointmentStatus(apt.realId, "confirmed")
                        }
                        className="text-green-600 hover:underline mr-2"
                      >
                        Duyệt
                      </button>
                    )}
                    {["pending", "confirmed"].includes(apt.status) && (
                      <button
                        onClick={() =>
                          updateAppointmentStatus(apt.realId, "cancelled")
                        }
                        className="text-red-600 hover:underline"
                      >
                        Hủy
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Tạo Mới */}
      {showCreateModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h2 className="text-xl font-bold text-gray-900">
                Tạo lịch hẹn mới
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-2xl text-gray-400"
              >
                &times;
              </button>
            </div>

            <form className="space-y-6" onSubmit={handleCreate}>
              {/* Thông tin bệnh nhân */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-700 border-b pb-1 mb-2">
                  Thông tin Bệnh nhân
                </h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Họ và Tên
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Ví dụ: Nguyễn Văn A"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Số điện thoại
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email (Tùy chọn)
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mật khẩu tạm thời cho bệnh nhân mới
                  </label>
                  <input
                    type="password"
                    minLength={8}
                    value={formData.temporaryPassword}
                    onChange={(e) =>
                      setFormData({ ...formData, temporaryPassword: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Tối thiểu 8 ký tự; bỏ trống nếu bệnh nhân đã có tài khoản"
                  />
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Địa chỉ (Tùy chọn)
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              {/* Chọn Lịch Khám */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h3 className="font-semibold text-blue-800 border-b border-blue-200 pb-1 mb-3">
                  Chọn Lịch Khám
                </h3>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chọn Bác sĩ <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.doctorId}
                    onChange={(e) => handleDoctorChange(e.target.value)}
                    className="w-full px-3 py-2 border border-blue-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">-- Chọn bác sĩ --</option>
                    {doctors.map((doc) => (
                      <option key={doc.DoctorID} value={doc.DoctorID}>
                        {doc.user?.FullName} - {doc.specialty?.SpecialtyName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Danh sách Slot */}
                {loadingSlots ? (
                  <div className="text-center text-gray-500 py-4">
                    Đang tải lịch của bác sĩ...
                  </div>
                ) : formData.doctorId && doctorSlots.length === 0 ? (
                  <div className="text-center text-red-500 py-4 bg-white rounded border border-red-100">
                    Bác sĩ này chưa có lịch trống nào.
                  </div>
                ) : (
                  <div className="space-y-4 max-h-60 overflow-y-auto custom-scrollbar">
                    {Object.entries(groupedSlots).map(([date, slots]) => (
                      <div key={date}>
                        <h4 className="text-sm font-bold text-gray-600 mb-2 sticky top-0 bg-blue-50 py-1">
                          {date}
                        </h4>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {slots.map((slot) => {
                            const timeLabel = new Date(
                              slot.StartTime
                            ).toLocaleTimeString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            });
                            const isSelected = formData.slotId === slot.SlotID;
                            return (
                              <button
                                key={slot.SlotID}
                                type="button"
                                onClick={() => handleSelectSlot(slot)}
                                className={`py-2 px-1 text-sm rounded border transition-all ${isSelected
                                  ? "bg-blue-600 text-white border-blue-600 shadow-md scale-105"
                                  : "bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:text-blue-600"
                                  }`}
                              >
                                {timeLabel}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {formData.slotId !== 0 && (
                  <div className="mt-3 p-2 bg-green-100 text-green-800 text-sm rounded text-center font-medium border border-green-200">
                    Đã chọn: {formData.time} ngày {formData.date}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lý do khám / Ghi chú
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData({ ...formData, reason: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none"
                  rows={2}
                ></textarea>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
                  disabled={!formData.slotId}
                >
                  Xác nhận đặt lịch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
