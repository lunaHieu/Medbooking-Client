"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";
import LayoutBook from "@/components/layoutBook";
import * as Api from "@/lib/ApiClient";
import { FaTimes } from "react-icons/fa";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const [showForgotModal, setShowForgotModal] = useState(false);

  // Dữ liệu nhập liệu
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Trạng thái xử lý Modal
  const [modalLoading, setModalLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [modalMessage, setModalMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Check Ghi nhớ đăng nhập
  useEffect(() => {
    const savedUser = localStorage.getItem("saved_username");
    if (savedUser) {
      setUsername(savedUser);
      setRememberMe(true);
    }
  }, []);

  //Xử lý Đăng nhập
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username || !password) {
      setError("Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu!");
      return;
    }

    setIsLoading(true);

    try {
      const response = await Api.login({ username, password });

      if (response.token) {
        localStorage.setItem("user", JSON.stringify(response.user));

        // Logic Ghi nhớ
        if (rememberMe) {
          localStorage.setItem("saved_username", username);
        } else {
          localStorage.removeItem("saved_username");
        }

        localStorage.setItem('isLoggedIn', new Date().toISOString());

        const role = response.user.Role;
        switch (role) {
          case "QuanTriVien":
            router.push("/admin");
            break;
          case "BacSi":
            router.push("/doctor");
            break;
          case "NhanVien":
            router.push("/staff");
            break;
          default:
            router.push("/dat-lich");
            break;
        }
      } else {
        setError("Không nhận được token xác thực.");
      }
    } catch (err) {
      console.error("Login failed:", err);
      const error = err as AxiosError<{ message: string }>;
      const msg =
        error.response?.data?.message || error.message || "Đăng nhập thất bại.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetOtp = async () => {
    if (!forgotEmail) {
      setModalMessage({ type: "error", text: "Vui lòng nhập Email trước!" });
      return;
    }
    setOtpLoading(true);
    setModalMessage(null);
    try {
      await Api.sendOtp(forgotEmail);

      setModalMessage({
        type: "success",
        text: "Đã gửi mã OTP vào email của bạn!",
      });
    } catch {
      setModalMessage({
        type: "error",
        text: "Lỗi gửi mã. Kiểm tra lại email.",
      });
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSubmitReset = async () => {
    setModalMessage(null);

    if (!forgotEmail || !forgotOtp || !newPassword || !confirmPassword) {
      setModalMessage({
        type: "error",
        text: "Vui lòng nhập đầy đủ thông tin!",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setModalMessage({ type: "error", text: "Mật khẩu nhập lại không khớp!" });
      return;
    }

    setModalLoading(true);
    try {
      await Api.resetPassword({
        email: forgotEmail,
        otp: forgotOtp,
        password: newPassword,
      });
      alert("Đổi mật khẩu thành công! Hãy đăng nhập lại.");

      // Reset và đóng modal
      setShowForgotModal(false);
      setForgotEmail("");
      setForgotOtp("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      const message = err instanceof AxiosError ? err.message : "Lỗi hệ thống.";
      setModalMessage({ type: "error", text: message });
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <LayoutBook>
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white shadow-md rounded-lg p-8 w-full max-w-md border border-gray-100">
          <h1 className="text-2xl font-bold text-green-700 text-center mb-6">
            Đăng Nhập
          </h1>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Tên đăng nhập
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-green-500"
                placeholder="Nhập tên đăng nhập"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Mật khẩu
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-green-500"
                placeholder="••••••••"
                disabled={isLoading}
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <span className="ml-2 text-gray-600">Ghi nhớ</span>
              </label>

              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-green-600 font-medium hover:text-green-800 hover:underline"
              >
                Quên mật khẩu?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full text-white py-2.5 rounded-lg font-bold transition flex justify-center items-center ${
                isLoading
                  ? "bg-green-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700 shadow-md"
              }`}
            >
              {isLoading ? "Đang xử lý..." : "Đăng Nhập"}
            </button>
          </form>

          <p className="text-sm text-center mt-6 text-gray-600">
            Chưa có tài khoản?{" "}
            <a
              href="/register"
              className="text-green-600 font-bold hover:underline"
            >
              Đăng ký ngay
            </a>
          </p>
        </div>

        {showForgotModal && (
          <div className="fixed inset-0 bg-opacity-60 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up">
              <div className="bg-green-600 p-4 flex justify-between items-center text-white">
                <h3 className="text-lg font-bold">Lấy lại mật khẩu</h3>
                <button
                  onClick={() => setShowForgotModal(false)}
                  className="hover:text-red-200"
                >
                  <FaTimes size={20} />
                </button>
              </div>

              <div className="p-6">
                <p className="text-sm text-gray-600 mb-4 italic">
                  * Nhập email và nhấn Lấy mã. Sau đó điền mã OTP và mật khẩu
                  mới.
                </p>

                {modalMessage && (
                  <div
                    className={`mb-4 p-3 rounded text-sm font-semibold ${
                      modalMessage.type === "success"
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-red-50 text-red-600 border border-red-200"
                    }`}
                  >
                    {modalMessage.text}
                  </div>
                )}

                <div className="border border-gray-200 rounded-lg overflow-hidden mb-6">
                  <table className="w-full text-sm text-left">
                    <tbody>
                      <tr className="border-b border-gray-100">
                        <td className="bg-gray-50 p-3 font-semibold text-gray-700 w-1/3 align-middle">
                          Email
                        </td>
                        <td className="p-2 flex gap-2">
                          <input
                            type="email"
                            value={forgotEmail}
                            onChange={(e) => setForgotEmail(e.target.value)}
                            className="flex-1 border border-gray-300 rounded px-2 py-1.5 focus:outline-green-500"
                            placeholder="Nhập email..."
                          />
                          <button
                            type="button"
                            onClick={handleGetOtp}
                            disabled={otpLoading}
                            className="bg-blue-500 text-white px-3 py-1.5 rounded hover:bg-blue-600 text-xs font-bold whitespace-nowrap disabled:bg-gray-300"
                          >
                            {otpLoading ? "..." : "Lấy mã"}
                          </button>
                        </td>
                      </tr>

                      <tr className="border-b border-gray-100">
                        <td className="bg-gray-50 p-3 font-semibold text-gray-700 align-middle">
                          Mã OTP
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={forgotOtp}
                            onChange={(e) => setForgotOtp(e.target.value)}
                            className="w-full border border-gray-300 rounded px-2 py-1.5 focus:outline-green-500 font-bold tracking-widest"
                            placeholder="VD: 123456"
                          />
                        </td>
                      </tr>

                      <tr className="border-b border-gray-100">
                        <td className="bg-gray-50 p-3 font-semibold text-gray-700 align-middle">
                          Mật khẩu mới
                        </td>
                        <td className="p-2">
                          <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full border border-gray-300 rounded px-2 py-1.5 focus:outline-green-500"
                            placeholder="Mật khẩu mới..."
                          />
                        </td>
                      </tr>

                      <tr>
                        <td className="bg-gray-50 p-3 font-semibold text-gray-700 align-middle">
                          Nhập lại mật khẩu
                        </td>
                        <td className="p-2">
                          <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full border border-gray-300 rounded px-2 py-1.5 focus:outline-green-500"
                            placeholder="Xác nhận lại..."
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <button
                  onClick={handleSubmitReset}
                  disabled={modalLoading}
                  className="w-full bg-green-500 text-white py-3 rounded-lg font-bold hover:bg-green-600 shadow-md transition disabled:bg-gray-400"
                >
                  {modalLoading ? "Đang xử lý..." : "GỬI YÊU CẦU ĐỔI MẬT KHẨU"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </LayoutBook>
  );
}
