"use client";
import { useEffect, useState } from "react";
import LayoutUsers from "@/components/layoutUsers";
import * as Api from "@/lib/ApiClient";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Lock } from "lucide-react";
import { handleError } from "@/lib/utils";
export default function ProfilePage() {
    const [formData, setFormData] = useState({
        FullName: "",
        DateOfBirth: "",
        Gender: "",
        PhoneNumber: "",
        Email: "",
        Address: "",
    });
    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [loading, setLoading] = useState(true);
    const [openPasswordModal, setOpenPasswordModal] = useState(false);
    const formatDate = (dateStr: string | null | undefined, toDisplay: boolean = false): string => {
        if (!dateStr) return "";
        const isoDate = dateStr.split("T")[0];
        if (toDisplay) {
            const [year, month, day] = isoDate.split("-");
            return `${day}/${month}/${year}`;
        }

        return isoDate;
    };
    //Load dữ liệu từ API khi vào trang
    useEffect(() => {
        const token = localStorage.getItem('api_token');
        if (!token) return;
        const fetchProfile = async () => {
            try {
                const userData = await Api.getMe();
                setFormData({
                    FullName: userData.FullName || "",
                    DateOfBirth: formatDate(userData.DateOfBirth),
                    Gender: userData.Gender || "",
                    PhoneNumber: userData.PhoneNumber || "",
                    Email: userData.Email || "",
                    Address: userData.Address || "",
                });
            } catch (error) {
                console.error("Lỗi tải thông tin:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    //Xử lý nhập liệu
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    //Lưu thông tin lên Server
    const handleSave = async () => {
        try {
            await Api.updateProfile(formData);
            alert("Cập nhật thông tin thành công!");
        } catch (error) {
            console.log(error);
            alert("Có lỗi xảy ra khi lưu thông tin.");
        }
    };

    const handleChangePassword = async () => {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            alert("Xác nhận mật khẩu mới không khớp!");
            return;
        }

        try {
            const res = await Api.changePassword({
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword,
                confirmPassword: passwordData.confirmPassword
            });

            if (res.success) {
                alert("Đổi mật khẩu thành công!");
                setOpenPasswordModal(false);
                setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
            }
        } catch (error: unknown) {
            handleError(error, "Lỗi khi lưu thông tin cá nhân.");
        }
    };
    if (loading) {
        return (
            <LayoutUsers>
                <div className="min-h-screen p-8 bg-gray-50 flex justify-center">
                    Đang tải...
                </div>
            </LayoutUsers>
        );
    }

    return (
        <LayoutUsers>
            <div className="min-h-screen p-8 bg-gray-50">
                <h1 className="text-2xl font-bold text-green-700 mb-6">Thông tin cá nhân</h1>
                <Dialog open={openPasswordModal} onOpenChange={setOpenPasswordModal}>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="flex items-center gap-2">
                            <Lock className="w-4 h-4" /> Đổi mật khẩu
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] bg-white">
                        <DialogHeader>
                            <DialogTitle className="text-green-700">Đổi mật khẩu mới</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Mật khẩu hiện tại</label>
                                <input
                                    type="password"
                                    className="w-full border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-green-500"
                                    value={passwordData.currentPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Mật khẩu mới</label>
                                <input
                                    type="password"
                                    className="w-full border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-green-500"
                                    value={passwordData.newPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Xác nhận mật khẩu mới</label>
                                <input
                                    type="password"
                                    className="w-full border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-green-500"
                                    value={passwordData.confirmPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                />
                            </div>
                            <Button onClick={handleChangePassword} className="w-full bg-green-700 hover:bg-green-800">
                                Xác nhận đổi mật khẩu
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
                <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Họ và tên</label>
                            <input
                                name="FullName"
                                value={formData.FullName}
                                onChange={handleChange}
                                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Ngày sinh</label>
                            <input
                                name="DateOfBirth"
                                type="date"
                                value={formData.DateOfBirth}
                                onChange={handleChange}
                                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Giới tính</label>
                            <select
                                name="Gender"
                                value={formData.Gender}
                                onChange={handleChange}
                                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600 bg-white"
                            >
                                <option value="">Chọn giới tính</option>
                                <option value="Nam">Nam</option>
                                <option value="Nữ">Nữ</option>
                                <option value="Khác">Khác</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Số điện thoại</label>
                            <input
                                name="PhoneNumber"
                                value={formData.PhoneNumber}
                                onChange={handleChange}
                                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Email</label>
                            <input
                                name="Email"
                                type="email"
                                value={formData.Email}
                                onChange={handleChange}
                                disabled
                                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600 bg-gray-50 text-gray-500 cursor-not-allowed"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Địa chỉ</label>
                            <input
                                name="Address"
                                value={formData.Address}
                                onChange={handleChange}
                                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
                            />
                        </div>
                    </div>

                    <Button
                        onClick={handleSave}
                        className="mt-4 bg-green-700 text-white py-2 px-4 rounded-md hover:bg-green-800 transition"
                    >
                        Lưu thông tin
                    </Button>
                </div>
            </div>
        </LayoutUsers >
    );
}
