"use client";

import React, { useState, useEffect } from "react";
import {
  Bell,
  CalendarClock,
  AlertTriangle,
  Loader2,
  Check,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import LayoutUsers from "@/components/layoutUsers";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import * as Api from "@/lib/ApiClient";

interface NotificationUI {
  id: number;
  title: string;
  message: string;
  date: string;
  type: "LichHen" | "HeThong";
  read: boolean;
}

export default function ThongBao() {
  const [notifications, setNotifications] = useState<NotificationUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<NotificationUI | null>(null);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const mapType = (backendType: string): "LichHen" | "HeThong" => {
    if (backendType === "AppointmentReminder") return "LichHen";

    return "HeThong";
  };

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const data = await Api.getMyNotifications();

        const mapped: NotificationUI[] = data.map((item) => ({
          id: item.NotificationID,
          title: item.Title || "Thông báo",
          message: item.Content,
          date: new Date(item.created_at).toLocaleString("vi-VN", {
            day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
          }),
          read: item.Status === "Read",
          type: mapType(item.NotificationType),
        }));

        setNotifications(mapped);
      } catch (error) {
        console.error("Lỗi tải thông báo:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  //Xử lý đọc tin
  const handleMarkAsRead = async (noti: NotificationUI) => {
    setSelected(noti);
    if (noti.read) return;

    try {
      await Api.markNotificationAsRead(noti.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === noti.id ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error(error);
    }
  };

  // Icon theo loại
  const getIcon = (type: NotificationUI["type"]) => {
    if (type === "LichHen") {
      return <CalendarClock className="text-blue-600 w-6 h-6" />;
    }
    return <AlertTriangle className="text-orange-600 w-6 h-6" />;
  };

  const getStyle = (type: NotificationUI["type"]) => {
    if (type === "LichHen") {
      return "bg-blue-50 border-blue-200 hover:bg-blue-100";
    }
    return "bg-orange-50 border-orange-200 hover:bg-orange-100";
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread") return !n.read;
    return true;
  });

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!confirm("Bạn có chắc chắn muốn xóa thông báo này không?")) return;
    try {
      await Api.deleteMyNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (error) {
      console.error("Lỗi khi xóa:", error);
      alert("Không thể xóa thông báo lúc này.");
    }
  }
  const handleDeleteAllRead = async () => {
    // Kiểm tra xem có thông báo nào đã đọc không
    const hasRead = notifications.some(n => n.read);
    if (!hasRead) return;

    if (!confirm("Bạn có chắc chắn muốn xóa tất cả thông báo đã đọc không?")) return;

    try {
      await Api.deleteAllReadNotifications();
      setNotifications(prev => prev.filter(n => !n.read));
      alert("Đã xóa sạch các thông báo đã đọc.");
    } catch (error) {
      console.error("Lỗi xóa:", error);
      alert("Không thể thực hiện thao tác xóa lúc này.");
    }
  };
  return (
    <LayoutUsers>
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-green-700 mb-2 flex items-center gap-2">
          <Bell className="w-6 h-6" />
          Thông báo của bạn
        </h1>
        <p className="text-gray-500 mb-6">
          Xem lại lịch nhắc hẹn khám và các thông báo bảo trì từ hệ thống.
        </p>
        <div className="flex gap-2 mb-4 border-b pb-1">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${filter === "all"
                ? "border-green-600 text-green-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${filter === "unread"
                ? "border-green-600 text-green-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
            >
              Chưa đọc
            </button>
          </div>

          {notifications.some((n) => n.read) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeleteAllRead}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 flex items-center gap-1 transition-all"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Xóa tất cả đã đọc</span>
            </Button>
          )}
        </div>
        {/* Danh sách */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin mb-2 text-green-600" />
            <p>Đang tải dữ liệu...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed">
            <Bell className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 font-medium">Bạn không có thông báo nào</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {filteredNotifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleMarkAsRead(n)}
                  className={`flex items-start gap-4 p-4 border rounded-xl cursor-pointer transition-all ${getStyle(
                    n.type
                  )} ${n.read ? "opacity-70 grayscale-[0.3]" : "opacity-100 shadow-sm"}`}
                >
                  <div className="p-2 bg-white rounded-full shadow-sm shrink-0">
                    {getIcon(n.type)}
                  </div>

                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className={`font-bold text-base ${n.type === 'LichHen' ? 'text-blue-800' : 'text-orange-800'}`}>
                        {n.title}
                      </h3>
                      {!n.read && (
                        <span className="shrink-0 w-2.5 h-2.5 bg-red-500 rounded-full mt-1.5" title="Chưa đọc"></span>
                      )}
                    </div>
                    <p className="text-gray-700 text-sm mt-1 line-clamp-2">{n.message}</p>
                    <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                      {n.date}
                    </p>
                  </div>
                  {n.read && (
                    <button
                      onClick={(e) => handleDelete(e, n.id)}
                      className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Xóa thông báo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

              ))}

            </div>
          </>
        )}

        {/* Modal Chi Tiết */}
        <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
          <DialogContent className="max-w-md bg-white">
            <DialogHeader>
              <DialogTitle className={`flex items-center gap-2 ${selected?.type === 'LichHen' ? 'text-blue-700' : 'text-orange-700'}`}>
                {selected?.type === 'LichHen' ? <CalendarClock className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                {selected?.title}
              </DialogTitle>
            </DialogHeader>

            {selected && (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-md border text-gray-800 text-sm leading-relaxed">
                  {selected.message}
                </div>

                <div className="flex justify-between items-center text-xs text-gray-500 border-t pt-3">
                  <span>Thời gian nhận: {selected.date}</span>
                  {selected.read && <span className="flex items-center text-green-600 gap-1"><Check className="w-3 h-3" /> Đã đọc</span>}
                </div>

                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => setSelected(null)}>
                    Đóng
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </LayoutUsers>
  );
}
