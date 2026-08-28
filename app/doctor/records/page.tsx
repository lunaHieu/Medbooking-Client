"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import MedicalRecordsTab from "../components/MedicalRecordsTab";
import LoadingState from "../components/LoadingState";
import ErrorState from "../components/ErrorState";
import {
  Search,
  Download,
  Printer,
  FileText,
  BarChart3,
  User,
  Stethoscope
} from "lucide-react";

import type { MedicalRecord } from "@/lib/model";
import { doctorService } from "@/app/services/doctorService";

type RecordStatusFilter = "all" | "completed" | "in-progress";
type DateFilter = "all" | "today" | "week" | "month";

const getPatientName = (record: MedicalRecord) =>
  record.patient?.FullName || "Bệnh nhân chưa có tên";

const getRecordDate = (record: MedicalRecord) => new Date(record.created_at);

export default function RecordsPage() {
  // ==================== STATES ====================
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<RecordStatusFilter>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "name" | "status">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<MedicalRecord[]>([]);
  const [patientList, setPatientList] = useState<string[]>([]);
  const loadRecords = useCallback(async () => {
    try {
      setLoading(true);
      const response = await doctorService.getMedicalRecords();
      if (!response.success) throw new Error(response.message);

      const records = response.data || [];
      setMedicalRecords(records);
      setFilteredRecords(records);
      setPatientList(Array.from(new Set(records.map(getPatientName))).sort());
      setError(false);
    } catch (err) {
      console.error("Không thể tải bệnh án từ API:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRecords();
  }, [loadRecords]);

  // ==================== FILTERING ====================
  useEffect(() => {
    let filtered = [...medicalRecords];

    // Search filter
    if (searchTerm.trim()) {
      const term = (searchTerm || "").toLowerCase().trim();
      filtered = filtered.filter(record =>
        getPatientName(record).toLowerCase().includes(term) ||
        (record?.Diagnosis || "").toLowerCase().includes(term)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(record => statusFilter === "completed"
        ? record.appointment?.Status === "Completed"
        : record.appointment?.Status !== "Completed");
    }

    // Patient filter
    if (selectedPatient !== "all") {
      filtered = filtered.filter(record => getPatientName(record) === selectedPatient);
    }

    // Date filter
    if (dateFilter !== "all") {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      switch (dateFilter) {
        case "today":
          filtered = filtered.filter(record => {
            const recordDate = getRecordDate(record);
            return recordDate >= startOfDay;
          });
          break;

        case "week":
          const weekAgo = new Date(startOfDay);
          weekAgo.setDate(weekAgo.getDate() - 7);
          filtered = filtered.filter(record => {
            const recordDate = getRecordDate(record);
            return recordDate >= weekAgo;
          });
          break;

        case "month":
          const monthAgo = new Date(startOfDay);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          filtered = filtered.filter(record => {
            const recordDate = getRecordDate(record);
            return recordDate >= monthAgo;
          });
          break;

      }
    }

    // Sort records
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "date":
          comparison = getRecordDate(b).getTime() - getRecordDate(a).getTime();
          break;

        case "name":
          comparison = getPatientName(a).localeCompare(getPatientName(b));
          break;

        case "status":
          comparison = (a.appointment?.Status || "").localeCompare(b.appointment?.Status || "");
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    setFilteredRecords(filtered);
  }, [searchTerm, statusFilter, dateFilter, selectedPatient, sortBy, sortOrder, medicalRecords]);

  // ==================== STATISTICS ====================
  const stats = useMemo(() => {
    const total = medicalRecords.length;
    const completed = medicalRecords.filter(r => r.appointment?.Status === "Completed").length;
    const pending = total - completed;
    const uniquePatients = patientList.length;

    const diagnosisCounts = medicalRecords.reduce((acc, record) => {
      acc[record.Diagnosis] = (acc[record.Diagnosis] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topDiagnoses = Object.entries(diagnosisCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([diagnosis, count]) => ({ diagnosis, count }));

    return {
      total,
      completed,
      pending,
      uniquePatients,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      topDiagnoses
    };
  }, [medicalRecords, patientList]);

  // ==================== EVENT HANDLERS ====================
  const handleViewMedicalRecord = (id: number) => {
    const record = medicalRecords.find(r => r.RecordID === id);
    if (record) {
      setSelectedRecord(record);
      setShowDetailModal(true);
    }
  };

  const handlePrintMedicalRecord = (record: MedicalRecord) => {
    const pdfContent = `
      BỆNH VIỆN ĐA KHOA
      ===============================
      Bác sĩ: ${record.doctor?.user?.FullName || "Bác sĩ"}
      Ngày: ${new Date().toLocaleDateString('vi-VN')}
      
      THÔNG TIN BỆNH NHÂN
      -------------------
      Họ tên: ${getPatientName(record)}
      Ngày sinh: ${record.patient?.DateOfBirth}
      Ngày khám: ${record.created_at}
      Chẩn đoán: ${record.Diagnosis}
      
      
      HƯỚNG DẪN
      ---------
      ${record.Notes}
      
    `;

    const blob = new Blob([pdfContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `benh-an-${record.RecordID}-${record.created_at.slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert(`Đã tạo bản in bệnh án cho ${getPatientName(record)}`);
  };

  const handleExportRecords = () => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      totalRecords: filteredRecords.length,
      filters: { searchTerm, statusFilter, dateFilter, patient: selectedPatient },
      records: filteredRecords.map(record => ({
        id: record.RecordID,
        patient: getPatientName(record),
        dateOfBirth: record.patient?.DateOfBirth,
        diagnosis: record.Diagnosis,
        notes: record.Notes,
        date: record.created_at,
        status: record.appointment?.Status
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `benh-an-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert(`Đã xuất ${filteredRecords.length} bệnh án thành công!`);
  };

  const handlePrintRecords = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Danh sách bệnh án</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f5f5f5; }
            </style>
          </head>
          <body>
            <h1>Danh sách bệnh án</h1>
            <div style="margin-bottom: 20px;">
              <p><strong>Tổng số bệnh án:</strong> ${filteredRecords.length}</p>
              <p><strong>Ngày in:</strong> ${new Date().toLocaleString('vi-VN')}</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th>STT</th>
                  <th>Bệnh nhân</th>
                  <th>Ngày sinh</th>
                  <th>Ngày khám</th>
                  <th>Chẩn đoán</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                ${filteredRecords.map((record, index) => `
                  <tr>
                    <td>${index + 1}</td>
                     <td>${getPatientName(record)}</td>
                    <td>${record.patient?.DateOfBirth}</td>
                    <td>${record.created_at}</td>
                    <td>${record.Diagnosis}</td>
                    <td>${record.appointment?.Status === 'Completed' ? 'Đã hoàn thành' : 'Đang xử lý'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleRefreshData = () => void loadRecords();

  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setDateFilter("all");
    setSelectedPatient("all");
    setSortBy("date");
    setSortOrder("desc");
  };

  // RENDER LOADING/ERROR
  if (loading) {
    return <LoadingState message="Đang tải danh sách bệnh án..." />;
  }

  if (error) {
    return (
      <ErrorState
        message="Không thể tải danh sách bệnh án"
      // onRetry={handleRefreshData}
      />
    );
  }

  // MAIN RENDER
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-50 to-white rounded-2xl p-6 border border-emerald-100">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <FileText className="w-8 h-8 text-emerald-600" />
              Quản lý bệnh án
            </h1>
            <p className="text-gray-600 mt-2">
              Lưu trữ và quản lý thông tin bệnh án bệnh nhân
            </p>

            <div className="flex flex-wrap gap-3 mt-4">
              <div className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm">
                <span className="font-bold">{stats.total}</span> bệnh án
              </div>
              <div className="px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-sm">
                <span className="font-bold">{stats.completed}</span> đã hoàn thành
              </div>
              <div className="px-3 py-1.5 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                <span className="font-bold">{stats.pending}</span> đang xử lý
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {/* <button
              onClick={handleAddRecord}
              className="px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Thêm bệnh án
            </button> */}

            <div className="flex gap-2">
              <button
                onClick={handlePrintRecords}
                className="px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <Printer className="w-5 h-5" />
                In
              </button>

              <button
                onClick={handleExportRecords}
                className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Download className="w-5 h-5" />
                Xuất file
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search  */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tìm kiếm bệnh án
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Tên bệnh nhân, chẩn đoán..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Status filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trạng thái
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as RecordStatusFilter)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="completed">Đã hoàn thành</option>
              <option value="in-progress">Đang xử lý</option>
            </select>
          </div>

          {/* Patient filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bệnh nhân
            </label>
            <select
              value={selectedPatient}
              onChange={(e) => setSelectedPatient(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            >
              {patientList.map((patient, index) => (
                <option
                  key={`patient-${patient}-${index}`}
                  value={patient}
                >
                  {patient}
                </option>
              ))}
            </select>
          </div>

          {/* Date filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Thời gian
            </label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as DateFilter)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Tất cả thời gian</option>
              <option value="today">Hôm nay</option>
              <option value="week">7 ngày qua</option>
              <option value="month">30 ngày qua</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Hiển thị <span className="font-semibold">{filteredRecords.length}</span> / {medicalRecords.length} bệnh án
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm"
            >
              Xóa bộ lọc
            </button>
            <button
              onClick={handleRefreshData}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
            >
              Làm mới
            </button>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.completionRate}%</div>
              <div className="text-sm text-gray-600">Tỷ lệ hoàn thành</div>
            </div>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full"
              style={{ width: `${stats.completionRate}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <User className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.uniquePatients}</div>
              <div className="text-sm text-gray-600">Bệnh nhân đã khám</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Stethoscope className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {stats.topDiagnoses.length > 0 ? stats.topDiagnoses[0].count : 0}
              </div>
              <div className="text-sm text-gray-600">Chẩn đoán phổ biến nhất</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Records Content */}
      <MedicalRecordsTab
        medicalRecords={filteredRecords}
        handleViewMedicalRecord={handleViewMedicalRecord}
        generateMedicalRecordPrint={handlePrintMedicalRecord}
      />

      {/* Footer */}
      <div className="flex justify-between items-center pt-6 border-t border-gray-200">
        <div className="text-sm text-gray-500">
          Cập nhật: {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
        </div>

        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            <span className="font-semibold">{filteredRecords.length}</span> bệnh án
          </div>
          {/* <button
            onClick={handleAddRecord}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Thêm bệnh án
          </button> */}
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedRecord && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                 Chi tiết bệnh án - {getPatientName(selectedRecord)}
              </h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Bệnh nhân</div>
                   <div className="font-semibold">{getPatientName(selectedRecord)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Ngày sinh</div>
                  <div className="font-semibold">
                    {selectedRecord.patient?.DateOfBirth ? (
                      new Date(selectedRecord.patient?.DateOfBirth).toLocaleDateString('vi-VN')
                    ) : (
                      "Chưa có ngày sinh"
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Ngày khám</div>
                  <div className="font-semibold">

                    {selectedRecord.appointment?.StartTime ? (
                      new Date(selectedRecord.appointment.StartTime.replace(' ', 'T')).toLocaleDateString('vi-VN')
                    ) : (
                      "Chưa có ngày khám"
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Trạng thái</div>
                  <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${selectedRecord.appointment?.Status === 'Completed'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                    }`}>
                    {selectedRecord.appointment?.Status === 'Completed' ? 'Đã hoàn thành' : 'Đang xử lý'}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Chẩn đoán</div>
                <div className="p-3 bg-gray-50 rounded-lg">{selectedRecord.Diagnosis}</div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Điều trị</div>
                <div className="p-3 bg-gray-50 rounded-lg">{selectedRecord.Notes}</div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={() => {
                    handlePrintMedicalRecord(selectedRecord);
                    setShowDetailModal(false);
                  }}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
                >
                  In Bệnh Án
                </button>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
