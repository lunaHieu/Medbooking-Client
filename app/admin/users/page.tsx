"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";
import { AxiosError } from "axios";
import { Search } from "lucide-react";
import * as Api from "@/lib/ApiClient";
import * as Model from "@/lib/model";
import { getFullImageUrl } from "@/lib/utils";
import DataThumbnail from "@/components/thumnail/DataThumbnail";

const ROLE_LABELS: Record<string, string> = {
  BenhNhan: "Bệnh nhân",
  BacSi: "Bác sĩ",
  NhanVien: "Nhân viên",
  QuanTriVien: "Quản trị viên",
};

const STATUS_LABELS: Record<string, string> = {
  HoatDong: "Hoạt động",
  Khoa: "Đã khóa",
  ChoDuyet: "Chờ duyệt",
};

const ROLES = ["BenhNhan", "BacSi", "NhanVien", "QuanTriVien"];
const STATUSES = ["HoatDong", "Khoa"];
const USERS_PER_PAGE = 10;

//Model Form
interface UserFormProps {
  user: Model.User | null;
  onClose: () => void;
  onSuccess: () => void;
}

const UserFormModal: React.FC<UserFormProps> = ({
  user,
  onClose,
  onSuccess,
}) => {
  const isEdit = !!user;
  const [loading, setLoading] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // State Form
  const [formData, setFormData] = useState({
    FullName: user?.FullName || "",
    Email: user?.Email || "",
    Username: user?.Username || "",
    PhoneNumber: user?.PhoneNumber || "",
    Role: user?.Role || "BenhNhan",
    Status: user?.Status || "HoatDong",
    Password: "",
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string>(
    user?.avatar_url
      ? getFullImageUrl(user.avatar_url)
      : ""
  );
  useEffect(() => {
    if (user) {
      setFormData({
        FullName: user.FullName,
        Email: user.Email || "",
        Username: user.Username,
        PhoneNumber: user.PhoneNumber,
        Role: user.Role,
        Status: user.Status,
        Password: "",
      });

      // Cập nhật ảnh preview
      const av = user.avatar_url;
      setPreviewUrl(av ? getFullImageUrl(av) : "");
    } else {
      setFormData({
        FullName: "",
        Email: "",
        Username: "",
        PhoneNumber: "",
        Role: "BenhNhan",
        Status: "HoatDong",
        Password: "",
      });
      setPreviewUrl("");
      setSelectedFile(null);
    }
  }, [user]);
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreviewUrl("");
    const fileInput = document.getElementById(
      "userFileInput"
    ) as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!isEdit && !formData.Password) {
      alert("Vui lòng nhập mật khẩu cho tài khoản mới.");
      setLoading(false);
      return;
    }

    if (!formData.Username.trim()) {
      alert("Vui lòng nhập Tên đăng nhập.");
      setLoading(false);
      return;
    }

    try {
      const data = new FormData();
      data.append("FullName", formData.FullName);
      data.append("Email", formData.Email);
      data.append("Username", formData.Username);
      data.append("PhoneNumber", formData.PhoneNumber);
      data.append("Role", formData.Role);
      data.append("Status", formData.Status);

      if (formData.Password && (isResettingPassword || !isEdit)) {
        data.append("password", formData.Password);
      }

      if (selectedFile && isEdit) {
        data.append("avatar", selectedFile);
      }

      if (isEdit && user) {
        await Api.adminUpdateUser(user.UserID, data);
        alert("Cập nhật thành công!");
      } else {
        await Api.adminCreateUser(data);
        alert("Tạo người dùng mới thành công!");
      }

      onSuccess();
    } catch (error) {
      if (error instanceof AxiosError) {
        console.error("Error:", error);
        const msg = error.response?.data?.message || "Có lỗi xảy ra!";
        alert("" + msg);
      } else {
        console.error("Unexpected Error:", error);
        alert("Có lỗi không xác định xảy ra!");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex justify-center items-center z-50 p-4 backdrop-blur-sm bg-black/30">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-gray-100">
        <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50 rounded-t-2xl sticky top-0 z-10">
          <h2 className="text-xl font-bold text-gray-800">
            {isEdit ? "Sửa Thông Tin Người Dùng" : "Thêm Người Dùng Mới"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-500 text-3xl leading-none"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Họ và Tên <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  name="FullName"
                  value={formData.FullName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên đăng nhập <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  name="Username"
                  value={formData.Username}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 outline-none"
                  placeholder="VD: nguyenvan_a"
                  disabled={isEdit}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="email"
                  name="Email"
                  value={formData.Email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 outline-none"
                  disabled={isEdit}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số điện thoại <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="tel"
                  name="PhoneNumber"
                  value={formData.PhoneNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                {(isResettingPassword || !isEdit) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {!isEdit ? "Mật khẩu *" : "Mật khẩu mới"}
                    </label>
                    <input
                      type="password"
                      name="Password"
                      value={formData.Password}
                      onChange={handleChange}
                      required={!isEdit}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 outline-none bg-blue-50"
                      placeholder="******"
                    />
                  </div>
                )}
                {isEdit && !isResettingPassword && (
                  <button
                    type="button"
                    onClick={() => setIsResettingPassword(true)}
                    className="text-sm text-blue-600 hover:underline mt-2 font-medium flex items-center"
                  >
                    Đổi mật khẩu
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vai trò <span className="text-red-500">*</span>
                </label>
                <select
                  name="Role"
                  value={formData.Role}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 outline-none bg-white cursor-pointer"
                  disabled={isEdit && (user?.Role === "QuanTriVien" || user?.Role === "BacSi")}
                >
                  {ROLES.filter((role) =>
                    role !== "BacSi" || user?.Role === "BacSi"
                  ).map((role) => (
                    <option key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trạng thái
                </label>
                <select
                  name="Status"
                  value={formData.Status}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 outline-none bg-white"
                >
                  {STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ảnh đại diện
                </label>
                <div className="flex items-center space-x-3 p-2 border border-dashed rounded-lg bg-gray-50">
                  <div className="w-12 h-12 rounded-full overflow-hidden border bg-white flex-shrink-0 relative">
                    <Image
                      src={
                        previewUrl || "https://placehold.co/100x100?text=User"
                      }
                      alt="Avatar"
                      fill
                      sizes="48px"
                      className="object-cover"
                      onError={() =>
                        setPreviewUrl("https://placehold.co/100x100?text=Err")
                      }
                      unoptimized={true}
                    />
                  </div>
                  <div className="flex flex-col w-full">
                    <input
                      id="userFileInput"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                    />
                    {previewUrl && (
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="text-xs text-red-500 hover:text-red-700 font-semibold text-left mt-1 w-fit"
                      >
                        Xóa ảnh
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-md flex items-center transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="mr-2 animate-spin"></span> Đang lưu...
                </>
              ) : (
                <>
                  <span className="mr-2"></span>{" "}
                  {isEdit ? "Lưu thay đổi" : "Tạo người dùng"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

//Main
export default function UserManagementPage() {
  const [users, setUsers] = useState<Model.User[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Model.User | null>(null);

  //Load Data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const usersData = await Api.adminGetUsers(
        filterRole || undefined,
        searchQuery || undefined,
      );
      setUsers(usersData);
    } catch (error) {
      console.error("Lỗi tải dữ liệu:", error);
    } finally {
      setLoading(false);
    }
  }, [filterRole, searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 500);
    return () => clearTimeout(timer);
  }, [loadData]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterRole, searchQuery]);

  //Handlers
  const handleOpenModal = (user: Model.User | null = null) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleModalSuccess = () => {
    setIsModalOpen(false);
    loadData();
  };

  const handleDelete = async (userId: number) => {
    //Tìm thông tin người dùng trong danh sách hiện tại
    const userToDelete = users.find((user) => user.UserID === userId);
    if (!userToDelete) return;

    const uName = userToDelete.FullName || "Chưa cập nhật";
    if (
      confirm(
        `Bạn có chắc chắn muốn KHÓA tài khoản "${uName}" không?`
      )
    ) {
      try {
        const data = new FormData();
        data.append("Status", "Khoa"); // Chuyển trạng thái sang Khóa

        data.append("FullName", uName);
        data.append("Username", userToDelete.Username);
        data.append("PhoneNumber", userToDelete.PhoneNumber);
        data.append("Role", userToDelete.Role);

        await Api.adminUpdateUser(userId, data);

        //Cập nhật giao diện
        setUsers((prev) =>
          prev.map((user) => (user.UserID === userId ? { ...user, Status: "Khoa" } : user))
        );
        alert("Đã khóa tài khoản thành công.");
      } catch (error) {
        console.error(error);
        alert("Thao tác thất bại.");
      }
    }
  };

  const handleToggleStatus = async (userItem: Model.User) => {
    const newStatus = userItem.Status === "HoatDong" ? "Khoa" : "HoatDong";
    const actionName = newStatus === "Khoa" ? "KHÓA" : "KÍCH HOẠT";
    const uName = userItem.FullName || "Chưa cập nhật";

    if (confirm(`Bạn có muốn ${actionName} tài khoản "${uName}"?`)) {
      try {
        const data = new FormData();
        data.append("Status", newStatus);
        data.append("FullName", uName);
        data.append("Role", userItem.Role);
        data.append("Username", userItem.Username);
        data.append("PhoneNumber", userItem.PhoneNumber);

        await Api.adminUpdateUser(userItem.UserID, data);
        setUsers((prev) =>
          prev.map((user) =>
            user.UserID === userItem.UserID ? { ...user, Status: newStatus } : user
          )
        );
      } catch {
        alert("Thao tác thất bại.");
      }
    }
  };

  // Pagination
  const totalPages = Math.ceil(users.length / USERS_PER_PAGE);
  const currentUsers = useMemo(() => {
    const start = (currentPage - 1) * USERS_PER_PAGE;
    return users.slice(start, start + USERS_PER_PAGE);
  }, [users, currentPage]);

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen font-sans">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
          Quản lý Người dùng
        </h1>
        <button
          onClick={() => handleOpenModal()}
          className="bg-blue-600 text-white text-xl px-6 py-3 rounded-xl hover:bg-blue-700 shadow-lg font-bold transition flex items-center"
        >
          <span className="mr-2 text-xl">+</span> Thêm Người Dùng
        </button>
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-sm mb-6 border border-gray-100 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <div className="flex-grow w-full md:w-auto relative">
            <input
              type="text"
              placeholder="Tìm theo tên, email, số điện thoại..."
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="w-full md:w-64 relative">
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer bg-white appearance-none"
          >
            <option value="">Tất cả vai trò</option>
            {ROLES.map((role) => (
              <option key={role} value={role}>
                {ROLE_LABELS[role]}
              </option>
            ))}
          </select>
          <span className="absolute right-4 top-3.5 text-gray-400 pointer-events-none"></span>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
        {loading ? (
          <div className="p-16 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-100 border-t-blue-600 mx-auto mb-4"></div>
            <span className="text-gray-500">Đang tải dữ liệu...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase w-16">
                    ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">
                    Người dùng
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">
                    Vai trò
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">
                    Trạng thái
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {currentUsers.map((user) => {
                  const uid = user.UserID;
                  const uName = user.FullName;
                  const uRole = user.Role;
                  const uStatus = user.Status;
                  const uAvatar = user.avatar_url || "";
                  return (
                    <tr
                      key={uid}
                      className="hover:bg-blue-50 transition group"
                    >
                      <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                        #{uid}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <DataThumbnail
                            src={uAvatar}
                            alt={uName}
                            fallbackType="user"
                            className="h-10 w-10 rounded-full border mr-3"
                          />

                          <div>
                            <div className="text-sm font-bold text-gray-900">
                              {uName}
                            </div>
                            <div className="text-xs text-gray-500">
                               @{user.Username}
                            </div>
                            <div className="text-xs text-gray-400">{user.Email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold
                          ${
                            uRole === "QuanTriVien"
                              ? "bg-purple-100 text-purple-800"
                              : uRole === "BacSi"
                              ? "bg-blue-100 text-blue-800"
                              : uRole === "NhanVien"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                          }
                        `}
                        >
                          {ROLE_LABELS[uRole] || uRole}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer hover:opacity-80
                          ${
                            uStatus === "HoatDong"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }
                        `}
                          onClick={() => handleToggleStatus(user)}
                          title="Bấm để đổi trạng thái"
                        >
                          {STATUS_LABELS[uStatus] || uStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-3">
                        <button
                          onClick={() => handleOpenModal(user)}
                          className="text-blue-600 hover:text-blue-800 font-bold hover:underline text-sm"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDelete(uid)}
                          className="text-red-600 hover:text-red-800 font-bold hover:underline text-sm"
                          disabled={uRole === "QuanTriVien"}
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {currentUsers.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-10 text-center text-gray-500"
                    >
                      Không tìm thấy kết quả.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="mt-6 flex justify-end gap-2">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((p) => p - 1)}
          className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-100"
        >
          Trước
        </button>
        <span className="px-3 py-1 font-bold text-gray-600">
          Trang {currentPage}/{totalPages || 1}
        </span>
        <button
          disabled={currentPage >= totalPages}
          onClick={() => setCurrentPage((p) => p + 1)}
          className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-100"
        >
          Sau
        </button>
      </div>

      {isModalOpen && (
        <UserFormModal
          user={selectedUser}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
}
