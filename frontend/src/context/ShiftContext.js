import { createContext, useContext, useState } from 'react';
import {
  DEPARTMENTS,
  SHIFT_TIMES,
  INITIAL_NURSES,
  INITIAL_SHIFTS,
  INITIAL_SWAP_REQUESTS,
  INITIAL_NOTIFICATIONS,
} from '../data/mockData';

const ShiftContext = createContext();

export const ShiftProvider = ({ children }) => {
  const [userRole, setUserRoleState] = useState('admin'); // 'admin' | 'nurse'
  const [activeTab, setActiveTab] = useState('dashboard');
  const [nurses, setNurses] = useState(INITIAL_NURSES);
  const [shifts, setShifts] = useState(INITIAL_SHIFTS);
  const [swapRequests, setSwapRequests] = useState(INITIAL_SWAP_REQUESTS);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [toast, setToast] = useState(null);
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  // Active nurse user profile if in nurse mode
  const [currentNurseId, setCurrentNurseId] = useState('N-102'); // Marcus Vance

  const currentUser = userRole === 'nurse'
    ? nurses.find((n) => n.id === currentNurseId) || nurses[1]
    : { name: 'Dr. Evelyn Vance (Admin)', role: 'Shift Director & Ward Admin', avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80' };

  const showToast = (message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => setToast(null), 4000);
  };

  const setUserRole = (role) => {
    setUserRoleState(role);
    if (role === 'admin') {
      setActiveTab('dashboard');
      showToast('Switched to Administrator Workspace', 'info');
    } else {
      setActiveTab('nurse-dashboard');
      showToast('Switched to Nurse Portal', 'info');
    }
  };

  // Add new shift manually
  const addShift = (newShiftData) => {
    const assignedNurse = nurses.find((n) => n.id === newShiftData.assignedNurseId);
    const newShift = {
      id: `SH-${Math.floor(100 + Math.random() * 900)}`,
      date: newShiftData.date,
      timeSlot: newShiftData.timeSlot,
      department: newShiftData.department,
      requiredRole: newShiftData.requiredRole || 'Staff Nurse (RN)',
      assignedNurseId: newShiftData.assignedNurseId || null,
      nurseName: assignedNurse ? assignedNurse.name : null,
      status: newShiftData.assignedNurseId ? 'Filled' : (newShiftData.isUrgent ? 'Urgent' : 'Open'),
      incentiveBonus: newShiftData.incentiveBonus || 0,
      notes: newShiftData.notes || 'Created by Administrator.',
    };

    setShifts((prev) => [newShift, ...prev]);

    if (assignedNurse) {
      // Update nurse hours
      setNurses((prev) =>
        prev.map((n) => (n.id === assignedNurse.id ? { ...n, scheduledHours: n.scheduledHours + 8 } : n))
      );
    }

    showToast(`New shift created for ${newShift.department} on ${newShift.date}`, 'success');
  };

  // Assign nurse to an open shift
  const assignNurseToShift = (shiftId, nurseId) => {
    const nurse = nurses.find((n) => n.id === nurseId);
    if (!nurse) return;

    setShifts((prev) =>
      prev.map((s) =>
        s.id === shiftId
          ? { ...s, assignedNurseId: nurseId, nurseName: nurse.name, status: 'Filled' }
          : s
      )
    );

    // Update nurse hours
    setNurses((prev) =>
      prev.map((n) => (n.id === nurseId ? { ...n, scheduledHours: n.scheduledHours + 8 } : n))
    );

    showToast(`Assigned ${nurse.name} to shift #${shiftId}`, 'success');
  };

  // Unassign nurse from a shift
  const unassignNurseFromShift = (shiftId) => {
    const shift = shifts.find((s) => s.id === shiftId);
    if (!shift || !shift.assignedNurseId) return;

    const nurseId = shift.assignedNurseId;

    setShifts((prev) =>
      prev.map((s) =>
        s.id === shiftId ? { ...s, assignedNurseId: null, nurseName: null, status: 'Open' } : s
      )
    );

    setNurses((prev) =>
      prev.map((n) => (n.id === nurseId ? { ...n, scheduledHours: Math.max(0, n.scheduledHours - 8) } : n))
    );

    showToast(`Unassigned nurse from shift #${shiftId}`, 'warning');
  };

  // Register new Nurse
  const addNurse = (nurseData) => {
    const newNurse = {
      id: `N-${Math.floor(100 + Math.random() * 900)}`,
      name: nurseData.name,
      role: nurseData.role || 'Staff Nurse (RN)',
      department: nurseData.department,
      email: nurseData.email,
      phone: nurseData.phone || '+1 (555) 000-0000',
      avatar: nurseData.avatar || 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=150&auto=format&fit=crop&q=80',
      experienceYears: parseInt(nurseData.experienceYears || '3', 10),
      certifications: nurseData.certifications || ['BLS', 'ACLS'],
      maxWeeklyHours: parseInt(nurseData.maxWeeklyHours || '40', 10),
      scheduledHours: 0,
      burnoutScore: 10,
      shiftPreference: nurseData.shiftPreference || 'Day',
      status: 'Available',
    };

    setNurses((prev) => [newNurse, ...prev]);
    showToast(`Registered new staff nurse ${newNurse.name}`, 'success');
  };

  // AI Schedule Generator (Solves open shifts optimal allocation)
  const generateAISchedule = async (rules) => {
    setIsAiGenerating(true);
    showToast('AI Optimization Engine started... Analyzing constraints', 'info');

    // Simulate AI computing latency
    await new Promise((res) => setTimeout(res, 2200));

    let assignedCount = 0;

    // Find open or urgent shifts
    const updatedShifts = shifts.map((shift) => {
      if (shift.status === 'Open' || shift.status === 'Urgent') {
        // Find available nurse matching department & capacity
        const eligibleNurse = nurses.find(
          (n) =>
            n.scheduledHours < n.maxWeeklyHours &&
            (n.department === shift.department || n.certifications.includes('CCRN') || n.certifications.includes('ACLS'))
        );

        if (eligibleNurse) {
          assignedCount++;
          eligibleNurse.scheduledHours += 8;
          return {
            ...shift,
            assignedNurseId: eligibleNurse.id,
            nurseName: eligibleNurse.name,
            status: 'Filled',
            notes: `${shift.notes} (Auto-assigned by AI Engine with 96% Match Score)`,
          };
        }
      }
      return shift;
    });

    setShifts(updatedShifts);
    setIsAiGenerating(false);

    const newNotif = {
      id: `NOTIF-${Date.now()}`,
      type: 'success',
      title: 'AI Roster Optimization Complete',
      message: `Successfully assigned ${assignedCount} unfilled shifts with zero compliance fatigue violations.`,
      time: 'Just now',
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);

    showToast(`AI Engine optimized schedule! Filled ${assignedCount} shifts with 98% coverage score.`, 'success');
  };

  // Request shift swap (Nurse side)
  const requestShiftSwap = (swapData) => {
    const newSwap = {
      id: `SWAP-${Math.floor(500 + Math.random() * 900)}`,
      requesterId: currentUser.id,
      requesterName: currentUser.name,
      requesterShiftId: swapData.requesterShiftId,
      requesterShiftDate: swapData.requesterShiftDate,
      requesterShiftType: swapData.requesterShiftType,
      requesterDepartment: swapData.requesterDepartment,
      targetNurseId: swapData.targetNurseId || null,
      targetNurseName: swapData.targetNurseName || 'Open Exchange',
      targetShiftId: swapData.targetShiftId || null,
      targetShiftDate: swapData.targetShiftDate || 'Flex',
      targetShiftType: swapData.targetShiftType || 'Flex',
      targetDepartment: swapData.targetDepartment || swapData.requesterDepartment,
      reason: swapData.reason,
      status: 'Pending',
      createdAt: 'Just now',
    };

    setSwapRequests((prev) => [newSwap, ...prev]);
    showToast('Shift swap request submitted for manager review.', 'success');
  };

  // Approve swap request (Admin side)
  const approveSwapRequest = (swapId) => {
    const request = swapRequests.find((r) => r.id === swapId);
    if (!request) return;

    setSwapRequests((prev) =>
      prev.map((r) => (r.id === swapId ? { ...r, status: 'Approved' } : r))
    );

    // Perform the actual nurse swap on the shifts
    if (request.targetShiftId && request.targetNurseId) {
      setShifts((prev) =>
        prev.map((s) => {
          if (s.id === request.requesterShiftId) {
            return { ...s, assignedNurseId: request.targetNurseId, nurseName: request.targetNurseName };
          }
          if (s.id === request.targetShiftId) {
            return { ...s, assignedNurseId: request.requesterId, nurseName: request.requesterName };
          }
          return s;
        })
      );
    }

    showToast(`Approved shift swap request #${swapId}`, 'success');
  };

  // Reject swap request
  const rejectSwapRequest = (swapId) => {
    setSwapRequests((prev) =>
      prev.map((r) => (r.id === swapId ? { ...r, status: 'Rejected' } : r))
    );
    showToast(`Rejected swap request #${swapId}`, 'info');
  };

  // Pickup open shift (Nurse side)
  const pickupShift = (shiftId) => {
    assignNurseToShift(shiftId, currentUser.id);
    showToast(`You picked up shift #${shiftId}! Incentive added to your pay period.`, 'success');
  };

  // Clock In simulation
  const clockInShift = (shiftId) => {
    showToast(`Clocked IN for shift #${shiftId}! GPS Verified: City General Hospital`, 'success');
  };

  const markNotificationRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    showToast('All notifications marked as read', 'info');
  };

  return (
    <ShiftContext.Provider
      value={{
        userRole,
        setUserRole,
        activeTab,
        setActiveTab,
        currentUser,
        currentNurseId,
        setCurrentNurseId,
        nurses,
        shifts,
        swapRequests,
        notifications,
        toast,
        isAiGenerating,
        showToast,
        addShift,
        assignNurseToShift,
        unassignNurseFromShift,
        addNurse,
        generateAISchedule,
        requestShiftSwap,
        approveSwapRequest,
        rejectSwapRequest,
        pickupShift,
        clockInShift,
        markNotificationRead,
        markAllNotificationsRead,
        DEPARTMENTS,
        SHIFT_TIMES,
      }}
    >
      {children}
    </ShiftContext.Provider>
  );
};

export const useShift = () => useContext(ShiftContext);
