"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import * as Api from "@/lib/ApiClient";
import * as Model from "@/lib/model";
import { handleError } from "@/lib/utils";

const ITEMS_PER_PAGE = 9;

const getDoctorName = (doctor: Model.Doctor) =>
  doctor.user?.FullName || "Chưa cập nhật";

const getSpecialtyName = (doctor: Model.Doctor) =>
  doctor.specialty?.SpecialtyName || "";

interface NewSlotForm {
  doctor_id: number;
  date: string;
  start_time: string;
  end_time: string;
}

export default function ScheduleManagementPage() {
  const [doctors, setDoctors] = useState<Model.Doctor[]>([]);
  const [slots, setSlots] = useState<Model.AdminScheduleSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newSlot, setNewSlot] = useState<NewSlotForm>({
    doctor_id: 0,
    date: new Date().toISOString().split("T")[0],
    start_time: "08:00",
    end_time: "08:30",
  });

  useEffect(() => {
    const loadDoctors = async () => {
      try {
        setDoctors(await Api.getDoctors());
      } catch (error) {
        console.error("Error loading doctors:", error);
        setDoctors([]);
      }
    };
    loadDoctors();
  }, []);

  const loadSlots = useCallback(async () => {
    if (selectedDoctorId === "all") {
      setSlots([]);
      return;
    }
    setLoading(true);
    try {
      const docId = parseInt(selectedDoctorId);
      setSlots(await Api.getDoctorScheduleAdmin(docId, selectedDate));
    } catch (error) {
      console.error("Lỗi tải lịch:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, selectedDoctorId]);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDate, selectedDoctorId]);

  const filteredSlots = useMemo(() => {
    return slots.filter((slot) => {
      const slotDate = slot.StartTime.split(" ")[0];
      return slotDate === selectedDate;
    });
  }, [slots, selectedDate]);

  const totalPages = Math.ceil(filteredSlots.length / ITEMS_PER_PAGE);
  const currentSlots = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredSlots.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredSlots, currentPage]);

  const handleDeleteSlot = async (slotId: number, status: string) => {
    if (status === "Booked") {
      alert("Không thể xóa lịch đã có người đặt!");
      return;
    }
    if (confirm("Bạn có chắc muốn xóa khung giờ này?")) {
      try {
        await Api.adminDeleteSlot(slotId);
        setSlots((prev) => prev.filter((s) => s.SlotID !== slotId));
        alert("Đã xóa thành công.");
      } catch (error) {
        console.error(error);
        alert("Xóa thất bại.");
      }
    }
  };

  const handleAddSlot = async () => {
    if (isSaving) return; // Chặn click nếu đang gửi
    if (!newSlot.doctor_id) {
      alert("Vui lòng chọn bác sĩ!");
      return;
    }
    setIsSaving(true);
    try {
      const startDateTime = `${newSlot.date} ${newSlot.start_time}:00`;
      const endDateTime = `${newSlot.date} ${newSlot.end_time}:00`;
      await Api.adminCreateSlot(newSlot.doctor_id, startDateTime, endDateTime);
      alert("Đã thêm lịch làm việc mới!");
      setIsModalOpen(false);
      if (selectedDoctorId === newSlot.doctor_id.toString()) {
        loadSlots();
      } else {
        setSelectedDoctorId(newSlot.doctor_id.toString());
        setSelectedDate(newSlot.date);
      }
    } catch (error) {
      handleError(error, "Thêm mới thất bại");
    } finally {
      setIsSaving(false); // Mở khóa nút sau khi xong
    }
  };

  const getDoctorInfo = (id: number) => doctors.find((doctor) => doctor.DoctorID === id);

  const handleOpenModal = () => {
    setIsModalOpen(true);
    if (selectedDoctorId !== "all") {
      setNewSlot((prev) => ({
        ...prev,
        doctor_id: Number(selectedDoctorId),
      }));
    } else {
      setNewSlot((prev) => ({
        ...prev,
        doctor_id: 0,
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
      <section className="max-w-7xl w-full mx-auto bg-white rounded-xl shadow-lg overflow-hidden flex flex-col min-h-[600px]">
        <div className="p-6 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Lịch Trình Bác Sĩ
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Quản lý ca làm việc và thời gian trống.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="date"
              className="border border-gray-300 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
            <select
              className="border border-gray-300 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[200px]"
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
            >
              <option value="all">-- Chọn Bác sĩ để xem --</option>
              {doctors.map((doctor) => {
                const docName = getDoctorName(doctor);
                const specName = getSpecialtyName(doctor);
                return (
                  <option key={doctor.DoctorID} value={doctor.DoctorID}>
                    {docName} {specName ? `(${specName})` : ""}
                  </option>
                );
              })}
            </select>
            <button
              onClick={handleOpenModal}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition shadow-md flex items-center justify-center gap-2"
            >
              <span className="text-xl leading-none">+</span> Tạo Lịch
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 bg-gray-50/50 flex-1 overflow-y-auto flex flex-col justify-between">
          <div>
            {" "}
            {/* Bọc nội dung chính vào 1 div để justify-between hoạt động */}
            {selectedDoctorId === "all" ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <p className="text-lg font-medium">
                  Vui lòng chọn một Bác sĩ để xem lịch trình
                </p>
              </div>
            ) : loading ? (
              <div className="flex justify-center items-center h-64 text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-2"></div>
                Đang tải dữ liệu...
              </div>
            ) : filteredSlots.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <p className="text-lg font-medium">
                  Chưa có lịch làm việc nào trong ngày {selectedDate}
                </p>
                <button
                  onClick={handleOpenModal}
                  className="text-blue-500 text-sm hover:underline mt-2"
                >
                  Tạo lịch ngay
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentSlots.map((slot) => {
                  const doc = getDoctorInfo(slot.DoctorID);
                  const startTime = slot.StartTime
                    .split(" ")[1]
                    ?.slice(0, 5);
                  const endTime = slot.EndTime
                    .split(" ")[1]
                    ?.slice(0, 5);
                  const docName = doc ? getDoctorName(doc) : "N/A";
                  const specName = doc ? getSpecialtyName(doc) : "---";
                  const slotStatus = slot.Status || "Available";
                  return (
                    <div
                      key={slot.SlotID}
                      className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                          {(docName || "D").charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-gray-800 text-sm">
                            {docName}
                          </p>
                          <p className="text-xs text-gray-500">{specName}</p>
                          <div className="mt-1 flex items-center gap-2">
                            <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-xs">
                              {startTime} - {endTime}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {slotStatus === "Available" ? (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                            Trống
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                            Đã đặt
                          </span>
                        )}
                        {slotStatus === "Available" && (
                          <button
                            onClick={() => handleDeleteSlot(slot.SlotID, slotStatus)}
                            className="text-red-400 hover:text-red-600 text-xs font-medium hover:underline"
                          >
                            Xóa
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>{" "}
          {/* Đóng thẻ div bọc nội dung chính */}
          {/* Pagination UI - Nằm cùng cấp với div nội dung chính để được đẩy xuống đáy */}
          {!loading && filteredSlots.length > 0 && (
            <div className="mt-6 flex justify-end gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="px-3 py-1 border rounded-lg bg-white disabled:opacity-50 hover:bg-gray-100 transition shadow-sm text-sm"
              >
                Trước
              </button>
              <span className="px-3 py-1 font-bold text-gray-600 bg-white border rounded-lg flex items-center shadow-sm text-sm">
                Trang {currentPage} / {totalPages || 1}
              </span>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="px-3 py-1 border rounded-lg bg-white disabled:opacity-50 hover:bg-gray-100 transition shadow-sm text-sm"
              >
                Sau
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Modal giữ nguyên không thay đổi */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800 text-lg">
                Tạo Khung Giờ Làm Việc
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-2xl text-gray-400 hover:text-gray-600"
              >
                &times;
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Bác sĩ <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white disabled:bg-gray-100 disabled:text-gray-500"
                  value={newSlot.doctor_id}
                  disabled={selectedDoctorId !== "all"}
                  onChange={(e) =>
                    setNewSlot({
                      ...newSlot,
                      doctor_id: Number(e.target.value),
                    })
                  }
                >
                  <option value={0}>-- Chọn bác sĩ --</option>
                  {doctors.map((doctor) => {
                    const docName = getDoctorName(doctor);
                    const specName = getSpecialtyName(doctor);
                    return (
                      <option key={doctor.DoctorID} value={doctor.DoctorID}>
                        {docName} {specName ? `- ${specName}` : ""}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Ngày làm việc
                </label>
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newSlot.date}
                  onChange={(e) =>
                    setNewSlot({ ...newSlot, date: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Giờ bắt đầu
                  </label>
                  <input
                    type="time"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={newSlot.start_time}
                    onChange={(e) =>
                      setNewSlot({ ...newSlot, start_time: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Giờ kết thúc
                  </label>
                  <input
                    type="time"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={newSlot.end_time}
                    onChange={(e) =>
                      setNewSlot({ ...newSlot, end_time: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-medium transition"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleAddSlot}
                disabled={isSaving}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Đang lưu...
                  </span>
                ) : (
                  <>Lưu Lịch Trình</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
