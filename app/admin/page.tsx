"use client";

import Link from "next/link";
import { FaUserMd, FaHospital, FaUsers, FaClipboardList, FaDollarSign, FaStar, FaCog } from 'react-icons/fa';
const cards = [
    { title: "Quản lí Tài khoản", href: "/admin/users", icon: FaUsers, description: "Tạo, sửa, vô hiệu hóa tài khoản bác sĩ, nhân viên và bệnh nhân." },
    { title: "Quản lí Bác sĩ", href: "/admin/doctor", icon: FaUserMd, description: "Quản lí hồ sơ, bằng cấp, và phân công chuyên khoa cho bác sĩ." },

    { title: "Quản lí Chuyên khoa", href: "/admin/specialties", icon: FaHospital, description: "Thêm, sửa, xóa các khoa/bộ phận trong phòng khám." },
    { title: "Quản lí Dịch vụ & Giá", href: "/admin/services", icon: FaDollarSign, description: "Thiết lập danh sách dịch vụ, giá tiền, và thời gian khám." },

    { title: "Quản lí Phản hồi & Đánh giá", href: "/admin/feedbacks", icon: FaStar, description: "Duyệt, ẩn hoặc xóa các đánh giá của bệnh nhân." },
    { title: "Quản lí Lịch hẹn Chung", href: "/admin/appointments", icon: FaClipboardList, description: "Giám sát tất cả các cuộc hẹn để giải quyết tranh chấp." },

    { title: "Quản lí thông báo", href: "/admin/notifications", icon: FaCog, description: "Cập nhật thông báo và quản lí các thông báo với các bệnh nhân." },
    { title: "Quản lí thời gian làm việc", href: "/admin/doctor_available", icon: FaCog, description: "Cập nhật lịch rảnh của bác sĩ." },
];

export default function AdminPage() {
    return (
        <main className="min-h-screen bg-gray-50 p-8">
            <h1 className="text-4xl font-bold mb-8 text-center text-gray-800">Cổng Quản Trị Hệ Thống</h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
                {cards.map((card, index) => (
                    <Link
                        key={index}
                        href={card.href}
                        className="flex flex-col items-start p-6 bg-white rounded-xl shadow-lg hover:shadow-2xl hover:scale-[1.02] transition-transform duration-300 border-t-4 border-blue-600 group"
                    >
                        <div className="flex items-center mb-3">
                            <card.icon className="w-6 h-6 mr-3 text-blue-600 group-hover:text-blue-700" />
                            <span className="text-xl font-bold text-gray-800">{card.title}</span>
                        </div>
                        <p className="text-sm text-gray-500">{card.description}</p>
                    </Link>
                ))}
            </div>
        </main>
    );
}
