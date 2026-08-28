"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useRouter, useSearchParams } from "next/navigation";
import LayoutBook from "@/components/layoutBook";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import { AxiosError } from 'axios';

import * as Api from "@/lib/ApiClient";
import * as Model from "@/lib/model";
import DataThumbnail from "@/components/thumnail/DataThumbnail";

function DoctorBookingPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const urlDoctorId = searchParams.get('doctorId');
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const token = localStorage.getItem('api_token');
        if (!token) {
            alert("Vui lòng đăng nhập để đặt lịch!");
            router.push('/login');
        }
    }, [router]);

    //state dữ liệu
    const [doctors, setDoctors] = useState<Model.Doctor[]>([]);
    const [currentUser, setCurrentUser] = useState<Model.User | null>(null);
    const [loading, setLoading] = useState(true);
    const [familyMembers, setFamilyMembers] = useState<Model.FamilyMember[]>([]);
    const [selectedPatientId, setSelectedPatientId] = useState<number>(0);
    //state form
    const [selectedDoctor, setSelectedDoctor] = useState<Model.Doctor | null>(null);

    // State cho lịch
    const [availabilities, setAvailabilities] = useState<Model.AvailabilitySlot[]>([]);
    const [selectedDate, setSelectedDate] = useState("");
    const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
    const [selectedTimeLabel, setSelectedTimeLabel] = useState("");

    const [reason, setReason] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [bookingLoading, setBookingLoading] = useState(false);

    const [showDoctorSheet, setShowDoctorSheet] = useState(false);
    const [viewingDoctor, setViewingDoctor] = useState<Model.Doctor | null>(null);

    const [search, setSearch] = useState("");
    const [deptFilter, setDeptFilter] = useState("");
    const [page, setPage] = useState(1);
    const pageSize = 5;

    // Mở sheet chọn bác sĩ
    // Gọi API lấy lịch ngay
    const handleViewDoctor = async (doctor: Model.Doctor) => {
        setViewingDoctor(doctor);
        setSelectedDate(""); // Reset ngày đã chọn
        setSelectedSlotId(null);
        setAvailabilities([]); // Xóa lịch cũ

        try {
            // Gọi API lấy lịch trống
            const slots = await Api.getDoctorAvailability(doctor.DoctorID);
            // Lọc slot tương lai & Available
            const validSlots = slots.filter(s => s.Status === 'Available' && new Date(s.StartTime) > new Date());
            setAvailabilities(validSlots);

            // Tự động chọn ngày đầu tiên nếu có lịch
            if (validSlots.length > 0) {
                const firstDate = validSlots[0].StartTime.split(" ")[0]; // YYYY-MM-DD
                setSelectedDate(firstDate);
            }
        } catch (error) {
            console.error("Lỗi lấy lịch:", error);
        }
    };

    //LOAD DỮ LIỆU
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [docsData, userData, familyData] = await Promise.all([
                    Api.getDoctors(),
                    Api.getMe().catch(() => null),
                    Api.getFamilyMembers().catch(() => [] as Model.FamilyMember[])
                ]);

                setDoctors(docsData);
                if (urlDoctorId) {
                    const foundDoctor = docsData.find(doc => doc.DoctorID === Number(urlDoctorId));
                    if (foundDoctor) {
                        setSelectedDoctor(foundDoctor);
                        setShowDoctorSheet(true);
                        await handleViewDoctor(foundDoctor);
                    }
                }
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
    }, [urlDoctorId]);
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
    // Xử lí ngày giờ trong API
    // Lấy danh sách ngày duy nhất
    const uniqueDates = useMemo(() => {
        const dates = new Set(availabilities.map(slot => slot.StartTime.split(" ")[0]));
        return Array.from(dates).sort();
    }, [availabilities]);

    // Lấy danh sách giờ theo ngày đang chọn
    const slotsOnDate = useMemo(() => {
        return availabilities.filter(slot => slot.StartTime.startsWith(selectedDate));
    }, [availabilities, selectedDate]);


    // Lọc danh sách bác sĩ (Client-side)
    const filteredDoctors = useMemo(() => {
        return doctors.filter((d) => {
            const nameMatch = (d?.user?.FullName || "").toLowerCase().includes((search || "").toLowerCase());
            // Lọc theo tên chuyên khoa (deptFilter là text nhập vào)
            const specMatch = !deptFilter || (d?.specialty?.SpecialtyName || "").toLowerCase().includes((deptFilter || "").toLowerCase());
            return nameMatch && specMatch;
        });
    }, [doctors, search, deptFilter]);

    // Phân trang
    const totalPages = Math.ceil(filteredDoctors.length / pageSize);
    const currentDoctors = filteredDoctors.slice(
        (page - 1) * pageSize,
        page * pageSize
    );

    // Format ngày hiển thị (Thứ..., dd/mm)
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

    // Submit Đặt lịch
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDoctor) return alert("Vui lòng chọn bác sĩ!");
        if (!selectedSlotId) return alert("Vui lòng chọn thời gian khám!");
        if (!reason.trim()) return alert("Vui lòng nhập lý do khám!");
        if (!selectedPatientId) return alert("Vui lòng xác định người đi khám!");
        setBookingLoading(true);
        try {
            await Api.bookAppointment(selectedSlotId, selectedPatientId, reason, file || undefined);

            alert("Đặt lịch khám thành công!");
            router.push("/dat-lich");
        } catch (error) {
            const err = error as AxiosError<{ message: string }>;
            const msg = err.response?.data?.message || "Đặt lịch thất bại.";
            alert("" + msg);
        } finally {
            setBookingLoading(false);
        }
    };

    if (!isMounted) return null;

    return (
        <LayoutBook>
            {/* Form đặt lịch chính */}
            <div className="max-w-2xl mx-auto bg-white rounded shadow p-6">
                <h1 className="text-2xl font-bold text-green-700 text-center mb-6">
                    Đặt lịch khám theo bác sĩ
                </h1>

                <form onSubmit={handleSubmit} className="space-y-5">
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

                                    {/* danh sách người thân */}
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

                    {/* Bác sĩ (Đã chọn) */}
                    <div>
                        <label className="block font-semibold mb-2">Bác sĩ</label>
                        {!selectedDoctor ? (
                            <div
                                onClick={() => setShowDoctorSheet(true)}
                                className="w-full border rounded px-3 py-2 cursor-pointer hover:border-green-600 text-gray-500"
                            >
                                Chọn bác sĩ
                            </div>
                        ) : (
                            <div
                                onClick={() => setShowDoctorSheet(true)}
                                className="w-full border rounded px-3 py-3 cursor-pointer hover:border-green-600"
                            >
                                <div className="font-semibold text-green-700">
                                    {selectedDoctor.user?.FullName}
                                </div>
                                <div className="text-sm text-gray-600">
                                    Chuyên khoa: {selectedDoctor.specialty?.SpecialtyName}
                                </div>
                                <div className="text-sm text-gray-600">
                                    Học vị: {selectedDoctor.Degree} | Kinh nghiệm: {selectedDoctor.YearsOfExperience} năm
                                </div>

                                {selectedDate && selectedTimeLabel && (
                                    <div className="text-sm mt-1 text-blue-600 font-bold">
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

            {/* Sheet chọn bác sĩ */}
            {showDoctorSheet && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    {!viewingDoctor ? (
                        <div className="bg-white w-[600px] max-h-[85%] rounded-t-2xl p-4 overflow-y-auto rounded-b-2xl">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-semibold">Chọn bác sĩ</h2>
                                <button onClick={() => setShowDoctorSheet(false)}>✕</button>
                            </div>

                            {/* Lọc */}
                            <div className="flex justify-center mb-4">
                                <div className="flex gap-2 w-full">
                                    <input
                                        type="text"
                                        placeholder="Tìm chuyên khoa..."
                                        value={deptFilter}
                                        onChange={(e) => setDeptFilter(e.target.value)}
                                        className="border rounded px-2 py-1 w-full text-sm"
                                    />

                                    <input
                                        type="text"
                                        placeholder="Tìm bác sĩ..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="border rounded px-2 py-1 w-full text-sm"
                                    />
                                </div>
                            </div>

                            {/* Danh sách bác sĩ */}
                            {loading ? (
                                <div className="text-center py-8 text-gray-500">Đang tải danh sách...</div>
                            ) : currentDoctors.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">Không tìm thấy bác sĩ nào.</div>
                            ) : (
                                <>
                                    {currentDoctors.map((doc) => (
                                        <div
                                            key={doc.DoctorID}
                                            onClick={() => handleViewDoctor(doc)}
                                            className="flex items-center gap-3 p-3 border-b cursor-pointer hover:bg-gray-100 transition"
                                        >
                                            <div className="w-[60px] h-[60px]">
                                                <DataThumbnail
                                                    src={doc.imageURL || doc.user?.avatar_url}
                                                    alt={doc.user?.FullName}
                                                    fallbackType="doctor"
                                                    className="w-full h-full rounded-full"
                                                />
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-900">{doc.user?.FullName}</div>
                                                <div className="text-sm text-green-600 font-medium">{doc.specialty?.SpecialtyName}</div>
                                                <div className="text-xs text-gray-500">{doc.Degree}</div>
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
                        // Nếu đã bấm vào 1 bác sĩ -> Hiện chi tiết & Lịch
                        <div className="bg-white w-[50%] max-h-[90%] rounded-2xl p-6 overflow-y-auto">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-semibold text-green-700">Lịch bác sĩ</h2>
                                <button onClick={() => setViewingDoctor(null)} className="text-gray-500 hover:text-gray-800"> Quay lại danh sách</button>
                            </div>

                            <div className="flex gap-4 border-b pb-4 mb-4 items-center">
                                <div className="w-20 h-20">
                                    <DataThumbnail
                                        src={viewingDoctor.imageURL || viewingDoctor.user?.avatar_url}
                                        alt={viewingDoctor.user?.FullName}
                                        fallbackType="doctor"
                                        className="w-full h-full rounded-lg"
                                    />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-blue-700">
                                        {viewingDoctor.user?.FullName}
                                    </h3>
                                    <p className="text-sm text-gray-600 font-bold">{viewingDoctor.specialty?.SpecialtyName}</p>
                                    <p className="text-sm text-gray-500">{viewingDoctor.ProfileDescription}</p>
                                </div>
                            </div>

                            {/* Chọn ngày */}
                            <h4 className="font-semibold mb-2 text-gray-700">Chọn ngày khám</h4>
                            <div className="flex gap-2 overflow-x-auto mb-6 pb-2">
                                {uniqueDates.length > 0 ? uniqueDates.map((dateStr) => (
                                    <Button
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
                                    </Button>
                                )) : (
                                    <p className="text-sm text-gray-400 italic">Bác sĩ chưa có lịch trống.</p>
                                )}
                            </div>

                            {/* Chọn giờ */}
                            {selectedDate && (
                                <div className="animate-fade-in">
                                    <h4 className="font-semibold mb-2 text-gray-700">Chọn giờ khám</h4>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-4">
                                        {slotsOnDate.length > 0 ? slotsOnDate.map((slot) => {
                                            const rawTime = slot.StartTime || "";
                                            const timePart = rawTime.includes("T") ? rawTime.split("T")[1] : rawTime.split(" ")[1];
                                            const timeStr = (timePart || rawTime || "").substring(0, 5); // 08:00
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
                                    onClick={() => setShowDoctorSheet(false)} // Đóng hẳn sheet
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                >
                                    Đóng
                                </button>
                                <button
                                    disabled={!selectedDate || !selectedSlotId}
                                    onClick={() => {
                                        setSelectedDoctor(viewingDoctor); // Set bác sĩ vào Form chính
                                        setShowDoctorSheet(false); // Đóng sheet
                                        setViewingDoctor(null);
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

export default function DoctorBookingPage() {
    return (
        <Suspense fallback={<div className="text-center p-10 font-medium text-gray-600">Đang tải dữ liệu...</div>}>
            <DoctorBookingPageContent />
        </Suspense>
    );
}
