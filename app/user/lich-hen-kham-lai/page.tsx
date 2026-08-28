"use client";
import { useState, useEffect, useMemo } from "react";
import { CalendarPlus, CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import LayoutUsers from "@/components/layoutUsers";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";
import * as Api from "@/lib/ApiClient";
import * as Model from "@/lib/model";
import DataThumbnail from "@/components/thumnail/DataThumbnail";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

export default function LichHenKhamLai() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Model.Appointment[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPatientId, setSelectedPatientId] = useState<number>(0);
  //State lịch tía khám
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOldAppt, setSelectedOldAppt] = useState<Model.Appointment | null>(null);

  // Dữ liệu lịch trống (Slots)
  const [availabilities, setAvailabilities] = useState<Model.AvailabilitySlot[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);

  const [reason, setReason] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const itemsPerPage = 8;
  const totalPages = Math.ceil(appointments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = appointments.slice(startIndex, endIndex);
  //LOAD DỮ LIỆU LỊCH SỬ (Để chọn cái nào cần tái khám)
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await Api.getMyAppointments();
        // Chỉ lấy các lịch ĐÃ HOÀN THÀNH (Completed) để tái khám
        const completed = data
          .filter(a => a.Status === 'Completed')
          .sort((a, b) => new Date(b.StartTime).getTime() - new Date(a.StartTime).getTime());

        setAppointments(completed);
      } catch (error) {
        console.error("Lỗi tải lịch sử:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // XỬ LÝ KHI BẤM "ĐẶT TÁI KHÁM"
  const handleOpenReBook = async (appt: Model.Appointment) => {
    setSelectedOldAppt(appt);
    setIsModalOpen(true);
    // Reset form
    setSelectedDate("");
    setSelectedSlotId(null);
    setAvailabilities([]);
    setReason(`Tái khám theo lịch hẹn #${appt.AppointmentID}`); // Gợi ý lý do
    setSelectedPatientId(appt.PatientID);
    // Tải lịch trống của chính Bác sĩ cũ
    if (appt.DoctorID) {
      try {
        const slots = await Api.getDoctorAvailability(appt.DoctorID);
        const validSlots = slots.filter(s => s.Status === 'Available' && new Date(s.StartTime) > new Date());
        setAvailabilities(validSlots);

        if (validSlots.length > 0) {
          const firstDate = validSlots[0].StartTime.split(" ")[0];
          setSelectedDate(firstDate);
        }
      } catch {
        alert("Không tải được lịch của bác sĩ này.");
      }
    }
  };

  const uniqueDates = useMemo(() => {
    const dates = new Set((availabilities || []).map(slot => slot.StartTime?.split(" ")[0] || ""));
    return Array.from(dates).sort();
  }, [availabilities]);

  const slotsOnDate = useMemo(() => {
    return availabilities.filter(slot => slot.StartTime.startsWith(selectedDate));
  }, [availabilities, selectedDate]);

  // Format ngày hiển thị
  const formatDateLabel = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const day = d.getDate().toString().padStart(2, "0");
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    return `${day}/${month}`;
  };

  //GỬI YÊU CẦU ĐẶT LỊCH
  const handleConfirmBooking = async () => {
    if (!selectedSlotId) return alert("Vui lòng chọn giờ khám!");
    if (!selectedPatientId) {
      return alert("Không tìm thấy thông tin người bệnh để tái khám!");
    }
    setBookingLoading(true);
    try {

      await Api.bookAppointment(
        selectedSlotId,
        selectedPatientId,
        reason,
        undefined, // Không có file
      );

      alert("Đặt lịch tái khám thành công!");
      setIsModalOpen(false);
      router.push("/dat-lich");
    } catch (error) {
      let msg = "Đặt lịch thất bại.";

      // Kiểm tra nếu lỗi là từ Axios (API trả về lỗi 400, 500...)
      if (error instanceof AxiosError && error.response?.data?.message) {
        msg = error.response.data.message;
      }
      else if (error instanceof Error) {
      }
      alert(" " + msg);
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <LayoutUsers>
      <div className="p-6 min-h-screen bg-gray-50">
        <h1 className="text-xl font-bold text-green-700 mb-2 flex items-center gap-2">
          <CalendarCheck className="w-6 h-6" /> Đặt lịch tái khám
        </h1>
        <p className="text-gray-600 mb-6 text-sm">
          Chọn các lần khám trước đây để đặt lịch hẹn lại với cùng bác sĩ và dịch vụ.
        </p>

        {loading ? (
          <div className="text-center py-10 text-gray-500">Đang tải dữ liệu...</div>
        ) : appointments.length === 0 ? (
          <div className="bg-white border rounded-lg shadow-sm p-10 flex flex-col items-center justify-center min-h-[250px]">
            <p className="font-medium mb-1">Chưa có lịch sử khám</p>
            <p className="text-gray-500 text-sm">Bạn chưa hoàn thành buổi khám nào để tái khám.</p>
          </div>
        ) : (
          <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto min-h-[560px]">
              <table className="w-full border-collapse text-left">
                <thead className="bg-gray-50 border-b">
                  <tr className="text-sm text-gray-600 uppercase">
                    <th className="py-3 px-4">Bác sĩ</th>
                    <th className="py-3 px-4">Chuyên khoa / Dịch vụ</th>
                    <th className="py-3 px-4">Ngày khám cũ</th>
                    <th className="py-3 px-4 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {currentItems.map((a) => {
                    const doctorName = a.doctor?.user?.FullName || "---";
                    const avatar = a.doctor?.imageURL || a.doctor?.user?.avatar_url;

                    return (
                      <tr key={a.AppointmentID} className="hover:bg-blue-50 transition">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10">
                              <DataThumbnail
                                src={avatar}
                                alt={doctorName}
                                fallbackType="doctor"
                                className="w-full h-full rounded-full border"
                              />
                            </div>
                            <div>
                              <div className="font-bold text-gray-800 text-sm">{doctorName}</div>
                              <div className="text-xs text-gray-500">BS. Điều trị</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-sm text-blue-700">
                            {a.service?.ServiceName || "Khám dịch vụ"}
                          </div>
                          <div className="text-xs text-gray-500">
                            {a.doctor?.specialty?.SpecialtyName}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700">
                          {new Date(a.StartTime).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold flex items-center gap-1 mx-auto shadow-sm"
                            onClick={() => handleOpenReBook(a)}
                          >
                            <CalendarPlus className="w-4 h-4" /> Tái khám
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/*MODAL CHỌN LỊCH TÁI KHÁM*/}
        {isModalOpen && selectedOldAppt && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
              <div className="bg-green-600 p-4 flex justify-between items-center text-white">
                <h3 className="font-bold text-lg">Đặt lịch tái khám</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-white/80 hover:text-white text-2xl">&times;</button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                <div className="bg-green-50 p-3 rounded-lg border border-green-100 text-sm">
                  <p><span className="font-bold">Bác sĩ:</span> {selectedOldAppt.doctor?.user?.FullName}</p>
                  <p><span className="font-bold">Dịch vụ:</span> {selectedOldAppt.service?.ServiceName}</p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Chọn ngày:</label>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {uniqueDates.length > 0 ? uniqueDates.map(date => (
                      <button
                        key={date}
                        onClick={() => { setSelectedDate(date); setSelectedSlotId(null); }}
                        className={`px-3 py-2 rounded border whitespace-nowrap text-sm font-medium transition
                                            ${selectedDate === date ? 'bg-green-600 text-white border-green-600' : 'bg-white border-gray-200 hover:bg-green-50'}
                                        `}
                      >
                        {formatDateLabel(date)}
                      </button>
                    )) : (
                      <p className="text-sm text-red-500 italic">Bác sĩ chưa có lịch trống gần đây.</p>
                    )}
                  </div>
                </div>

                {selectedDate && (
                  <div className="animate-fade-in">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Chọn giờ:</label>
                    <div className="grid grid-cols-4 gap-2">
                      {slotsOnDate.map(slot => {
                        const timeStr = (slot.StartTime.split(" ")[1] || "").substring(0, 5);
                        return (
                          <button
                            key={slot.SlotID}
                            onClick={() => { setSelectedSlotId(slot.SlotID); }}
                            className={`py-1.5 rounded border text-sm font-semibold transition ${selectedSlotId === slot.SlotID ? "bg-green-600 text-white shadow-md" : "hover:border-green-500 bg-white"
                              }`}
                          >
                            {timeStr}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Ghi chú / Triệu chứng:</label>
                  <Textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="focus-visible:ring-green-600"
                    placeholder="Nhập tình trạng hiện tại..."
                  />
                </div>
              </div>

              <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>Hủy</Button>
                <Button
                  onClick={handleConfirmBooking}
                  disabled={!selectedSlotId || bookingLoading}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold"
                >
                  {bookingLoading ? "Đang xử lý..." : "Xác nhận"}
                </Button>
              </div>
            </div>
          </div>
        )}
        <div className="py-4 border-t bg-gray-50/50 flex justify-center items-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 1) setCurrentPage(prev => prev - 1);
                  }}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                >
                </PaginationPrevious>
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    href="#"
                    isActive={currentPage === page}
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage(page);
                    }}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
                  }}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                >
                </PaginationNext>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
          <div className="text-sm text-gray-600">
            <span className="text-gray-700 px-6 text-sm whitespace-nowrap">
              Trang <span className="text-gray-600">{currentPage}</span>
              <span className="mx-2 text-gray-300">|</span>
              Tổng số <span className="">{totalPages} </span>trang
            </span>
          </div>
        </div>
      </div>
    </LayoutUsers>
  );
}
