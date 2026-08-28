"use client";

import { useCallback, useEffect, useState } from "react";
import { adminUpdatePatient, ApiError } from "@/lib/ApiClient";
import { FaStickyNote } from "react-icons/fa";
import { Search } from "lucide-react";

interface Patient {
  UserID: number;
  FullName: string;
  Username: string;
  Email: string;
  PhoneNumber: string;
  DateOfBirth: string;
  Gender: string;
  Address: string;
}

interface MedicalRecord {
  RecordID: number;
  Diagnosis: string;
  DoctorName: string;
  created_at: string;
  Notes?: string;
}

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000") + "/api";

export default function PatientManagement() {
  //State dữ liệu
  const [patients, setPatients] = useState<Patient[]>([]);
  const [medicalHistory, setMedicalHistory] = useState<MedicalRecord[]>([]);

  //State giao diện
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const fetchPatients = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("api_token");
      const res = await fetch(API_BASE_URL + "/admin/patients", {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",

          "Authorization": `Bearer ${token}`
        },
      });

      if (!res.ok) {
        if (res.status === 401) {
          alert("Bạn cần đăng nhập bằng tài khoản Admin để xem trang này!");
          return;
        }
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      setPatients(data);
    } catch (err) {
      console.error("Lỗi tải dữ liệu:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPatients();
  }, [fetchPatients]);

  //TÌM KIẾM (Search Logic)
  const filteredPatients = patients.filter((p) => {
    const term = searchTerm.toLowerCase();
    const name = p.FullName ? p.FullName.toLowerCase() : "";
    const email = p.Email ? p.Email.toLowerCase() : "";
    const phone = p.PhoneNumber ? p.PhoneNumber.toLowerCase() : "";

    return name.includes(term) || email.includes(term) || phone.includes(term);
  });

  //XEM CHI TIẾT & LỊCH SỬ
  const viewPatient = async (patient: Patient) => {
    setSelectedPatient(patient);
    setShowDetailModal(true);
    setMedicalHistory([]);

    try {
      const token = localStorage.getItem("api_token");
      const res = await fetch(
        `${API_BASE_URL}/admin/patients/${patient.UserID}/history`,
        {
          method: "GET",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",

            "Authorization": `Bearer ${token}`
          },
        }
      );
      if (res.ok) {
        const data = await res.json();
        setMedicalHistory(data);
      }
    } catch (error) {
      console.error("Lỗi tải lịch sử khám:", error);
    }
  };
  //THÊM BỆNH NHÂN MỚI
  const handleAddPatient = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const token = localStorage.getItem("api_token");

    const lastName = formData.get("LastName") as string;
    const firstName = formData.get("FirstName") as string;
    const fullName = `${lastName} ${firstName}`.trim();

    // Tạo object dữ liệu để gửi JSON
    const payload = {
      Username: formData.get("Username"),
      password: formData.get("Password"),

      FullName: fullName,
      Email: formData.get("Email"),
      PhoneNumber: formData.get("PhoneNumber"),
      DateOfBirth: formData.get("DateOfBirth"),
      Gender: formData.get("Gender"),
      Address: formData.get("Address"),
    };

    try {
      const res = await fetch(`${API_BASE_URL}/admin/patients`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(payload),
      });

      //Đọc lỗi chi tiết từ Server
      if (!res.ok) {
        const errorData = await res.json();

        // Nếu Server trả về danh sách lỗi validation (Laravel chuẩn)
        if (errorData.errors) {
          const messages = Object.values(errorData.errors).flat().join("\n");
          throw new Error(messages);
        }

        throw new Error(errorData.message || "Lỗi thêm mới");
      }

      alert("Thêm bệnh nhân thành công!");
      setShowAddModal(false);
      fetchPatients(); // Tải lại danh sách
    } catch (error) {
      // Hiển thị thông báo lỗi cụ thể
      const err = error as ApiError;
      const msg = err.response?.data?.message || err.message || "Lỗi không xác định"
      alert(`Lỗi" \n${msg}`);
    }
  };

  //CẬP NHẬT THÔNG TIN (Dùng ApiClient)
  const handleUpdatePatient = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    if (!selectedPatient) return;

    const formData = new FormData(event.currentTarget);
    // Tạo payload JSON
    const payload = {
      Username: selectedPatient.Username,
      FullName: (formData.get("FullName") as string) || "",
      Email: (formData.get("Email") as string) || "",
      PhoneNumber: (formData.get("PhoneNumber") as string) || "",
      DateOfBirth: (formData.get("DateOfBirth") as string) || "",
      Gender: (formData.get("Gender") as string) || "",
      Address: (formData.get("Address") as string) || "",
    };

    try {
      await adminUpdatePatient(selectedPatient.UserID, payload);

      alert("Cập nhật thông tin thành công!");
      setShowDetailModal(false);
      fetchPatients(); // Tải lại danh sách
    } catch (error) {
      const err = error as ApiError;
      const message = err.response?.data?.message || err.message || "Lỗi không xác định";
      alert(`Lỗi cập nhật: ${message}`);
    }
  };

  // Helper: Format ngày cho input type="date"
  const formatDateForInput = (dateString: string | undefined) => {
    if (!dateString) return "";
    return dateString.split("T")[0];
  };

  return (
    <div className="space-y-6 p-4">
      {/* --- Header --- */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Quản lý bệnh nhân
          </h1>
          <p className="text-sm text-gray-500">
            Tra cứu, thêm mới và quản lý hồ sơ bệnh nhân
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition font-medium flex items-center gap-2"
        >
          <span>+</span> Thêm bệnh nhân
        </button>
      </div>

      {/* --- Tìm kiếm --- */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, email, số điện thoại..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
          />
        </div>
      </div>

      {/* --- Danh sách bảng --- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            Đang tải dữ liệu...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Họ tên
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Liên hệ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Giới tính
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPatients.length > 0 ? (
                  filteredPatients.map((p, index) => (
                    // Thêm index làm key dự phòng để tránh lỗi React Warning
                    <tr
                      key={p.UserID || index}
                      className="hover:bg-blue-50 transition"
                    >
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                        {p.FullName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <div className="flex flex-col">
                          <span>{p.PhoneNumber}</span>
                          <span className="text-xs text-gray-400">
                            {p.Email}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${p.Gender === "Nam"
                            ? "bg-blue-100 text-blue-800"
                            : p.Gender === "Nữ"
                              ? "bg-pink-100 text-pink-800"
                              : "bg-gray-100 text-gray-800"
                            }`}
                        >
                          {p.Gender}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => viewPatient(p)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md"
                        >
                          Chi tiết
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      Không tìm thấy bệnh nhân nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL THÊM BỆNH NHÂN */}
      {showAddModal && (
        <div className="fixed inset-0 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">
                Thêm Bệnh Nhân Mới
              </h2>
            </div>

            <form onSubmit={handleAddPatient} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tài khoản & Mật khẩu */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên đăng nhập
                  </label>
                  <input
                    name="Username"
                    required
                    className="w-full border rounded-lg p-2"
                    placeholder="VD: nguyenva"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mật khẩu
                  </label>
                  <input
                    name="Password"
                    type="password"
                    required
                    className="w-full border rounded-lg p-2"
                    placeholder="******"
                  />
                </div>

                {/* Họ tên tách rời */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Họ đệm
                  </label>
                  <input
                    name="LastName"
                    required
                    className="w-full border rounded-lg p-2"
                    placeholder="VD: Nguyễn Văn"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên
                  </label>
                  <input
                    name="FirstName"
                    required
                    className="w-full border rounded-lg p-2"
                    placeholder="VD: A"
                  />
                </div>

                {/* Liên hệ */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    name="Email"
                    type="email"
                    required
                    className="w-full border rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số điện thoại
                  </label>
                  <input
                    name="PhoneNumber"
                    required
                    className="w-full border rounded-lg p-2"
                  />
                </div>

                {/* Thông tin cá nhân */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày sinh
                  </label>
                  <input
                    name="DateOfBirth"
                    type="date"
                    required
                    className="w-full border rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Giới tính
                  </label>
                  <select
                    name="Gender"
                    className="w-full border rounded-lg p-2"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Địa chỉ
                </label>
                <textarea
                  name="Address"
                  rows={2}
                  className="w-full border rounded-lg p-2"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Lưu hồ sơ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CHI TIẾT & SỬA */}
      {showDetailModal && selectedPatient && (
        <div className="fixed inset-0 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
              <h2 className="text-xl font-bold text-gray-800">
                Hồ sơ bệnh nhân
              </h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                &times;
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Cột trái: Form sửa thông tin */}
                <div className="lg:col-span-2 space-y-4">
                  <h3 className="font-semibold text-blue-800 border-b pb-2 mb-4">
                    Thông tin cá nhân
                  </h3>
                  <form onSubmit={handleUpdatePatient} className="space-y-3">
                    {/* Username - Readonly */}
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase">
                        Tài khoản (Không thể sửa)
                      </label>
                      <input
                        value={selectedPatient.Username}
                        disabled
                        className="w-full bg-gray-100 border border-gray-300 text-gray-500 rounded p-2 mt-1 cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Họ và Tên
                      </label>
                      <input
                        name="FullName"
                        defaultValue={selectedPatient.FullName}
                        className="w-full border rounded p-2"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Email
                        </label>
                        <input
                          name="Email"
                          defaultValue={selectedPatient.Email}
                          className="w-full border rounded p-2"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          SĐT
                        </label>
                        <input
                          name="PhoneNumber"
                          defaultValue={selectedPatient.PhoneNumber}
                          className="w-full border rounded p-2"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Ngày sinh
                        </label>
                        <input
                          name="DateOfBirth"
                          type="date"
                          defaultValue={formatDateForInput(
                            selectedPatient.DateOfBirth
                          )}
                          className="w-full border rounded p-2"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Giới tính
                        </label>
                        <select
                          name="Gender"
                          defaultValue={selectedPatient.Gender}
                          className="w-full border rounded p-2"
                        >
                          <option value="Nam">Nam</option>
                          <option value="Nữ">Nữ</option>
                          <option value="Khác">Khác</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Địa chỉ
                      </label>
                      <textarea
                        name="Address"
                        defaultValue={selectedPatient.Address}
                        rows={2}
                        className="w-full border rounded p-2"
                      ></textarea>
                    </div>

                    <div className="text-right pt-2">
                      <button
                        type="submit"
                        className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 shadow-sm"
                      >
                        Cập nhật thông tin
                      </button>
                    </div>
                  </form>
                </div>

                {/* Cột phải: Lịch sử khám */}
                <div className="lg:col-span-1 bg-gray-50 p-4 rounded-lg h-fit">
                  <h3 className="font-semibold text-blue-800 border-b pb-2 mb-4">
                    Lịch sử khám bệnh
                  </h3>
                  <div className="max-h-[400px] overflow-y-auto space-y-3">
                    {medicalHistory.length === 0 ? (
                      <p className="text-sm text-gray-500 italic text-center">
                        Chưa có lịch sử khám.
                      </p>
                    ) : (
                      medicalHistory.map((r, index) => (
                        // Thêm index làm key dự phòng
                        <div
                          key={r.RecordID || index}
                          className="bg-white p-3 rounded shadow-sm border border-gray-100"
                        >
                          <p className="font-bold text-gray-800 text-sm">
                            {r.Diagnosis}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDateForInput(r.created_at)}
                          </p>
                          <p className="text-xs text-gray-500">
                            BS: {r.DoctorName}
                          </p>
                          {r.Notes && (
                            <p className="text-xs text-gray-600 mt-2 bg-gray-100 p-2 rounded">
                              <FaStickyNote className="mt-0.5 text-gray-500 shrink-0" />
                              <span>{r.Notes}</span>
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
