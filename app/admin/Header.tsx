"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { logout } from "@/lib/ApiClient"; // Import hàm logout từ API
import { LogOut, Home } from "lucide-react"; // Icon cho đẹp

export default function Header() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (!confirm("Bạn có chắc chắn muốn đăng xuất khỏi trang quản trị?"))
      return;

    setIsLoggingOut(true);

    try {
      await logout();
    } catch (error) {
      console.error("Lỗi khi gọi API logout:", error);
    }
    localStorage.removeItem("api_token");
    localStorage.removeItem("token");
    localStorage.removeItem("user_role");
    localStorage.removeItem("username");

    document.cookie = "token=; path=/; max-age=0";
    document.cookie = "api_token=; path=/; max-age=0";

    router.push("/login");

    // window.location.href = "/login";
  };

  return (
    <header className="bg-gradient-to-r from-blue-600 to-indigo-500 text-white shadow-md sticky top-0 z-50">
      <div className="max-w-8xl mx-auto flex justify-between items-center p-4">
        {/* Logo / Tên hệ thống */}
        <Link href="/" className="hover:opacity-80 flex items-center gap-2">
          <h1 className="text-xl font-bold">HUNRE Hospital</h1>
        </Link>

        {/* Các nút hành động bên phải */}
        <div className="flex items-center space-x-6">
          {/* Link ra trang chủ Website*/}
          <Link
            href="/admin"
            className="flex items-center gap-2 hover:bg-white/20 px-3 py-1.5 rounded-md transition text-sm font-medium"
          >
            <Home className="w-4 h-4" />
            <span>Xem Quản Trị</span>
          </Link>

          {/* Nút Đăng xuất */}
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center gap-2 bg-red-500 hover:bg-red-600 px-4 py-1.5 rounded-md transition text-sm font-bold shadow-sm disabled:opacity-50"
          >
            {isLoggingOut ? (
              <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
            ) : (
              <LogOut className="w-4 h-4" />
            )}
            <span>{isLoggingOut ? "Đang thoát..." : "Đăng xuất"}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
