import { useState } from "react"
import type React from "react"
import type { PatientDetail, MedicalExamFormData } from "@/lib/model"
import { Save, AlertTriangle, Trash2, FileText, Upload } from "lucide-react"

interface MedicalExamFormProps {
  patient: PatientDetail
  onClose: () => void
  onComplete: (formData: MedicalExamFormData) => void
  onCancel?: () => void
}

const MedicalExamForm = ({
  patient,
  onClose,
  onComplete,
  onCancel
}: MedicalExamFormProps) => {
  const [formData, setFormData] = useState<MedicalExamFormData>({
    diagnosis: '',
    clinicalNotes: '',
    notes: '',
    currentSymptoms: patient.symptoms,
    prescriptions: [],
    tests: [''],
    attachments: [],
    vitalSigns: {
      bloodPressure: '',
      heartRate: 80,
      temperature: 36.5,
      respiratoryRate: 16,
      spO2: 98,
      weight: 60,
      height: 165
    }
  })

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // const updateVitalSign = (field: keyof VitalSigns, value: string | number) => {
  //   setFormData(prev => ({
  //     ...prev,
  //     vitalSigns: {
  //       ...prev.vitalSigns,
  //       [field]: value
  //     }
  //   }))
  // }

  // const updatePrescription = (index: number, field: keyof Prescription, value: string) => {
  //   const updated = [...prescriptions]
  //   updated[index] = { ...updated[index], [field]: value }
  //   setPrescriptions(updated)
  // }

  // const addPrescription = () => {
  //   setPrescriptions([...prescriptions, { medicine: '', dosage: '', frequency: '' }])
  // }

  // const removePrescription = (index: number) => {
  //   if (prescriptions.length > 1) {
  //     setPrescriptions(prescriptions.filter((_, i) => i !== index))
  //   }
  // }

  // const addTest = () => {
  //   setFormData(prev => ({
  //     ...prev,
  //     tests: [...prev.tests, '']
  //   }))
  // }

  // const updateTest = (index: number, value: string) => {
  //   const newTests = [...formData.tests]
  //   newTests[index] = value
  //   setFormData(prev => ({ ...prev, tests: newTests }))
  // }

  // const removeTest = (index: number) => {
  //   if (formData.tests.length > 1) {
  //     const newTests = formData.tests.filter((_, i) => i !== index)
  //     setFormData(prev => ({ ...prev, tests: newTests }))
  //   }
  // }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
      const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

      const validFiles = files.filter(file => {
        // Kiểm tra dung lượng
        if (file.size > MAX_FILE_SIZE) {
          alert(`File ${file.name} quá lớn (tối đa 10MB)`);
          return false;
        }
        // Kiểm tra định dạng
        if (!ALLOWED_TYPES.includes(file.type)) {
          alert(`File ${file.name} không đúng định dạng (chỉ nhận Ảnh, PDF, Word)`);
          return false;
        }
        return true;
      });

      setFormData(prev => ({
        ...prev,
        attachments: [...prev.attachments, ...validFiles]
      }));
    }
  };

  const removeFile = (index: number) => {
    const newFiles = formData.attachments.filter((_, i) => i !== index)
    setFormData(prev => ({ ...prev, attachments: newFiles }))
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.diagnosis.trim()) {
      newErrors.diagnosis = 'Vui lòng nhập chẩn đoán'
    }
    if (formData.attachments.length > 5) {
      alert('Bạn chỉ được đính kèm tối đa 5 tệp tin');
      return false;
    }
    if (!formData.currentSymptoms.trim()) {
      newErrors.currentSymptoms = 'Vui lòng nhập triệu chứng hiện tại'
    }

    // // Validate vital signs
    // if (formData.vitalSigns.bloodPressure && !/^\d+\/\d+$/.test(formData.vitalSigns.bloodPressure)) {
    //   newErrors.bloodPressure = 'Huyết áp phải có định dạng 120/80'
    // }

    // if (formData.vitalSigns.heartRate < 40 || formData.vitalSigns.heartRate > 200) {
    //   newErrors.heartRate = 'Mạch phải từ 40-200 lần/phút'
    // }

    // if (formData.vitalSigns.temperature < 35 || formData.vitalSigns.temperature > 42) {
    //   newErrors.temperature = 'Nhiệt độ phải từ 35-42°C'
    // }

    // if (formData.vitalSigns.spO2 < 70 || formData.vitalSigns.spO2 > 100) {
    //   newErrors.spO2 = 'SpO2 phải từ 70-100%'
    // }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleComplete = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await onComplete(formData);

    } catch (error) {
      console.error("❌ Lỗi khi lưu bệnh án:", error);
    } finally {
      setLoading(false);
    }
  };

  // ĐÂY LÀ PHẦN RETURN JSX
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 overflow-y-auto py-4">
      <div className="bg-white rounded-2xl p-6 max-w-4xl w-full mx-4 my-auto max-h-[95vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6 sticky top-0 bg-white pt-2 pb-4 border-b">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              Tạo bệnh án - {patient.name}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              ID: {patient.id} • {patient.age} tuổi • {patient.gender}
              {patient.phone && ` • SĐT: ${patient.phone}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={loading}
          >
            ✕
          </button>
        </div>

        {/* Warning nếu có dị ứng */}
        {patient.allergies && patient.allergies.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <span className="font-semibold text-amber-800">CẢNH BÁO DỊ ỨNG</span>
            </div>
            <p className="text-sm text-amber-700">
              Bệnh nhân có dị ứng với: {patient.allergies.join(', ')}
            </p>
          </div>
        )}

        <div className="space-y-6">
          {/* Dấu hiệu sinh tồn */}
          {/* <div className="border border-gray-200 rounded-lg p-5 bg-gray-50">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Dấu hiệu sinh tồn
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Huyết áp (mmHg)*
                </label>
                <input
                  type="text"
                  placeholder="120/80"
                  value={formData.vitalSigns.bloodPressure}
                  onChange={(e) => updateVitalSign('bloodPressure', e.target.value)}
                  className={`w-full border rounded-lg p-3 text-sm ${errors.bloodPressure ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.bloodPressure && (
                  <p className="text-red-500 text-xs mt-1">{errors.bloodPressure}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mạch (lần/phút)*
                </label>
                <input
                  type="number"
                  placeholder="72"
                  value={formData.vitalSigns.heartRate}
                  onChange={(e) => updateVitalSign('heartRate', parseInt(e.target.value) || 0)}
                  className={`w-full border rounded-lg p-3 text-sm ${errors.heartRate ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.heartRate && (
                  <p className="text-red-500 text-xs mt-1">{errors.heartRate}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nhiệt độ (°C)*
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="36.5"
                  value={formData.vitalSigns.temperature}
                  onChange={(e) => updateVitalSign('temperature', parseFloat(e.target.value) || 0)}
                  className={`w-full border rounded-lg p-3 text-sm ${errors.temperature ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.temperature && (
                  <p className="text-red-500 text-xs mt-1">{errors.temperature}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nhịp thở (lần/phút)
                </label>
                <input
                  type="number"
                  placeholder="16"
                  value={formData.vitalSigns.respiratoryRate}
                  onChange={(e) => updateVitalSign('respiratoryRate', parseInt(e.target.value) || 0)}
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SpO2 (%)*
                </label>
                <input
                  type="number"
                  placeholder="98"
                  value={formData.vitalSigns.spO2}
                  onChange={(e) => updateVitalSign('spO2', parseInt(e.target.value) || 0)}
                  className={`w-full border rounded-lg p-3 text-sm ${errors.spO2 ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.spO2 && (
                  <p className="text-red-500 text-xs mt-1">{errors.spO2}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cân nặng (kg)
                </label>
                <input
                  type="number"
                  placeholder="65"
                  value={formData.vitalSigns.weight}
                  onChange={(e) => updateVitalSign('weight', parseFloat(e.target.value) || 0)}
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chiều cao (cm)
                </label>
                <input
                  type="number"
                  placeholder="170"
                  value={formData.vitalSigns.height}
                  onChange={(e) => updateVitalSign('height', parseFloat(e.target.value) || 0)}
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm"
                />
              </div>
            </div>
          </div> */}

          {/* Triệu chứng hiện tại */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Triệu chứng hiện tại *
            </label>
            <textarea
              value={formData.currentSymptoms}
              onChange={(e) => setFormData({ ...formData, currentSymptoms: e.target.value })}
              className={`w-full border rounded-lg p-4 h-28 ${errors.currentSymptoms ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Mô tả chi tiết triệu chứng hiện tại của bệnh nhân..."
            />
            {errors.currentSymptoms && (
              <p className="text-red-500 text-xs mt-1">{errors.currentSymptoms}</p>
            )}
          </div>

          {/* Chẩn đoán */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chẩn đoán *
            </label>
            <textarea
              value={formData.diagnosis}
              onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
              className={`w-full border rounded-lg p-4 h-28 ${errors.diagnosis ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Nhập chẩn đoán chính xác..."
            />
            {errors.diagnosis && (
              <p className="text-red-500 text-xs mt-1">{errors.diagnosis}</p>
            )}
          </div>

          {/* Ghi chú lâm sàng */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ghi chú lâm sàng / Phác đồ điều trị
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full border border-gray-300 rounded-lg p-4 h-32"
              placeholder="Nhập ghi chú lâm sàng và phác đồ điều trị chi tiết..."
            />
          </div>

          {/* Đơn thuốc */}
          {/* <div className="border border-gray-200 rounded-lg p-5">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-semibold text-gray-900">Đơn thuốc</h4>
              <button
                type="button"
                onClick={addPrescription}
                className="text-blue-600 text-sm font-medium flex items-center gap-1 hover:text-blue-700"
              >
                <Plus className="w-4 h-4" />
                Thêm thuốc
              </button>
            </div>

            <div className="space-y-3">
              {prescriptions.map((prescription, index) => (
                <div key={index} className="grid grid-cols-12 gap-3 items-center">
                  <div className="col-span-5">
                    <input
                      type="text"
                      placeholder="Tên thuốc *"
                      value={prescription.medicine}
                      onChange={(e) => updatePrescription(index, 'medicine', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-3 text-sm"
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="text"
                      placeholder="Liều lượng *"
                      value={prescription.dosage}
                      onChange={(e) => updatePrescription(index, 'dosage', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-3 text-sm"
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="text"
                      placeholder="Cách dùng *"
                      value={prescription.frequency}
                      onChange={(e) => updatePrescription(index, 'frequency', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-3 text-sm"
                    />
                  </div>
                  <div className="col-span-1">
                    <button
                      type="button"
                      onClick={() => removePrescription(index)}
                      className="text-red-500 hover:text-red-700 p-2"
                      disabled={prescriptions.length <= 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-gray-500 mt-3">
              * Chỉ những thuốc có đầy đủ thông tin mới được lưu
            </p>
          </div> */}

          {/* Chỉ định */}
          {/* <div className="border border-gray-200 rounded-lg p-5">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-semibold text-gray-900">Chỉ định cận lâm sàng</h4>
              <button
                onClick={addTest}
                className="text-blue-600 text-sm font-medium flex items-center gap-1 hover:text-blue-700"
              >
                <Plus className="w-4 h-4" />
                Thêm chỉ định
              </button>
            </div>

            <div className="space-y-3">
              {formData.tests.map((test, index) => (
                <div key={index} className="flex gap-3 items-center">
                  <input
                    type="text"
                    value={test}
                    onChange={(e) => updateTest(index, e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg p-3 text-sm"
                    placeholder="Ví dụ: Chụp X-quang ngực, Xét nghiệm máu CBC..."
                  />
                  {formData.tests.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTest(index)}
                      className="text-red-500 hover:text-red-700 p-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div> */}

          {/* Tải lên kết quả */}
          <div className="border border-gray-200 rounded-lg p-5">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-600" />
              Tải lên kết quả xét nghiệm/hình ảnh
            </h4>

            <div className="mb-4">
              <input
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                onChange={handleFileUpload}
                className="w-full border border-gray-300 rounded-lg p-3"
              />
              <p className="text-xs text-gray-500 mt-2">
                Chấp nhận: JPG, PNG, PDF, DOC (tối đa 10MB mỗi file)
              </p>
            </div>

            {formData.attachments.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Files đã chọn:</p>
                {formData.attachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-900">{file.name}</p>
                        <p className="text-xs text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* PHẦN BUTTONS */}
        <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={handleComplete}
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-4 rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Đang lưu...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Lưu bệnh án
              </>
            )}
          </button>

          {/* Nút Hủy khám */}
          {onCancel && (
            <button
              onClick={onCancel}
              disabled={loading}
              className="px-6 bg-red-600 text-white py-4 rounded-lg hover:bg-red-700 font-medium transition-colors disabled:opacity-50"
            >
              Hủy khám
            </button>
          )}

          <button
            onClick={onClose}
            disabled={loading}
            className={`${onCancel ? 'flex-1' : 'px-6'} bg-gray-300 text-gray-700 py-4 rounded-lg hover:bg-gray-400 font-medium transition-colors disabled:opacity-50`}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}

export default MedicalExamForm
