import { useState, useCallback } from 'react';
import { doctorService } from '@/app/services/doctorService';

export interface Slot {
  id: number;
  date: string;
  start_time: string;
  end_time: string;
  status: 'available' | 'booked' | 'blocked';
  patient_id?: number;
  patient_name?: string;
}

export const useSlotManagement = () => {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSlots = useCallback(async (startDate?: Date) => {
    try {
      setLoading(true);
      setError(null);

      const date = startDate || new Date();
      const targetDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      const response = await doctorService.getMySlots(targetDate);
      if (!response.success) {
        setError("Không thể tải lịch làm việc");
        return;
      }

      setSlots(response.data.map((slot) => ({
        id: slot.SlotID,
        date: slot.StartTime.slice(0, 10),
        start_time: slot.StartTime.slice(11, 16),
        end_time: slot.EndTime.slice(11, 16),
        status: slot.Status.toLowerCase() === "booked"
          ? "booked"
          : slot.Status.toLowerCase() === "blocked"
            ? "blocked"
            : "available",
      })));
    } catch (err) {
      setError('Có lỗi xảy ra khi tải lịch làm việc');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createSlot = useCallback(async (slotData: {
    date: string;
    start_time: string;
    end_time: string;
    max_patients?: number;
  }) => {
    try {
      setLoading(true);
      setError(null);
      
      await doctorService.createSlot(slotData);
      return { success: true };
    } catch (err) {
      const errorMsg = 'Có lỗi xảy ra khi tạo slot';
      setError(errorMsg);
      console.error(err);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteSlot = useCallback(async (slotId: number) => {
    try {
      setLoading(true);
      setError(null);
      
      await doctorService.deleteSlot(slotId);
      setSlots(prev => prev.map(slot =>
        slot.id === slotId ? { ...slot, status: "blocked" } : slot
      ));
      return { success: true };
    } catch (err) {
      const errorMsg = 'Có lỗi xảy ra khi xóa slot';
      setError(errorMsg);
      console.error(err);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  const blockSlot = useCallback(async (slotId: number) => {
    try {
      setLoading(true);
      setError(null);
      
      // Assuming we have an API to block a slot
      // For now, we'll just update local state
      setSlots(prev => prev.map(slot => 
        slot.id === slotId ? { ...slot, status: 'blocked' } : slot
      ));
      
      return { success: true };
    } catch (err) {
      setError('Không thể khóa slot');
      console.error(err);
      return { success: false, error: 'Không thể khóa slot' };
    } finally {
      setLoading(false);
    }
  }, []);

  const getSlotsForDate = useCallback((date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return slots.filter(slot => slot.date === dateStr);
  }, [slots]);

  const getSlotsForWeek = useCallback((weekStart: Date) => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    return slots.filter(slot => {
      const slotDate = new Date(slot.date);
      return slotDate >= weekStart && slotDate <= weekEnd;
    });
  }, [slots]);

  return {
    slots,
    loading,
    error,
    loadSlots,
    createSlot,
    deleteSlot,
    blockSlot,
    getSlotsForDate,
    getSlotsForWeek
  };
};
