"use client";

import { useState, useEffect } from "react";
import {
  User, Shield, Bell, Database, Mail, Phone,
  Calendar, GraduationCap, Briefcase, Save,
  RefreshCw, Key, Monitor, Moon, Sun, FileText
} from "lucide-react";
import { doctorService } from "../../services/doctorService";
import * as Api from "@/lib/ApiClient";
import { AxiosError } from "axios";

export default function SettingsPage() {
  // STATES 
  const [activeTab, setActiveTab] = useState<"profile" | "security" | "notifications" | "preferences">("profile");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  // DOCTOR PROFILE
  const [doctorInfo, setDoctorInfo] = useState({
    id: "DOC001",
    name: "Nguyễn Văn A",
    specialty: "Nội tổng quát",
    specialtyId: 0,
    email: "doctor.a@hospital.com",
    phone: "0901234567",
    department: "Khoa Nội tổng quát",
    licenseNumber: "BS-2023-00123",
    experience: "10 năm",
    education: "Bác sĩ chuyên khoa I - Đại học Y Hà Nội",
    bio: "Chuyên gia về các bệnh lý nội khoa, có kinh nghiệm trong điều trị các bệnh mãn tính như tiểu đường, cao huyết áp.",
    address: "123 Đường Lê Lợi, Quận 1, TP.HCM",
    workingHours: { morning: "07:30 - 11:30", afternoon: "13:30 - 17:00" },
    consultationFee: "300,000 VND",
    languages: ["Tiếng Việt", "Tiếng Anh"]
  });

  // SECURITY SETTINGS
  const [securitySettings, setSecuritySettings] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  //  NOTIFICATION SETTINGS
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: {
      appointmentReminders: true,
      newAppointments: true,
      patientMessages: true,
      systemUpdates: false,
      promotional: false
    },
    pushNotifications: {
      urgentAlerts: true,
      appointmentChanges: true,
      newRecords: true,
      labResults: true
    },
    smsNotifications: {
      appointmentReminders: true,
      emergencyAlerts: true
    },
    quietHours: {
      enabled: true,
      startTime: "22:00",
      endTime: "07:00"
    }
  });

  // PREFERENCES 
  const [preferences, setPreferences] = useState({
    theme: "light" as "light" | "dark" | "auto",
    language: "vi",
    timezone: "Asia/Ho_Chi_Minh",
    dateFormat: "dd/MM/yyyy",
    timeFormat: "24h",
    recordsPerPage: 20,
    autoSave: true,
    keyboardShortcuts: true,
    animations: true,
    soundEffects: false,
    dashboardWidgets: ["stats", "appointments", "patients", "calendar"],
    defaultView: "dashboard" as "dashboard" | "schedule" | "records",
    consultationTemplate: "Mẫu khám chuẩn",
    prescriptionTemplate: "Mẫu đơn thuốc chuẩn"
  });

  // MOCK DATA LOADING 

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const [res, savedSettings] = await Promise.all([
          doctorService.getMyProfile(),
          doctorService.getMySettings(),
        ]);
        if (res.success && res.data) {
          const d = res.data;

          setDoctorInfo(prev => ({
            ...prev,
            name: d.FullName || prev.name,
            email: d.Email || prev.email,
            phone: d.PhoneNumber || prev.phone,
            specialty: d.SpecialtyName || prev.specialty,
            specialtyId: d.SpecialtyID || prev.specialtyId,
            experience: d.YearsOfExperience !== undefined ? String(d.YearsOfExperience) : "",
            education: d.Degree || "",
            bio: d.ProfileDescription || ""
          }));
        }
        if (Object.keys(savedSettings.notificationSettings).length > 0) {
          setNotificationSettings(prev => ({
            ...prev,
            ...savedSettings.notificationSettings as Partial<typeof prev>,
          }));
        }
        if (Object.keys(savedSettings.preferences).length > 0) {
          setPreferences(prev => ({
            ...prev,
            ...savedSettings.preferences as Partial<typeof prev>,
          }));
        }
      } catch (err) {
        console.error("Không tải được profile:", err);
      }
    };
    loadProfile();
  }, []);

  // ==================== HANDLE SAVE  ====================
  const handleSaveChanges = async () => {
    setSaveStatus("saving");
    try {
      await Promise.all([
        doctorService.updateProfile({
          FullName: doctorInfo.name,
          email: doctorInfo.email,
          phone: doctorInfo.phone,
          SpecialtyID: doctorInfo.specialtyId,
          Degree: doctorInfo.education,
          YearsOfExperience: doctorInfo.experience,
          ProfileDescription: doctorInfo.bio,
        }),
        doctorService.updateSettings({ notificationSettings, preferences }),
      ]);

      // 2. Lấy cache cũ
      const currentCache = localStorage.getItem("doctorInfo");
      let existingData: Record<string, unknown> = {};
      if (currentCache) {
        try {
          const parsedCache: unknown = JSON.parse(currentCache);
          if (parsedCache && typeof parsedCache === "object" && !Array.isArray(parsedCache)) {
            existingData = parsedCache as Record<string, unknown>;
          }
        } catch {
          existingData = {};
        }
      }

      // 3. Tạo cache mới bao gồm cả thông tin chuyên môn
      const cachedDoctor = existingData.doctor;
      const doctorCache = cachedDoctor && typeof cachedDoctor === "object" && !Array.isArray(cachedDoctor)
        ? cachedDoctor as Record<string, unknown>
        : {};
      const cachedSpecialty = doctorCache.specialty;
      const specialtyCache = cachedSpecialty && typeof cachedSpecialty === "object" && !Array.isArray(cachedSpecialty)
        ? cachedSpecialty as Record<string, unknown>
        : {};
      const updatedCache = {
        ...existingData,
        FullName: doctorInfo.name,
        Email: doctorInfo.email,
        PhoneNumber: doctorInfo.phone,
        // Đảm bảo doctor_profile cũng được cập nhật trong cache
        doctor: {
          ...doctorCache,
          Degree: doctorInfo.education,
          YearsOfExperience: doctorInfo.experience,
          ProfileDescription: doctorInfo.bio,
          specialty: {
            ...specialtyCache,
            SpecialtyName: doctorInfo.specialty.trim()
          }
        }
      };

      localStorage.setItem("doctorInfo", JSON.stringify(updatedCache));
      window.dispatchEvent(new Event("doctorInfoUpdated"));

      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (err) {
      console.error("Lưu thất bại:", err);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };
  // EVENT HANDLERS 
  const handleInputChange = (section: string, field: string, value: string | number | boolean | string[]) => {
    switch (section) {
      case "profile":
        setDoctorInfo(prev => ({ ...prev, [field]: value }));
        break;
      case "security":
        setSecuritySettings(prev => ({ ...prev, [field]: value }));
        break;
      case "notifications":
        // Handle nested notification settings
        if (field.includes('.')) {
          const [category, subField] = field.split('.');
          if (category === "quietHours") {
            const quietHoursField = subField as keyof typeof notificationSettings.quietHours;
            setNotificationSettings(prev => ({
              ...prev,
              quietHours: {
                ...prev.quietHours,
                [quietHoursField]: value,
              },
            }));
            break;
          }
          setNotificationSettings(prev => ({
            ...prev,
            [category]: {
              ...prev[category as keyof typeof notificationSettings],
              [subField]: value
            }
          }));
        } else {
          setNotificationSettings(prev => ({ ...prev, [field]: value }));
        }
        break;
      case "preferences":
        setPreferences(prev => ({ ...prev, [field]: value }));
        break;
    }
  };

  const handlePasswordChange = async () => {
    if (securitySettings.newPassword !== securitySettings.confirmPassword) {
      alert("Mật khẩu mới không khớp!");
      return;
    }

    if (securitySettings.newPassword.length < 8) {
      alert("Mật khẩu phải có ít nhất 8 ký tự!");
      return;
    }

    try {
      setSaveStatus("saving");

      await Api.changePassword({
        currentPassword: securitySettings.currentPassword,
        newPassword: securitySettings.newPassword,
        confirmPassword: securitySettings.confirmPassword
      });

      alert("Đổi mật khẩu thành công!");

      // Reset password fields
      setSecuritySettings(prev => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      }));

      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 3000);

    } catch (error: unknown) {
      console.error(error);
      const apiError = error instanceof AxiosError
        ? error.response?.data as { message?: string } | undefined
        : undefined;
      alert(apiError?.message || "Lỗi: Mật khẩu hiện tại không đúng hoặc có lỗi hệ thống!");
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  const handleExportSettings = () => {
    const settingsData = {
      exportedAt: new Date().toISOString(),
      profile: doctorInfo,
      preferences: preferences,
      notificationSettings: notificationSettings
    };

    const blob = new Blob([JSON.stringify(settingsData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cai-dat-bac-si-${doctorInfo.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert(" Đã xuất cài đặt thành công!");
  };

  const handleRefreshData = () => {
    setTimeout(() => {
      // Reload page in real app
      window.location.reload();
    }, 1000);
  };

  //  RENDER LOADING/ERROR 
  // if (loading) {
  //   return <LoadingState message="Đang tải cài đặt..." />;
  // }

  // if (error) {
  //   return (
  //     <ErrorState
  //       message="Không thể tải cài đặt"
  //       onRetry={handleRefreshData}
  //     />
  //   );
  // }

  //  MAIN RENDER
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-50 to-white rounded-2xl p-6 border border-indigo-100">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Cài đặt hệ thống
            </h1>
            <p className="text-gray-600 mt-2">
              Quản lý thông tin cá nhân, bảo mật và tùy chỉnh hệ thống
            </p>
          </div>

          {/* Save status and actions */}
          <div className="flex flex-wrap items-center gap-3">
            {saveStatus === "saving" && (
              <div className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Đang lưu...
              </div>
            )}

            {saveStatus === "saved" && (
              <div className="px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-sm flex items-center gap-2">
                Đã lưu
              </div>
            )}

            {saveStatus === "error" && (
              <div className="px-3 py-1.5 bg-red-100 text-red-800 rounded-full text-sm">
                Lỗi khi lưu
              </div>
            )}

            <button
              onClick={handleExportSettings}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <Database className="w-4 h-4" />
              Xuất cài đặt
            </button>

            <button
              onClick={handleSaveChanges}
              disabled={saveStatus === "saving"}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              Lưu thay đổi
            </button>
          </div>
        </div>

        {/* Navigation tabs */}
        <div className="mt-6 flex flex-wrap gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${activeTab === "profile"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
          >
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Hồ sơ cá nhân
            </div>
          </button>

          <button
            onClick={() => setActiveTab("security")}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${activeTab === "security"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
          >
            {/* <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Bảo mật
            </div> */}
          </button>

          <button
            onClick={() => setActiveTab("notifications")}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${activeTab === "notifications"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
          >
            {/* <div className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Thông báo
            </div> */}
          </button>

          <button
            onClick={() => setActiveTab("preferences")}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${activeTab === "preferences"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
          >
            {/* <div className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Tùy chỉnh
            </div> */}
          </button>
        </div>
      </div>

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <div className="space-y-6">
          {/* Basic Info Card */}
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-600" />
              Thông tin cơ bản
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Họ và tên
                </label>
                <input
                  type="text"
                  value={doctorInfo.name}
                  onChange={(e) => handleInputChange("profile", "name", e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chuyên khoa
                </label>
                <input
                  type="text"
                  value={doctorInfo.specialty}
                  onChange={(e) => handleInputChange("profile", "specialty", e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="email"
                    value={doctorInfo.email}
                    onChange={(e) => handleInputChange("profile", "email", e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số điện thoại
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="tel"
                    value={doctorInfo.phone}
                    onChange={(e) => handleInputChange("profile", "phone", e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Khoa
                </label>
                <input
                  type="text"
                  value={doctorInfo.department}
                  onChange={(e) => handleInputChange("profile", "department", e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số chứng chỉ hành nghề
                </label>
                <input
                  type="text"
                  value={doctorInfo.licenseNumber}
                  onChange={(e) => handleInputChange("profile", "licenseNumber", e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div> */}
            </div>
          </div>

          {/* Professional Details Card */}
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-indigo-600" />
              Thông tin chuyên môn
            </h3>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kinh nghiệm
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={doctorInfo.experience}
                    onChange={(e) => handleInputChange("profile", "experience", e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Học vấn
                </label>
                <div className="relative">
                  <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={doctorInfo.education}
                    onChange={(e) => handleInputChange("profile", "education", e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giới thiệu bản thân
                </label>
                <textarea
                  value={doctorInfo.bio}
                  onChange={(e) => handleInputChange("profile", "bio", e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Giới thiệu về chuyên môn, kinh nghiệm..."
                />
              </div>

              {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> */}
              {/* <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giờ làm việc (Sáng)
                  </label>
                  <input
                    type="text"
                    value={doctorInfo.workingHours.morning}
                    onChange={(e) => handleInputChange("profile", "workingHours", {
                      ...doctorInfo.workingHours,
                      morning: e.target.value
                    })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="07:30 - 11:30"
                  />
                </div> */}

              {/* <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giờ làm việc (Chiều)
                  </label>
                  <input
                    type="text"
                    value={doctorInfo.workingHours.afternoon}
                    onChange={(e) => handleInputChange("profile", "workingHours", {
                      ...doctorInfo.workingHours,
                      afternoon: e.target.value
                    })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="13:30 - 17:00"
                  />
                </div> */}
              {/* </div> */}
            </div>
          </div>

          {/* Additional Info Card */}
          {/* <div className="bg-white rounded-2xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-600" />
              Thông tin bổ sung
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Địa chỉ
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={doctorInfo.address}
                    onChange={(e) => handleInputChange("profile", "address", e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phí tư vấn
                </label>
                <input
                  type="text"
                  value={doctorInfo.consultationFee}
                  onChange={(e) => handleInputChange("profile", "consultationFee", e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="300,000 VND"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ngôn ngữ
                </label>
                <div className="flex flex-wrap gap-2">
                  {doctorInfo.languages.map((language, index) => (
                    <div key={index} className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-lg">
                      <span>{language}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const newLanguages = doctorInfo.languages.filter((_, i) => i !== index);
                          handleInputChange("profile", "languages", newLanguages);
                        }}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const newLanguage = prompt("Thêm ngôn ngữ mới:");
                      if (newLanguage && !doctorInfo.languages.includes(newLanguage)) {
                        handleInputChange("profile", "languages", [...doctorInfo.languages, newLanguage]);
                      }
                    }}
                    className="px-3 py-1.5 border border-dashed border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50"
                  >
                    + Thêm
                  </button>
                </div>
              </div>
            </div>
          </div> */}
        </div>
      )}

      {/* Security Tab */}
      {activeTab === "security" && (
        <div className="space-y-6">
          {/* Password Change Card */}
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <Key className="w-5 h-5 text-indigo-600" />
              Đổi mật khẩu
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mật khẩu hiện tại
                </label>
                <input
                  type="password"
                  value={securitySettings.currentPassword}
                  onChange={(e) => handleInputChange("security", "currentPassword", e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Nhập mật khẩu hiện tại"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mật khẩu mới
                </label>
                <input
                  type="password"
                  value={securitySettings.newPassword}
                  onChange={(e) => handleInputChange("security", "newPassword", e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Ít nhất 8 ký tự"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Xác nhận mật khẩu mới
                </label>
                <input
                  type="password"
                  value={securitySettings.confirmPassword}
                  onChange={(e) => handleInputChange("security", "confirmPassword", e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Nhập lại mật khẩu mới"
                />
              </div>

              <button
                onClick={handlePasswordChange}
                className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Đổi mật khẩu
              </button>
            </div>
          </div>

          <div className="bg-amber-50 rounded-2xl border border-amber-200 p-6">
            <h3 className="text-lg font-semibold text-amber-900 mb-2 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Bảo mật nâng cao
            </h3>
            <p className="text-sm text-amber-800">
              Xác thực hai yếu tố, cảnh báo đăng nhập, timeout phiên và quản lý thiết bị sẽ chỉ xuất hiện khi hệ thống có cơ chế quản lý phiên và xác thực đa yếu tố ở máy chủ.
              Hiện tại, thay đổi mật khẩu là chức năng bảo mật duy nhất có hiệu lực.
            </p>
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === "notifications" && (
        <div className="space-y-6">
          {/* Email Notifications Card */}
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <Mail className="w-5 h-5 text-indigo-600" />
              Thông báo qua Email
            </h3>

            <div className="space-y-4">
              {Object.entries(notificationSettings.emailNotifications).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">
                      {key === "appointmentReminders" && "Nhắc lịch hẹn"}
                      {key === "newAppointments" && "Lịch hẹn mới"}
                      {key === "patientMessages" && "Tin nhắn bệnh nhân"}
                      {key === "systemUpdates" && "Cập nhật hệ thống"}
                      {key === "promotional" && "Khuyến mãi"}
                    </div>
                    <p className="text-sm text-gray-600">
                      {key === "appointmentReminders" && "Nhận email nhắc lịch hẹn"}
                      {key === "newAppointments" && "Thông báo khi có lịch hẹn mới"}
                      {key === "patientMessages" && "Thông báo tin nhắn từ bệnh nhân"}
                      {key === "systemUpdates" && "Cập nhật tính năng mới"}
                      {key === "promotional" && "Khuyến mãi và ưu đãi đặc biệt"}
                    </p>
                  </div>
                  <button
                    onClick={() => handleInputChange("notifications", `emailNotifications.${key}`, !value)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full ${value ? 'bg-indigo-600' : 'bg-gray-300'
                      }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${value ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Push Notifications Card */}
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <Bell className="w-5 h-5 text-indigo-600" />
              Thông báo đẩy
            </h3>

            <div className="space-y-4">
              {Object.entries(notificationSettings.pushNotifications).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">
                      {key === "urgentAlerts" && "Cảnh báo khẩn cấp"}
                      {key === "appointmentChanges" && "Thay đổi lịch hẹn"}
                      {key === "newRecords" && "Bệnh án mới"}
                      {key === "labResults" && "Kết quả xét nghiệm"}
                    </div>
                    <p className="text-sm text-gray-600">
                      {key === "urgentAlerts" && "Cảnh báo khẩn cấp và ưu tiên cao"}
                      {key === "appointmentChanges" && "Thông báo thay đổi lịch hẹn"}
                      {key === "newRecords" && "Thông báo khi có bệnh án mới"}
                      {key === "labResults" && "Kết quả xét nghiệm sẵn sàng"}
                    </p>
                  </div>
                  <button
                    onClick={() => handleInputChange("notifications", `pushNotifications.${key}`, !value)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full ${value ? 'bg-indigo-600' : 'bg-gray-300'
                      }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${value ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Quiet Hours Card */}
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <Moon className="w-5 h-5 text-indigo-600" />
              Giờ yên tĩnh
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">Bật giờ yên tĩnh</div>
                  <p className="text-sm text-gray-600">Tạm dừng thông báo vào giờ nghỉ ngơi</p>
                </div>
                <button
                  onClick={() => handleInputChange("notifications", "quietHours.enabled", !notificationSettings.quietHours.enabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full ${notificationSettings.quietHours.enabled ? 'bg-indigo-600' : 'bg-gray-300'
                    }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${notificationSettings.quietHours.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                  />
                </button>
              </div>

              {notificationSettings.quietHours.enabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bắt đầu
                    </label>
                    <input
                      type="time"
                      value={notificationSettings.quietHours.startTime}
                      onChange={(e) => handleInputChange("notifications", "quietHours.startTime", e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kết thúc
                    </label>
                    <input
                      type="time"
                      value={notificationSettings.quietHours.endTime}
                      onChange={(e) => handleInputChange("notifications", "quietHours.endTime", e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Preferences Tab */}
      {activeTab === "preferences" && (
        <div className="space-y-6">
          {/* Display Preferences Card */}
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <Monitor className="w-5 h-5 text-indigo-600" />
              Hiển thị & Giao diện
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giao diện
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleInputChange("preferences", "theme", "light")}
                    className={`flex-1 p-4 border rounded-lg flex flex-col items-center gap-2 ${preferences.theme === "light"
                      ? "border-indigo-600 bg-indigo-50"
                      : "border-gray-300 hover:bg-gray-50"
                      }`}
                  >
                    <Sun className="w-6 h-6" />
                    <span>Sáng</span>
                  </button>
                  <button
                    onClick={() => handleInputChange("preferences", "theme", "dark")}
                    className={`flex-1 p-4 border rounded-lg flex flex-col items-center gap-2 ${preferences.theme === "dark"
                      ? "border-indigo-600 bg-indigo-50"
                      : "border-gray-300 hover:bg-gray-50"
                      }`}
                  >
                    <Moon className="w-6 h-6" />
                    <span>Tối</span>
                  </button>
                  <button
                    onClick={() => handleInputChange("preferences", "theme", "auto")}
                    className={`flex-1 p-4 border rounded-lg flex flex-col items-center gap-2 ${preferences.theme === "auto"
                      ? "border-indigo-600 bg-indigo-50"
                      : "border-gray-300 hover:bg-gray-50"
                      }`}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span>Tự động</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ngôn ngữ
                </label>
                <select
                  value={preferences.language}
                  onChange={(e) => handleInputChange("preferences", "language", e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="vi">Tiếng Việt</option>
                  <option value="en">English</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Định dạng ngày
                </label>
                <select
                  value={preferences.dateFormat}
                  onChange={(e) => handleInputChange("preferences", "dateFormat", e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="dd/MM/yyyy">dd/MM/yyyy</option>
                  <option value="MM/dd/yyyy">MM/dd/yyyy</option>
                  <option value="yyyy-MM-dd">yyyy-MM-dd</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Định dạng giờ
                </label>
                <select
                  value={preferences.timeFormat}
                  onChange={(e) => handleInputChange("preferences", "timeFormat", e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="24h">24 giờ</option>
                  <option value="12h">12 giờ</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Múi giờ
                </label>
                <select
                  value={preferences.timezone}
                  onChange={(e) => handleInputChange("preferences", "timezone", e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="Asia/Ho_Chi_Minh">(GMT+7) Hà Nội, Hồ Chí Minh</option>
                  <option value="UTC">(GMT) UTC</option>
                  <option value="America/New_York">(GMT-5) New York</option>
                  <option value="Europe/London">(GMT+0) London</option>
                  <option value="Asia/Tokyo">(GMT+9) Tokyo</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số bản ghi/trang
                </label>
                <select
                  value={preferences.recordsPerPage}
                  onChange={(e) => handleInputChange("preferences", "recordsPerPage", parseInt(e.target.value))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
          </div>

          {/* Behavior Preferences Card */}
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Hành vi & Hiệu suất
            </h3>

            <div className="space-y-4">
              {[
                { key: "autoSave", label: "Tự động lưu", description: "Tự động lưu thay đổi" },
                { key: "keyboardShortcuts", label: "Phím tắt", description: "Bật phím tắt bàn phím" },
                { key: "animations", label: "Hiệu ứng", description: "Hiệu ứng chuyển động" },
                { key: "soundEffects", label: "Âm thanh", description: "Âm thanh thông báo" }
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{item.label}</div>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </div>
                  <button
                    onClick={() => handleInputChange("preferences", item.key, !preferences[item.key as keyof typeof preferences])}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full ${preferences[item.key as keyof typeof preferences] ? 'bg-indigo-600' : 'bg-gray-300'
                      }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${preferences[item.key as keyof typeof preferences] ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Default Templates Card */}
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              Mẫu mặc định
            </h3>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mẫu khám bệnh
                </label>
                <select
                  value={preferences.consultationTemplate}
                  onChange={(e) => handleInputChange("preferences", "consultationTemplate", e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="Mẫu khám chuẩn">Mẫu khám chuẩn</option>
                  <option value="Mẫu khám nhanh">Mẫu khám nhanh</option>
                  <option value="Mẫu khám chi tiết">Mẫu khám chi tiết</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mẫu đơn thuốc
                </label>
                <select
                  value={preferences.prescriptionTemplate}
                  onChange={(e) => handleInputChange("preferences", "prescriptionTemplate", e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="Mẫu đơn thuốc chuẩn">Mẫu đơn thuốc chuẩn</option>
                  <option value="Mẫu đơn thuốc ngắn">Mẫu đơn thuốc ngắn</option>
                  <option value="Mẫu đơn thuốc chi tiết">Mẫu đơn thuốc chi tiết</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trang mặc định
                </label>
                <select
                  value={preferences.defaultView}
                  onChange={(e) => handleInputChange("preferences", "defaultView", e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="dashboard">Bảng điều khiển</option>
                  <option value="schedule">Lịch làm việc</option>
                  <option value="records">Bệnh án</option>
                </select>
              </div>
            </div>
          </div>

          {/* Reset Card */}
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-indigo-600" />
              Khôi phục & Đặt lại
            </h3>

            <div className="space-y-4">
              <p className="text-gray-600">
                Khôi phục tất cả cài đặt về giá trị mặc định ban đầu.
              </p>

              <div className="flex gap-3">
                <button
                  // onClick={handleResetToDefaults}
                  className="px-4 py-2.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                >
                  Khôi phục mặc định
                </button>

                <button
                  onClick={handleExportSettings}
                  className="px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Sao lưu cài đặt
                </button>
              </div>

              <p className="text-sm text-gray-500">
                Lưu ý: Thao tác khôi phục mặc định không thể hoàn tác.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex justify-between items-center pt-6 border-t border-gray-200">
        <div className="text-sm text-gray-500">
          ID: {doctorInfo.id} • Cập nhật lần cuối:
          <span suppressHydrationWarning>
            {typeof window !== 'undefined'
              ? new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
              : '--:--'
            }
          </span>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleRefreshData}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Làm mới
          </button>

          <button
            onClick={handleSaveChanges}
            disabled={saveStatus === "saving"}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saveStatus === "saving" ? "Đang lưu..." : "Lưu tất cả thay đổi"}
          </button>
        </div>
      </div>
    </div>
  );
}
