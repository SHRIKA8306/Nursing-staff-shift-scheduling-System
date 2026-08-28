import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import NurseManagement from "./pages/NurseManagement";
import NurseDashboard from "./pages/NurseDashboard";
import MySchedule from "./pages/MySchedule";
import ShiftSwap from "./pages/ShiftSwap";
import LeaveManagement from "./pages/LeaveManagement";
import Attendance from "./pages/Attendance";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Login Route */}
          <Route path="/" element={<Login />} />

          {/* Protected Administrator Routes */}
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/nurse-management"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <NurseManagement />
              </ProtectedRoute>
            }
          />

          {/* Protected Nurse Routes */}
          <Route
            path="/nurse-dashboard"
            element={
              <ProtectedRoute allowedRoles={["nurse", "admin"]}>
                <NurseDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-schedule"
            element={
              <ProtectedRoute allowedRoles={["nurse", "admin"]}>
                <MySchedule />
              </ProtectedRoute>
            }
          />
          <Route
            path="/shift-swap"
            element={
              <ProtectedRoute allowedRoles={["nurse", "admin"]}>
                <ShiftSwap />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leave-management"
            element={
              <ProtectedRoute allowedRoles={["nurse", "admin"]}>
                <LeaveManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/attendance"
            element={
              <ProtectedRoute allowedRoles={["nurse", "admin"]}>
                <Attendance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute allowedRoles={["nurse", "admin"]}>
                <Notifications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={["nurse", "admin"]}>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute allowedRoles={["nurse", "admin"]}>
                <Settings />
              </ProtectedRoute>
            }
          />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;