"use client";

import { useState, useEffect } from "react";
import DashboardStats from "./DashboardStats";
import TodayAppointments from "./TodayAppointments";
import WaitingPatients from "./WaitingPatients";
import ExamInProgress from "./ExamInProgress";
import MedicalExamForm from "./MedicalExamForm";
import type {
  DoctorDashboardAppointment as Appointment,
  DoctorQueuePatient as Patient,
  DoctorDashboardMedicalRecord as MedicalRecord,
  PatientDetail,
} from "@/lib/model";

interface DashboardTabProps {
  dashboardStats: {
    totalAppointments: number;
    completedAppointments: number;
    waitingAppointments: number;
    inProgressAppointments: number;
    todayAppointments: number;
  };
  appointments: Appointment[];
  waitingPatients: Patient[];
  medicalRecords: MedicalRecord[];
  currentDoctor: {
    FullName: string;
    specialty: { SpecialtyName: string };
    id?: number;
    email?: string;
    phone?: string;
  };
  getPriorityColor: (p: string) => string;
  getPriorityText: (p: string) => string;
  onViewPatientDetail: (patient: Patient) => void;
  handleStartExam: (patient: PatientDetail) => Promise<void>;
}

export default function DashboardTab({
  dashboardStats,
  appointments: initialAppointments,
  waitingPatients: initialWaitingPatients,
  medicalRecords,
  currentDoctor,
  getPriorityColor,
  getPriorityText,
  onViewPatientDetail,
  handleStartExam: onStartExam,
}: DashboardTabProps) {
  // STATE QUẢN LÝ DỮ LIỆU
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [waitingPatients, setWaitingPatients] = useState<Patient[]>(initialWaitingPatients);
  const [showExamForm, setShowExamForm] = useState(false);
  const [selectedPatientForExam, setSelectedPatientForExam] = useState<PatientDetail | null>(null);

  // State cho TodayAppointments
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // ĐỒNG BỘ KHI PROPS THAY ĐỔI
  useEffect(() => {
    setAppointments(initialAppointments);
  }, [initialAppointments]);

  useEffect(() => {
    setWaitingPatients(initialWaitingPatients);
  }, [initialWaitingPatients]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "checked_in": return {
        cls: "bg-green-100 text-green-800",
        icon: "✓",
        text: "Đã check-in"
      };
      case "in_progress": return {
        cls: "bg-blue-100 text-blue-800",
        icon: "↻",
        text: "Đang khám"
      };
      case "completed": return {
        cls: "bg-gray-100 text-gray-800",
        icon: "✓",
        text: "Hoàn thành"
      };
      default: return {
        cls: "bg-yellow-100 text-yellow-800",
        icon: "⏳",
        text: "Chờ"
      };
    }
  };

  // Xử lý bắt đầu khám
  const handleStartExam = async (patientDetail: PatientDetail) => {
    await onStartExam(patientDetail);
  };

  // Xử lý khi hoàn thành khám
  const handleExamComplete = () => {
    if (!selectedPatientForExam) return;

    console.log('✅ Hoàn thành khám cho:', selectedPatientForExam.name);

    // setAppointments(prev => 
    //   prev.map(appt => {
    //     const isPatientAppointment = 
    //       appt.patientId === selectedPatientForExam.id || 
    //       appt.id === selectedPatientForExam.id ||
    //       appt.patientName === selectedPatientForExam.name;

    //     // Chỉ chuyển từ in_progress sang completed
    //     if (isPatientAppointment && appt.status === 'in_progress') {
    //       return { ...appt, status: 'completed' as const };
    //     }
    //     return appt;
    //   })
    // );

    alert(`✅ Đã hoàn thành khám cho ${selectedPatientForExam.name}!`);

    setShowExamForm(false);
    setSelectedPatientForExam(null);
  };

  // Xử lý khi hủy khám
  const handleCancelExam = () => {
    if (!selectedPatientForExam) return;

    console.log('❌ Hủy khám cho:', selectedPatientForExam.name);

    // KHÔNG chuyển sang completed, chỉ về waiting
    // setAppointments(prev => 
    //   prev.map(appt => {
    //     const isPatientAppointment = 
    //       appt.patientId === selectedPatientForExam.id || 
    //       appt.id === selectedPatientForExam.id ||
    //       appt.patientName === selectedPatientForExam.name;

    //     if (isPatientAppointment && appt.status === 'in_progress') {
    //       return { ...appt, status: 'waiting' as const }; // ← Chỉ về waiting, KHÔNG completed
    //     }
    //     return appt;
    //   })
    // );

    // Thêm lại waiting list
    // setWaitingPatients(prev => {
    //   const exists = prev.some(p => p.id === selectedPatientForExam.id);
    //   if (!exists) {
    //     return [...prev, {
    //       id: selectedPatientForExam.id,
    //       name: selectedPatientForExam.name,
    //       age: selectedPatientForExam.age,
    //       gender: selectedPatientForExam.gender,
    //       phone: selectedPatientForExam.phone,
    //       symptoms: selectedPatientForExam.symptoms,
    //       appointmentTime: selectedPatientForExam.appointmentTime || "",
    //       status: 'waiting' as const,
    //       checkInTime: '',
    //       priority: selectedPatientForExam.priority || 'medium',
    //       allergies: selectedPatientForExam.allergies || [],
    //       medicalHistory: selectedPatientForExam.medicalHistory || []
    //     }];
    //   }
    //   return prev;
    // });

    // Reset form
    setShowExamForm(false);
    setSelectedPatientForExam(null);
  };

  // Tính toán các giá trị cần thiết 
  const inProgressCount = appointments.filter(a => a.status === "in_progress").length;
  
  // Tính paginated appointments 
  const filteredAppointments = appointments.filter(appt => {
    if (searchTerm && !(appt?.patientName || "").toLowerCase().includes((searchTerm || "").toLowerCase())) {
      return false;
    }
    if (statusFilter !== "all" && appt.status !== statusFilter) {
      return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAppointments = filteredAppointments.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-8">

      {/* Stats Section */}
      <DashboardStats
        stats={{
          totalAppointments: dashboardStats.totalAppointments,
          completed: dashboardStats.completedAppointments,
          waiting: dashboardStats.waitingAppointments,
          inProgress: inProgressCount
        }}
      />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column - Appointments (2/3 width) */}
        <div className="xl:col-span-2 space-y-6">
          <TodayAppointments
            appointments={appointments}
            waitingPatients={waitingPatients}
            medicalRecords={medicalRecords}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            itemsPerPage={itemsPerPage}
            totalPages={totalPages}
            paginatedAppointments={paginatedAppointments}
            getStatusInfo={getStatusInfo}
            getPriorityColor={getPriorityColor}
            getPriorityText={getPriorityText}
            onViewPatientDetail={onViewPatientDetail}
            handleStartExam={handleStartExam}
            handleViewAppointmentDetail={(id) => {
              const patient = waitingPatients.find(p => p.id === id);
              if (patient) onViewPatientDetail(patient);
            }}
          />
        </div>

        {/* Right Column - Sidebar (1/3 width) */}
        <div className="space-y-6">
          <ExamInProgress
            appointments={appointments}
            waitingPatients={waitingPatients}
            medicalRecords={medicalRecords}
            currentDoctor={currentDoctor}
            getPriorityColor={getPriorityColor}
            getPriorityText={getPriorityText}
            handleStartExam={handleStartExam}
          />

          <WaitingPatients
            waitingPatients={waitingPatients}
            medicalRecords={medicalRecords}
            getStatusInfo={getStatusInfo}
            getPriorityColor={getPriorityColor}
            getPriorityText={getPriorityText}
            handleViewPatientDetail={(id) => {
              const patient = waitingPatients.find(p => p.id === id);
              if (patient) onViewPatientDetail(patient);
            }}
            handleStartExam={handleStartExam}
          />
        </div>
      </div>

      {/* Medical Exam Form Modal */}
      {showExamForm && selectedPatientForExam && (
        <MedicalExamForm
          patient={selectedPatientForExam}
          onClose={handleCancelExam}
          onComplete={handleExamComplete}
        />
      )}
    </div>
  );
}
