"use client";

import { useState, useEffect } from "react";
import { CalendarX2, Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import LayoutUsers from "@/components/layoutUsers";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import * as Api from "@/lib/ApiClient";
import * as Model from "@/lib/model";
import DataThumbnail from "@/components/thumnail/DataThumbnail";

export default function LichSuDatLich() {
  const [appointments, setAppointments] = useState<Model.Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Model.Appointment | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const totalPages = Math.ceil(appointments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = appointments.slice(startIndex, endIndex);
  const loadData = async () => {
    setLoading(true);
    try {
      const data = await Api.getMyAppointments();
      console.log("API Response:", data);

      setAppointments(
        data.sort((a, b) => new Date(b.StartTime).getTime() - new Date(a.StartTime).getTime())
      );
    } catch (error) {
      console.error("Lỗi tải lịch sử:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCancelAppointment = async (id: number) => {
    try {
      await Api.cancelAppointment(id);
      alert("Đã hủy lịch hẹn thành công.");
      setAppointments((prev) =>
        prev.map((a) => (a.AppointmentID === id ? { ...a, Status: "Cancelled" } : a))
      );
    } catch {
      alert("Hủy lịch thất bại.");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Confirmed": return <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-sm font-medium">Đã xác nhận</span>;
      case "Pending": return <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-sm font-medium">Đang chờ</span>;
      case "Cancelled": return <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-sm font-medium">Đã hủy</span>;
      case "Completed": return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm font-medium">Hoàn thành</span>;
      case "CheckedIn": return <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm font-medium">Chờ khám</span>;
      default: return <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm">{status}</span>;
    }
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return "---";
    return new Date(dateStr).toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  return (
    <LayoutUsers>
      <div className="p-6">
        <h1 className="text-xl font-semibold text-green-700 mb-2">
          Lịch sử đặt lịch khám bệnh
        </h1>

        {loading ? (
          <div className="text-center py-10">Đang tải dữ liệu...</div>
        ) : appointments.length === 0 ? (
          <div className="bg-white border rounded-lg shadow-sm p-10 flex flex-col items-center justify-center min-h-[250px]">
            <CalendarX2 className="w-12 h-12 text-gray-400 mb-3" />
            <p className="text-gray-500">Bạn chưa có lịch hẹn nào.</p>
          </div>
        ) : (
          <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto min-h-[550px]">
              <table className="w-full border-collapse text-left">
                <thead className="bg-gray-50">
                  <tr className="border-b text-sm text-gray-600 uppercase">
                    <th className="py-3 px-4">Mã Phiếu</th>
                    <th className="py-3 px-4">Chuyên khoa</th>
                    <th className="py-3 px-4">Bác sĩ phụ trách</th>
                    <th className="py-3 px-4">Thời gian khám</th>
                    <th className="py-3 px-4">Trạng thái</th>
                    <th className="py-3 px-4 text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((a) => {
                    const doctorName = a.doctor?.user?.FullName || "Đang xếp lịch...";
                    const specialtyName = a.doctor?.specialty?.SpecialtyName || "---";
                    const avatar = a.doctor?.user?.avatar_url || a.doctor?.imageURL;

                    return (
                      <tr key={a.AppointmentID} className="border-b hover:bg-gray-50 transition text-sm">
                        <td className="py-3 px-4 font-mono text-gray-500">#{a.AppointmentID}</td>
                        <td className="py-3 px-4 font-medium text-blue-600">
                          {specialtyName}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {a.doctor && (
                              <div className="w-8 h-8">
                                <DataThumbnail
                                  src={avatar}
                                  alt={doctorName}
                                  fallbackType="doctor"
                                  className="w-full h-full rounded-full"
                                />
                              </div>
                            )}
                            <span className={a.doctor ? "text-gray-800" : "text-gray-400 italic"}>
                              {doctorName}
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-4">{formatDateTime(a.StartTime)}</td>

                        <td className="py-3 px-4">
                          {getStatusBadge(a.Status)}
                        </td>

                        <td className="py-3 px-4 flex gap-2 justify-center">
                          <Button size="icon" variant="ghost" className="hover:bg-blue-50 text-blue-600" onClick={() => setSelected(a)}>
                            <Eye className="w-4 h-4" />
                          </Button>

                          {(a.Status === "Pending" || a.Status === "Confirmed") && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="icon" variant="ghost" className="hover:bg-red-50 text-red-600">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Hủy lịch hẹn?</AlertDialogTitle>
                                  <AlertDialogDescription>Bạn có chắc chắn muốn hủy không?</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Không</AlertDialogCancel>
                                  <AlertDialogAction className="bg-red-600" onClick={() => handleCancelAppointment(a.AppointmentID)}>
                                    Hủy ngay
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal chi tiết */}
        <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-green-700">Chi tiết lịch hẹn #{selected?.AppointmentID}</DialogTitle>
            </DialogHeader>
            {selected && (
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded">
                  <div>
                    <span className="block text-gray-500 text-xs uppercase">Bác sĩ</span>
                    <span className="font-bold">{selected.doctor?.user?.FullName || "Chưa phân công"}</span>
                  </div>
                  <div>
                    <span className="block text-gray-500 text-xs uppercase">Chuyên khoa</span>
                    <span className="font-bold">{selected.doctor?.specialty?.SpecialtyName || "---"}</span>
                  </div>
                  <div>
                    <span className="block text-gray-500 text-xs uppercase">Ngày giờ</span>
                    <span className="font-bold text-blue-600">{formatDateTime(selected.StartTime)}</span>
                  </div>
                  <div>
                    <span className="block text-gray-500 text-xs uppercase">Trạng thái</span>
                    {getStatusBadge(selected.Status)}
                  </div>
                </div>
                <div>
                  <span className="font-bold block mb-1">Triệu chứng:</span>
                  <p className="bg-gray-50 p-2 rounded border">{selected.InitialSymptoms}</p>
                </div>
                {selected.CancellationReason && (
                  <p className="text-red-600 bg-red-50 p-2 rounded">Lý do hủy: {selected.CancellationReason}</p>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
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
