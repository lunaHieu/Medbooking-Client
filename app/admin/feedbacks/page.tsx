"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import * as Api from "@/lib/ApiClient";
// import * as Model from "@/lib/model";

const ITEMS_PER_PAGE = 5;

interface FeedbackUI {
  id: number;
  patientName: string;
  patientAvatar?: string;
  targetName: string;
  type: "Doctor" | "System";
  rating: number;
  comment: string;
  date: string;
}

const StarRating = ({ rating }: { rating: number }) => {
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-5 h-5 ${
            star <= rating ? "text-yellow-400" : "text-gray-300"
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
};

export default function FeedbacksPage() {
  const [feedbacks, setFeedbacks] = useState<FeedbackUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRating, setFilterRating] = useState<number | "all">("all");

  const [currentPage, setCurrentPage] = useState(1);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await Api.adminGetFeedbacks();

      const mappedData: FeedbackUI[] = data.map((item) => ({
        id: item.FeedbackID,
        patientName: item.ReviewerName || "Bệnh nhân",
        patientAvatar: item.ReviewerAvatar || "",
        targetName: item.TargetName || "Hệ thống",
        type: item.Type,
        rating: item.Rating,
        comment: item.Comment || "",
        date: item.CreatedAt,
      }));

      setFeedbacks(mappedData);
    } catch (error) {
      console.error("Lỗi tải phản hồi:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterRating]);

  // FILTER
  const filteredFeedbacks = feedbacks.filter((fb) =>
    filterRating === "all" ? true : fb.rating === filterRating
  );

  const totalPages = Math.ceil(filteredFeedbacks.length / ITEMS_PER_PAGE);
  const currentFeedbacks = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredFeedbacks.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredFeedbacks, currentPage]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
      <section className="max-w-5xl w-full mx-auto bg-white rounded-xl shadow-lg overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Đánh Giá & Phản Hồi
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Tổng hợp ý kiến khách hàng về dịch vụ
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-600">
              Lọc theo sao:
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setFilterRating("all")}
                className={`px-3 py-1 text-sm rounded-full border ${
                  filterRating === "all"
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-600 hover:bg-gray-100"
                }`}
              >
                Tất cả
              </button>
              <button
                onClick={() => setFilterRating(5)}
                className={`px-3 py-1 text-sm rounded-full border ${
                  filterRating === 5
                    ? "bg-yellow-500 text-white border-yellow-500"
                    : "bg-white text-gray-600 hover:bg-yellow-50"
                }`}
              >
                5★
              </button>
              <button
                onClick={() => setFilterRating(1)}
                className={`px-3 py-1 text-sm rounded-full border ${
                  filterRating === 1
                    ? "bg-red-500 text-white border-red-500"
                    : "bg-white text-gray-600 hover:bg-red-50"
                }`}
              >
                1★
              </button>
            </div>
            <button
              onClick={loadData}
              className="ml-4 text-blue-600 hover:underline text-sm flex items-center gap-1"
            >
              <span></span> Làm mới
            </button>
          </div>
        </div>

        {/* Danh sách Feedback */}
        <div className="p-6 bg-gray-50/50 space-y-4 min-h-[500px]">
          {loading ? (
            <div className="text-center py-12 text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              Đang tải đánh giá...
            </div>
          ) : filteredFeedbacks.length === 0 ? (
            <div className="text-center py-12 text-gray-500 flex flex-col items-center">
              <p>Không có đánh giá nào phù hợp.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {currentFeedbacks.map((fb) => (
                <div
                  key={fb.id}
                  className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <div className="flex flex-col gap-3">
                    {/* Header của từng Card */}
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        {/* Avatar (Chữ cái đầu) */}
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                          {(fb.patientName || "U").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-800">
                            {fb.patientName}
                          </h4>
                          <p className="text-xs text-gray-500">{fb.date}</p>
                        </div>
                      </div>

                      {/*Xanh nếu là Doctor, Xám nếu là System */}
                      <div
                        className={`flex items-center gap-2 px-3 py-1 rounded-full border ${
                          fb.type === "Doctor"
                            ? "bg-blue-50 border-blue-100 text-blue-700"
                            : "bg-gray-100 border-gray-200 text-gray-600"
                        }`}
                      >
                        <span className="text-xs font-medium">Đánh giá:</span>
                        <span className="text-xs font-bold">
                          {fb.targetName}
                        </span>
                      </div>
                    </div>

                    <hr className="border-gray-100" />

                    {/* Nội dung Rating & Comment */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <StarRating rating={fb.rating} />
                        <span className="text-sm font-bold text-gray-800 ml-1">
                          {fb.rating}.0
                        </span>
                      </div>
                      <p className="text-gray-700 text-base leading-relaxed bg-gray-50/50 p-3 rounded-lg border border-gray-100 italic">
                        `{fb.comment}`
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {!loading && filteredFeedbacks.length > 0 && (
            <div className="mt-6 flex justify-end gap-2 pt-4">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="px-3 py-1 border rounded-lg bg-white disabled:opacity-50 hover:bg-gray-100 transition shadow-sm"
              >
                Trước
              </button>
              <span className="px-3 py-1 font-bold text-gray-600 bg-white border rounded-lg flex items-center shadow-sm">
                Trang {currentPage} / {totalPages || 1}
              </span>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="px-3 py-1 border rounded-lg bg-white disabled:opacity-50 hover:bg-gray-100 transition shadow-sm"
              >
                Sau
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
