import axios from "axios";
import * as Model from "./model";
const rawBase = process.env.NEXT_PUBLIC_API_URL;

if (!rawBase) {
  throw new Error("NEXT_PUBLIC_API_URL phải được cấu hình khi build ứng dụng.");
}

export const API_BASE_URL = rawBase.replace(/\/$/, "") + "/api";
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});
export interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message: string;
}
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("api_token");

  if (
    token &&
    !config.url?.includes("/login") &&
    !config.url?.includes("/register")
  ) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

//NHÓM XÁC THỰC

export const register = async (
  data: FormData,
): Promise<Model.MessageResponse> => {
  const response = await apiClient.post("/auth/register", data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const login = async (data: {
  username: string;
  password: string;
}): Promise<Model.LoginResponse> => {
  const response = await apiClient.post("/auth/login", data, {
    headers: { "Content-Type": "application/json" },
  });

  const rawData = response.data;
  const token = rawData.access_token || rawData.token;

  // Extract raw role
  let rawRole = "";
  if (rawData.user && (rawData.user.Role || rawData.user.role)) {
    rawRole = rawData.user.Role || rawData.user.role;
  } else if (rawData.role) {
    rawRole = rawData.role;
  } else if (rawData.Role) {
    rawRole = rawData.Role;
  }

  // Map to Vietnamese version
  let frontendRole: "BenhNhan" | "BacSi" | "NhanVien" | "QuanTriVien" =
    "BenhNhan";
  const upperRole = (rawRole || "").toUpperCase();
  if (
    upperRole.includes("ADMIN") ||
    upperRole.includes("QUANTRIVIEN") ||
    upperRole.includes("QUANTRIYEN") ||
    upperRole === "QUANTRI"
  ) {
    frontendRole = "QuanTriVien";
  } else if (
    upperRole.includes("DOCTOR") ||
    upperRole.includes("BACSI") ||
    upperRole === "BAC_SI"
  ) {
    frontendRole = "BacSi";
  } else if (
    upperRole.includes("STAFF") ||
    upperRole.includes("MEDICAL_STAFF") ||
    upperRole.includes("NHANVIEN")
  ) {
    frontendRole = "NhanVien";
  } else if (upperRole.includes("PATIENT") || upperRole.includes("BENHNHAN")) {
    frontendRole = "BenhNhan";
  }

  // Build or update user object
  let user = rawData.user || {};
  user = {
    UserID: user.UserID || user.userId || rawData.userId,
    Username: user.Username || user.username || rawData.username || "",
    Role: frontendRole,
    Email: user.Email || user.email || rawData.email || null,
    PhoneNumber:
      user.PhoneNumber || user.phoneNumber || rawData.phoneNumber || "",
    FirstName: user.FirstName || user.firstName || rawData.firstName || "",
    LastName: user.LastName || user.lastName || rawData.lastName || "",
    Status: user.Status || user.status || rawData.status || "Active",
    avatar_url: user.avatar_url || user.avatarURL || rawData.avatarURL || null,
  };

  if (token && typeof window !== "undefined") {
    localStorage.setItem("api_token", token);
    localStorage.setItem("user_role", frontendRole);
    localStorage.setItem("user", JSON.stringify(user));
  }

  return {
    token: token,
    user: user,
  };
};

export const logout = async () => {
  try {
    await apiClient.post("/auth/logout");
  } catch (error) {
    console.error("Lỗi khi gọi API logout, vẫn tiếp tục xóa local:", error);
  }

  // Dọn dẹp sạch sẽ
  localStorage.removeItem("api_token");
  localStorage.removeItem("user_role");
  localStorage.removeItem("user"); // Thêm dòng này
  window.location.href = "/login";
};

// ==================== NHÓM CÔNG KHAI (PUBLIC) ====================

export const getAllServices = async (
  search?: string,
): Promise<Model.Service[]> => {
  const params = search ? { search } : {};
  const response = await apiClient.get("/public/services", { params });
  return response.data;
};

export const getSpecialties = async (
  search?: string,
): Promise<Model.Specialty[]> => {
  const params = search ? { search } : {};
  const response = await apiClient.get("/public/specialties", { params });
  return response.data;
};

export const getDoctorDetails = async (id: number): Promise<Model.Doctor> => {
  const response = await apiClient.get(`/public/doctors/${id}`);
  return response.data;
};

//Gọi bác sĩ
export const getDoctors = async (
  search?: string,
  specialtyId?: number,
): Promise<Model.Doctor[]> => {
  //Định nghĩa rõ kiểu: object này vì có key 'search' và 'specialty_id'
  const params: { search?: string; specialty_id?: number } = {};

  if (search) params.search = search;
  if (specialtyId) params.specialty_id = specialtyId;

  const response = await apiClient.get("/public/doctors", { params });
  return response.data;
};

export const getDoctorAvailability = async (
  doctorId: number,
): Promise<Model.AvailabilitySlot[]> => {
  if (!doctorId || isNaN(Number(doctorId))) return [];
  const response = await apiClient.get(`/public/doctors/${doctorId}/slots`);
  return response.data;
};

export const getSpecialtyAvailability = async (
  specialtyId: number,
): Promise<Model.AvailabilitySlot[]> => {
  const response = await apiClient.get(
    `/public/specialties/${specialtyId}/available-slots`,
  );
  return response.data;
};

export const getTopFeedbacks = async (): Promise<Model.TopFeedback[]> => {
  const response = await apiClient.get("/public/feedbacks/featured");
  return response.data;
};

//NHÓM BỆNH NHÂN

export const getMe = async (): Promise<Model.User> => {
  const response = await apiClient.get("/user/profile");
  return response.data;
};

export const uploadAvatar = async (file: File): Promise<Model.User> => {
  const formData = new FormData();
  formData.append("avatar", file);
  const response = await apiClient.post("/user/upload-avatar", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data.user || response.data;
};

export const getMyAppointments = async (): Promise<Model.Appointment[]> => {
  const response = await apiClient.get("/patient/appointments/me");
  return response.data;
};

export const getMyDoctors = async (): Promise<Model.Doctor[]> => {
  const response = await apiClient.get("/patient/previous-doctors");
  return response.data;
};

export const bookAppointment = async (
  slotId: number,
  PatientID: number,
  symptoms: string,
  file?: File,
): Promise<Model.MessageResponse> => {
  const formData = new FormData();
  formData.append("SlotID", slotId.toString());
  formData.append("PatientID", PatientID.toString());
  if (symptoms) formData.append("InitialSymptoms", symptoms);
  if (file) formData.append("file", file);

  const response = await apiClient.post("/patient/appointments", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const cancelAppointment = async (
  id: number,
): Promise<Model.MessageResponse> => {
  const response = await apiClient.put(
    `/patient/appointments/${id}/cancel`,
    {},
  );
  return response.data;
};

export const getMyNotifications = async (): Promise<Model.Notification[]> => {
  const response = await apiClient.get("/my-notifications");
  return response.data;
};

export const markNotificationAsRead = async (id: number): Promise<void> => {
  await apiClient.put(`/notifications/${id}/read`, {});
};

export const deleteMyNotification = async (
  id: number | string,
): Promise<Model.MessageResponse> => {
  const response = await apiClient.delete(`/notifications/${id}`);
  return response.data;
};
export const deleteAllReadNotifications = async () => {
  const response = await apiClient.delete("/notifications/read");
  return response.data;
};
export const sendOtp = async (email: string) => {
  const response = await apiClient.post(`/forgot-password/send-otp`, {
    email: email,
  });
  return response.data;
};
export const resetPassword = async (data: {
  email: string;
  otp: string;
  password: string;
}) => {
  const response = await apiClient.post(`/forgot-password/reset`, data);
  return response.data;
};
export const changePassword = async (
  data: Model.ChangePasswordRequest,
): Promise<Model.ChangePasswordResponse> => {
  const response = await apiClient.post<Model.ChangePasswordResponse>(
    "/user/change-password",
    data,
  );
  return response.data;
};
//NHÓM BÁC SĨ
export const doctorGetSchedule = async (): Promise<Model.Appointment[]> => {
  const response = await apiClient.get("/doctor/appointments/my-day");
  return response.data;
};

export const doctorCreateSlot = async (
  start: string,
  end: string,
): Promise<Model.MessageResponse> => {
  const response = await apiClient.post("/doctor/schedules", {
    startTime: start,
    endTime: end,
  });
  return response.data;
};

export const doctorDeleteSlot = async (id: number): Promise<void> => {
  await apiClient.put(`/doctor/schedules/${id}/cancel`, {});
};

export const doctorCreateMedicalRecord = async (
  payload: { appointmentId: number; diagnosis: string; notes?: string },
): Promise<Model.MessageResponse> => {
  const response = await apiClient.post("/doctor/medical-records", payload);
  return response.data;
};

export const doctorUploadResult = async (
  recordId: number,
  file: File,
  desc: string,
): Promise<Model.MessageResponse> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("description", desc);
  const response = await apiClient.post(
    `/doctor/medical-records/${recordId}/results`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );
  return response.data;
};

export const updateAppointmentStatus = async (
  appointmentId: number,
  status: "InProgress" | "Completed",
): Promise<Model.MessageResponse> => {
  let response;
  if (status === "InProgress") {
    response = await apiClient.put(
      `/doctor/appointments/${appointmentId}/start`,
      {},
    );
  } else {
    response = await apiClient.put(
      `/doctor/appointments/${appointmentId}/complete`,
      {},
    );
  }
  return response.data;
};

export const getMySlots = async (
  date?: string,
): Promise<Model.AvailabilitySlot[]> => {
  const url = date
    ? `/doctor/schedules/me?targetDate=${date}`
    : "/doctor/schedules/me";
  const response = await apiClient.get(url);
  return response.data;
};

export const getPatientHistory = async (
  patientId: number,
): Promise<Model.MedicalRecord[]> => {
  const response = await apiClient.get(
    `/doctor/patients/${patientId}/medical-records`,
  );
  return response.data;
};

export const getDoctorDashboard = async (): Promise<unknown> => {
  try {
    console.log("Getting doctor dashboard...");
    const response = await apiClient.get("/doctor/dashboard/stats");
    console.log("Dashboard response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error in getDoctorDashboard:", error);
    throw error;
  }
};

// NHÓM STAFF & ADMIN
export const getStaffDashboard = async (): Promise<Model.DashboardStats> => {
  const response = await apiClient.get("/staff/dashboard-stats");
  return response.data;
};

export const confirmAppointment = async (
  id: number,
): Promise<Model.MessageResponse> => {
  const response = await apiClient.patch(
    `/staff/appointments/${id}/confirm`,
    {},
  );
  return response.data;
};

export const checkInAppointment = async (
  id: number,
): Promise<Model.MessageResponse> => {
  const response = await apiClient.patch(
    `/staff/appointments/${id}/check-in`,
    {},
  );
  return response.data;
};

export const getAllAppointments = async (): Promise<Model.Appointment[]> => {
  try {
    const response = await apiClient.get("/admin/all-appointments");

    // API trả về { success: true, data: [...] }
    if (response.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }

    console.warn("Unexpected response format:", response.data);
    return [];
  } catch {
    console.log("All appointments endpoint error");
    return [];
  }
};

export const getDoctorScheduleAdmin = async (
  doctorId: number,
  date: string,
): Promise<Model.AdminScheduleSlot[]> => {
  const response = await apiClient.get(
    `/admin/doctors/${doctorId}/schedules?targetDate=${date}`,
  );
  return response.data;
};

export const getPendingAppointments = async (): Promise<
  Model.Appointment[]
> => {
  try {
    const response = await apiClient.get("/staff/pending-appointments");

    // API trả về { success: true, data: [...] }
    if (response.data.success && Array.isArray(response.data.data)) {
      console.log("Pending appointments:", response.data.count);
      return response.data.data; // Trả về mảng data
    }

    console.warn("Unexpected response format:", response.data);
    return [];
  } catch {
    console.log("Pending appointments endpoint error");
    return [];
  }
};

// Các hàm Admin & Staff dùng FormData (giữ override Content-Type)
export const adminCreateDoctor = async (
  formData: FormData,
): Promise<Model.MessageResponse> => {
  const response = await apiClient.post("/admin/doctors", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const adminUpdateDoctor = async (
  id: number,
  formData: FormData,
): Promise<Model.MessageResponse> => {
  formData.append("_method", "PUT");
  const response = await apiClient.post(`/admin/doctors/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const adminUploadDoctorImage = async (
  id: number,
  file: File,
): Promise<Model.MessageResponse> => {
  const formData = new FormData();
  formData.append("imageURL", file);
  const response = await apiClient.post(
    `/admin/doctors/${id}/upload-image`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );
  return response.data;
};

export const adminDeleteDoctor = async (id: number): Promise<void> => {
  await apiClient.delete(`/admin/doctors/${id}`);
};

export const adminGetUsers = async (
  role?: string,
  search?: string,
): Promise<Model.User[]> => {
  const params = { role, search };
  const response = await apiClient.get("/admin/users", { params });
  return response.data;
};

export const adminUpdateUser = async (
  id: number,
  formData: FormData,
): Promise<Model.MessageResponse> => {
  formData.append("_method", "PUT");
  const response = await apiClient.post(`/admin/users/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const adminCreateSpecialty = async (
  formData: FormData,
): Promise<Model.MessageResponse> => {
  const response = await apiClient.post("/admin/specialties", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const adminUpdateSpecialty = async (
  id: number,
  formData: FormData,
): Promise<Model.MessageResponse> => {
  formData.append("_method", "PUT");
  const response = await apiClient.post(`/admin/specialties/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const adminDeleteSpecialty = async (id: number): Promise<void> => {
  await apiClient.delete(`/admin/specialties/${id}`);
};

export const adminGetAllServices = async (
  search?: string,
): Promise<Model.Service[]> => {
  const params = search ? { search } : {};
  const response = await apiClient.get("/admin/services", { params });
  return response.data;
};

export const adminCreateService = async (
  formData: FormData,
): Promise<Model.MessageResponse> => {
  const response = await apiClient.post("/admin/services", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const adminDeleteService = async (id: number): Promise<void> => {
  await apiClient.delete(`/admin/services/${id}`);
};

export const getDoctorMyMedicalRecords = async (): Promise<
  Model.MedicalRecord[]
> => {
  const response = await apiClient.get("/doctor/medical-records");
  return response.data;
};

export const getFeedbacks = async (): Promise<Model.Feedback[]> => {
  const response = await apiClient.get("/staff/feedbacks");
  return response.data;
};

export const adminGetFeedbacks = async (): Promise<Model.AdminFeedback[]> => {
  const response = await apiClient.get("/admin/feedbacks");
  return response.data;
};

export const getAllMedicalRecords = async (
  patientId?: number,
): Promise<Model.MedicalRecord[]> => {
  const params = patientId ? { patient_id: patientId } : {};
  const response = await apiClient.get("/admin/medical-records", { params });
  return response.data;
};

export const getMedicalRecordDetail = async (
  id: number,
): Promise<Model.MedicalRecord> => {
  const response = await apiClient.get(`/admin/medical-records/${id}`);
  return response.data;
};

export const adminDeleteMedicalRecord = async (id: number): Promise<void> => {
  await apiClient.delete(`/admin/medical-records/${id}`);
};

export const adminUpdateService = async (
  id: number,
  formData: FormData,
): Promise<Model.MessageResponse> => {
  formData.append("_method", "PUT");
  const response = await apiClient.post(`/admin/services/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const updateProfile = async (
  data: Model.UpdateProfileRequest,
): Promise<Model.MessageResponse> => {
  const response = await apiClient.put("/user/profile", data);
  return response.data;
};

export const submitFeedback = async (data: {
  AppointmentID?: number | null;
  TargetType: "Doctor" | "System";
  Rating: number;
  Comment: string;
}): Promise<Model.MessageResponse> => {
  if (data.TargetType === "Doctor" && data.AppointmentID) {
    const response = await apiClient.post(
      `/appointments/${data.AppointmentID}/feedback`,
      {
        Rating: data.Rating,
        Comment: data.Comment,
      },
    );
    return response.data;
  } else if (data.TargetType === "System") {
    const response = await apiClient.post("/system-feedback", {
      Rating: data.Rating,
      Comment: data.Comment,
    });
    return response.data;
  }

  throw new Error("Dữ liệu đánh giá không hợp lệ");
};

export const adminGetUserDetail = async (id: number): Promise<Model.User> => {
  const response = await apiClient.get(`/admin/users/${id}`);
  return response.data;
};

export const adminCreatePatient = async (
  formData: FormData,
): Promise<Model.MessageResponse> => {
  const response = await apiClient.post("/admin/patients", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const adminDeleteUser = async (id: number): Promise<void> => {
  await apiClient.delete(`/admin/patients/${id}`);
};

export const adminCreateUser = async (
  formData: FormData,
): Promise<Model.MessageResponse> => {
  const response = await apiClient.post("/admin/users", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const adminCancelAppointment = async (
  id: number,
  reason: string,
): Promise<Model.MessageResponse> => {
  const response = await apiClient.patch(`/staff/appointments/${id}/cancel`, {
    reason,
  });
  return response.data;
};

export const adminCreateSlot = async (
  doctorId: number,
  start: string,
  end: string,
): Promise<Model.MessageResponse> => {
  const response = await apiClient.post(`/admin/doctors/${doctorId}/schedules`, {
    startTime: start.replace(" ", "T"),
    endTime: end.replace(" ", "T"),
  });
  return response.data;
};

export const adminDeleteSlot = async (slotId: number): Promise<void> => {
  await apiClient.put(`/admin/schedules/${slotId}/cancel`, {});
};

export const adminUpdatePatient = async (
  id: number,
  data: Model.AdminUpdatePatientRequest,
): Promise<Model.MessageResponse> => {
  const response = await apiClient.put(`/admin/patients/${id}`, data);
  return response.data;
};

export const getNotificationLogs = async (): Promise<Model.Notification[]> => {
  const response = await apiClient.get("/admin/notifications");
  return response.data;
};

export const sendNotification = async (
  data: Model.SendNotificationRequest,
): Promise<Model.MessageResponse> => {
  const response = await apiClient.post("/admin/notifications/send", data);
  return response.data;
};

export const deleteNotification = async (
  id: number | string,
): Promise<Model.MessageResponse> => {
  const response = await apiClient.delete(`/admin/notifications/${id}`);
  return response.data;
};

export const deleteAllNotifications =
  async (): Promise<Model.MessageResponse> => {
    const response = await apiClient.delete(`/admin/notifications/delete-all`);
    return response.data;
  };

export const triggerReminders = async (): Promise<Model.MessageResponse> => {
  const response = await apiClient.post(
    `/admin/notifications/trigger-reminders`,
    {},
  );
  return response.data;
};

export const staffCreateAppointment = async (
  formData: FormData,
): Promise<Model.MessageResponse> => {
  const response = await apiClient.post("/staff/appointments", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const staffUpdateSlot = async (
  slotId: number,
  doctorId: number,
  startTime: string,
  endTime: string,
): Promise<Model.MessageResponse> => {
  const response = await apiClient.put(`/staff/availability/${slotId}`, {
    DoctorID: doctorId,
    StartTime: startTime,
    EndTime: endTime,
  });
  return response.data;
};

export const staffDeleteSlot = async (id: number): Promise<void> => {
  await apiClient.delete(`/staff/availability/${id}`);
};

export const getFamilyMembers = async (): Promise<Model.FamilyMember[]> => {
  const response = await apiClient.get("user/family-members");
  return response.data;
};

export const addFamilyMember = async (
  relativeUserId: number,
  relationType: string,
): Promise<Model.MessageResponse> => {
  const response = await apiClient.post("/user/family-members", {
    RelativeUserID: relativeUserId,
    RelationType: relationType,
  });
  return response.data;
};

export const removeFamilyMember = async (
  relativeUserId: number,
): Promise<Model.MessageResponse> => {
  const response = await apiClient.delete(
    `/user/family-members/${relativeUserId}`,
  );
  return response.data;
};

export const searchUserPublic = async (
  query: string,
): Promise<Model.User[]> => {
  const response = await apiClient.get(`/users/search-public?query=${query}`);
  return response.data;
};

export default apiClient;
