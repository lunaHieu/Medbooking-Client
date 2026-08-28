"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, FileChartColumn, CalendarDays, Users } from "lucide-react";
import * as Api from "@/lib/ApiClient";
import Link from "next/link";
import Image from "next/image";
import Dashboard from "./components/Dashboard";
import AppointmentManagement from "./components/AppointmentManagement";
import PatientManagement from "./components/PatientManagement";
import DoctorSchedule from "./components/DoctorSchedule";

export default function StaffPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (!confirm("Bạn có chắc chắn muốn đăng xuất?")) return;

    setLoggingOut(true);
    try {
      await Api.logout();
    } catch (error) {
      console.error("Logout error", error);
    } finally {
      // Xóa token client và chuyển hướng
      localStorage.removeItem("api_token");
      localStorage.removeItem("user_role");
      router.push("/login");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/">
              <div className="flex items-center ">
                <Image
                  src="/image/HUNRE_LOGO.svg"
                  alt="Medbooking"
                  width={160}
                  height={80}
                  className="h-20 w-auto object-contain"
                />
              </div>
            </Link>

            <div className="flex items-center gap-4">
              <div className="bg-red-600 text-white font-bold text-sm px-3 py-1 rounded shadow-sm">
                STAFF / ADMIN
              </div>

              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex items-center gap-2 text-gray-600 hover:text-red-600 font-medium transition text-sm"
              >
                <LogOut className="w-4 h-4" />
                {loggingOut ? "Đang thoát..." : "Đăng xuất"}
              </button>
            </div>
          </div>

          {/* Tabs Menu */}
          <div className="flex space-x-8 overflow-x-auto border-t border-gray-100 pt-1">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`flex text-center gap-2  py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition ${activeTab === "dashboard"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
            >
              <FileChartColumn /> Bảng điều khiển
            </button>
            <button
              onClick={() => setActiveTab("appointments")}
              className={`flex text-center gap-2  py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition ${activeTab === "appointments"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
            >
              <CalendarDays />
              Quản lý lịch hẹn
            </button>
            <button
              onClick={() => setActiveTab("patients")}
              className={`flex text-center gap-2 py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition ${activeTab === "patients"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
            >
              <Users /> Quản lý bệnh nhân
            </button>
            <button
              onClick={() => setActiveTab("schedule")}
              className={` flex text-center gap-2 py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition ${activeTab === "schedule"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
            >
              <CalendarDays /> Lịch làm việc bác sĩ
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "dashboard" && <Dashboard />}
        {activeTab === "appointments" && <AppointmentManagement />}
        {activeTab === "patients" && <PatientManagement />}
        {activeTab === "schedule" && <DoctorSchedule />}
      </main>
    </div>
  );
}
