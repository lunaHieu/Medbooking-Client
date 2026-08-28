// app/Doctor/components/DoctorDashboard.tsx
interface DashboardStats {
  total_appointments?: number;
  today_appointments?: number;
  pending_appointments?: number;
  completed_appointments?: number;
}

interface DashboardData {
  data?: { stats?: DashboardStats };
}

interface QueueItem {
  patient?: string;
  status?: string;
}

interface QueueData {
  data?: QueueItem[];
}

interface DoctorDashboardProps {
  dashboardData?: DashboardData;
  queueData?: QueueData;
}

export default function DoctorDashboard({ dashboardData, queueData }: DoctorDashboardProps) {
  
  const stats = dashboardData?.data?.stats || {};
  
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">Tổng cuộc hẹn</h3>
          <p className="text-2xl font-bold mt-2">{stats.total_appointments || 0}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">Hôm nay</h3>
          <p className="text-2xl font-bold mt-2">{stats.today_appointments || 0}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">Đang chờ</h3>
          <p className="text-2xl font-bold mt-2">{stats.pending_appointments || 0}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">Đã hoàn thành</h3>
          <p className="text-2xl font-bold mt-2">{stats.completed_appointments || 0}</p>
        </div>
      </div>
      
      {/* Queue Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Hàng chờ bệnh nhân</h2>
        {queueData?.data?.length ? (
          <ul className="space-y-2">
            {queueData.data.map((item, index) => (
              <li key={index} className="flex justify-between items-center p-3 border rounded">
                <span>{item.patient || `Bệnh nhân ${index + 1}`}</span>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  {item.status || 'Chờ khám'}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">Không có bệnh nhân trong hàng chờ</p>
        )}
      </div>
      
      {/* Actions */}
      <div className="flex space-x-4">
        <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Xem lịch làm việc
        </button>
        <button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
          Tạo bệnh án mới
        </button>
        <button className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600">
          Quản lý slot
        </button>
      </div>
    </div>
  );
}
