import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute, RoleGuard, GuestRoute } from "../guards";

import AdminLayout from "../components/layout/AdminLayout";
import AuthLayout from "../components/layout/AuthLayout";

import LoginPage from "../pages/auth/LoginPage";
import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "../pages/auth/ResetPasswordPage";
import AlumniRegisterPage from "../pages/auth/AlumniRegisterPage";

import DashboardPage from "../pages/admin/dashboard/DashboardPage";
import UsersListPage from "../pages/admin/users/UsersListPage";
import UserDetailPage from "../pages/admin/users/UserDetailPage";
import LoginLogsPage from "../pages/admin/login-logs/LoginLogsPage";
import DepartmentsListPage from "../pages/admin/departments/DepartmentsListPage";
import DepartmentDetailPage from "../pages/admin/departments/DepartmentDetailPage";
import GraduateImportPage from "../pages/admin/graduates/GraduateImportPage";
import GraduatesListPage from "../pages/admin/graduates/GraduatesListPage";
import GraduateDetailPage from "../pages/admin/graduates/GraduateDetailPage";
import ImportHistoryPage from "../pages/admin/graduates/ImportHistoryPage";
import RegistrationSettingsPage from "../pages/admin/verification/RegistrationSettingsPage";
import VerificationLogsPage from "../pages/admin/verification/VerificationLogsPage";
import BlacklistPage from "../pages/admin/verification/BlacklistPage";
import AnalyticsDashboardPage from "../pages/admin/analytics/AnalyticsDashboardPage";
import NotificationsPage from "../pages/admin/notifications/NotificationsPage";
import ReportsPage from "../pages/admin/reports/ReportsPage";
import JobPostsPage from "../pages/admin/job-posts/JobPostsPage";
import CoursesListPage from "../pages/admin/courses/CoursesListPage";

import AlumniLayout from "../components/layout/AlumniLayout";
import AlumniDashboardPage from "../pages/alumni/dashboard/AlumniDashboardPage";
import AlumniProfilePageView from "../pages/alumni/profile/AlumniProfilePage";
import AlumniEmploymentPage from "../pages/alumni/employment/AlumniEmploymentPage";
import AlumniBoardExamPage from "../pages/alumni/board-exam/AlumniBoardExamPage";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ─── Guest Routes ──────────────────────────── */}
        <Route element={<GuestRoute />}>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route
              path="/reset-password/:token"
              element={<ResetPasswordPage />}
            />
            <Route path="/register" element={<AlumniRegisterPage />} />
          </Route>
        </Route>

        {/* ─── Admin Routes ──────────────────────────── */}
        <Route element={<ProtectedRoute />}>
          <Route element={<RoleGuard roles={["admin"]} />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="users" element={<UsersListPage />} />
              <Route path="users/:uuid" element={<UserDetailPage />} />
              <Route path="login-logs" element={<LoginLogsPage />} />
              <Route path="departments" element={<DepartmentsListPage />} />
              <Route
                path="departments/:id"
                element={<DepartmentDetailPage />}
              />
              <Route path="courses" element={<CoursesListPage />} />
              <Route path="graduates" element={<GraduatesListPage />} />
              <Route path="graduates/import" element={<GraduateImportPage />} />
              <Route
                path="graduates/import-history"
                element={<ImportHistoryPage />}
              />
              <Route path="graduates/:id" element={<GraduateDetailPage />} />
              <Route
                path="registration/settings"
                element={<RegistrationSettingsPage />}
              />
              <Route
                path="verification/logs"
                element={<VerificationLogsPage />}
              />
              <Route path="blacklist" element={<BlacklistPage />} />
              <Route path="analytics" element={<AnalyticsDashboardPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="job-posts" element={<JobPostsPage />} />
            </Route>
          </Route>
        </Route>

        {/* ─── Alumni Routes ─────────────────────────── */}
        <Route element={<ProtectedRoute />}>
          <Route element={<RoleGuard roles={["alumni"]} />}>
            <Route path="/alumni" element={<AlumniLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AlumniDashboardPage />} />
              <Route path="profile" element={<AlumniProfilePageView />} />
              <Route path="employment" element={<AlumniEmploymentPage />} />
              <Route path="board-exam" element={<AlumniBoardExamPage />} />
            </Route>
          </Route>
        </Route>

        {/* ─── Fallback ──────────────────────────────── */}
        <Route
          path="/unauthorized"
          element={
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-slate-800 mb-2">403</h1>
                <p className="text-slate-500">
                  You do not have permission to access this page.
                </p>
              </div>
            </div>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
