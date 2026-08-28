"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Layout from "@/components/layout";
import { RefreshCw } from "lucide-react";
import * as Api from "@/lib/ApiClient";
import DataThumbnail from "@/components/thumnail/DataThumbnail";
import * as Model from "@/lib/model";
import { handleError } from "@/lib/utils";
interface DoctorUI extends Model.Doctor {
  schedule?: { [key: string]: string[] };
  price?: number;
  hospital?: string;
  location?: string;
}
export default function DoctorsBookingPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchTrigger, setSearchTrigger] = useState("");
  const [showCategory, setShowCategory] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  // dữ liệu từ backend
  const [doctors, setDoctors] = useState<DoctorUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [viewDoctor, setViewDoctor] = useState<DoctorUI | null>(null);

  const [categories, setCategories] = useState<string[]>(["Tất cả danh mục"]);

  // const priceRanges = [
  //   { label: "Dưới 300k", value: "0-300000" },
  //   { label: "300k - 500k", value: "300000-500000" },
  //   { label: "Trên 500k", value: "500000+" },
  // ];

  //Load danh sách bác sĩ từ backend
  useEffect(() => {
    async function loadDoctors() {
      console.log("1. Bắt đầu gọi API...");
      try {
        setLoading(true);
        setError(null);
        console.log(
          "Địa chỉ API hiện tại là:",
          process.env.NEXT_PUBLIC_API_URL,
        );
        const [doctorsData, specialtiesData] = await Promise.all([
          Api.getDoctors(),

          Api.getSpecialties(),
        ]);

        const docsWithUI: DoctorUI[] = (doctorsData || []).map((d) => ({
          ...d,
          // price: 300000,
          hospital: "Bệnh viện HUNRE",
          location: "Hà Nội",
          schedule: {},
        }));

        setDoctors(docsWithUI);
        const specNames = (specialtiesData || []).map(
          (s) => s?.SpecialtyName || "",
        );
        setCategories(["Tất cả danh mục", ...specNames]);
      } catch (error) {
        handleError(error, "Lỗi tải ảnh!");
      } finally {
        setLoading(false);
      }
    }

    loadDoctors();
  }, []);

  //Filter & Pagination
  const toggleCategory = (cat: string) => {
    if (cat === "Tất cả danh mục") {
      setSelectedCategories([]);
      return;
    }
    if (selectedCategories.includes(cat)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== cat));
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
    setCurrentPage(1);
  };

  const filtered = doctors.filter((doc) => {
    // Truy cập user.FullName
    const matchName = (doc?.user?.FullName || "")
      .toLowerCase()
      .includes((searchTrigger || "").toLowerCase());
    // Truy cập specialty.SpecialtyName
    const docSpecName = doc.specialty?.SpecialtyName || "";
    const matchDept =
      selectedCategories.length === 0 ||
      selectedCategories.includes(docSpecName);

    // const price = doc.price || 300000;
    // const matchPrice =
    //   priceRange === "" ||
    //   (priceRange.includes("-") &&
    //     price >= parseInt(priceRange.split("-")[0]) &&
    //     price <= parseInt(priceRange.split("-")[1])) ||
    //   (priceRange === "500000+" && price > 500000);

    return matchName && matchDept;
  });

  const doctorsPerPage = 5;
  const totalPages = Math.ceil(filtered.length / doctorsPerPage) || 1;
  const startIndex = (currentPage - 1) * doctorsPerPage;
  const paginatedDoctors = filtered.slice(
    startIndex,
    startIndex + doctorsPerPage,
  );

  return (
    <Layout>
      <div className="w-300 mx-auto px-4 py-6">
        {/* Thanh tìm kiếm */}
        <div className="bg-green-600 p-2 rounded-md shadow">
          <div className="flex flex-col justify-center items-center gap-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Tìm kiếm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-128 px-4 py-2 border rounded-md bg-white focus:outline-none"
              />
              <button
                className="px-4 py-2 bg-white rounded-md font-medium hover:bg-gray-100"
                onClick={() => {
                  setSearchTrigger(searchTerm);
                  setCurrentPage(1);
                }}
              >
                Tìm kiếm
              </button>

              <button
                className="p-2 bg-green-500 text-white rounded-md hover:bg-green-700 flex items-center justify-center"
                onClick={() => {
                  setSearchTerm("");
                  setSearchTrigger("");
                  setSelectedCategories([]);
                  setCurrentPage(1);
                }}
                title="Reset bộ lọc"
              >
                <RefreshCw size={18} />
              </button>
            </div>
            <div className="flex gap-2">
              <div className="relative w-128">
                <button
                  className="w-full px-3 py-2 border rounded-md bg-white text-left"
                  onClick={() => setShowCategory(!showCategory)}
                >
                  {selectedCategories.length > 0
                    ? selectedCategories.join(", ")
                    : "Danh mục"}
                </button>

                {showCategory && (
                  <div className="absolute top-full mt-2 w-full bg-white border rounded-lg shadow-lg p-3 z-10">
                    <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                      {categories.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => toggleCategory(cat)}
                          className={`px-3 py-2 rounded-lg border ${
                            selectedCategories.includes(cat)
                              ? "bg-green-500 border-green-600 text-white"
                              : "bg-gray-100"
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                    <div className="flex justify-between mt-3">
                      <button
                        className="px-3 py-2 text-gray-500"
                        onClick={() => setSelectedCategories([])}
                      >
                        Đặt lại
                      </button>
                      <button
                        className="px-4 py-2 bg-green-600 text-white rounded-lg"
                        onClick={() => setShowCategory(false)}
                      >
                        Áp dụng
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Thông báo */}
        {loading && (
          <p className="mt-4 text-center text-gray-500">Đang tải bác sĩ...</p>
        )}
        {error && <p className="mt-4 text-center text-red-500">Lỗi: {error}</p>}

        {/* Danh sách bác sĩ */}
        {!loading &&
          !error &&
          paginatedDoctors.map((doc) => {
            // Lấy dữ liệu từ Object lồng nhau
            const fullName = doc.user?.FullName || "Bác sĩ";
            const degree = doc.Degree;
            const description = doc.ProfileDescription || "Chưa có mô tả";
            const specName = doc.specialty?.SpecialtyName || "Chuyên khoa";
            const hospital = doc.hospital;
            const location = doc.location;
            // const price = doc.price || 300000;

            return (
              <div
                key={doc.DoctorID}
                className="mt-2 bg-white rounded-md shadow p-4 grid grid-cols-1 md:grid-cols-3 gap-6"
              >
                {/*ẢNH & INFO*/}
                <div className="flex items-start gap-4 border-r pr-4">
                  <DataThumbnail
                    src={doc.imageURL}
                    alt={fullName}
                    fallbackType="doctor"
                    className="w-20 h-20 rounded-full border shadow-sm flex-shrink-0"
                  />

                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-0.5">
                      {degree}
                    </p>
                    <h2 className="text-lg font-bold text-blue-700 leading-tight">
                      {fullName}
                    </h2>
                    <p className="text-sm text-gray-500 font-medium mb-1">
                      {specName}
                    </p>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {description}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">{location}</p>
                    <button
                      type="button"
                      onClick={() => setViewDoctor(doc)}
                      className="text-sm text-blue-500 cursor-pointer mt-1 hover:underline"
                    >
                      Xem thêm
                    </button>
                  </div>
                </div>

                <div className="col-span-2 pl-4">
                  <div className="space-y-4">
                    <div className="border-b pb-4">
                      <p>
                        <strong>Địa chỉ khám:</strong> {hospital}
                      </p>
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={() =>
                          router.push(
                            `/dat-lich/bac-si?doctorId=${doc.DoctorID}`,
                          )
                        }
                        className="px-6 py-2 bg-green-600 text-white rounded-md font-semibold hover:bg-green-700"
                      >
                        Đặt lịch với bác sĩ này
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

        {/* Pagination */}
        {!loading && !error && (
          <div className="flex justify-center mt-6 space-x-2">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-3 py-1 rounded ${
                  currentPage === i + 1
                    ? "bg-green-600 text-white"
                    : "bg-gray-200 hover:bg-gray-300"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {viewDoctor && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden">
            <div className="flex items-center gap-4 p-6 border-b">
              <DataThumbnail
                src={viewDoctor.imageURL}
                alt={viewDoctor.user?.FullName}
                fallbackType="doctor"
                className="w-20 h-20 rounded-full border"
              />
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-0.5">
                  {viewDoctor.Degree}
                </p>

                <h2 className="text-lg font-bold text-blue-700 leading-tight">
                  {viewDoctor.user?.FullName}
                </h2>
                <p className="text-sm text-gray-600">
                  Chuyên khoa: {viewDoctor.specialty?.SpecialtyName}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Bệnh viện: HUNRE Hospital
                </p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <h3 className="font-semibold">Giới thiệu</h3>
                <p className="text-sm text-gray-700">
                  {viewDoctor.ProfileDescription || "Chưa có thông tin"}
                </p>
              </div>
              <div>
                <h3 className="font-semibold">Địa chỉ khám</h3>
                <p className="text-sm text-gray-700">
                  {viewDoctor.hospital} - {viewDoctor.location}
                </p>
              </div>
              {/* <div>
                <h3 className="font-semibold">Giá khám</h3>
                <p className="text-sm text-gray-700">{viewDoctor.price?.toLocaleString("vi-VN")}đ</p>
              </div> */}
            </div>

            <div className="p-4 border-t flex justify-between items-center">
              <button
                onClick={() => {
                  setViewDoctor(null);
                  router.push(
                    `/dat-lich/bac-si?doctorId=${viewDoctor.DoctorID}`,
                  );
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-md font-semibold hover:bg-green-700"
              >
                Đặt lịch với bác sĩ này
              </button>
              <button
                onClick={() => setViewDoctor(null)}
                className="px-4 py-2 bg-gray-200 rounded-md"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
