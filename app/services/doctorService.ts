import apiClient from "@/lib/ApiClient";
import { PriorityLevel } from "@/lib/model";
import type {
  DoctorQueuePatient as Patient,
  MedicalRecord,
  Appointment
} from "@/lib/model";

// --- ENUM (Nên import từ model, nhưng khai báo tạm ở đây để tránh lỗi) ---
// import { AppointmentStatus } from "@/lib/model"; 
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T; 
  record?: T; 
}
export interface DashboardStats {
  total_appointments: number;
  completed_appointments: number;
  waiting_appointments: number;
  in_progress_appointments: number;
  today_appointments: number;
}

export interface QueueResponse {
  success: boolean;
  data: Patient[];
}
export interface UserProfileResponse {
  id?: number;
  FullName?: string;
  Email?: string;
  PhoneNumber?: string;
  Role?: string;
  SpecialtyName?: string;
  SpecialtyID?: number;
  YearsOfExperience?: string | number;
  Degree?: string;
  ProfileDescription?: string;
}
export interface ScheduleResponse {
  success: boolean;
  data: Appointment[];
}

export interface DoctorSettingsData {
  notificationSettings: Record<string, unknown>;
  preferences: Record<string, unknown>;
}

export interface MedicalRecordCreatePayload {
  appointmentId: number;
  diagnosis: string;
  notes?: string;
}

export interface DoctorSlotResponse {
  SlotID: number;
  StartTime: string;
  EndTime: string;
  Status: string;
}

interface DoctorPatientApiResponse {
  UserID?: number;
  id?: number;
  FullName?: string;
  name?: string;
  PhoneNumber?: string;
  phone?: string;
  Birthday?: string;
  DoB?: string;
  DateOfBirth?: string;
  Gender?: string;
  gender?: string;
}

interface DoctorAppointmentApiResponse {
  id?: number;
  AppointmentID?: number;
  PatientID?: number;
  patient?: DoctorPatientApiResponse;
  StartTime?: string;
  start_time?: string;
  updated_at?: string;
  Status?: string;
  InitialSymptoms?: string;
  Reason?: string;
  Description?: string;
  Priority?: "low" | "medium" | "high" | "emergency";
}

export interface PatientHistoryResponse {
  success: boolean;
  data: MedicalRecord[];
}
export interface DoctorProfileDetail {
  DoctorID?: number;
  SpecialtyID?: number;
  Degree?: string | null;
  YearsOfExperience?: string | number | null;
  ProfileDescription?: string | null;
  imageURL?: string;
  specialty?: {
    SpecialtyID: number;
    SpecialtyName: string;
  };
}

// Định nghĩa dữ liệu trả về từ API (UserProfile) - Đã được làm phẳng
// export interface DoctorProfile {
//   id: number;
//   FullName: string;
//   email: string;
//   phone: string;
//   specialty?: {
//     SpecialtyID: number;
//     SpecialtyName: string;
//   };
//   department?: string;
//   licenseNumber?: string;
//   experience?: string;
//   education?: string;
//   bio?: string;
//   address?: string;
//   workingHours?: {
//     morning: string;
//     afternoon: string;
//   };
//   consultationFee?: string;
//   languages?: string[];
// }

const calculateAge = (dob: string | null | undefined): number => {
  if (!dob) return 0;
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return 0;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

class DoctorService {

  async getDashboard(): Promise<DashboardStats> {
    const response = await apiClient.get("/doctor/dashboard-stats");

    console.log("Raw API Response:", response.data);

    const apiData = response.data.data || response.data;

    return {
      total_appointments: apiData.total_appointments_count ?? 0,
      completed_appointments: apiData.completed_appointments_count ?? 0,
      waiting_appointments: apiData.waiting_appointments_count ?? 0,
      in_progress_appointments: apiData.in_progress_appointments_count ?? 0,
      today_appointments: apiData.today_appointments_count ?? 0,
    };
  }


  async getQueue(): Promise<QueueResponse> {
    try {
      const response = await apiClient.get("/doctor/appointments/my-day");
      const appointmentList = (Array.isArray(response.data) ? response.data : (response.data?.data || [])) as DoctorAppointmentApiResponse[];

      const mappedPatients: Patient[] = appointmentList.map((appt) => {
        // Lấy object bệnh nhân
        const p = appt.patient || {};
        return {
          id: appt.id ?? appt.AppointmentID ?? 0,
          patientId: appt.PatientID || p.UserID || p.id || 0,
          name: p.FullName || p.name || "Không tên",
          phone: p.PhoneNumber || p.phone || "",

          age: calculateAge(p.Birthday || p.DoB || p.DateOfBirth),

          gender: p.Gender || p.gender || 'other',

          appointmentTime: appt.StartTime || appt.start_time || "",
          checkInTime: appt.updated_at || "",

          status: this.normalizeStatus(appt.Status || ""),
          initialSymptoms: appt.InitialSymptoms || "Bệnh nhân không nhập triệu chứng",
          symptoms: appt.Reason || appt.Description || "",
          priority: {
            low: PriorityLevel.LOW,
            medium: PriorityLevel.MEDIUM,
            high: PriorityLevel.HIGH,
            emergency: PriorityLevel.EMERGENCY,
          }[appt.Priority || "medium"],
          allergies: [],
          medicalHistory: []
        };
      });

      return {
        success: true,
        data: mappedPatients
      };

    } catch (error) {
      console.error("Lỗi getQueue:", error);
      return { success: false, data: [] };
    }
  }

  // SCHEDULE
  async getSchedule(from?: string, to?: string): Promise<ScheduleResponse> {
    const today = new Date();
    const defaultFrom = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const defaultTo = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const params = {
      from: from || defaultFrom,
      to: to || defaultTo
    };
    
    const response = await apiClient.get("/doctor/appointments", { params });
    const arrayData = Array.isArray(response.data) ? response.data : (response.data?.data || []);
    
    return {
      success: true,
      data: arrayData
    };
  }

  // APPOINTMENT STATUS UPDATES 
  async updateAppointmentStatus(id: number, status: "InProgress" | "Completed"): Promise<boolean> {
    try {
      const action = status === "InProgress" ? "start" : "complete";
      await apiClient.put(`/doctor/appointments/${id}/${action}`, {});
      return true;
    } catch (error) {
      console.error(`Lỗi update status ${status}:`, error);
      return false;
    }
  }

  async checkInAppointment(id: number): Promise<boolean> {
    console.error(`Không thể check-in lịch hẹn ${id}: thao tác này thuộc quyền nhân viên tiếp đón.`);
    return false;
  }

  async startExam(id: number): Promise<boolean> {
    return await this.updateAppointmentStatus(id, 'InProgress'); 
  }

  async completeExam(id: number): Promise<boolean> {
    return await this.updateAppointmentStatus(id, 'Completed');
  }

  async cancelAppointment(id: number): Promise<boolean> {
    console.error(`Không thể hủy lịch hẹn ${id}: API bác sĩ không hỗ trợ thao tác này.`);
    return false;
  }

  // ==================== MEDICAL RECORDS ====================
  async getMedicalRecords(): Promise<ApiResponse<MedicalRecord[]>> {
  try {
    
    const response = await apiClient.get("/doctor/medical-records", {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (response.data) {
      return {
        success: true,
        message: response.data.message || "Tải dữ liệu thành công",
        data: response.data.data || response.data 
      };
    }

    return { success: false, message: "Server không trả về dữ liệu" };

  } catch (error) {
    console.error("Lỗi tải bệnh án:", error);
    return { 
      success: false, 
      message: "Lỗi kết nối server khi tải bệnh án"
    };
  }
}
  async createMedicalRecord(payload: MedicalRecordCreatePayload): Promise<ApiResponse<{ RecordID: number }>> {
    const response = await apiClient.post("/doctor/medical-records", payload);
    return { success: true, data: response.data };
  }

  async uploadExamResult(recordId: number, file: File, description = ""): Promise<ApiResponse<unknown>> {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("description", description);
      const response = await apiClient.post(`/doctor/medical-records/${recordId}/results`, formData);
      return {
        success: true,
        message: "Tải tệp thành công",
        data: response.data
      };
    } catch (error) {
      console.error("Lỗi upload kết quả:", error);
      return { success: false, message: "Không thể tải tệp kết quả" };
    }
  }

  // ==================== PATIENT HISTORY ====================
  async getPatientHistory(patientId: number): Promise<PatientHistoryResponse> {
    const res = await apiClient.get(`/doctor/patients/${patientId}/medical-records`);
    return {
      success: true,
      data: Array.isArray(res.data) ? res.data : (res.data?.data || []),
    };
  }

  // ==================== PROFILE MANAGEMENT ====================
  async getMyProfile(): Promise<ApiResponse<UserProfileResponse>> {
    try {
      const response = await apiClient.get("/doctor/profile");
      const d = response.data?.data || response.data;
      console.log("Dữ liệu gốc: ", d);
      return {
        success: true,
        data: {
          FullName: d.FullName,
          Email: d.Email,
          PhoneNumber: d.PhoneNumber,
          SpecialtyName: d.SpecialtyName || d.specialty?.SpecialtyName || d.doctor_profile?.specialty?.SpecialtyName || "Chưa xác định",
          SpecialtyID: d.SpecialtyID || d.doctor_profile?.SpecialtyID,
          YearsOfExperience: d.YearsOfExperience || d.doctor_profile?.YearsOfExperience || 0,
          Degree: d.Degree || d.doctor_profile?.Degree || "Chưa cập nhật",
          ProfileDescription: d.ProfileDescription || d.doctor_profile?.ProfileDescription || "Chưa có giới thiệu"
        }
      };
    } catch (error) {
      console.error("Lỗi getMyProfile:", error);
      return { success: false, message: "Lỗi khi tải thông tin bác sĩ" };
    }
  }

  async updateProfile(data: {
  FullName: string;
  email: string;
  phone?: string;
  SpecialtyID?: number; 
  Degree?: string;
  YearsOfExperience?: number | string;
  ProfileDescription?: string;
}) {
    const payload = {
      fullName: data.FullName,
      email: data.email,
      phoneNumber: data.phone,
      specialtyId: data.SpecialtyID,
      degree: data.Degree,
      yearsOfExperience: data.YearsOfExperience === "" || data.YearsOfExperience === undefined
        ? undefined
        : Number(data.YearsOfExperience),
      profileDescription: data.ProfileDescription,
    };

    const response = await apiClient.put("/doctor/profile", payload);
    return response.data;
  }

  async getMySettings(): Promise<DoctorSettingsData> {
    const response = await apiClient.get<DoctorSettingsData>("/doctor/settings");
    return response.data;
  }

  async updateSettings(data: DoctorSettingsData): Promise<DoctorSettingsData> {
    const response = await apiClient.put<DoctorSettingsData>("/doctor/settings", data);
    return response.data;
  }

  // ==================== SLOT MANAGEMENT ====================
  async getMySlots(date?: string): Promise<{ success: boolean; data: DoctorSlotResponse[] }> {
    const response = await apiClient.get("/doctor/schedules/me", {
      params: date ? { targetDate: date } : undefined,
    });
    return { success: true, data: Array.isArray(response.data) ? response.data : [] };
  }

  async createSlot(slotData: { date: string; start_time: string; end_time: string }): Promise<void> {
    await apiClient.post("/doctor/schedules", {
      startTime: `${slotData.date}T${slotData.start_time}:00`,
      endTime: `${slotData.date}T${slotData.end_time}:00`,
    });
  }

  async deleteSlot(slotId: number): Promise<void> {
    await apiClient.put(`/doctor/schedules/${slotId}/cancel`, {});
  }

  // ==================== HELPER METHODS (ĐÃ SỬA LOGIC) ====================
  private normalizeStatus(status: string): string {
    if (!status) return 'waiting';

    const s = (status || "").toLowerCase(); // Chuyển về chữ thường

    const statusMap: Record<string, string> = {
      // Nhóm WAITING
      'waiting': 'waiting',
      'pending': 'waiting',
      'confirmed': 'waiting',

      // Nhóm CHECKED_IN (Thêm case viết liền)
      'checked_in': 'checked_in', // Frontend style
      'checkedin': 'checked_in',  // Backend style (Quan trọng!)
      'arrived': 'checked_in',

      // Nhóm IN_PROGRESS
      'in_progress': 'in_progress',
      'inprogress': 'in_progress', // Thêm case viết liền
      'processing': 'in_progress',

      // Nhóm COMPLETED
      'completed': 'completed',
      'done': 'completed',
      'finished': 'completed',

      // Nhóm CANCELLED
      'cancelled': 'cancelled',
      'canceled': 'cancelled'
    };

    return statusMap[s] || 'waiting';
  }

  private normalizePriority(priority: string): string {
    if (!priority) return 'medium';

    const priorityMap: Record<string, string> = {
      'low': 'low',
      'medium': 'medium',
      'high': 'high',
      'emergency': 'emergency',
      'normal': 'low',
      'urgent': 'high',
      'critical': 'emergency'
    };

    return priorityMap[(priority || "").toLowerCase()] || 'medium';
  }
}

// Utility functions
export const safeParseDate = (dateString: string | null | undefined): Date | null => {
  if (!dateString) return null;
  try {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
};

export const formatTime = (dateString: string | null | undefined): string => {
  const date = safeParseDate(dateString);
  if (!date) return "Chưa có giờ";
  return date.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatDate = (dateString: string | null | undefined): string => {
  const date = safeParseDate(dateString);
  if (!date) return "Chưa có ngày";
  return date.toLocaleDateString('vi-VN', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric'
  });
};

export const formatDateTime = (dateString: string | null | undefined): string => {
  const date = safeParseDate(dateString);
  if (!date) return "Chưa có ngày giờ";
  return date.toLocaleString('vi-VN', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const doctorService = new DoctorService();
