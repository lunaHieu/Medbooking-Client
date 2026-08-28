"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { AxiosError } from "axios";
import * as Api from "@/lib/ApiClient";
import * as Model from "@/lib/model";
import { getFullImageUrl } from "@/lib/utils";
import DataThumbnail from "@/components/thumnail/DataThumbnail";
import { Plus, Search } from "lucide-react";

const normalizeStatus = (status: string) => {
  const s = (status || "").toLowerCase();
  if (s === "active" || s === "hoatdong" || s === "hoat_dong") return "HoatDong";
  if (s === "blocked" || s === "khoa" || s === "inactive") return "Khoa";
  return "HoatDong";
};

interface DoctorFormProps {
  doctor: Model.Doctor | null;
  specialties: Model.Specialty[];
  onClose: () => void;
  onSuccess: () => void;
}

const DoctorFormModal: React.FC<DoctorFormProps> = ({
  doctor,
  specialties,
  onClose,
  onSuccess,
}) => {
  const isEdit = !!doctor;
  const [loading, setLoading] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // Map dữ liệu API vào Form
  const [formData, setFormData] = useState({
    FullName: "",
    Email: "",
    Username: "",
    Password: "",
    PhoneNumber: "",
    SpecialtyID: specialties[0]?.SpecialtyID || 0,
    Degree: "",
    YearsOfExperience: 1,
    ProfileDescription: "",
    Status: "HoatDong",
  });

  // State xử lý file ảnh
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Logic preview ảnh: Ưu tiên ảnh từ DB (qua getFullImageUrl)
  const initialImage = doctor?.imageURL || doctor?.user?.avatar_url;
  const [previewUrl, setPreviewUrl] = useState<string>(
    initialImage ? getFullImageUrl(initialImage) : ""
  );
  useEffect(() => {
    if (doctor) {
      const user = doctor.user;
      setFormData({
        FullName: user.FullName,
        Email: user.Email || "",
        Username: user.Username,
        Password: "",
        PhoneNumber: user.PhoneNumber,
        SpecialtyID: doctor.SpecialtyID || doctor.specialty?.SpecialtyID || specialties[0]?.SpecialtyID || 0,
        Degree: doctor.Degree || "",
        YearsOfExperience: doctor.YearsOfExperience || 1,
        ProfileDescription: doctor.ProfileDescription || "",
        Status: normalizeStatus(user.Status),
      });

      // Cập nhật ảnh preview theo bác sĩ đang chọn
      const img = doctor.imageURL || doctor.user?.avatar_url;
      setPreviewUrl(img ? getFullImageUrl(img) : "");
    } else {
      setFormData({
        FullName: "",
        Email: "",
        Username: "",
        Password: "",
        PhoneNumber: "",
        SpecialtyID: specialties[0]?.SpecialtyID || 0,
        Degree: "",
        YearsOfExperience: 1,
        ProfileDescription: "",
        Status: "HoatDong",
      });
      setPreviewUrl("");
      setSelectedFile(null);
    }
  }, [doctor, specialties]);
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "SpecialtyID" || name === "YearsOfExperience"
          ? Number(value)
          : value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file)); // Preview ảnh local
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreviewUrl("");
    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validate password khi tạo mới
    if (!isEdit && !formData.Password) {
      alert("Vui lòng nhập mật khẩu khi tạo tài khoản mới.");
      setLoading(false);
      return;
    }

    try {
      const data = new FormData();
      data.append("FullName", formData.FullName);
      data.append("Username", formData.Username);

      data.append("Email", formData.Email);

      data.append("PhoneNumber", formData.PhoneNumber);
      data.append("SpecialtyID", formData.SpecialtyID.toString());
      data.append("Degree", formData.Degree);
      data.append("YearsOfExperience", formData.YearsOfExperience.toString());
      data.append("Status", formData.Status);

      if (formData.ProfileDescription)
        data.append("ProfileDescription", formData.ProfileDescription);

      if (formData.Password) {
        data.append("password", formData.Password);
      }

      //Gửi file vào key 'image'
      if (selectedFile) {
        data.append("imageURL", selectedFile);
      }

      if (isEdit && doctor) {
        await Api.adminUpdateDoctor(doctor.DoctorID, data);
        alert("Cập nhật thành công!");
      } else {
        await Api.adminCreateDoctor(data);
        alert("Tạo hồ sơ thành công!");
      }
      onSuccess();
    } catch (error) {
      if (error instanceof AxiosError) {
        console.error("Error:", error);
        const msg = error.response?.data?.message || "Có lỗi xảy ra!";
        alert("" + msg);
      } else {
        console.error("Unexpected Error:", error);
        alert("Có lỗi không xác định xảy ra!");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-transparent flex justify-center items-center z-50 p-4 bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-3xl my-8 overflow-y-auto max-h-[90vh] border border-gray-100">
        <div className="flex justify-between items-center mb-4 border-b pb-2">
          <h2 className="text-2xl font-semibold text-gray-800">
            {isEdit ? "Sửa hồ sơ Bác sĩ" : "Thêm Bác sĩ mới"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* THÔNG TIN CHUNG */}
            <h3 className="col-span-full text-lg font-bold mt-2 border-b pb-1">
              Thông tin Tài khoản & Cơ bản
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Họ và Tên
              </label>
              <input
                type="text"
                name="FullName"
                value={formData.FullName}
                onChange={handleChange}
                required
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Chuyên khoa
              </label>
              <select
                name="SpecialtyID"
                value={formData.SpecialtyID}
                onChange={handleChange}
                required
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value={0}>-- Chọn chuyên khoa --</option>
                {specialties.map((s) => (
                  <option key={s.SpecialtyID} value={s.SpecialtyID}>
                    {s.SpecialtyName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                name="Email"
                value={formData.Email}
                onChange={handleChange}
                required
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Tài khoản đăng nhập
              </label>
              <input
                type="text"
                name="Username"
                value={formData.Username}
                onChange={handleChange}
                required
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Số điện thoại
              </label>
              <input
                type="tel"
                name="PhoneNumber"
                value={formData.PhoneNumber}
                onChange={handleChange}
                required
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Mật khẩu */}
            <div>
              {(isResettingPassword || !isEdit) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {!isEdit ? "Mật khẩu" : "Mật khẩu mới"}
                  </label>
                  <input
                    type="password"
                    name="Password"
                    value={formData.Password}
                    onChange={handleChange}
                    required={!isEdit}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-blue-50"
                  />
                </div>
              )}
              {isEdit && !isResettingPassword && (
                <button
                  type="button"
                  onClick={() => setIsResettingPassword(true)}
                  className="text-sm text-blue-600 hover:underline mt-4 font-medium"
                >
                  Đổi mật khẩu
                </button>
              )}
            </div>

            {/* THÔNG TIN CHUYÊN MÔN */}
            <h3 className="col-span-full text-lg font-bold mt-4 border-b pb-1">
              Thông tin Chuyên môn & Hình ảnh
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Bằng cấp
              </label>
              <input
                type="text"
                name="Degree"
                value={formData.Degree}
                onChange={handleChange}
                required
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Năm kinh nghiệm
              </label>
              <input
                type="number"
                name="YearsOfExperience"
                value={formData.YearsOfExperience}
                onChange={handleChange}
                required
                min="1"
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ảnh đại diện
              </label>
              <div className="flex items-center space-x-3 p-2 border border-rounded rounded-lg bg-gray-50">
                <div className="w-16 h-16 relative rounded-full border bg-white overflow-hidden flex-shrink-0">
                  {/* Preview Modal */}
                  <Image
                    src={previewUrl || "https://placehold.co/100x100?text=Dr"}
                    alt="Avatar Preview"
                    fill
                    sizes="64px"
                    className="object-cover"
                    onError={() =>
                      setPreviewUrl("https://placehold.co/100x100?text=Err")
                    }
                    unoptimized={true}
                  />
                </div>
                <div className="flex flex-col w-full">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                  />
                  {previewUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="text-xs text-red-500 hover:text-red-700 font-semibold text-left mt-1 w-fit"
                    >
                      Xóa ảnh
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Mô tả hồ sơ (ProfileDescription)
              </label>
              <textarea
                name="ProfileDescription"
                value={formData.ProfileDescription}
                onChange={handleChange}
                rows={3}
                required
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {isEdit && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Trạng thái
                </label>
                <select
                  name="Status"
                  value={formData.Status}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="HoatDong">Hoạt động</option>
                  <option value="Khoa">Khóa / Nghỉ việc</option>
                </select>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-400 flex items-center"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="mr-2 animate-spin"></span> Đang lưu...
                </>
              ) : (
                <>
                  <span className="mr-2"></span>{" "}
                  {isEdit ? "Cập nhật" : "Tạo hồ sơ"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

//MAIN COMPONENT
export default function DoctorManagementPage() {
  const [doctors, setDoctors] = useState<Model.Doctor[]>([]);
  const [specialties, setSpecialties] = useState<Model.Specialty[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterSpecialty, setFilterSpecialty] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Model.Doctor | null>(
    null
  );
  const ITEMS_PER_PAGE = 10;

  const loadData = async () => {
    setLoading(true);
    try {
      const [docsData, specsData] = await Promise.all([
        Api.getDoctors(),
        Api.getSpecialties(),
      ]);
      setDoctors(docsData);
      setSpecialties(specsData);
    } catch (error) {
      console.error("Error:", error);
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id: number) => {
    if (window.confirm("Bạn có chắc chắn muốn VÔ HIỆU HÓA bác sĩ này?")) {
      try {
        await Api.adminDeleteDoctor(id);
        setDoctors((prev) => prev.filter((doctor) => doctor.DoctorID !== id));
        alert("Đã xóa thành công.");
      } catch (error) {
        console.log(error);
        alert("Xóa thất bại.");
      }
    }
  };

  const handleOpenModal = (doctor: Model.Doctor | null = null) => {
    setSelectedDoctor(doctor);
    setIsModalOpen(true);
  };

  const handleModalSuccess = () => {
    setIsModalOpen(false);
    loadData();
  };

  const filteredDoctors = useMemo(() => {
    if (!Array.isArray(doctors)) return [];
    return doctors.filter((doc) => {
      const name = (doc.user?.FullName || "").toLowerCase();
      const email = (doc.user?.Email || "").toLowerCase();
      const query = (searchQuery || "").toLowerCase();

      const matchesSearch = name.includes(query) || email.includes(query);
      const matchesSpec =
        filterSpecialty === "ALL" ||
        doc.SpecialtyID === Number(filterSpecialty);

      return matchesSearch && matchesSpec;
    });
  }, [doctors, searchQuery, filterSpecialty]);

  const totalPages = Math.ceil(filteredDoctors.length / ITEMS_PER_PAGE);
  const currentDoctors = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredDoctors.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredDoctors, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterSpecialty]);

  return (
    <div className="max-w-7xl mx-auto p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-gray-800 border-b pb-2">
        Quản lý Hồ sơ Bác sĩ
      </h1>

      {/* Thanh Điều khiển */}
      <div className="bg-white p-4 rounded-xl shadow-md mb-6">
        <div className="flex flex-wrap items-center justify-between space-y-3 md:space-y-0">
          <div className="flex space-x-3 items-center w-full md:w-auto">
            <div className="relative flex-grow">
              <div className="absolute left-0 inset-y-0 pl-4 flex items-center ">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Tìm kiếm theo tên, email, chuyên khoa..."
                className="p-2 pl-10 border border-gray-300 rounded-lg w-full md:w-72 focus:ring-blue-500 focus:border-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></span>
            </div>

            <div className="relative">
              <select
                value={filterSpecialty}
                onChange={(e) => setFilterSpecialty(e.target.value)}
                className="p-2 border border-gray-300 rounded-lg appearance-none bg-white pr-8 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
              >
                <option value="ALL">Tất cả Chuyên khoa</option>
                {specialties.map((s) => (
                  <option key={s.SpecialtyID} value={s.SpecialtyID}>
                    {s.SpecialtyName}
                  </option>
                ))}
              </select>
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"></span>
            </div>
          </div>

          <button
            onClick={() => handleOpenModal()}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-md w-full md:w-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Bác sĩ Mới</span>
          </button>
        </div>
      </div>

      {/* Bảng Danh sách Bác sĩ */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-16">
                  Ảnh
                </th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Họ và Tên
                </th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Chuyên khoa
                </th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Bằng cấp/KN
                </th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Liên hệ
                </th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="py-3 px-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentDoctors.map((doctor) => {
                const fullName = doctor.user?.FullName || "Chưa cập nhật";
                const email = doctor.user?.Email || "N/A";
                const phone = doctor.user?.PhoneNumber || "N/A";
                const status = normalizeStatus(doctor.user?.Status || "HoatDong");
                const avatar = doctor.imageURL || doctor.user?.avatar_url;
                const specName = specialties.find((specialty) => specialty.SpecialtyID === doctor.SpecialtyID)
                  ?.SpecialtyName || doctor.specialty?.SpecialtyName || "---";

                return (
                  <tr
                    key={doctor.DoctorID}
                    className="hover:bg-gray-50 transition"
                  >
                    <td className="py-3 px-4 text-sm text-gray-700">
                      <DataThumbnail
                        src={avatar}
                        alt={fullName}
                        fallbackType="doctor"
                        className="w-10 h-10 rounded-full border"
                      />
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700 font-bold">
                      {fullName}
                    </td>
                    <td className="py-3 px-4 text-sm font-semibold text-blue-600">
                      {specName}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700">
                       {doctor.Degree}
                      <br />
                      <span className="text-xs text-gray-500">
                         {doctor.YearsOfExperience} năm
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700">
                      {email}
                      <br />
                      <span className="text-xs text-gray-500">{phone}</span>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded ${
                          status === "HoatDong"
                            ? "bg-green-100 text-green-700"
                            : "bg-orange-100 text-orange-700"
                        }`}
                      >
                        {status === "HoatDong" ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-sm space-x-2">
                      <button
                         onClick={() => handleOpenModal(doctor)}
                        className="text-blue-600 hover:text-blue-800 font-bold hover:underline"
                      >
                        Sửa
                      </button>
                      <button
                         onClick={() => handleDelete(doctor.DoctorID)}
                        className="text-red-600 hover:text-red-800 font-bold hover:underline"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                );
              })}
              {currentDoctors.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    {loading
                      ? "Đang tải dữ liệu..."
                      : "Không tìm thấy bác sĩ nào khớp với tiêu chí tìm kiếm/lọc."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Phân Trang */}
      <div className="mt-6 flex justify-between items-center">
        <span className="text-sm text-gray-700">
          Hiển thị {currentDoctors.length} trên tổng số {filteredDoctors.length}{" "}
          bác sĩ
        </span>
        <div className="flex space-x-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 text-sm font-medium border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-100"
          >
            Trước
          </button>
          <span className="px-3 py-1 text-sm font-medium text-blue-600">
            Trang {currentPage} / {totalPages || 1}
          </span>
          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(totalPages, prev + 1))
            }
            disabled={currentPage === totalPages || totalPages === 0}
            className="px-3 py-1 text-sm font-medium border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-100"
          >
            Sau
          </button>
        </div>
      </div>

      {isModalOpen && (
        <DoctorFormModal
          doctor={selectedDoctor}
          specialties={specialties}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
}
