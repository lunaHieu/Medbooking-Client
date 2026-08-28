"use client";
import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import LayoutBook from "@/components/layoutBook";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious, } from "@/components/ui/pagination";
import { AxiosError } from 'axios';

import * as Api from "@/lib/ApiClient";
import * as Model from "@/lib/model";
import DataThumbnail from "@/components/thumnail/DataThumbnail";

export default function SpecialtyBookingPage() {
    const router = useRouter();

    const [specialties, setSpecialties] = useState<Model.Specialty[]>([]);
    const [currentUser, setCurrentUser] = useState<Model.User | null>(null);
    const [loading, setLoading] = useState(true);
    const [familyMembers, setFamilyMembers] = useState<Model.FamilyMember[]>([]);
    const [selectedPatientId, setSelectedPatientId] = useState<number>(0);

    const [selectedSpecialty, setSelectedSpecialty] = useState<Model.Specialty | null>(null);

    // State xử lý Lịch (Slot)
    const [availabilities, setAvailabilities] = useState<Model.AvailabilitySlot[]>([]);
    const [selectedDate, setSelectedDate] = useState("");
    const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null); // ID để gửi API
    const [selectedTimeLabel, setSelectedTimeLabel] = useState(""); // Giờ hiển thị (08:00)

    const [reason, setReason] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [bookingLoading, setBookingLoading] = useState(false);

    // state ui (Sheet, Pagination, Search)
    const [showSpecialtySheet, setShowSpecialtySheet] = useState(false);
    // XEM SHEET
    const [viewingSpecialty, setViewingSpecialty] = useState<Model.Specialty | null>(null);

    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const pageSize = 5;

    //LOAD DỮ LIỆU BAN ĐẦU
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [specsData, userData, familyData] = await Promise.all([
                    Api.getSpecialties(),
                    Api.getMe().catch(() => null),
                    Api.getFamilyMembers().catch(() => [])
                ]);
                setSpecialties(specsData);
                setFamilyMembers(familyData);
                if (userData) {
                    setCurrentUser(userData);
                    const savedPersonName = localStorage.getItem("booking_for_person");
                    //logic ghi nhớ
                    if (savedPersonName && savedPersonName !== userData.FullName) {
                        const matchedMember = familyData.find((m: Model.FamilyMember) => m.FullName === savedPersonName);
                        if (matchedMember) {
                            setSelectedPatientId(matchedMember.UserID);
                        } else {
                            // Nếu không tìm thấy người thân, mặc định là mình
                            setSelectedPatientId(userData.UserID);
                        }
                    } else {
                        setSelectedPatientId(userData.UserID);
                    }
                }
            } catch (error) {
                console.error("Lỗi tải dữ liệu:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);
    const handlePersonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        if (value === "ADD_NEW_MEMBER") {
            router.push("/user/quan-ly-gia-dinh");
            return;
        }
        const selectedId = Number(value);
        setSelectedPatientId(selectedId);

        let name = "";
        if (currentUser && selectedId === currentUser.UserID) {
            name = currentUser.FullName;
        } else {
            const matched = familyMembers.find((m) => m.UserID === selectedId);
            if (matched) {
                name = matched.FullName;
            }
        }
        // Lưu lại lựa chọn mới nếu người dùng đổi ý tại trang này
        localStorage.setItem("booking_for_person", name);
    };
    //XỬ LÝ KHI BẤM VÀO MỘT CHUYÊN KHOA (MỞ SHEET CHI TIẾT)
    const handleViewSpecialty = async (spec: Model.Specialty) => {
        setViewingSpecialty(spec);
        setSelectedDate("");
        setSelectedSlotId(null);
        setAvailabilities([]);

        try {
            const slots = await Api.getSpecialtyAvailability(spec.SpecialtyID);

            // Lọc slot tương lai & Available
            const validSlots = slots.filter(s => s.Status === 'Available' && new Date(s.StartTime) > new Date());
            setAvailabilities(validSlots);

            // Auto chọn ngày đầu tiên
            if (validSlots.length > 0) {
                const firstDate = validSlots[0].StartTime.split(" ")[0];
                setSelectedDate(firstDate);
            }
        } catch (error) {
            console.error("Lỗi lấy lịch chuyên khoa:", error);
        }
    };

    //LOGIC TÍNH TOÁN NGÀY GIỜ (Tương tự trang Bác sĩ)
    const uniqueDates = useMemo(() => {
        const dates = new Set(availabilities.map(slot => slot.StartTime.split(" ")[0]));
        return Array.from(dates).sort();
    }, [availabilities]);

    const slotsOnDate = useMemo(() => {
        return availabilities.filter(slot => slot.StartTime.startsWith(selectedDate));
    }, [availabilities, selectedDate]);

    //LỌC & PHÂN TRANG
    const filteredSpecialties = useMemo(() => {
        return specialties.filter((s) =>
            (s?.SpecialtyName || "").toLowerCase().includes((search || "").toLowerCase())
        );
    }, [specialties, search]);

    const totalPages = Math.ceil(filteredSpecialties.length / pageSize);
    const currentSpecialties = filteredSpecialties.slice(
        (page - 1) * pageSize,
        page * pageSize
    );

    // Helper format ngày
    const weekdayNames = ["Chủ nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
    const formatDateLabel = (dateStr: string) => {
        if (!dateStr) return "";
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        const weekday = weekdayNames[d.getDay()];
        const day = d.getDate().toString().padStart(2, "0");
        const month = (d.getMonth() + 1).toString().padStart(2, "0");
        return `${weekday} ${day}/${month}`;
    };

    //GỬI FORM ĐẶT LỊCH
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSpecialty) return alert("Vui lòng chọn chuyên khoa!");
        if (!selectedSlotId) return alert("Vui lòng chọn thời gian khám!");
        if (!reason.trim()) return alert("Vui lòng nhập triệu chứng!");
        if (!selectedPatientId) return alert("Vui lòng chọn người khám!");
        setBookingLoading(true);
        try {
            await Api.bookAppointment(selectedSlotId, selectedPatientId, reason, file || undefined);
            alert("Đặt lịch thành công!");
            router.push("/dat-lich");
        } catch (error) {
            const err = error as AxiosError<{ message: string }>;
            const msg = err.response?.data?.message || "Đặt lịch thất bại.";
            alert("" + msg);
        } finally {
            setBookingLoading(false);
        }
    };

    return (
        <LayoutBook>
            {/* Form đặt lịch */}
            <div className="max-w-2xl mx-auto bg-white rounded shadow p-6">
                <h1 className="text-2xl font-bold text-green-700 text-center mb-6">
                    Đặt lịch khám theo chuyên khoa
                </h1>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Người tới khám */}
                    <div>
                        <label className="block font-semibold mb-2">Người tới khám</label>
                        <select
                            value={selectedPatientId || ""}
                            onChange={handlePersonChange}
                            className="w-full border rounded px-3 py-2 focus:outline-green-600 bg-white"
                        >
                            {currentUser ? (
                                <>
                                    <option value={currentUser.UserID}>{currentUser.FullName}</option>

                                    {/* Render danh sách người thân */}
                                    {familyMembers.length > 0 && (
                                        <optgroup label="Người thân">
                                            {familyMembers.map((mem) => (
                                                <option key={mem.UserID} value={mem.UserID}>
                                                    {mem.FullName} ({mem.RelationType || mem.pivot?.RelationType})
                                                </option>
                                            ))}
                                        </optgroup>
                                    )}

                                    <option value="ADD_NEW_MEMBER" className="text-blue-600 font-bold">+ Thêm người thân mới...</option>
                                </>
                            ) : (
                                <option value="">Đang tải thông tin...</option>
                            )}

                        </select>
                    </div>

                    {/* Chuyên khoa */}
                    <div>
                        <label className="block font-semibold mb-2">Chuyên khoa</label>
                        {!selectedSpecialty ? (
                            <div
                                onClick={() => setShowSpecialtySheet(true)}
                                className="w-full border rounded px-3 py-2 cursor-pointer hover:border-green-600 text-gray-500"
                            >
                                Chọn chuyên khoa
                            </div>
                        ) : (
                            <div
                                onClick={() => setShowSpecialtySheet(true)}
                                className="w-full border rounded px-3 py-3 cursor-pointer hover:border-green-600"
                            >
                                <div className="font-semibold text-green-700">
                                    {selectedSpecialty.SpecialtyName}
                                </div>
                                <div className="text-sm text-gray-600">
                                    {selectedSpecialty.Description || "Chuyên khoa uy tín"}
                                </div>

                                {/* Hiển thị giờ đã chọn */}
                                {selectedDate && selectedTimeLabel && (
                                    <div className="mt-2 text-sm text-blue-600 font-bold">
                                        Thời gian: {formatDateLabel(selectedDate)} – {selectedTimeLabel}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Lý do khám */}
                    <div>
                        <label className="block font-semibold mb-2">
                            Lý do khám / Triệu chứng
                        </label>
                        <Textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Nhập lý do khám hoặc triệu chứng..."
                            className="w-full focus-visible:ring-green-600"
                        />
                    </div>

                    {/* File */}
                    <div>
                        <label className="block font-semibold mb-2">
                            Tải ảnh hoặc file (PDF, DOCX)
                        </label>
                        <input
                            type="file"
                            accept="image/*,.pdf,.doc,.docx"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                            className="w-full border rounded px-3 py-2"
                        />
                        {file && (
                            <p className="mt-2 text-sm text-gray-600">
                                File đã chọn: {file.name}
                            </p>
                        )}
                    </div>

                    <Button
                        type="submit"
                        disabled={bookingLoading}
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                        {bookingLoading ? "Đang xử lý..." : "Xác nhận đặt lịch"}
                    </Button>
                </form>
            </div>

            {/* Sheet chọn chuyên khoa */}
            {showSpecialtySheet && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    {/* Nếu chưa chọn item nào để xem lịch -> Hiện danh sách */}
                    {!viewingSpecialty ? (
                        <div className="bg-white w-[600px] max-h-[85%] rounded-t-2xl p-4 overflow-y-auto rounded-b-2xl">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-semibold">Chọn chuyên khoa</h2>
                                <button onClick={() => setShowSpecialtySheet(false)}>✕</button>
                            </div>

                            <div className="flex justify-center mb-4">
                                <input
                                    type="text"
                                    placeholder="Tìm chuyên khoa..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="border rounded px-2 py-1 w-[500px] text-sm"
                                />
                            </div>

                            {loading ? (
                                <div className="text-center py-8 text-gray-500">Đang tải danh sách...</div>
                            ) : currentSpecialties.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">Không tìm thấy chuyên khoa nào.</div>
                            ) : (
                                <>
                                    {currentSpecialties.map((spec) => (
                                        <div
                                            key={spec.SpecialtyID}
                                            onClick={() => handleViewSpecialty(spec)}
                                            className="flex items-center gap-3 p-3 border-b cursor-pointer hover:bg-gray-100 transition"
                                        >
                                            <div className="w-[60px] h-[60px]">
                                                <DataThumbnail
                                                    src={spec.imageURL}
                                                    alt={spec.SpecialtyName}
                                                    fallbackType="specialty"
                                                    className="w-full h-full rounded-lg"
                                                />
                                            </div>
                                            <div>
                                                <div className="font-medium text-green-800">{spec.SpecialtyName}</div>
                                                <div className="font-medium text-sm text-gray-500 line-clamp-1">
                                                    {spec.Description || "Chưa có mô tả"}
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Phân trang */}
                                    {totalPages > 1 && (
                                        <Pagination className="mt-4">
                                            <PaginationContent>
                                                <PaginationItem>
                                                    <PaginationPrevious
                                                        onClick={() => setPage(Math.max(page - 1, 1))}
                                                        className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                                    />
                                                </PaginationItem>
                                                <span className="mx-2 text-sm">Trang {page}/{totalPages}</span>
                                                <PaginationItem>
                                                    <PaginationNext
                                                        onClick={() => setPage(Math.min(page + 1, totalPages))}
                                                        className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                                    />
                                                </PaginationItem>
                                            </PaginationContent>
                                        </Pagination>
                                    )}
                                </>
                            )}
                        </div>
                    ) : (
                        // Nếu đã chọn xem chi tiết -> Hiện Lịch của chuyên khoa đó
                        <div className="bg-white w-[50%] max-h-[90%] rounded-2xl p-6 overflow-y-auto">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-semibold text-green-700">
                                    Lịch chuyên khoa
                                </h2>
                                {/* Nút Quay lại danh sách */}
                                <button onClick={() => setViewingSpecialty(null)} className="text-gray-500 hover:text-black">Quay lại</button>
                            </div>

                            {/* Info Chuyên khoa */}
                            <div className="flex gap-4 border-b pb-4 mb-4 items-center">
                                <div className="w-20 h-20">
                                    <DataThumbnail
                                        src={viewingSpecialty.imageURL}
                                        alt={viewingSpecialty.SpecialtyName}
                                        fallbackType="specialty"
                                        className="w-full h-full rounded-lg"
                                    />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-blue-700">
                                        {viewingSpecialty.SpecialtyName}
                                    </h3>
                                    <p className="text-sm text-gray-600 line-clamp-2">{viewingSpecialty.Description}</p>
                                </div>
                            </div>

                            {/* Chọn ngày */}
                            <h4 className="font-semibold mb-2 text-gray-700">Chọn ngày khám</h4>
                            <div className="flex gap-2 overflow-x-auto mb-4 pb-2">
                                {uniqueDates.length > 0 ? uniqueDates.map((dateStr) => (
                                    <button
                                        key={dateStr}
                                        onClick={() => {
                                            setSelectedDate(dateStr);
                                            setSelectedSlotId(null);
                                            setSelectedTimeLabel("");
                                        }}
                                        className={`px-4 py-2 rounded-lg border min-w-[100px] text-sm text-center transition whitespace-nowrap ${selectedDate === dateStr
                                            ? "bg-green-600 text-white border-green-600 shadow-md"
                                            : "bg-white border-gray-200 text-gray-600 hover:bg-green-50"
                                            }`}
                                    >
                                        {formatDateLabel(dateStr)}
                                    </button>
                                )) : (
                                    <p className="text-sm text-gray-400 italic">Chưa có lịch khám trống cho chuyên khoa này.</p>
                                )}
                            </div>

                            {/* Chọn giờ */}
                            {selectedDate && (
                                <div className="animate-fade-in">
                                    <h4 className="font-semibold mb-2 text-gray-700">Chọn giờ khám</h4>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-6">
                                        {slotsOnDate.length > 0 ? slotsOnDate.map((slot) => {
                                            const rawTime = slot.StartTime || "";
                                            const timePart = rawTime.includes("T") ? rawTime.split("T")[1] : rawTime.split(" ")[1];
                                            const timeStr = (timePart || rawTime || "").substring(0, 5);
                                            return (
                                                <button
                                                    key={slot.SlotID}
                                                    onClick={() => {
                                                        setSelectedSlotId(slot.SlotID);
                                                        setSelectedTimeLabel(timeStr);
                                                    }}
                                                    className={`py-2 rounded border text-sm font-semibold transition ${selectedSlotId === slot.SlotID
                                                        ? "bg-green-600 text-white border-green-600 shadow-md"
                                                        : "border-gray-200 text-gray-700 hover:border-green-500 hover:bg-green-50"
                                                        }`}
                                                >
                                                    {timeStr}
                                                </button>
                                            );
                                        }) : (
                                            <p className="col-span-3 text-sm text-gray-400">Hết giờ ngày này.</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Footer Sheet */}
                            <div className="flex justify-end gap-3 border-t pt-4">
                                <button
                                    onClick={() => setShowSpecialtySheet(false)} // Đóng hẳn
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                >
                                    Đóng
                                </button>
                                <button
                                    disabled={!selectedDate || !selectedSlotId}
                                    onClick={() => {
                                        setSelectedSpecialty(viewingSpecialty); // Chọn vào form chính
                                        setShowSpecialtySheet(false);
                                        setViewingSpecialty(null);
                                    }}
                                    className="bg-green-600 text-white py-2 px-6 rounded-lg font-bold hover:bg-green-700 disabled:opacity-50 transition"
                                >
                                    Xác nhận chọn
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </LayoutBook>
    );
}
