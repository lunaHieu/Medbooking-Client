import { useState, useEffect } from "react"
import { AlertTriangle } from "lucide-react"
import type { PatientDetail, MedicalRecord } from "@/lib/model"
import { doctorService } from "../../services/doctorService"

interface PatientDetailModalProps {
  patient: PatientDetail
  onClose: () => void
  onStartExam: (patient: PatientDetail) => void
  getPriorityColor: (priority: string) => string
  getPriorityText: (priority: string) => string
}

const PatientDetailModal = ({
  patient,
  onClose,
  onStartExam,
  getPriorityColor,
  getPriorityText
}: PatientDetailModalProps) => {
  const [activeTab, setActiveTab] = useState<'info' | 'history' | 'allergies'>('info')
  const [patientHistory, setPatientHistory] = useState<MedicalRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    const loadPatientHistory = async () => {
      if (!patient.id) return;

      setLoadingHistory(true);
      try {
        console.log('📚 Loading patient history for patient:', patient.id);
        const history = await doctorService.getPatientHistory(patient.id);

        if (history.success && Array.isArray(history.data)) {
          setPatientHistory(history.data);
        } else {
          console.warn('Unexpected history response:', history);
          setPatientHistory([]);
        }
      } catch (error) {
        console.error("Error loading patient history:", error);
        setPatientHistory([]);
      } finally {
        setLoadingHistory(false);
      }
    };

    if (activeTab === 'history' && patient.id) {
      loadPatientHistory();
    }
  }, [activeTab, patient.id]);

  return (
    <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Thông tin bệnh nhân</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
          >
            ✕
          </button>
        </div>

        {/* CẢNH BÁO NGUY CƠ */}
        <div className="mb-4">
          {patient.priority === 'emergency' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse">
                🚨 CẤP CỨU - ƯU TIÊN TỐI CAO
              </span>
            </div>
          )}
          {patient.priority === 'high' && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                ⚠️ ƯU TIÊN CAO
              </span>
            </div>
          )}
        </div>

        {patient.allergies.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span className="font-semibold text-amber-800">DỊ ỨNG</span>
            </div>
            <p className="text-sm text-amber-700 mt-1">{patient.allergies.join(', ')}</p>
          </div>
        )}

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('info')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === 'info'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } transition-colors`}
          >
            Thông tin
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === 'history'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } transition-colors`}
          >
            Lịch sử khám
          </button>
          <button
            onClick={() => setActiveTab('allergies')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === 'allergies'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } transition-colors`}
          >
            Tiền sử & Dị ứng
          </button>
        </div>

        {activeTab === 'info' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Họ tên</label>
                <p className="font-semibold">{patient.name}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Tuổi</label>
                <p className="font-semibold">{patient.age}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Giới tính</label>
                <p className="font-semibold">
                  {patient.gender}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-600">SĐT</label>
                <p className="font-semibold">{patient.phone}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Thời gian hẹn</label>
                <p className="font-semibold">{patient.appointmentTime}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Mức độ ưu tiên</label>
                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(patient.priority)}`}>
                  {getPriorityText(patient.priority)}
                </span>
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-600">Triệu chứng chính</label>
              <p className="font-semibold">{patient.initialSymptoms}</p>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-3">
            {loadingHistory ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Đang tải lịch sử khám...</p>
              </div>
            ) : patientHistory.length > 0 ? (
              patientHistory.map(record => (
                <div key={record.RecordID} className="border rounded-lg p-3 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between">
                    <span className="font-semibold">
                      {record.created_at
                        ? new Date(record.created_at).toLocaleDateString('vi-VN')
                        : 'Không có ngày'}
                    </span>
                    <span className="text-sm text-gray-600">{record.Diagnosis}</span>
                  </div>
                  <p className="text-sm mt-1">{record.Notes || "Không có ghi chú"}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Chưa có lịch sử khám</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'allergies' && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2">Dị ứng</label>
              <div className="flex flex-wrap gap-2">
                {patient.allergies.length > 0 ? (
                  patient.allergies.map((allergy, index) => (
                    <span key={index} className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm">
                      {allergy}
                    </span>
                  ))
                ) : (
                  <p className="text-gray-500">Không có dị ứng nào được ghi nhận</p>
                )}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2">Tiền sử bệnh</label>
              <div className="flex flex-wrap gap-2">
                {patient.medicalHistory.length > 0 ? (
                  patient.medicalHistory.map((history, index) => (
                    <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                      {history}
                    </span>
                  ))
                ) : (
                  <p className="text-gray-500">Không có tiền sử bệnh nào được ghi nhận</p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-6 pt-4 border-t">
          <button
            onClick={() => onStartExam(patient)}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium transition-colors"
          >
            Bắt đầu khám
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400 font-medium transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}

export default PatientDetailModal
