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
import * as Api from "@/lib/ApiClient";
import * as Model from "@/lib/model";
// import { AxiosError } from "axios";
import DataThumbnail from "@/components/thumnail/DataThumbnail";
import { handleError } from "@/lib/utils";
interface AggregatedService extends Model.Service {
    SpecialtyName: string;
}

function ServiceBookingPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const urlServiceId = searchParams.get('serviceId');
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const token = localStorage.getItem('api_token');
        if (!token) {
            alert("Vui lòng đăng nhập để đặt lịch!");
            router.push('/login');
        }
    }, [router]);

    //State dữ liệu API & cache
    const [services, setServices] = useState<AggregatedService[]>([]);
    const [currentUser, setCurrentUser] = useState<Model.User | null>(null);
    const [loading, setLoading] = useState(true);
    const [familyMembers, setFamilyMembers] = useState<Model.FamilyMember[]>([]);
    const [selectedPatientId, setSelectedPatientId] = useState<number>(0);
    //State cache lịch trống theo ServiceID (để không gọi lại API)
    const [slotsCache, setSlotsCache] = useState<Map<number, Model.AvailabilitySlot[]>>(new Map());

    //State form đặt lịch
    const [selectedService, setSelectedService] = useState<AggregatedService | null>(null);

    // State xử lý Slot
    const [selectedDate, setSelectedDate] = useState("");
    const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null); // SlotID gửi API
    const [selectedTimeLabel, setSelectedTimeLabel] = useState(""); // Giờ hiển thị

    const [reason, setReason] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [bookingLoading, setBookingLoading] = useState(false);

    //STATE UI (Sheet, Pagination, Search)
    const [showServiceSheet, setShowServiceSheet] = useState(false);
    const [viewingService, setViewingService] = useState<AggregatedService | null>(null);

    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const pageSize = 5;

    // 2. XỬ LÝ KHI BẤM VÀO DỊCH VỤ (MỞ SHEET CHỌN LỊCH)
    const handleViewService = async (service: AggregatedService) => {
        setViewingService(service);
        setSelectedDate("");
        setSelectedSlotId(null);
        setSlotsCache(new Map()); // Reset cache khi chọn dịch vụ mới

        try {
            // Gọi API lấy lịch trống (Dùng API theo Chuyên khoa của dịch vụ đó)
            const slots = await Api.getSpecialtyAvailability(service.SpecialtyID);

            const validSlots = slots.filter(s => s.Status === 'Available' && new Date(s.StartTime) > new Date());

            // Lưu vào cache tạm thời
            const newCache = new Map();
            newCache.set(service.ServiceID, validSlots);
            setSlotsCache(newCache);

            // Tự động chọn ngày đầu tiên có lịch
            if (validSlots.length > 0) {
                const firstDate = validSlots[0].StartTime.split(" ")[0];
                setSelectedDate(firstDate);
            }
        } catch {
            alert("Không tải được lịch khám trống.");
        }
    };

    //LOAD DỮ LIỆU BAN ĐẦU
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Gọi các API cần thiết
                const [specsData, servicesData, userData, familyData] = await Promise.all([
                    Api.getSpecialties(),
                    Api.getAllServices(),
                    Api.getMe().catch(() => null),
                    Api.getFamilyMembers().catch(() => [])
                ]);

                // Tạo Map Specialty Name để nối dữ liệu vào Service
                const specMap = new Map(specsData.map(s => [s.SpecialtyID, s.SpecialtyName]));

                // Nối Specialty Name vào Service
                const aggregatedServices: AggregatedService[] = servicesData.map(srv => ({
                    ...srv,
                    SpecialtyName: specMap.get(srv.SpecialtyID) || 'Không xác định',
                })) as AggregatedService[];

                setServices(aggregatedServices);
                if (urlServiceId) {
                    const foundService = aggregatedServices.find(s => s.ServiceID === Number(urlServiceId));
                    if (foundService) {
                        setSelectedService(foundService);
                        setShowServiceSheet(true);
                        await handleViewService(foundService);
                    }
                }
                setFamilyMembers(familyData);
                if (userData) {
                    setCurrentUser(userData);

                    const savedPersonName = localStorage.getItem("booking_for_person");

                    if (savedPersonName && savedPersonName !== userData.FullName) {

                        const matchedMember = familyData.find((m: Model.FamilyMember) => m.FullName === savedPersonName);
                        if (matchedMember) {
                            setSelectedPatientId(matchedMember.UserID);
                        } else {
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
    }, [urlServiceId]);
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

    //LOGIC TÍNH TOÁN NGÀY GIỜ (Lấy từ Cache hoặc State)
    const serviceIdToView = viewingService?.ServiceID;
    const currentSlots = useMemo(() => {
        if (!serviceIdToView) {
            return [];
        }
        return slotsCache.get(serviceIdToView) ?? [];
    }, [serviceIdToView, slotsCache]);

    const uniqueDates = useMemo(() => {
        const dates = new Set(currentSlots.map(slot => slot.StartTime.split(" ")[0]));
        return Array.from(dates).sort();
    }, [currentSlots]);

    const slotsOnDate = useMemo(() => {
        return currentSlots.filter(slot => slot.StartTime.startsWith(selectedDate));
    }, [currentSlots, selectedDate]);

    //LỌC VÀ PHÂN TRANG (Client-side)
    const filteredServices = useMemo(() => {
        return services.filter((srv) =>
            (srv?.ServiceName || "").toLowerCase().includes((search || "").toLowerCase()) ||
            (srv?.Description || "").toLowerCase().includes((search || "").toLowerCase()) ||
            (srv?.SpecialtyName || "").toLowerCase().includes((search || "").toLowerCase())
        );
    }, [services, search]);

    const totalPages = Math.ceil(filteredServices.length / pageSize);
    const currentServices = filteredServices.slice(
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

    // GỬI FORM ĐẶT LỊCH (API)
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPatientId) return alert("Vui lòng chọn người khám!");
        if (!selectedService) return alert("Vui lòng chọn dịch vụ!");
        if (!selectedSlotId) return alert("Vui lòng chọn thời gian khám!");
        if (!reason.trim()) return alert("Vui lòng nhập triệu chứng!");

        setBookingLoading(true);
        try {
            // Gọi API đặt lịch, truyền thêm ServiceID để lưu chính xác
            await Api.bookAppointment(
                selectedSlotId,
                selectedPatientId,
                reason,
                file || undefined,
                // selectedService.ServiceID
            );

            alert("Đặt lịch thành công! Vui lòng chờ xác nhận.");
            router.push("/dat-lich");
        } catch (error) {
            handleError(error, "Lỗi đặt lịch!")
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
                    Đặt lịch khám theo dịch vụ
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

                    {/* Dịch vụ */}
                    <div>
                        <label className="block font-semibold mb-2">Dịch vụ</label>
                        {!selectedService ? (
                            <div
                                onClick={() => setShowServiceSheet(true)}
                                className="w-full border rounded px-3 py-2 cursor-pointer hover:border-green-600 text-gray-500"
                            >
                                Chọn dịch vụ
                            </div>
                        ) : (
                            <div
                                onClick={() => setShowServiceSheet(true)}
                                className="w-full border rounded px-3 py-3 cursor-pointer hover:border-green-600"
                            >
                                <div className="font-semibold text-green-700">
                                    {selectedService.ServiceName}
                                </div>
                                <div className="text-sm text-gray-600">
                                    Chuyên khoa: {selectedService.SpecialtyName}
                                </div>
                                {selectedDate && selectedTimeLabel && (
                                    <div className="text-sm mt-1 text-blue-600 font-bold">
                                        Thời gian: {formatDateLabel(selectedDate)} – {selectedTimeLabel}
                                    </div>
                                )}
                                <div className="text-sm text-red-600 mt-1">
                                    Giá: {selectedService.Price.toLocaleString()}đ
                                </div>
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
                        disabled={bookingLoading || !selectedSlotId}
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                        {bookingLoading ? "Đang xử lý..." : "Xác nhận đặt lịch"}
                    </Button>
                </form>
            </div>

            {/* Sheet chọn dịch vụ */}
            {showServiceSheet && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">

                    <div className="bg-white w-[600px] max-h-[85%] rounded-2xl p-4 overflow-y-auto">

                        {/* Header chung */}
                        <div className="flex justify-between items-center mb-4 border-b pb-2">
                            <h2 className="text-lg font-semibold">{viewingService ? 'Chọn lịch khám' : 'Chọn dịch vụ'}</h2>
                            <button onClick={() => {
                                if (viewingService) setViewingService(null);
                                else setShowServiceSheet(false);
                            }} className="text-gray-500 hover:text-black">
                                {viewingService ? '← Quay lại' : '✕'}
                            </button>
                        </div>

                        {!viewingService ? (
                            // --- VIEW 1: DANH SÁCH DỊCH VỤ ---
                            <>
                                <div className="flex justify-center mb-4">
                                    <input
                                        type="text"
                                        placeholder="Tìm tên dịch vụ, chuyên khoa..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="border rounded px-2 py-1 w-full text-sm"
                                    />
                                </div>

                                {loading ? (
                                    <div className="text-center py-8 text-gray-500">Đang tải danh sách...</div>
                                ) : filteredServices.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">Không tìm thấy dịch vụ nào.</div>
                                ) : (
                                    <>
                                        {currentServices.map((srv) => (
                                            <div
                                                key={srv.ServiceID}
                                                onClick={() => handleViewService(srv)}
                                                className="flex items-center gap-3 p-3 border-b cursor-pointer hover:bg-gray-100 transition"
                                            >
                                                <div className="w-[60px] h-[60px]">
                                                    <DataThumbnail
                                                        src={srv.imageURL}
                                                        alt={srv.ServiceName}
                                                        fallbackType="service"
                                                        className="w-full h-full rounded-lg"
                                                    />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900">{srv.ServiceName}</div>
                                                    <div className="text-sm text-green-600 font-medium">Khoa: {srv.SpecialtyName}</div>
                                                    <div className="text-xs text-red-600">Giá: {srv.Price.toLocaleString()} VNĐ</div>
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
                            </>
                        ) : (
                            // --- VIEW 2: CHỌN LỊCH CỦA DỊCH VỤ ---
                            <>
                                {/* Info Dịch vụ */}
                                <div className="flex gap-4 mb-4 items-center">
                                    <div className="w-16 h-16">
                                        <DataThumbnail
                                            src={viewingService.imageURL}
                                            alt={viewingService.ServiceName}
                                            fallbackType="service"
                                            className="w-full h-full rounded-lg"
                                        />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-blue-700">
                                            {viewingService.ServiceName}
                                        </h3>
                                        <p className="text-sm text-gray-600">Khoa: {viewingService.SpecialtyName}</p>
                                        <p className="text-sm text-red-600 font-bold">Giá: {viewingService.Price.toLocaleString()} VNĐ</p>
                                    </div>
                                </div>

                                {/* Chọn ngày */}
                                <h4 className="font-semibold mb-2 text-gray-700">📅 Chọn ngày khám</h4>
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
                                        <p className="text-sm text-gray-400 italic">Chưa có lịch trống.</p>
                                    )}
                                </div>

                                {/* Chọn giờ */}
                                {selectedDate && (
                                    <div className="animate-fade-in">
                                        <h4 className="font-semibold mb-2 text-gray-700">⏰ Chọn giờ khám</h4>
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
                                        onClick={() => setShowServiceSheet(false)}
                                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        disabled={!selectedDate || !selectedSlotId}
                                        onClick={() => {
                                            setSelectedService(viewingService); // Chọn vào form chính
                                            setShowServiceSheet(false);
                                            setViewingService(null);
                                        }}
                                        className="bg-green-600 text-white py-2 px-6 rounded-lg font-bold hover:bg-green-700 disabled:opacity-50 transition"
                                    >
                                        Xác nhận chọn
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </LayoutBook>
    );
}

export default function ServiceBookingPage() {
    return (
        <Suspense fallback={<div className="text-center p-10 font-medium text-gray-600">Đang tải dữ liệu...</div>}>
            <ServiceBookingPageContent />
        </Suspense>
    );
}
