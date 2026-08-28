"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { AxiosError } from "axios";
import * as Api from "@/lib/ApiClient";
import * as Model from "@/lib/model";
import { getFullImageUrl } from "@/lib/utils";
import DataThumbnail from "@/components/thumnail/DataThumbnail";

const SPECIALTIES_PER_PAGE = 10;

interface SpecialtyFormProps {
  specialty: Model.Specialty | null;
  onClose: () => void;
  onSuccess: () => void;
}

const SpecialtyFormModal: React.FC<SpecialtyFormProps> = ({
  specialty,
  onClose,
  onSuccess,
}) => {
  const isEdit = !!specialty;
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    SpecialtyName: specialty?.SpecialtyName || "",
    Description: specialty?.Description || "",
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Logic preview ảnh: Nếu có ảnh cũ -> lấy link từ DB (qua getFullImageUrl), nếu không -> rỗng
  const [previewUrl, setPreviewUrl] = useState<string>(
    specialty?.imageURL
      ? getFullImageUrl(specialty.imageURL)
      : ""
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = new FormData();
      data.append("SpecialtyName", formData.SpecialtyName);
      if (formData.Description)
        data.append("Description", formData.Description);

      if (selectedFile) {
        data.append("imageURL", selectedFile);
      }

      if (isEdit && specialty) {
        await Api.adminUpdateSpecialty(specialty.SpecialtyID, data);
        alert("Cập nhật chuyên khoa thành công!");
      } else {
        await Api.adminCreateSpecialty(data);
        alert("Tạo chuyên khoa mới thành công!");
      }

      onSuccess();
      onClose();
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
    <div className="fixed inset-0 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-lg border border-gray-100">
        <div className="flex justify-between items-center mb-4 border-b pb-2">
          <h2 className="text-2xl font-bold text-gray-800">
            {isEdit ? "Sửa Chuyên khoa" : "Thêm Chuyên khoa mới"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl transition"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Tên Chuyên khoa *
            </label>
            <input
              type="text"
              name="SpecialtyName"
              value={formData.SpecialtyName}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
              placeholder="Ví dụ: Khoa Nội, Khoa Nhi..."
            />
          </div>

          {/* --- Phần Ảnh trong Modal --- */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Ảnh Minh Họa
            </label>
            <div className="flex items-center space-x-4 mt-2">
              <div className="w-16 h-16 relative rounded-full border bg-gray-50 flex-shrink-0 overflow-hidden">
                <Image
                  src={
                    previewUrl ||
                    "https://placehold.co/64x64/E0E0E0/000?text=CK"
                  }
                  alt="Preview"
                  fill
                  sizes="64px"
                  className="object-cover"
                  onError={() =>
                    setPreviewUrl(
                      "https://placehold.co/64x64/E0E0E0/000?text=Err"
                    )
                  }
                  unoptimized={true}
                />
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Mô tả
            </label>
            <textarea
              name="Description"
              value={formData.Description}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
              placeholder="Thông tin chi tiết về chuyên khoa..."
            />
          </div>

          <div className="mt-6 flex justify-end space-x-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-md flex items-center transition disabled:opacity-50"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="mr-2 animate-spin"></span> Đang lưu...
                </>
              ) : (
                <>
                  <span className="mr-2"></span>{" "}
                  {isEdit ? "Cập nhật" : "Thêm mới"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function SpecialtyManagementPage() {
  const [specialties, setSpecialties] = useState<Model.Specialty[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSpecialty, setSelectedSpecialty] =
    useState<Model.Specialty | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      setSpecialties(await Api.getSpecialties());
    } catch (error) {
      console.error("Lỗi tải dữ liệu:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const filteredSpecialties = useMemo(() => {
    if (!searchQuery) return specialties;
    const query = (searchQuery || "").toLowerCase();
    return specialties.filter(
      (s) =>
        (s.SpecialtyName || "").toLowerCase().includes(query) ||
        (s.Description || "").toLowerCase().includes(query)
    );
  }, [specialties, searchQuery]);

  // Tính toán dữ liệu cho trang hiện tại
  const totalPages = Math.ceil(
    filteredSpecialties.length / SPECIALTIES_PER_PAGE
  );

  const currentSpecialties = useMemo(() => {
    const start = (currentPage - 1) * SPECIALTIES_PER_PAGE;
    return filteredSpecialties.slice(start, start + SPECIALTIES_PER_PAGE);
  }, [filteredSpecialties, currentPage]);

  const handleSuccess = () => {
    setIsModalOpen(false);
    loadData();
  };

  const handleOpenModal = (specialty: Model.Specialty | null = null) => {
    setSelectedSpecialty(specialty);
    setIsModalOpen(true);
  };

  const handleDelete = async (specialtyId: number) => {
    if (
      confirm(
        "Bạn có chắc chắn muốn xóa chuyên khoa này? Việc này sẽ ảnh hưởng đến các bác sĩ liên quan."
      )
    ) {
      try {
        await Api.adminDeleteSpecialty(specialtyId);
        setSpecialties((prev) =>
          prev.filter((specialty) => specialty.SpecialtyID !== specialtyId)
        );
        alert("Đã xóa thành công.");
      } catch (error) {
        console.error(error);
        alert("Xóa thất bại. Có thể do ràng buộc dữ liệu (còn Bác sĩ).");
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-8 bg-gray-50 min-h-screen font-sans">
      <h1 className="text-3xl font-bold mb-8 text-gray-800 border-b pb-2 flex items-center gap-2">
        Quản lý Danh mục Chuyên khoa
      </h1>

      {/* Thanh Điều khiển */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-wrap items-center justify-between space-y-3 md:space-y-0 gap-4">
          {/* Tìm kiếm */}
          <div className="relative flex-grow max-w-md">
            <input
              type="text"
              placeholder="Tìm kiếm theo tên chuyên khoa..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></span>
          </div>

          {/* Nút Thêm mới */}
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center space-x-2 px-5 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition duration-150 shadow-md w-full md:w-auto"
          >
            <span></span>
            <span>Thêm Chuyên khoa</span>
          </button>
        </div>
      </div>

      {/* Bảng Danh sách Chuyên khoa */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-4 px-6 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-16">
                  ID
                </th>
                <th className="py-4 px-6 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-20">
                  Ảnh
                </th>
                <th className="py-4 px-6 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-1/4">
                  Tên Chuyên khoa
                </th>
                <th className="py-4 px-6 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-auto">
                  Mô tả
                </th>
                <th className="py-4 px-6 text-right text-xs font-bold text-gray-500 uppercase tracking-wider w-1/6">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : filteredSpecialties.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-500">
                    Không tìm thấy chuyên khoa nào.
                  </td>
                </tr>
              ) : (
                currentSpecialties.map((specialty) => {
                  const specId = specialty.SpecialtyID;
                  const specName = specialty.SpecialtyName;
                  const specDesc = specialty.Description || "";
                  const specImg = specialty.imageURL || "";
                  return (
                    <tr
                      key={specId}
                      className="hover:bg-blue-50 transition duration-150"
                    >
                      <td className="py-4 px-6 text-sm text-gray-500 font-mono">
                        #{specId}
                      </td>

                      <td className="py-4 px-6">
                        <DataThumbnail
                          src={specImg}
                          alt={specName}
                          fallbackType="specialty"
                          className="w-10 h-10 rounded-full"
                        />
                      </td>

                      <td className="py-4 px-6 text-sm text-gray-800 font-bold">
                        {specName}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600">
                        {specDesc}
                      </td>
                      <td className="py-4 px-6 text-right text-sm flex justify-end space-x-3">
                        <button
                          onClick={() => handleOpenModal(specialty)}
                          className="text-blue-600 hover:text-blue-800 font-bold hover:underline"
                          title="Chỉnh sửa"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDelete(specId)}
                          className="text-red-600 hover:text-red-800 font-bold hover:underline"
                          title="Xóa"
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      {!loading && filteredSpecialties.length > 0 && (
        <div className="mt-6 flex justify-end gap-2">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            className="px-3 py-1 border rounded-lg bg-white disabled:opacity-50 hover:bg-gray-100 transition"
          >
            Trước
          </button>
          <span className="px-3 py-1 font-bold text-gray-600 bg-white border rounded-lg flex items-center">
            Trang {currentPage} / {totalPages || 1}
          </span>
          <button
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
            className="px-3 py-1 border rounded-lg bg-white disabled:opacity-50 hover:bg-gray-100 transition"
          >
            Sau
          </button>
        </div>
      )}
      {isModalOpen && (
        <SpecialtyFormModal
          specialty={selectedSpecialty}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
