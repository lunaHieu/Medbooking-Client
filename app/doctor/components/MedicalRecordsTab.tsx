"use client";

import { useState, useEffect } from "react";
import { MedicalRecord } from "@/lib/model"
// import { generatePrescriptionPDF } from "../components/InPrescriptionPDF";
interface MedicalRecordsTabProps {
  medicalRecords: MedicalRecord[]
  handleViewMedicalRecord: (id: number) => void
  generateMedicalRecordPrint: (record: MedicalRecord) => void
  viewMode?: "list" | "grid"
}
const statusConfig: Record<string, { label: string; classes: string }> = {
  Completed: { label: "Đã hoàn thành", classes: "bg-emerald-100 text-emerald-800" },
  Pending: { label: "Đang chờ xử lý", classes: "bg-yellow-100 text-yellow-800" },
  Confirmed: { label: "Đã xác nhận", classes: "bg-blue-100 text-blue-800" },
  CheckedIn: { label: "Đã có mặt", classes: "bg-indigo-100 text-indigo-800" },
};
const MedicalRecordsTab = ({
  medicalRecords,
  handleViewMedicalRecord,
  generateMedicalRecordPrint
}: MedicalRecordsTabProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(medicalRecords.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = medicalRecords.slice(indexOfFirstItem, indexOfLastItem);
  useEffect(() => {
    setCurrentPage(1);
  }, [medicalRecords]);
  return (
    <div className="bg-white rounded-2xl shadow border p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-xl font-semibold text-slate-900">Quản lý bệnh án ({medicalRecords.length})</h2>
      </div>

      {currentItems.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <p>Không tìm thấy bệnh án nào</p>
          <p className="text-sm mt-1">Thử tìm kiếm với từ khóa khác</p>
        </div>
      ) : (
        <div className="space-y-4">
          {currentItems.map((record) => {
            const currentStatus = record.appointment?.Status || "Pending";
            const config = statusConfig[currentStatus] || statusConfig.Pending

            return (

              <div key={record.RecordID} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-slate-900">{record.patient?.FullName || "Bệnh nhân chưa có tên"}</h3>
                    <p className="text-sm text-slate-600">Ngày sinh: {record.patient?.DateOfBirth ? (
                      new Date(record.patient.DateOfBirth).toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })
                    ) : (
                      "Chưa cập nhật"
                    )}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.classes}`}>
                    {config.label}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-1">Chẩn đoán:</p>
                    <p className="text-sm text-slate-600">{record.Diagnosis}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-1">Điều trị:</p>
                    <p className="text-sm text-slate-600">{record.Notes}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewMedicalRecord(record.RecordID)}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                  >
                    Xem chi tiết
                  </button>
                  <button
                    onClick={() => generateMedicalRecordPrint(record)}
                    className="px-3 py-1 border border-slate-300 rounded text-sm hover:bg-slate-100 transition-colors"
                  >
                    In Bệnh Án
                  </button>
                </div>
              </div>

            );
          })}
        </div>

      )}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-8 gap-4 border-t pt-6">
          <p className="text-sm text-slate-600">
            Hiển thị trang <span className="font-semibold text-slate-900">{currentPage}</span> trên {totalPages}
          </p>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm disabled:opacity-50 hover:bg-slate-50"
            >
              Trước
            </button>

            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i + 1}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-9 h-9 rounded-lg border text-sm font-medium transition-colors ${currentPage === i + 1
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                  }`}
              >
                {i + 1}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm disabled:opacity-50 hover:bg-slate-50"
            >
              Sau
            </button>
          </div>
        </div>
      )}
    </div>

  )
}

export default MedicalRecordsTab;
