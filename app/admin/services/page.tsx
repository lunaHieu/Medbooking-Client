"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";
import { AxiosError } from "axios";
import * as Api from "@/lib/ApiClient";
import * as Model from "@/lib/model";
import { getFullImageUrl } from "@/lib/utils";
import DataThumbnail from "@/components/thumnail/DataThumbnail";

interface ServiceFormProps {
  service: Model.Service | null;
  specialties: Model.Specialty[];
  onClose: () => void;
  onSuccess: () => void;
}

const ServiceFormModal: React.FC<ServiceFormProps> = ({
  service,
  specialties,
  onClose,
  onSuccess,
}) => {
  const isEdit = !!service;
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    ServiceName: service?.ServiceName || "",
    Description: service?.Description || "",
    EstimatedDuration: (service?.EstimatedDuration || "15").toString(),
    Price: (service?.Price || "0").toString(),
    SpecialtyID: service?.SpecialtyID || specialties[0]?.SpecialtyID || 0,
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Preview ảnh: Ưu tiên ảnh từ DB
  const [previewUrl, setPreviewUrl] = useState<string>(
    service?.imageURL
      ? getFullImageUrl(service.imageURL)
      : ""
  );

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "EstimatedDuration" ||
          name === "Price" ||
          name === "SpecialtyID"
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = new FormData();
      data.append("ServiceName", formData.ServiceName);
      data.append("SpecialtyID", formData.SpecialtyID.toString());
      data.append("Price", formData.Price);
      data.append("EstimatedDuration", formData.EstimatedDuration);

      if (formData.Description)
        data.append("Description", formData.Description);

      if (selectedFile) {
        data.append("imageURL", selectedFile); // Key là 'image'
      }

      if (isEdit && service) {
        await Api.adminUpdateService(service.ServiceID, data);
        alert("Cập nhật dịch vụ thành công!");
      } else {
        await Api.adminCreateService(data);
        alert("Thêm dịch vụ mới thành công!");
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
    <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex justify-center items-center z-50 p-4 bg-black/30">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-100">
        <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50 rounded-t-2xl sticky top-0 z-10">
          <h2 className="text-xl font-bold text-gray-800">
            {isEdit ? "Sửa Dịch vụ" : "Thêm Dịch vụ mới"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-500 text-3xl"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Tên Dịch vụ *
              </label>
              <input
                type="text"
                name="ServiceName"
                value={formData.ServiceName}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="VD: Khám tổng quát"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Chuyên khoa *
              </label>
              <select
                name="SpecialtyID"
                value={formData.SpecialtyID}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                {specialties.map((s) => (
                  <option key={s.SpecialtyID} value={s.SpecialtyID}>
                    {s.SpecialtyName}
                  </option>
                ))}
              </select>
            </div>

            {/* Ảnh trong Modal */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Ảnh minh họa
              </label>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 relative rounded-lg border bg-gray-50 flex-shrink-0 overflow-hidden">
                  <Image
                    src={previewUrl || "https://placehold.co/100x100?text=IMG"}
                    alt="Preview"
                    fill
                    sizes="48px"
                    className="object-cover"
                    onError={() =>
                      setPreviewUrl("https://placehold.co/100x100?text=Err")
                    }
                    unoptimized={true}
                  />
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 cursor-pointer"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Giá (VNĐ) *
              </label>
              <input
                type="number"
                name="Price"
                value={formData.Price}
                onChange={handleChange}
                required
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Thời gian (phút) *
              </label>
              <input
                type="number"
                name="EstimatedDuration"
                value={formData.EstimatedDuration}
                onChange={handleChange}
                required
                min="5"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Mô tả chi tiết
              </label>
              <textarea
                name="Description"
                value={formData.Description}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Thông tin về dịch vụ..."
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-md flex items-center transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="mr-2 animate-spin"></span> Đang lưu...
                </>
              ) : (
                <>
                  <span className="mr-2"></span>{" "}
                  {isEdit ? "Lưu thay đổi" : "Tạo mới"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function ServiceManagementPage() {
  const [services, setServices] = useState<Model.Service[]>([]);
  const [specialties, setSpecialties] = useState<Model.Specialty[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Model.Service | null>(
    null
  );
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Load Data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [servicesData, specialtiesData] = await Promise.all([
        Api.adminGetAllServices(),
        Api.getSpecialties(),
      ]);
      setServices(servicesData);
      setSpecialties(specialtiesData);
    } catch (error) {
      console.error("Lỗi tải dữ liệu:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Map Specialty Name
  const specialtyMap = useMemo(() => {
    return specialties.reduce((map, s) => {
      map.set(s.SpecialtyID, s.SpecialtyName);
      return map;
    }, new Map<number, string>());
  }, [specialties]);

  // Filter
  const filteredServices = useMemo(() => {
    if (!searchQuery) return services;
    const query = (searchQuery || "").toLowerCase();
    return services.filter(
      (s) =>
        s.ServiceName.toLowerCase().includes(query) ||
        (s.Description || "").toLowerCase().includes(query) ||
        (specialtyMap.get(s.SpecialtyID) || "").toLowerCase().includes(query)
    );
  }, [services, searchQuery, specialtyMap]);

  // Pagination
  const totalPages = Math.ceil(filteredServices.length / ITEMS_PER_PAGE);
  const currentServices = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredServices.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredServices, currentPage]);

  const handleSuccess = () => {
    setIsModalOpen(false);
    loadData();
  };

  const handleOpenModal = (service: Model.Service | null = null) => {
    setSelectedService(service);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Bạn có chắc chắn muốn xóa dịch vụ này?")) {
      try {
        await Api.adminDeleteService(id);
        setServices((prev) => prev.filter((service) => service.ServiceID !== id));
        alert("Đã xóa thành công.");
      } catch (error) {
        console.error(error);
        alert("Xóa thất bại.");
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen font-sans">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            Quản lý Dịch vụ & Bảng giá
          </h1>
          <p className="text-gray-500 mt-1 ml-1">
            Danh sách dịch vụ khám chữa bệnh và bảng giá.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal(null)}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 shadow-lg flex items-center font-bold transition"
        >
          <span className="mr-2 text-xl"></span> Thêm Dịch vụ
        </button>
      </div>

      {/*Tìm kiếm*/}
      <div className="bg-white p-5 rounded-2xl shadow-sm mb-6 border border-gray-100">
        <div className="relative max-w-md">
          <input
            type="text"
            placeholder="Tìm theo tên, chuyên khoa..."
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1); // Reset về trang 1 khi tìm kiếm
            }}
          />
          <span className="absolute left-4 top-3.5 text-gray-400 text-lg"></span>
        </div>
      </div>

      {/* Bảng */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
        {loading ? (
          <div className="p-16 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-100 border-t-blue-600 mx-auto mb-4"></div>
            <span className="text-gray-500">Đang tải dữ liệu...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase w-16">
                    Ảnh
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">
                    Tên Dịch vụ
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">
                    Chuyên khoa
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">
                    Giá (VNĐ)
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">
                    Thời gian
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {currentServices.map((service) => {
                  const srvId = service.ServiceID;
                  const srvName = service.ServiceName;
                  const srvImg = service.imageURL || "";
                  const srvPrice = service.Price;
                  const srvDuration = service.EstimatedDuration;
                  return (
                    <tr
                      key={srvId}
                      className="hover:bg-blue-50 transition group"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <DataThumbnail
                          src={srvImg}
                          alt={srvName}
                          fallbackType="service"
                          className="w-10 h-10 rounded-lg"
                        />
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-800">
                        {srvName}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">
                           {specialtyMap.get(service.SpecialtyID) ||
                            "Chưa phân loại"}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-green-600">
                        {srvPrice.toLocaleString("vi-VN")} ₫
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-sm">
                        {srvDuration} phút
                      </td>
                      <td className="px-6 py-4 text-right space-x-3">
                        <button
                          onClick={() => handleOpenModal(service)}
                          className="text-blue-600 font-bold hover:underline"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDelete(srvId)}
                          className="text-red-600 font-bold hover:underline"
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {currentServices.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      Không tìm thấy dịch vụ nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="mt-6 flex justify-end gap-2">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((p) => p - 1)}
          className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-100"
        >
          Trước
        </button>
        <span className="px-3 py-1 font-bold text-gray-600">
          Trang {currentPage} / {totalPages || 1}
        </span>
        <button
          disabled={currentPage >= totalPages}
          onClick={() => setCurrentPage((p) => p + 1)}
          className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-100"
        >
          Sau
        </button>
      </div>

      {isModalOpen && (
        <ServiceFormModal
          service={selectedService}
          specialties={specialties}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
