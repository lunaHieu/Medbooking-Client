"use client";

import React, { useState, useEffect, useCallback } from "react";
import * as Api from "@/lib/ApiClient";
import * as Model from "@/lib/model";
import {
  ClipboardList,
  PhoneCall,
  UserRound,
  CalendarFold,
  Clock3,
  CheckCheck,
} from "lucide-react";

export default function Dashboard() {
  // State dữ liệu
  const [stats, setStats] = useState<Model.DashboardStats | null>(null);
  const [pendingAppointments, setPendingAppointments] = useState<
    Model.Appointment[]
  >([]);
  const [loading, setLoading] = useState(true);

  // --- LOAD DATA ---
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Gọi song song API lấy thống kê và danh sách chờ duyệt
      const [statsData, pendingData] = await Promise.all([
        Api.getStaffDashboard(),
        Api.getPendingAppointments(),
      ]);

      setStats(statsData);
      setPendingAppointments(pendingData);
    } catch (error) {
      console.error("Lỗi tải dữ liệu Dashboard:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // --- HANDLERS ---
  const handleConfirm = async (id: number) => {
    if (confirm(`Bạn có chắc muốn xác nhận lịch hẹn #${id}?`)) {
      try {
        await Api.confirmAppointment(id);
        alert(`Đã xác nhận lịch hẹn #${id}`);
        // Cập nhật lại danh sách (bỏ item đã duyệt)
        setPendingAppointments((prev) =>
          prev.filter((apt) => apt.AppointmentID !== id)
        );
        // Reload số liệu thống kê để cập nhật
        const newStats = await Api.getStaffDashboard();
        setStats(newStats);
      } catch {
        alert("Xác nhận thất bại. Vui lòng thử lại.");
      }
    }
  };

  // --- RENDER ---
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-2"></div>
        Đang tải dữ liệu...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. STATS CARDS (SỐ LIỆU THỐNG KÊ) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Lịch hẹn hôm nay */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Lịch hẹn hôm nay
              </p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats?.today_appointments_count || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Tổng số ca đặt khám trong ngày
          </p>
        </div>

        {/* Card 2: Chờ xác nhận */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Chờ xác nhận</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats?.pending_appointments_count || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Cần xử lý ngay</p>
        </div>

        {/* Card 3: Bệnh nhân mới */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Bệnh nhân mới</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats?.new_patients_count || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Đăng ký trong tháng này</p>
        </div>

        {/* Card 4: Tổng bác sĩ */}
        <div className="bg-white rounded-lg p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tổng bác sĩ</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats?.total_doctors_count || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Đang hoạt động</p>
        </div>
      </div>

      {/* 2. DANH SÁCH CHỜ DUYỆT (PENDING LIST) */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="flex gap-2 text-center text-lg font-semibold text-gray-900">
              <ClipboardList className="text-yellow-500" />
              Danh sách chờ xác nhận
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Các lịch hẹn mới cần được duyệt
            </p>
          </div>
          <button
            onClick={loadData}
            className="text-blue-600 hover:underline text-sm"
          >
            ↻ Làm mới
          </button>
        </div>

        <div className="p-6">
          {pendingAppointments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Không có lịch hẹn nào đang chờ duyệt.
            </div>
          ) : (
            <div className="space-y-4">
              {pendingAppointments.map((apt) => (
                <div
                  key={apt.AppointmentID}
                  className="border border-yellow-200 bg-yellow-50 rounded-lg p-4 hover:shadow-md transition"
                >
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="px-2 py-0.5 bg-yellow-200 text-yellow-800 text-xs font-bold rounded">
                          PENDING
                        </span>
                        <span className="text-xs text-gray-500 font-mono">
                          #{apt.AppointmentID}
                        </span>
                      </div>

                      <h3 className="font-bold text-gray-900 text-lg">
                        {apt.patient?.FullName || "Khách vãng lai"}
                      </h3>

                      <div className="mt-1 text-sm text-gray-600 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                        <p>
                          <PhoneCall /> {apt.patient?.PhoneNumber}
                        </p>
                        <p>
                          <UserRound /> BS. {apt.doctor?.user?.FullName}
                        </p>
                        <p>
                          <CalendarFold />{" "}
                          {new Date(apt.StartTime).toLocaleDateString("vi-VN")}
                        </p>
                        <p>
                          <Clock3 />{" "}
                          {new Date(apt.StartTime).toLocaleTimeString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>

                      {apt.InitialSymptoms && (
                        <p className="mt-2 text-sm text-gray-700 italic border-l-2 border-yellow-300 pl-2">
                          `{apt.InitialSymptoms}`
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2 w-full md:w-auto">
                      <button
                        onClick={() => handleConfirm(apt.AppointmentID)}
                        className="flex-1 md:flex-none px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                      >
                        <CheckCheck /> Xác nhận
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
