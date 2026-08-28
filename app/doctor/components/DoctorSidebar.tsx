import { Menu, LogOut, LayoutDashboard, Calendar, FileText, Settings } from "lucide-react"

type DoctorTab = "dashboard" | "schedule" | "records" | "settings"

interface CurrentDoctor {
  FullName: string
  specialty: {
    SpecialtyName: string
  }
}

const menuItems: Array<{
  icon: typeof LayoutDashboard
  label: string
  value: DoctorTab
}> = [
  { icon: LayoutDashboard, label: "Bảng điều khiển", value: "dashboard" },
  { icon: Calendar, label: "Lịch của tôi", value: "schedule" },
  { icon: FileText, label: "Bệnh án", value: "records" },
  { icon: Settings, label: "Cài đặt", value: "settings" },
]

interface DoctorSidebarProps {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  activeTab: DoctorTab
  setActiveTab: (tab: DoctorTab) => void
  currentDoctor: CurrentDoctor
  handleLogout: () => void
}

export default function DoctorSidebar({
  sidebarOpen,
  setSidebarOpen,
  activeTab,
  setActiveTab,
  currentDoctor,
  handleLogout
}: DoctorSidebarProps) {
  return (
    <aside className={`col-span-12 md:col-span-3 lg:col-span-2 transition-all duration-300 ${sidebarOpen ? "opacity-100" : "opacity-0 md:opacity-100"}`}>
      <div className="bg-white rounded-2xl shadow-md border p-4 h-fit sticky top-6 hover:shadow-lg transition-shadow duration-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-400 flex items-center justify-center text-white font-bold">
              BS
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Bs. {currentDoctor.FullName}</h3>
              <p className="text-xs text-slate-500">{currentDoctor.specialty.SpecialtyName}</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-md hover:bg-slate-50 transition-colors"
          >
            <Menu className="w-4 h-4 text-slate-600" />
          </button>
        </div>

        <nav className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.value}
              onClick={() => setActiveTab(item.value)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                activeTab === item.value
                  ? "bg-blue-50 text-blue-600"
                  : "hover:bg-slate-50 text-slate-800"
              }`}
            >
              <item.icon className="w-4 h-4" />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-6 pt-4 border-t">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-4 h-4 text-rose-500" />
            <span className="text-sm font-medium text-rose-600">Đăng xuất</span>
          </button>
        </div>
      </div>
    </aside>
  )
}
