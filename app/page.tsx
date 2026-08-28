"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Layout from "@/components/layout";
import Image from "next/image";
import Link from "next/link";
import {
  Hospital02Icon,
  Calendar02Icon,
  Doctor01Icon,
  Analytics01Icon,
  Mail01Icon,
  CheckmarkSquare02Icon,
  ClipboardIcon,
  GiftIcon,
  Message02Icon,
  YoutubeIcon,
  CameraVideoIcon,
  Location01Icon,
  Time03Icon,
  CallIcon,
} from "hugeicons-react";
import { FaCalendarAlt } from "react-icons/fa";
export default function HomePage() {
  const [banners] = useState<string[]>([
    "/image/banner-clinic.jpg",
    "/image/banner-doctor1.jpg",
    "/image/banner2.jpg",
  ]);

  const [currentBanner, setCurrentBanner] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [counted, setCounted] = useState(false);
  const [stats, setStats] = useState({
    doctors: 0,
    patients: 0,
    specialties: 0,
  });

  const autoSlideRef = useRef<NodeJS.Timeout | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);

  // Dữ liệu bác sĩ
  const doctors = [
    {
      name: "PGS. TS. Đào Xuân Cơ",
      specialty: "",
      experience: "Giám đốc Bệnh viện",
      image: "/image/bs1.jpg",
    },
    {
      name: "PGS. TS. Vũ Văn Giáp",
      specialty: "Trung Tâm Hô Hấp",
      experience: "Phó Giám đốc Bệnh viện",
      image: "/image/bs2.jpg",
    },
    {
      name: "PGS. TS. Nguyễn Tuấn Tùng",
      specialty: "Trung Tâm Huyết Học và Truyền Máu",
      experience: "Phó Giám đốc Bệnh viện",
      image: "/image/bs3.jpg",
    },
    {
      name: "PGS. TS. Đỗ Ngọc Sơn",
      specialty: "Giám đốc Trung tâm Hồi sức tích cực",
      experience: "",
      image: "/image/bs4.jpg",
    },
    {
      name: "PGS.TS. Phan Thu Phương",
      specialty: "Giám đốc - Trung tâm Hô hấp",
      experience: "",
      image: "/image/bs5.jpg",
    },
    {
      name: "TS. Nguyễn Thành Nam",
      specialty: "Giám đốc Trung tâm Nhi Khoa",
      experience: "",
      image: "/image/bs6.jpg",
    },
    {
      name: "PGS.TS. Nguyễn Thế Hào",
      specialty: "Trưởng khoa Phẫu thuật Thần kinh",
      experience: "",
      image: "/image/bs7.jpg",
    },
    {
      name: "TS. BS. Nguyễn Quang Bẩy",
      specialty: "Trưởng khoa Nội tiết - ĐTĐ",
      experience: "",
      image: "/image/bs8.jpg",
    },
    {
      name: "PGS. TS. Nguyễn Văn Tuấn",
      specialty: "Viện trưởng Viện Sức khỏe Tâm thần",
      experience: "",
      image: "/image/bs9.jpg",
    },
    {
      name: "TS. BS. Nghiêm Trung Dũng",
      specialty: "Giám Đốc Trung Tâm Thận TN và lọc máu",
      experience: "",
      image: "/image/bs10.jpg",
    },
  ];

  // Dữ liệu dịch vụ
  const services = [
    {
      id: 1,
      title: "Khám chữa bệnh đa chuyên khoa",
      image: "/image/anh1.webp",
      description:
        "Nội, Ngoại, Sản, Nhi, Ung bướu, Tiêu hóa, Gan mật, Răng hàm mặt, Tai mũi họng, Mắt, Tiêm chủng, Cơ xương khớp, Dinh dưỡng, Da liễu, Nội tiết, Nội thần kinh, Tim mạch, Hô hấp, Tiết niệu, Hậu môn trực tràng.",
    },
    {
      id: 2,
      title: "Tầm soát dự phòng bệnh",
      image: "/image/anh2.webp",
      description:
        "Các gói khám sức khỏe tổng quát, tiêm chủng cho trẻ em, người lớn, tầm soát ung thư, bệnh lý tim mạch, đái tháo đường, mắt... phù hợp mọi lứa tuổi.",
    },
    {
      id: 3,
      title: "Điều trị nội trú",
      image: "/image/anh3.webp",
      description:
        "Hệ thống phòng lưu viện hiện đại, đầy đủ tiện nghi với view Hồ Tây, giúp bệnh nhân an tâm nghỉ ngơi và phục hồi. Đội ngũ bác sĩ, điều dưỡng theo sát 24/7",
    },
    {
      id: 4,
      title: "Thai sản trọn gói",
      image: "/image/anh4.webp",
      description:
        "Chăm sóc mẹ và bé toàn diện từ ngày đầu mang thai đến sau sinh với các gói thai sản từ 8w - chuyên da.",
    },
  ];

  // Dữ liệu đánh giá
  const testimonials = [
    {
      name: "Anh Vũ Mạnh Tiến",
      rating: 5,
      text: "Dịch vụ tuyệt vời, bác sĩ tận tâm. Tôi rất hài lòng với cách chăm sóc của bệnh viện!",
      avatar: "/image/avatar1.jpg",
    },
    {
      name: "Chị Hương",
      rating: 5,
      text: "Cơ sở vật chất hiện đại, nhân viên thân thiện. Quy trình khám nhanh chóng, chuyên nghiệp.",
      avatar: "/image/avatar2.jpg",
    },
    {
      name: "Anh Tuấn",
      rating: 5,
      text: "Đặt lịch online rất tiện lợi, không phải chờ đợi lâu. Rất đáng để giới thiệu!",
      avatar: "/image/avatar3.jpg",
    },
  ];

  // Dữ liệu tin tức
  const newsItems = [
    {
      title: "10 Cách Phòng Ngừa Cảm Cúm Mùa Đông",
      image: "/image/news1.png",
      date: "15/11/2025",
      category: "Dự phòng",
      excerpt:
        "Mùa đông đến, cảm cúm dễ bùng phát. Cùng tìm hiểu các biện pháp phòng ngừa hiệu quả...",
    },
    {
      title: "Tầm Quan Trọng Của Khám Sức Khỏe Định Kỳ",
      image: "/image/news2.png",
      date: "10/11/2025",
      category: "Tổng quát",
      excerpt:
        "Khám sức khỏe định kỳ giúp phát hiện sớm bệnh lý, tiết kiệm chi phí điều trị...",
    },
    {
      title: "Chế Độ Dinh Dưỡng Cho Người Tiểu Đường",
      image: "/image/news3.png",
      date: "05/11/2025",
      category: "Dinh dưỡng",
      excerpt:
        "Chế độ ăn uống đóng vai trò quan trọng trong kiểm soát đường huyết...",
    },
  ];

  // Dữ liệu FAQ
  const faqs = [
    {
      q: "Làm thế nào để đặt lịch khám?",
      a: "Bạn có thể đặt lịch khám online qua website của chúng tôi, ứng dụng di động hoặc gọi trực tiếp đến hotline 1900-xxxx. Quy trình đặt lịch đơn giản, nhanh chóng chỉ trong vài phút.",
    },
    {
      q: "Bệnh viện có khám vào cuối tuần không?",
      a: "Có, chúng tôi làm việc 24/7 kể cả ngày lễ, Tết. Các phòng khám chuyên khoa hoạt động từ 7h-20h, cấp cứu 24/24.",
    },
    {
      q: "Có cần mang theo gì khi đi khám?",
      a: "Vui lòng mang theo CMND/CCCD, thẻ BHYT (nếu có), các kết quả xét nghiệm cũ và đơn thuốc đang dùng để bác sĩ tham khảo.",
    },
    {
      q: "Bệnh viện có hỗ trợ BHYT không?",
      a: "Có, chúng tôi chấp nhận tất cả các loại thẻ BHYT. Bệnh nhân có thể thanh toán trực tiếp bằng BHYT hoặc kết hợp chi phí.",
    },
    {
      q: "Thời gian chờ khám trung bình là bao lâu?",
      a: "Với hệ thống đặt lịch online, thời gian chờ trung bình chỉ khoảng 10-15 phút. Bệnh nhân đến đúng giờ hẹn sẽ được ưu tiên.",
    },
  ];

  //tiến trình cuộn trang
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const progress = (window.scrollY / totalHeight) * 100;
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Counter Animation
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !counted) {
        setCounted(true);

        const duration = 2000;
        const steps = 60;
        const increment = duration / steps;

        const current = { doctors: 0, patients: 0, specialties: 0 };
        const targets = { doctors: 1000, patients: 500000, specialties: 30 };

        const timer = setInterval(() => {
          current.doctors = Math.min(
            current.doctors + targets.doctors / steps,
            targets.doctors
          );
          current.patients = Math.min(
            current.patients + targets.patients / steps,
            targets.patients
          );
          current.specialties = Math.min(
            current.specialties + targets.specialties / steps,
            targets.specialties
          );

          setStats({
            doctors: Math.floor(current.doctors),
            patients: Math.floor(current.patients),
            specialties: Math.floor(current.specialties),
          });

          if (current.doctors >= targets.doctors) clearInterval(timer);
        }, increment);
      }
    });

    const statsElement = document.getElementById("stats-section");
    if (statsElement) observer.observe(statsElement);

    return () => observer.disconnect();
  }, [counted]);

  // Banner tự động đổi
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 3000); // 3s đổi ảnh 1 lần
    return () => clearInterval(interval);
  }, [banners.length]);

  const getCardWidth = useCallback(() => {
    const track = trackRef.current;
    if (!track) return 250;
    const firstCard = track.querySelector(".doctor-card") as HTMLElement | null;
    if (!firstCard) return 250;
    const rect = firstCard.getBoundingClientRect();
    const styles = window.getComputedStyle(firstCard);
    const ml = parseFloat(styles.marginLeft || "0");
    const mr = parseFloat(styles.marginRight || "0");
    return rect.width + ml + mr;
  }, []);

  const startAutoSlide = useCallback(() => {
    if (autoSlideRef.current) clearInterval(autoSlideRef.current);

    autoSlideRef.current = setInterval(() => {
      if (isDraggingRef.current) return;
      const track = trackRef.current;
      if (!track) return;
      const firstCard = track.querySelector(
        ".doctor-card"
      ) as HTMLElement | null;
      if (!firstCard) return;
      const step = getCardWidth();
      track.style.transition = "transform 0.8s cubic-bezier(0.4,0,0.2,1)";
      track.style.transform = `translate3d(-${step}px,0,0)`;

      const onEnd = () => {
        track.removeEventListener("transitionend", onEnd);
        track.style.transition = "none";
        track.style.transform = "translate3d(0,0,0)";
        track.appendChild(firstCard);
        void track.offsetHeight;
      };
      track.addEventListener("transitionend", onEnd, { once: true });
    }, 3000);
  }, [getCardWidth]);

  // Auto slide cho bác sĩ
  useEffect(() => {
    startAutoSlide();
    return () => {
      if (autoSlideRef.current) clearInterval(autoSlideRef.current);
    };
  }, [startAutoSlide]);

  const handleMouseEnter = () => {
    if (autoSlideRef.current) clearInterval(autoSlideRef.current);
  };

  const handleMouseLeave = () => {
    if (!isDraggingRef.current) startAutoSlide();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!trackRef.current) return;
    isDraggingRef.current = true;
    startXRef.current = e.pageX;
    const track = trackRef.current;
    const transform = window.getComputedStyle(track).transform;
    scrollLeftRef.current =
      transform !== "none" ? new DOMMatrix(transform).m41 : 0;
    track.style.cursor = "grabbing";
    track.style.transition = "none";
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !trackRef.current) return;
    e.preventDefault();
    const step = getCardWidth();
    const limit = step * 1.2;
    const walk = e.pageX - startXRef.current;
    const nextX = scrollLeftRef.current + walk;
    const clamped = Math.max(Math.min(nextX, limit), -limit);
    trackRef.current.style.transform = `translate3d(${clamped}px,0,0)`;
  };

  const handleMouseUp = () => {
    if (!isDraggingRef.current || !trackRef.current) return;
    isDraggingRef.current = false;
    trackRef.current.style.cursor = "grab";
    const track = trackRef.current;
    const matrix = new DOMMatrix(window.getComputedStyle(track).transform);
    const currentX = matrix.m41;
    const step = getCardWidth();
    const movedCards = Math.round(-currentX / step);
    const targetX = -movedCards * step;
    track.style.transition = "transform 0.5s cubic-bezier(0.4,0,0.2,1)";
    track.style.transform = `translate3d(${targetX}px,0,0)`;

    const onSnapEnd = () => {
      track.removeEventListener("transitionend", onSnapEnd);
      track.style.transition = "none";
      track.style.transform = "translate3d(0,0,0)";
      if (movedCards > 0) {
        for (let i = 0; i < movedCards; i++) {
          const first = track.querySelector(".doctor-card");
          if (first) track.appendChild(first);
        }
      } else if (movedCards < 0) {
        for (let i = 0; i < Math.abs(movedCards); i++) {
          const last = track.querySelector(".doctor-card:last-child");
          if (last) track.insertBefore(last, track.firstChild);
        }
      }
      void track.offsetHeight;
      startAutoSlide();
    };
    track.addEventListener("transitionend", onSnapEnd, { once: true });
  };

  const handleMouseLeaveTrack = () => {
    if (isDraggingRef.current) handleMouseUp();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!trackRef.current) return;
    isDraggingRef.current = true;
    startXRef.current = e.touches[0].pageX;
    const track = trackRef.current;
    const transform = window.getComputedStyle(track).transform;
    scrollLeftRef.current =
      transform !== "none" ? new DOMMatrix(transform).m41 : 0;
    track.style.transition = "none";
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || !trackRef.current) return;
    const x = e.touches[0].pageX;
    const walk = x - startXRef.current;
    trackRef.current.style.transform = `translate3d(${scrollLeftRef.current + walk
      }px,0,0)`;
  };

  const handleTouchEnd = () => {
    handleMouseUp();
  };

  return (
    <Layout>
      {/* Scroll Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gray-200 z-50">
        <div
          className="h-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 transition-all duration-300"
          style={{ width: `${scrollProgress}%` }}
        ></div>
      </div>

      <div className="max-w-[1400px] mx-auto p-5">
        {/* Banner */}
        {banners.length > 0 && (
          <section className="relative mb-8 rounded-xl overflow-hidden shadow-lg h-[250px] md:h-[400px]">
            {banners.map((banner, index) => (
              <Image
                key={index}
                src={banner}
                alt={`Banner ${index + 1}`}
                width={1400}
                height={400}
                priority={index === 0}
                className={`w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${index === currentBanner
                  ? "opacity-100 relative"
                  : "opacity-0 absolute top-0 left-0"
                  }`}
              />
            ))}
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2.5 z-10">
              {banners.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentBanner(index)}
                  className={`h-3 rounded-full bg-white/50 cursor-pointer transition-all duration-300 ${index === currentBanner
                    ? "bg-white w-[30px] rounded-[6px]"
                    : "w-3"
                    }`}
                />
              ))}
            </div>
          </section>
        )}

        {/* Phần Thống Kê Ấn Tượng với Counter Animation // \\dùng javascrip tính dữ liệu động*/}
        <section
          id="stats-section"
          className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 my-8 md:my-12"
        >
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-4 md:p-6 text-center shadow-lg hover:scale-105 transition-transform duration-300">
            <div className="text-3xl md:text-4xl font-bold mb-2">
              {stats.doctors.toLocaleString()}+
            </div>
            <div className="text-xs md:text-sm opacity-90">
              Bác sĩ chuyên khoa
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-4 md:p-6 text-center shadow-lg hover:scale-105 transition-transform duration-300">
            <div className="text-3xl md:text-4xl font-bold mb-2">
              {stats.patients > 1000
                ? `${(stats.patients / 1000).toFixed(0)}K`
                : stats.patients}
              +
            </div>
            <div className="text-xs md:text-sm opacity-90">Lượt khám/năm</div>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl p-4 md:p-6 text-center shadow-lg hover:scale-105 transition-transform duration-300">
            <div className="text-3xl md:text-4xl font-bold mb-2">
              {stats.specialties}+
            </div>
            <div className="text-xs md:text-sm opacity-90">Chuyên khoa</div>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-4 md:p-6 text-center shadow-lg hover:scale-105 transition-transform duration-300">
            <div className="text-3xl md:text-4xl font-bold mb-2">24/7</div>
            <div className="text-xs md:text-sm opacity-90">Cấp cứu</div>
          </div>
        </section>

        {/* Slideshow bác sĩ */}
        <div className="w-full my-10 bg-white px-5 py-[50px] rounded-2xl shadow-2xl overflow-hidden">
          <h2 className=" flex justify-center iteams-center text-black text-[28px] md:text-4xl font-bold mb-8 tracking-[1px]">
            <Hospital02Icon className="w-10 h-10" />
            Đội Ngũ Bác Sĩ Chuyên Nghiệp
            <Hospital02Icon className="w-10 h-10" />
          </h2>
          <h4 className="text-center my-[5px] text-sm md:text-base">
            Hơn 1.000 bác sĩ, đội ngũ hàng đầu cùng với hơn 4.300 nhân viên y tế
            tận tâm,
          </h4>
          <h5 className="text-center my-[5px] text-sm md:text-base">
            sẵn sàng phục vụ và chăm sóc sức khỏe cho mỗi bệnh nhân.
          </h5>
          <br />
          <br />
          <div
            className="relative h-[430px] overflow-hidden"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <div
              ref={trackRef}
              className="flex absolute left-0 cursor-grab active:cursor-grabbing select-none will-change-transform [backface-visibility:hidden]"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeaveTrack}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {[...doctors, ...doctors, ...doctors].map((doctor, index) => (
                <div
                  key={index}
                  className="doctor-card min-w-[220px] mx-[15px] bg-white rounded-2xl py-[30px] px-5 shadow-[0_8px_25px_rgba(143,4,4,0.15)] text-center transition-all duration-300 ease-in-out flex-shrink-0 hover:-translate-y-2.5 hover:shadow-[0_15px_35px_rgba(0,0,0,0.25)]"
                >
                  <div className="w-[242px] h-[250px] mx-auto mb-5 bg-[#f5f6ff] border-4 border-white shadow-[0_4px_15px_rgba(0,0,0,0.2)] relative overflow-hidden flex items-center justify-center">
                    <Image
                      src={doctor.image}
                      alt={doctor.name}
                      width={242}
                      height={250}
                      loading="lazy"
                      className="block w-full h-full object-cover"
                      draggable={false}
                    />
                  </div>
                  <div className="text-xl font-bold text-zinc-700 mb-2">
                    {doctor.name}
                  </div>
                  <div className="text-[15px] text-zinc-500 mb-4">
                    {doctor.specialty}
                  </div>
                  <div className="text-[13px] text-zinc-400 italic">
                    {doctor.experience}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Đặt Lịch Nhanh */}
        <section className="my-12 md:my-16 bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-6 md:p-12 text-white shadow-2xl">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl md:text-4xl font-bold mb-4">
              Đặt Lịch Khám Ngay Hôm Nay
            </h2>
            <p className="text-base md:text-lg mb-6 md:mb-8 opacity-90">
              Chăm sóc sức khỏe chưa bao giờ dễ dàng đến thế. Đặt lịch online
              chỉ với vài cú click!
            </p>
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <Link
                href="/dat-lich"
                className="flex items-center gap-2 justify-center bg-transparent border-2 border-white px-6 md:px-8 py-3 md:py-4 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
              >
                <Calendar02Icon className="text-red-600" />
                Đặt Lịch Khám
              </Link>
              <Link
                href="/doctors"
                className="flex bg-transparent border-2 border-white px-6 md:px-8 py-3 md:py-4 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors "
              >
                <Doctor01Icon className="text-green-500" /> Tìm Bác Sĩ
              </Link>
            </div>
          </div>
        </section>

        {/* Timeline Quy Trình Khám Bệnh */}
        <section className="my-12 md:my-16 bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 md:p-12">
          <h2 className="flex justify-center text-3xl md:text-4xl font-bold text-center mb-4">
            <Analytics01Icon className="h-10 w-10" />
            Quy Trình Khám Bệnh Đơn Giản
            <Analytics01Icon className="h-10 w-10" />
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Chỉ với 5 bước đơn giản, bạn đã hoàn tất quy trình khám bệnh
          </p>

          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Timeline Line */}
              <div className=" md:block absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-gradient-to-b from-blue-200 via-blue-400 to-blue-600"></div>

              {/* Steps */}
              {[
                {
                  step: 1,
                  title: "Đặt Lịch Hẹn",
                  desc: "Đặt lịch online hoặc qua hotline, chọn bác sĩ và thời gian phù hợp",
                  icon: <Calendar02Icon className="w-8 h-8 text-blue-600" />,
                },
                {
                  step: 2,
                  title: "Nhận Xác Nhận",
                  desc: "Nhận SMS/Email xác nhận lịch hẹn và hướng dẫn chuẩn bị",
                  icon: <Mail01Icon className="w-8 h-8 text-blue-600" />,
                },
                {
                  step: 3,
                  title: "Check-in",
                  desc: "Đến bệnh viện, làm thủ tục tại quầy lễ tân nhanh chóng",
                  icon: (
                    <CheckmarkSquare02Icon className="w-8 h-8 text-blue-600" />
                  ),
                },
                {
                  step: 4,
                  title: "Khám Bệnh",
                  desc: "Gặp bác sĩ chuyên khoa, được thăm khám và tư vấn chi tiết",
                  icon: <Doctor01Icon className="w-8 h-8 text-blue-600" />,
                },
                {
                  step: 5,
                  title: "Nhận Kết Quả",
                  desc: "Nhận kết quả, đơn thuốc và hướng dẫn điều trị (nếu có)",
                  icon: <ClipboardIcon className="w-8 h-8 text-blue-600" />,
                },
              ].map((item, index) => (
                <div
                  key={index}
                  className={`relative mb-12 md:mb-16 ${index % 2 === 0
                    ? "md:text-right md:pr-1/2"
                    : "md:text-left md:pl-1/2"
                    }`}
                >
                  <div
                    className={`md:w-1/2 ${index % 2 === 0
                      ? "md:mr-auto md:pr-12"
                      : "md:ml-auto md:pl-12"
                      }`}
                  >
                    <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 border-blue-500">
                      <div className="flex items-center gap-4 mb-3">
                        <div
                          className={`text-4xl ${index % 2 === 0 ? "order-1" : "md:order-2"
                            }`}
                        >
                          {item.icon}
                        </div>
                        <div
                          className={
                            index % 2 === 0
                              ? "order-2"
                              : "md:order-1 md:text-right"
                          }
                        >
                          <span className="inline-block bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm font-bold mb-2">
                            Bước {item.step}
                          </span>
                          <h3 className="text-xl font-bold text-gray-800">
                            {item.title}
                          </h3>
                        </div>
                      </div>
                      <p className="text-gray-600 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>

                  {/* Center Circle */}
                  <div className="hidden md:flex absolute left-1/2 top-6 transform -translate-x-1/2 w-12 h-12 bg-blue-600 rounded-full border-4 border-white shadow-lg items-center justify-center text-white font-bold text-lg">
                    {item.step}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Phần Chuyên khoa & Dịch vụ */}
        <div className="w-full my-16 px-5 py-[50px] bg-gradient-to-br from-[#f5f7fa] to-[#f1f1f1] rounded-2xl">
          <h2 className="text-center text-black text-[28px] md:text-4xl font-bold mb-12 tracking-[1px]">
            Đa Dạng Chuyên Khoa Dịch Vụ
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-5 md:gap-[30px] max-w-[1400px] mx-auto">
            {services.map((service) => (
              <div
                key={service.id}
                className="group bg-white rounded-2xl overflow-hidden shadow-[0_8px_25px_rgba(0,0,0,0.1)] transition-all duration-300 ease-in-out border-4 border-white flex flex-col hover:-translate-y-2.5 hover:shadow-[0_15px_40px_rgba(0,0,0,0.2)] mx-2.5 md:mx-0"
              >
                <div className="w-full h-[250px] overflow-hidden relative">
                  <Image
                    src={service.image}
                    alt={service.title}
                    width={400}
                    height={250}
                    className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-110"
                  />
                </div>
                <h3 className="text-xl font-bold text-[#ff6600] px-5 pt-5 pb-2.5 text-center min-h-[60px] flex items-center justify-center">
                  {service.title}
                </h3>
                <p className="text-sm text-zinc-600 leading-relaxed px-5 pb-5 text-justify flex-grow">
                  {service.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* So Sánh Gói Khám Sức Khỏe */}
        <section className="my-12 md:my-16">
          <h2 className="flex justify-center text-3xl md:text-4xl font-bold text-center mb-4 gap-3">
            <GiftIcon className="w-10 h-10 text-yellow-500" />
            Gói Khám Sức Khỏe Tổng Quát
            <GiftIcon className="w-10 h-10 text-yellow-500" />
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Chọn gói khám phù hợp với nhu cầu của bạn
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Gói Cơ Bản */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-gray-200">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2">Gói Cơ Bản</h3>
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  1.5tr<span className="text-lg text-gray-600">/lần</span>
                </div>
                <p className="text-gray-600 text-sm">
                  Phù hợp người trẻ khỏe mạnh
                </p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span className="text-gray-700">Khám lâm sàng tổng quát</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span className="text-gray-700">Xét nghiệm máu cơ bản</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span className="text-gray-700">Đo huyết áp, nhịp tim</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span className="text-gray-700">X-quang phổi</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-300 mt-1">✗</span>
                  <span className="text-gray-400">Siêu âm tổng quát</span>
                </li>
              </ul>
              <button className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors">
                Chọn Gói
              </button>
            </div>

            {/* Gói Nâng Cao - POPULAR */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-8 shadow-2xl transform md:-translate-y-4 relative border-4 border-blue-400">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-gray-900 px-4 py-1 rounded-full text-sm font-bold">
                PHỔ BIẾN NHẤT
              </div>
              <div className="text-center mb-6 text-white">
                <h3 className="text-2xl font-bold mb-2">Gói Nâng Cao</h3>
                <div className="text-4xl font-bold mb-2">
                  3.5tr<span className="text-lg opacity-90">/lần</span>
                </div>
                <p className="text-blue-100 text-sm">Khám sức khỏe toàn diện</p>
              </div>
              <ul className="space-y-3 mb-8 text-white">
                <li className="flex items-start gap-2">
                  <span className="text-yellow-300 mt-1">✓</span>
                  <span>Tất cả dịch vụ gói Cơ Bản</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-300 mt-1">✓</span>
                  <span>Siêu âm bụng tổng quát</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-300 mt-1">✓</span>
                  <span>Xét nghiệm chức năng gan, thận</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-300 mt-1">✓</span>
                  <span>Điện tim đồ</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-300 mt-1">✓</span>
                  <span>Tư vấn dinh dưỡng miễn phí</span>
                </li>
              </ul>
              <button className="w-full bg-white text-blue-600 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
                Chọn Gói
              </button>
            </div>

            {/* Gói VIP */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-purple-200">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2 text-purple-600">
                  Gói VIP
                </h3>
                <div className="text-4xl font-bold text-purple-600 mb-2">
                  7.5tr<span className="text-lg text-gray-600">/lần</span>
                </div>
                <p className="text-gray-600 text-sm">
                  Chăm sóc sức khỏe cao cấp
                </p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 mt-1">✓</span>
                  <span className="text-gray-700">
                    Tất cả dịch vụ gói Nâng Cao
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 mt-1">✓</span>
                  <span className="text-gray-700">
                    Nội soi dạ dày không đau
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 mt-1">✓</span>
                  <span className="text-gray-700">MRI/CT Scanner</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 mt-1">✓</span>
                  <span className="text-gray-700">Tầm soát ung thư</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 mt-1">✓</span>
                  <span className="text-gray-700">Phòng khám VIP riêng tư</span>
                </li>
              </ul>
              <button className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-purple-800 transition-colors">
                Chọn Gói
              </button>
            </div>
          </div>

          <p className="text-center text-gray-600 mt-8 text-sm">
            💡 Liên hệ hotline{" "}
            <a href="tel:1900xxxx" className="text-blue-600 font-semibold">
              1900-xxxx
            </a>{" "}
            để được tư vấn gói khám phù hợp
          </p>
        </section>

        {/* Phần Đánh Giá Của Bệnh Nhân */}
        <section className="my-12 md:my-16 bg-white rounded-2xl p-6 md:p-12 shadow-xl">
          <h2 className="flex text-2xl md:text-4xl font-bold text-center mb-8 md:mb-12 gap-3 justify-center ">
            <Message02Icon className="w-10 h-10 text-yellow-500" />
            Bệnh Nhân Nói Gì Về Chúng Tôi
            <Message02Icon className="w-10 h-10 text-yellow-500" />
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((review, i) => (
              <div
                key={i}
                className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100"
              >
                <div className="flex mb-3">
                  {[...Array(review.rating)].map((_, j) => (
                    <span key={j} className="text-yellow-400 text-xl">
                      ⭐
                    </span>
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic leading-relaxed">
                  &quot;{review.text}&quot;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                    {(review.name || "U").charAt(0)}
                  </div>
                  <p className="font-semibold text-blue-600">{review.name}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Video Giới Thiệu Bệnh Viện */}
        <section className="my-12 md:my-16 bg-gradient-to-br from-blue-900 to-blue-700 rounded-2xl overflow-hidden shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            <div className="p-8 md:p-12 flex flex-col justify-center text-white order-2 lg:order-1">
              <h2 className="flex gap-2 text-3xl md:text-4xl font-bold mb-6">
                <CameraVideoIcon className="w-8 h-8" />
                Khám Phá Bệnh Viện Của Chúng Tôi
              </h2>
              <p className="text-lg mb-6 opacity-90 leading-relaxed">
                Cùng tham quan cơ sở vật chất hiện đại, gặp gỡ đội ngũ y bác sĩ
                tận tâm và tìm hiểu quy trình chăm sóc sức khỏe chuyên nghiệp
                của chúng tôi.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">✓</span>
                  <div>
                    <h4 className="font-semibold mb-1">Cơ sở vật chất 5 sao</h4>
                    <p className="text-sm opacity-80">
                      Phòng khám, phòng mổ, phòng bệnh hiện đại
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">✓</span>
                  <div>
                    <h4 className="font-semibold mb-1">
                      Quy trình chuẩn quốc tế
                    </h4>
                    <p className="text-sm opacity-80">
                      Đảm bảo an toàn và hiệu quả cao nhất
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">✓</span>
                  <div>
                    <h4 className="font-semibold mb-1">Chăm sóc tận tình</h4>
                    <p className="text-sm opacity-80">
                      Đội ngũ điều dưỡng chuyên nghiệp 24/7
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative h-[300px] lg:h-auto min-h-[400px] order-1 lg:order-2">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/30 to-purple-600/30 flex items-center justify-center">
                <div className="text-white text-center">
                  <div className="flex">
                    <div className="text-6xl mb-4">
                      <YoutubeIcon className="w-12 h-12" />
                    </div>
                    <p className="text-lg font-semibold">Video Giới Thiệu</p>
                  </div>
                  <p className="text-sm opacity-100 mt-2">Sắp ra mắt</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Phần Hệ thống máy móc */}
        <div className="w-full my-16 bg-gradient-to-br from-white to-[#f8f9fa] rounded-2xl shadow-xl p-5 md:py-16 md:px-10">
          <h2 className="text-center text-[#0d6e3d] text-[28px] md:text-4xl font-bold mb-12 leading-[1.4] tracking-[1px]">
            HỆ THỐNG MÁY MÓC,
            <br />
            TRANG THIẾT BỊ HIỆN ĐẠI
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="flex flex-col gap-6">
              <div className="bg-white py-5 px-6 rounded-xl shadow-[0_4px_15px_rgba(0,0,0,0.08)] border-l-4 border-l-[#0d6e3d] transition-all duration-300 ease-in-out hover:translate-x-2.5 hover:shadow-[0_6px_20px_rgba(0,0,0,0.12)]">
                <p className="m-0 text-[15px] leading-[1.8] text-zinc-700 text-justify">
                  Trang thiết bị phòng mổ: Phòng mổ vô khuẩn 1 chiều, máy gây mê
                  kèm thở Drager – Fabius Plus (Đức), máy bơm tiêm điện điều
                  chỉnh liều mê, máy phẫu thuật đúc thủy tinh thể - Phaco (Thụy
                  Sỹ)...
                </p>
              </div>
              <div className="bg-white py-5 px-6 rounded-xl shadow-[0_4px_15px_rgba(0,0,0,0.08)] border-l-4 border-l-[#0d6e3d] transition-all duration-300 ease-in-out hover:translate-x-2.5 hover:shadow-[0_6px_20px_rgba(0,0,0,0.12)]">
                <p className="m-0 text-[15px] leading-[1.8] text-zinc-700 text-justify">
                  Chẩn đoán hình ảnh & tầm soát chuyên sâu: Máy MRI nguyên lý
                  H2, hệ thống chụp CT da lát cắt, hệ thống siêu âm 4D, 5D sắc
                  nét, siêu âm đàn hồi mô gan thế hệ mới, máy do loãng xương
                  DEXUM T...
                </p>
              </div>
              <div className="bg-white py-5 px-6 rounded-xl shadow-[0_4px_15px_rgba(0,0,0,0.08)] border-l-4 border-l-[#0d6e3d] transition-all duration-300 ease-in-out hover:translate-x-2.5 hover:shadow-[0_6px_20px_rgba(0,0,0,0.12)]">
                <p className="m-0 text-[15px] leading-[1.8] text-zinc-700 text-justify">
                  Nội soi, tim mạch và tiêu hóa cao cấp: Nội soi tiêu hóa công
                  nghệ MCU, NBI 5P phát hiện sớm ung thư đường tiêu hóa, điện
                  tim 3 cần, tầm soát vi khuẩn HP qua hơi thở...
                </p>
              </div>
              <div className="bg-white py-5 px-6 rounded-xl shadow-[0_4px_15px_rgba(0,0,0,0.08)] border-l-4 border-l-[#0d6e3d] transition-all duration-300 ease-in-out hover:translate-x-2.5 hover:shadow-[0_6px_20px_rgba(0,0,0,0.12)]">
                <p className="m-0 text-[15px] leading-[1.8] text-zinc-700 text-justify">
                  Hệ thống máy móc xét nghiệm chuyên sâu: xét nghiệm tự động
                  Power Express, phòng lab vi sinh & sinh học phân tử hiện đại,
                  máy phân tích thành phần cơ thể Tanita (Nhật Bản)... Cùng
                  nhiều máy móc công nghệ hiện đại khác.
                </p>
              </div>
            </div>

            <div className="relative lg:order-last order-first">
              <div className="group w-full h-[300px] md:h-[400px] lg:h-[800px] border-4 border-[#0d6e3d] rounded-2xl overflow-hidden bg-white shadow-[0_8px_30px_rgba(13,110,61,0.2)] transition-all duration-300 ease-in-out hover:shadow-[0_12px_40px_rgba(13,110,61,0.3)] hover:-translate-y-1">
                <Image
                  src="/image/thietbihiendai.webp"
                  alt="Hệ thống máy móc hiện đại"
                  width={700}
                  height={800}
                  className="w-full h-full object-cover block transition-transform duration-300 ease-in-out group-hover:scale-105"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Phần Tin Tức Y Khoa */}
        <section className="my-12 md:my-16">
          <h2 className="text-2xl md:text-4xl font-bold text-center mb-8 md:mb-12">
            📰 Tin Tức Sức Khỏe
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {newsItems.map((news, i) => (
              <div
                key={i}
                className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer group"
              >
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={news.image}
                    alt={news.title}
                    width={400}
                    height={200}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <span className="absolute top-3 left-3 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                    {news.category}
                  </span>
                </div>
                <div className="p-5">
                  <p className="text-sm text-gray-500 mb-2 flex items-center gap-2">
                    <FaCalendarAlt className="text-green-600 text-base" />

                    <span>{news.date}</span>
                  </p>
                  <h3 className="font-bold text-lg mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {news.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {news.excerpt}
                  </p>
                  <button className="text-blue-600 font-semibold hover:underline flex items-center gap-2">
                    Đọc thêm <span>+</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link
              href="/tin-tuc"
              className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg"
            >
              Xem Tất Cả Tin Tức
            </Link>
          </div>
        </section>

        {/* Phần FAQ */}
        <section className="my-12 md:my-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 md:p-12">
          <h2 className="text-2xl md:text-4xl font-bold text-center mb-8 md:mb-12">
            ❓ Câu Hỏi Thường Gặp
          </h2>
          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, i) => (
              <details
                key={i}
                className="bg-white rounded-lg shadow-md p-5 cursor-pointer hover:shadow-lg transition-shadow group"
              >
                <summary className="font-semibold text-base md:text-lg text-gray-800 flex justify-between items-center list-none">
                  <span className="pr-4">{faq.q}</span>
                  <span className="text-blue-600 transform group-open:rotate-180 transition-transform duration-300 flex-shrink-0">
                    ▼
                  </span>
                </summary>
                <p className="mt-3 text-gray-600 leading-relaxed text-sm md:text-base">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* Bản Đồ Tương Tác */}
        <section className="my-12 md:my-16 bg-white rounded-2xl overflow-hidden shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            <div className="p-8 md:p-12">
              <h2 className="flex gap-3 text-3xl font-bold mb-6 text-gray-800">
                <Location01Icon className="w-8 h-8 text-red-500" /> Tìm Đường
                Đến Bệnh Viện
              </h2>
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <span className="text-2xl">
                      <Hospital02Icon className="w-8 h-8 text-red-500" />
                    </span>{" "}
                    Địa chỉ
                  </h3>
                  <p className="text-gray-600 ml-9">
                    41A P. Phú Diễn, TP Hà Nội
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <span className="text-2xl">
                      <Time03Icon className="w-8 h-8 text-red-500" />
                    </span>{" "}
                    Giờ làm việc
                  </h3>
                  <div className="ml-9 space-y-1 text-gray-600">
                    <p>• Khám bệnh: 7:00 - 20:00 (T2-CN)</p>
                    <p>• Cấp cứu: 24/7</p>
                    <p>• Xét nghiệm: 6:00 - 22:00</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <span className="text-2xl">🚗</span> Hướng dẫn đi lại
                  </h3>
                  <div className="ml-9 space-y-2">
                    <div className="flex items-center gap-2 text-gray-700">
                      <span>🚌</span> Xe buýt: Tuyến 03, 23, 45
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <span>🚕</span> Grab/Taxi: Bệnh viên HUNRE
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <span>🅿️</span> Bãi đỗ xe miễn phí
                    </div>
                  </div>
                </div>
                <a
                  href="https://maps.google.com/?q=41A+Phú+Diễn+Hà+Nội"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors mt-4"
                >
                  Mở Google Maps →
                </a>
              </div>
            </div>
            <div className="relative h-[400px] lg:h-auto bg-gray-200">
              <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3723.6409580475993!2d105.75982837525714!3d21.047047480606874!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x313454c3a52297a9%3A0x5cc20ae75ad69645!2zNDFBIMSQLiBQaMO6IERp4buFbiwgQ-G6p3UgRGnhu4VuLCBC4bqvYyBU4burIExpw6ptLCBIw6AgTuG7mWk!5e0!3m2!1svi!2s!4v1764761958627!5m2!1svi!2s"
                    width="650"
                    height="580"
                    style={{ border: 0, borderRadius: "12px" }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Phần Liên Hệ Nhanh */}
        <section className="my-12 md:my-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <a
            href="tel:1900xxxx"
            className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 text-center hover:from-blue-100 hover:to-blue-200 transition-all duration-300 shadow-md hover:shadow-lg group"
          >
            <div className="text-4xl md:text-5xl mb-3 group-hover:scale-110 transition-transform">
              <CallIcon className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="font-bold text-lg mb-2">Hotline 24/7</h3>
            <p className="text-blue-600 font-semibold text-xl md:text-2xl">
              1900-xxxx
            </p>
            <p className="text-gray-600 text-sm mt-2">Hỗ trợ tư vấn miễn phí</p>
          </a>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 text-center hover:from-green-100 hover:to-green-200 transition-all duration-300 shadow-md hover:shadow-lg group">
            <div className="text-4xl md:text-5xl mb-3 group-hover:scale-110 transition-transform">
              <Location01Icon className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="font-bold text-lg mb-2">Địa Chỉ</h3>
            <p className="text-gray-600">41A P. Phú Diễn</p>
            <p className="text-gray-600">TP Hà Nội</p>
          </div>
          <a
            href="mailto:benhvienhunre@hospital.com"
            className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 text-center hover:from-orange-100 hover:to-orange-200 transition-all duration-300 shadow-md hover:shadow-lg group"
          >
            <div className="text-4xl md:text-5xl mb-3 group-hover:scale-110 transition-transform">
              <Mail01Icon className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="font-bold text-lg mb-2">Email</h3>
            <p className="text-orange-600 font-semibold text-lg">
              benhvienhunre@hospital.com
            </p>
            <p className="text-gray-600 text-sm mt-2">Liên hệ qua email</p>
          </a>
        </section>

        {/* Phần Chứng Nhận & Giải Thưởng */}
        <section className="my-12 md:my-16 bg-white rounded-2xl p-6 md:p-12 shadow-xl">
          <h2 className="text-2xl md:text-4xl font-bold text-center mb-8 md:mb-12">
            🏆 Chứng Nhận & Giải Thưởng
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: "🏅", text: "ISO 9001:2015" },
              { icon: "⭐", text: "Bệnh viện hạng I" },
              { icon: "🎖️", text: "JCI Accredited" },
              { icon: "💎", text: "Top 10 BV tốt nhất" },
            ].map((cert, i) => (
              <div
                key={i}
                className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 flex flex-col items-center justify-center hover:shadow-lg transition-all duration-300 border border-gray-100 group"
              >
                <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">
                  {cert.icon}
                </div>
                <p className="text-center font-semibold text-gray-700">
                  {cert.text}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </Layout>
  );
}
