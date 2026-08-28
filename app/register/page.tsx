"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import LayoutBook from "@/components/layoutBook";
import { register } from "@/lib/ApiClient";
import { AxiosError } from "axios";

export default function RegisterPage() {
    const [name, setName] = useState("");
    const [dob, setDob] = useState("");
    const [gender, setGender] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [address, setAddress] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const router = useRouter();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!name || !dob || !gender || !phone || !email || !address || !username || !password || !confirmPassword) {
            setError("Vui lòng nhập đầy đủ thông tin!");
            return;
        }

        if (password !== confirmPassword) {
            setError("Mật khẩu nhập lại không khớp!");
            return;
        }

        setIsLoading(true);

        try {
            const formData = new FormData();

            formData.append("FullName", name);
            formData.append("DateOfBirth", dob);
            formData.append("Gender", gender);
            formData.append("PhoneNumber", phone);
            formData.append("Address", address);

            formData.append("Email", email);
            formData.append("Username", username);
            formData.append("password", password);

            formData.append("password_confirmation", confirmPassword);
            formData.append("Role", "BenhNhan");

            await register(formData);

            alert("Đăng ký thành công! Bạn có thể đăng nhập ngay bây giờ.");
            router.push("/login");

        } catch (err) {

            const error = err as AxiosError<{ message: string; errors?: Record<string, string[]> }>;
            console.error("Register Error:", error);

            let msg = "Đăng ký thất bại. Vui lòng thử lại.";

            if (error.response?.data) {
                if (error.response.data.message) {
                    msg = error.response.data.message;
                }
                if (error.response.data.errors) {
                    const firstErrorKey = Object.keys(error.response.data.errors)[0];
                    if (firstErrorKey) {
                        // Truy cập phần tử đầu tiên của mảng lỗi
                        msg = error.response.data.errors[firstErrorKey][0];
                    }
                }
            }
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <LayoutBook>
            <div className="min-h-screen flex items-center justify-center bg-gray-50 py-10">
                <div className="bg-white shadow-md rounded-lg p-8 w-full max-w-4xl">
                    <h1 className="text-2xl font-bold text-green-700 text-center mb-6">Đăng Ký Tài Khoản</h1>

                    {error && (
                        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleRegister} className="space-y-4">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                                <label className="block text-sm font-medium mb-1">Họ tên <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
                                    placeholder="Nhập họ tên"
                                    disabled={isLoading}
                                />
                            </div>

                            <div className="flex-1">
                                <label className="block text-sm font-medium mb-1">Ngày sinh <span className="text-red-500">*</span></label>
                                <input
                                    type="date"
                                    value={dob}
                                    onChange={(e) => setDob(e.target.value)}
                                    className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                                <label className="block text-sm font-medium mb-1">Giới tính <span className="text-red-500">*</span></label>
                                <select
                                    value={gender}
                                    onChange={(e) => setGender(e.target.value)}
                                    className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600 bg-white"
                                    disabled={isLoading}
                                >
                                    <option value="">Chọn giới tính</option>
                                    <option value="Nam">Nam</option>
                                    <option value="Nu">Nữ</option>
                                    <option value="Khac">Khác</option>
                                </select>
                            </div>

                            <div className="flex-1">
                                <label className="block text-sm font-medium mb-1">Số điện thoại <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
                                    placeholder="Nhập số điện thoại"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                                <label className="block text-sm font-medium mb-1">Email <span className="text-red-500">*</span></label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
                                    placeholder="Nhập email"
                                    disabled={isLoading}
                                />
                            </div>

                            <div className="flex-1">
                                <label className="block text-sm font-medium mb-1">Địa chỉ <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
                                    placeholder="Nhập địa chỉ"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                                <label className="block text-sm font-medium mb-1">Tên đăng nhập <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
                                    placeholder="Nhập tên đăng nhập"
                                    disabled={isLoading}
                                />
                            </div>

                            <div className="flex-1">
                                <label className="block text-sm font-medium mb-1">Mật khẩu <span className="text-red-500">*</span></label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
                                    placeholder="Nhập mật khẩu"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Nhập lại mật khẩu <span className="text-red-500">*</span></label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
                                placeholder="Nhập lại mật khẩu"
                                disabled={isLoading}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full text-white py-2 rounded-md transition flex justify-center items-center ${isLoading
                                ? "bg-gray-400 cursor-not-allowed"
                                : "bg-green-700 hover:bg-green-800"
                                }`}
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Đang xử lý...
                                </>
                            ) : (
                                "Đăng Ký"
                            )}
                        </button>
                    </form>

                    <p className="text-sm text-center mt-4">
                        Đã có tài khoản? <a href="/login" className="text-green-700 hover:underline">Đăng nhập ngay</a>
                    </p>
                </div>
            </div>
        </LayoutBook>
    );
}
