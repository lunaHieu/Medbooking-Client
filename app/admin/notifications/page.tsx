"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Bell,
  Send,
  History,
  Loader,
  Megaphone,
  CalendarClock,
  CheckCircle2,
  Trash2,
  Trash,
  AlertCircle,
  PlayCircle,
} from "lucide-react";
import * as Api from "@/lib/ApiClient";
import * as Model from "@/lib/model";
import { AxiosError } from "axios";
import { handleError } from "@/lib/utils";

const ITEMS_PER_PAGE = 10;

export default function NotificationManagerPage() {
  const [activeTab, setActiveTab] = useState<"broadcast" | "logs">("broadcast");
  const [logs, setLogs] = useState<Model.NotificationLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const [broadcastForm, setBroadcastForm] = useState({
    title: "",
    content: "",
    targetGroup: "patients",
    channel: "in_app",
  });
  const handleTriggerReminders = async () => {
    if (
      !confirm(
        "Hệ thống sẽ quét lịch khám ngày mai và gửi thông báo cho bệnh nhân ngay lập tức.\nBạn có muốn tiếp tục?"
      )
    )
      return;

    setLoading(true);
    try {
      const res = await Api.triggerReminders();
      alert("" + res.message);
      setActiveTab("logs");
      loadData();
    } catch (error) {
      handleError(error, "Quét lịch thất bại!");
    }
  };
  const loadData = useCallback(async () => {
    if (activeTab !== "logs") return;

    setLoading(true);
    try {
      const data = await Api.getNotificationLogs();
      if (Array.isArray(data)) {
        const mappedLogs: Model.NotificationLog[] = data.map((item) => ({
          id: item.NotificationID,
          recipient: item.UserID ? `Người dùng #${item.UserID}` : "Thông báo hệ thống",
          title: item.Title || "Không tiêu đề",
          content: item.Content,
          type: item.NotificationType === "Reminder"
            ? "Reminder"
            : item.NotificationType === "System"
              ? "SystemAlert"
              : "Other",
          sent_at: item.created_at
            ? new Date(item.created_at).toLocaleString("vi-VN")
            : "N/A",
          status: item.Status || "Sent",
        }));
        setLogs(mappedLogs);
      } else {
        setLogs([]);
      }
    } catch (error) {
      console.error("Lỗi tải logs:", error);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, logs.length]); // Reset khi logs thay đổi độ dài (xóa, thêm mới)

  // --- 3. TÍNH TOÁN DỮ LIỆU CHO TRANG HIỆN TẠI ---
  const totalPages = Math.ceil(logs.length / ITEMS_PER_PAGE);
  const currentLogs = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return logs.slice(start, start + ITEMS_PER_PAGE);
  }, [logs, currentPage]);

  // GỬI THÔNG BÁO
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastForm.title || !broadcastForm.content) return;

    if (
      !confirm(
        "Bạn có chắc chắn muốn gửi thông báo này tới toàn bộ danh sách đã chọn?"
      )
    )
      return;

    try {
      await Api.sendNotification({
        Title: broadcastForm.title,
        Content: broadcastForm.content,
        TargetGroup: "patients",
        Channel: "in_app",
      });

      alert("Đã gửi thông báo thành công!");

      // Reset form
      setBroadcastForm({
        title: "",
        content: "",
        targetGroup: "patients",
        channel: "in_app",
      });

      // Chuyển sang tab logs để xem kết quả
      setActiveTab("logs");
    } catch (error: unknown) {
      console.error(error);

      const err = error as AxiosError<{ message: string }>;

      alert("Gửi thất bại: " + (err.response?.data?.message || "Lỗi hệ thống"));
    }
  };
  //XÓA TỪNG DÒNG
  const handleDeleteOne = async (id: number | string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa thông báo này khỏi lịch sử?"))
      return;
    //loading
    setDeletingId(id);
    try {
      await Api.deleteNotification(id);

      setLogs((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Lỗi xóa:", error);
      alert("Không thể xóa thông báo này.");
    } finally {
      setDeletingId(null); // Tắt loading
    }
  };

  const handleDeleteAll = async () => {
    if (logs.length === 0) return;

    const confirmText = prompt(
      "Hành động này sẽ xóa toàn bộ lịch sử thông báo và không thể khôi phục.\nNhập 'DELETE' để xác nhận:"
    );
    if (confirmText !== "DELETE") return;

    setLoading(true);
    try {
      await Api.deleteAllNotifications();

      //Chuyển logs về rỗng []
      setLogs([]);
      alert("Đã xóa toàn bộ lịch sử.");
    } catch (error) {
      console.error("Lỗi xóa tất cả:", error);
      alert("Có lỗi xảy ra khi xóa dữ liệu.");
    } finally {
      setLoading(false);
    }
  };
  const getTypeIcon = (type: string) => {
    if (type === "Reminder")
      return <CalendarClock className="w-5 h-5 text-blue-600" />;
    if (type === "SystemAlert")
      return <Megaphone className="w-5 h-5 text-orange-600" />;
    return <Bell className="w-5 h-5 text-gray-500" />;
  };

  const getTypeName = (type: string) => {
    if (type === "Reminder") return "Nhắc hẹn tự động";
    if (type === "SystemAlert") return "Thông báo hệ thống";
    return "Khác";
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-md overflow-hidden min-h-[600px] flex flex-col">
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Megaphone className="w-7 h-7 text-blue-600" />
              Quản lý Thông báo
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Gửi tin tức hệ thống và giám sát tin nhắc hẹn tự động.
            </p>
          </div>

          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab("broadcast")}
              className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${
                activeTab === "broadcast"
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Send className="w-4 h-4 inline-block mr-2" />
              Soạn tin mới
            </button>
            <button
              onClick={() => setActiveTab("logs")}
              className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${
                activeTab === "logs"
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <History className="w-4 h-4 inline-block mr-2" />
              Lịch sử gửi
            </button>
            <button
              onClick={handleTriggerReminders}
              className="text-blue-700 hover:bg-red-400 px-4 py-2 text-sm font-semibold rounded-md transition-all"
              title="Chạy thủ công lệnh quét lịch ngày mai"
            >
              <PlayCircle className="w-4 h-4" />
              Quét Nhắc Hẹn
            </button>
          </div>
        </div>

        <div className="p-6 flex-1 bg-gray-50/50">
          {activeTab === "broadcast" && (
            <div className="max-w-2xl mx-auto">
              <form
                onSubmit={handleSendBroadcast}
                className="bg-white p-8 rounded-xl border shadow-sm space-y-6"
              >
                <div className="flex items-center gap-3 pb-4 border-b">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <Send className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">
                      Gửi thông báo thủ công
                    </h3>
                    <p className="text-xs text-gray-500">
                      Tin nhắn sẽ hiện trên trang web/app của người dùng
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Đối tượng nhận
                    </label>
                    <input
                      disabled
                      value="Tất cả Bệnh nhân"
                      className="w-full border border-gray-200 bg-gray-100 text-gray-500 rounded-lg px-3 py-2.5 text-sm cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Kênh gửi
                    </label>
                    <input
                      disabled
                      value="Thông báo In-App"
                      className="w-full border border-gray-200 bg-gray-100 text-gray-500 rounded-lg px-3 py-2.5 text-sm cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tiêu đề <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Thông báo bảo trì hệ thống ngày 15/12..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={broadcastForm.title}
                    onChange={(e) =>
                      setBroadcastForm({
                        ...broadcastForm,
                        title: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nội dung <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    placeholder="Nhập nội dung chi tiết..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 h-32 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    value={broadcastForm.content}
                    onChange={(e) =>
                      setBroadcastForm({
                        ...broadcastForm,
                        content: e.target.value,
                      })
                    }
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-md transition flex justify-center items-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  Gửi Thông Báo Ngay
                </button>
              </form>
            </div>
          )}
          {activeTab === "logs" && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {logs.length > 0 && (
                <div className="px-6 py-3 bg-gray-50 border-b flex justify-between items-center">
                  <span className="text-xs font-semibold text-gray-500">
                    Tổng: {logs.length} thông báo
                  </span>
                  <button
                    onClick={handleDeleteAll}
                    className="flex items-center gap-1.5 text-red-600 hover:text-white hover:bg-red-600 px-3 py-1.5 rounded-md transition text-xs font-bold border border-red-200 hover:border-red-600"
                  >
                    <Trash className="w-4 h-4" />
                    Xóa tất cả
                  </button>
                </div>
              )}
              {loading ? (
                <div className="p-12 text-center text-gray-500 flex flex-col items-center">
                  <Loader className="w-8 h-8 animate-spin text-blue-600 mb-2" />
                  <p>Đang tải dữ liệu...</p>
                </div>
              ) : (
                <div className="overflow-x-auto ">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">
                          Thời gian
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">
                          Loại tin
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">
                          Tiêu đề / Nội dung
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">
                          Người nhận
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">
                          Trạng thái
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">
                          Hành động
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {logs.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-6 py-10 text-center text-gray-400"
                          >
                            <AlertCircle className="w-10 h-10 text-gray-300 mb-2" />
                            Chưa có lịch sử thông báo nào
                          </td>
                        </tr>
                      ) : (
                        currentLogs.map((log) => (
                          <tr
                            key={log.id}
                            className="hover:bg-gray-50 transition"
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {log.sent_at}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                {getTypeIcon(log.type)}
                                <span
                                  className={`text-sm font-semibold ${
                                    log.type === "Reminder"
                                      ? "text-blue-700"
                                      : "text-orange-700"
                                  }`}
                                >
                                  {getTypeName(log.type)}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="max-w-xs">
                                <p className="text-sm font-bold text-gray-800 truncate">
                                  {log.title}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                  {log.content}
                                </p>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              {log.recipient}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <CheckCircle2 className="w-3 h-3" />
                                Đã gửi
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <button
                                onClick={() => handleDeleteOne(log.id)}
                                disabled={deletingId === log.id}
                                className="text-gray-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition disabled:opacity-50"
                                title="Xóa thông báo này"
                              >
                                {deletingId === log.id ? (
                                  <Loader className="w-4 h-4 animate-spin text-red-600" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
              {!loading && logs.length > 0 && (
                <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50">
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
          )}
        </div>
      </div>
    </div>
  );
}
