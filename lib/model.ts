
export interface User {
  UserID: number;
  FullName: string;
  PhoneNumber: string;
  Email: string | null;
  Username: string;
  Role: "BenhNhan" | "BacSi" | "NhanVien" | "QuanTriVien";
  Status: "HoatDong" | "Khoa";
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  DateOfBirth?: string | null;
  Gender?: string | null;
  Address?: string | null;
}
export interface FamilyMember extends User{
  RelationType?: string;
    pivot?: {
        UserID: number;
        RelativeUserID: number;
        RelationType: string;
    }
}
export interface Service {
  ServiceID: number;
  SpecialtyID: number;
  ServiceName: string;
  Description: string | null;
  EstimatedDuration: number;
  Price: number;
  imageURL: string | null;
}

export interface Specialty {
  SpecialtyID: number;
  SpecialtyName: string;
  Description: string | null;
  imageURL: string | null;
  services?: Service[];
}

export interface Doctor {
  DoctorID: number;
  SpecialtyID: number;
  Degree: string;
  YearsOfExperience: number;
  ProfileDescription: string | null;
  imageURL: string | null; 
  user: User; 
  specialty: Specialty;
}

export interface AvailabilitySlot {
  SlotID: number;
  DoctorID: number;
  StartTime: string; // Format: "YYYY-MM-DD HH:mm:ss"
  EndTime: string;
  Status: "Available" | "Booked";
}

export interface AdminScheduleSlot extends Omit<AvailabilitySlot, "Status"> {
  Status: string;
  appointment?: Appointment | null;
}

export interface ExamResult {
  ResultID: number;
  RecordID: number;
  FilePath: string; // Đường dẫn file kết quả
  FileType: string;
  FileDescription: string | null;
  created_at: string;
}

export interface MedicalRecord {
  RecordID: number;
  AppointmentID: number;
  PatientID: number;
  DoctorID: number;
  Diagnosis: string;
  Notes: string | null;
  created_at: string;
  appointment?: Appointment;
  exam_results?: ExamResult[]; // Danh sách file đính kèm
  doctor?: Doctor; // Bác sĩ khám
  patient?: User; // Bệnh nhân
  user?: User;
}

export interface Appointment {
  AppointmentID: number;
  PatientID: number;
  DoctorID: number;
  SlotID: number | null;
  ServiceID: number;
  StartTime: string;
  EstimatedDuration?: number | null;
  Status: "Pending" | "Confirmed" | "Completed" | "Cancelled" | "CheckedIn" | string;
  InitialSymptoms: string | null;
  CancellationReason: string | null;
  file_path: string | null;
  Type: 'New' | 'FollowUp';
  PatientName?: string;
  DoctorName?: string;
  SpecialtyName?: string;
  ServiceName?: string;
  // Các quan hệ lồng nhau
  patient?: User;
  doctor?: Doctor;
  medical_record?: MedicalRecord;
  //Thông tin lịch khám
  service?: Service;
}

export interface Feedback {
  FeedbackID: number;
  PatientID: number;
  AppointmentID: number;
  Rating: number;
  Comment: string | null;
  created_at: string;
  patient?: User;
}
export interface AdminFeedback {
    FeedbackID: number;
    Rating: number;
    Comment: string;
    CreatedAt: string;
    
    ReviewerName: string;
    ReviewerAvatar?: string;

    TargetName: string;
    Type: 'Doctor' | 'System';
}
export interface TopFeedback {
    FeedbackID: number;
    Rating: number;     // 1 đến 5
    Comment: string;
    FullName: string;   // Tên bệnh nhân
    avatar_url?: string;
}
// 2. CÁC ĐỐI TƯỢNG PHẢN HỒI (RESPONSE)

export interface LoginResponse {
  user: User;
  token: string;
}

export interface MessageResponse {
  message: string;
}

export interface DashboardStats {
  today_appointments_count: number;
  pending_appointments_count: number;
  new_patients_count: number;
  total_doctors_count: number;
  // (Dành cho Bác sĩ)
  total_appointments_count?: number;
  completed_appointments_count?: number;
  waiting_appointments_count?: number;
}
export interface Notification {
  NotificationID: number;
  UserID: number;
  Title?: string; 
  Content: string;
  NotificationType: string; // 'System', 'Reminder', 'Warning'...
  Channel: string;          // 'In-App', 'Email', 'SMS'
  Status: string;           // 'Unread', 'Read'
  created_at: string;
  updated_at: string;
}
export interface SendNotificationRequest {
  Title: string;
  Content: string;
  TargetGroup: "all" | "patients" | "doctors" | "staff";
  Channel: "in_app" | "email";
}
export interface NotificationLog {
  id: number | string;
  recipient: string;
  title: string;
  content: string;
  type: "SystemAlert" | "Reminder" | "Other";
  sent_at: string;
  status: string;
}
export interface RawApiNotification {
  NotificationID: number;
  Title: string | null;
  Content: string;
  NotificationType: string; 
  created_at: string;
  Status: string;
  target_group?: string;       
  user?: { FullName: string };
}
// Type cho Doctor

export interface DoctorDashboardMedicalRecord {
  id: number
  patientName: string
  age: number
  diagnosis: string
  treatment: string
  prescriptions: Prescription[]
  tests: string[]
  date: string
  status: "Completed" | "Pending"
}

export interface VitalSigns {
  bloodPressure: string
  heartRate: number
  temperature: number
  respiratoryRate: number
  spO2: number
  weight: number
  height: number
}

export interface MedicalExamFormData {
  diagnosis: string
  clinicalNotes?: string
  notes: string
  currentSymptoms: string
  prescriptions?: Prescription[]
  tests?: string[]
  attachments: File[]
  vitalSigns?: VitalSigns
}

export interface Prescription {
  medicine: string
  dosage: string
  frequency: string
}

export interface DoctorScheduleDay {
  id: number
  date: string
  appointments: number
  timeSlots: string[]
  appointmentsList: Appointment[]
}

// Thêm các interface mới

export interface DoctorSpecialtyOption {
  id: number
  SpecialtyName: string
  description?: string
}

export interface DoctorDashboardStats {
  totalAppointments: number
  completedAppointments: number
  waitingAppointments: number
  inProgress: number
  cancelled: number
  revenue?: number
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  error?: string
}

// Enum cho status
export enum AppointmentStatus {
  CONFIRMED = "Confirmed",
  PENDING = "Pending",
  CHECKED_IN = "CheckedIn",
  IN_PROGRESS = "InProgress",
  COMPLETED = "Completed",
  CANCELLED = "Cancelled"
}

export enum PriorityLevel {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  EMERGENCY = "emergency"
}

// export enum Gender {
//   MALE = "male",
//   FEMALE = "female",
//   OTHER = "other"
// }

// existing interfaces
export interface DoctorDashboardAppointment {
  id: number
  patientId: number  
  patientName: string
  patientAge: number
  patientPhone: string
  symptoms: string
  appointmentTime: string
  status: AppointmentStatus | string  
  checkInTime: string
  doctorId?: number
  notes?: string
}

export interface DoctorQueuePatient {
  id: number
  patientId: number  
  name: string
  age: number
  gender: string
  phone: string
  symptoms: string
  appointmentTime: string
  status: AppointmentStatus | string  
  initialSymptoms: string
  checkInTime: string
  priority: PriorityLevel 
  allergies: string[]
  medicalHistory: string[]
  bloodType?: string
  insuranceId?: string
}

// Type mới cho Schedule
export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}
export interface ChangePasswordResponse {
    success: boolean;
    message: string;
}
export interface TimeSlot {
  start: string;
  end: string;
  booked: boolean;
  appointmentId?: number;
}

export interface WeeklySchedule {
  weekNumber: number;
  startDate: string;
  endDate: string;
  days: DoctorScheduleDay[];
}

export interface AppointmentFilter {
  status: "all" | "waiting" | "in_progress" | "completed" | "checked_in" | "cancelled";
  priority: "all" | "low" | "medium" | "high" | "emergency";
  dateRange?: {
    start: Date;
    end: Date;
  };
}
export interface PatientDetail extends DoctorQueuePatient {
  appointmentId?: number;
  medicalRecords: DoctorDashboardMedicalRecord[]
  vitalSigns?: VitalSigns
}
export interface AdminUpdatePatientRequest {
  FullName: string;
  PhoneNumber: string;
  Email?: string | null;
  DateOfBirth?: string | null; // YYYY-MM-DD
  Gender?: string | null;      // "Nam", "Nữ", "Khác"
  Address?: string | null;
  Status?: string;             // Admin có quyền sửa trạng thái (VD: "HoatDong", "Khoa")
}
export interface UpdateProfileRequest{
  FullName: string;
  PhoneNumber: string;
  Email: string;
  DateOfBirth?: string;
  Gender?: string;
  Address?: string;
  avatar?: File | null;
}
