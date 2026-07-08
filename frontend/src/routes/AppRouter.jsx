import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute, RoleGuard, GuestRoute } from "../guards";

import AdminLayout from "../components/layout/AdminLayout";
import AuthLayout from "../components/layout/AuthLayout";

import LoginPage from "../pages/auth/LoginPage";
import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "../pages/auth/ResetPasswordPage";
import AlumniRegisterPage from "../pages/auth/AlumniRegisterPage";

import DashboardPage from "../pages/admin/dashboard/DashboardPage";
import LoginLogsPage from "../pages/admin/login-logs/LoginLogsPage";
import DepartmentsListPage from "../pages/admin/departments/DepartmentsListPage";
import DepartmentDetailPage from "../pages/admin/departments/DepartmentDetailPage";
import GraduateImportPage from "../pages/admin/graduates/GraduateImportPage";
import GraduatesListPage from "../pages/admin/graduates/GraduatesListPage";
import GraduateDetailPage from "../pages/admin/graduates/GraduateDetailPage";
import ImportHistoryPage from "../pages/admin/graduates/ImportHistoryPage";
import VerificationLogsPage from "../pages/admin/verification/VerificationLogsPage";
import AnalyticsDashboardPage from "../pages/admin/analytics/AnalyticsDashboardPage";
import NotificationsPage from "../pages/admin/notifications/NotificationsPage";
import EmployerListPage from "../pages/admin/employers/EmployerListPage";
import EmployerDetailPage from "../pages/admin/employers/EmployerDetailPage";
import JobModerationListPage from "../pages/admin/job-moderation/JobModerationListPage";
import JobModerationDetailPage from "../pages/admin/job-moderation/JobModerationDetailPage";
import AnnouncementListPage from "../pages/admin/announcements/AnnouncementListPage";
import AnnouncementFormPage from "../pages/admin/announcements/AnnouncementFormPage";
import SettingsPage from "../pages/admin/settings/SettingsPage";

import AlumniLayout from "../components/layout/AlumniLayout";
import AlumniDashboardPage from "../pages/alumni/dashboard/AlumniDashboardPage";
import AlumniProfilePageView from "../pages/alumni/profile/AlumniProfilePage";
import AlumniEmploymentPage from "../pages/alumni/employment/AlumniEmploymentPage";
import AlumniBoardExamPage from "../pages/alumni/board-exam/AlumniBoardExamPage";
import AlumniJobBoardPage from "../pages/alumni/jobs/AlumniJobBoardPage";
import AlumniJobDetailPage from "../pages/alumni/jobs/AlumniJobDetailPage";
import AlumniMyApplicationsPage from "../pages/alumni/jobs/AlumniMyApplicationsPage";
import AlumniAnnouncementsPage from "../pages/alumni/announcements/AlumniAnnouncementsPage";
import AlumniInboxPage from "../pages/alumni/messages/AlumniInboxPage";
import AlumniConversationPage from "../pages/alumni/messages/AlumniConversationPage";

import EmployerLayout from "../components/layout/EmployerLayout";
import EmployerRegisterPage from "../pages/employer/auth/EmployerRegisterPage";
import EmployerDashboardPage from "../pages/employer/dashboard/EmployerDashboardPage";
import EmployerProfilePage from "../pages/employer/profile/EmployerProfilePage";
import EmployerJobListPage from "../pages/employer/jobs/EmployerJobListPage";
import EmployerJobCreatePage from "../pages/employer/jobs/EmployerJobCreatePage";
import EmployerJobApplicantsPage from "../pages/employer/jobs/EmployerJobApplicantsPage";

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
          {/* Employer registration is a standalone full-page form */}
          <Route path="/employer/register" element={<EmployerRegisterPage />} />
        </Route>

        {/* ─── Admin Routes ──────────────────────────── */}
        <Route element={<ProtectedRoute />}>
          <Route element={<RoleGuard roles={["admin"]} />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="login-logs" element={<LoginLogsPage />} />
              <Route path="departments" element={<DepartmentsListPage />} />
              <Route
                path="departments/:id"
                element={<DepartmentDetailPage />}
              />
              <Route path="graduates" element={<GraduatesListPage />} />
              <Route path="graduates/import" element={<GraduateImportPage />} />
              <Route
                path="graduates/import-history"
                element={<ImportHistoryPage />}
              />
              <Route path="graduates/:id" element={<GraduateDetailPage />} />
              <Route
                path="verification/logs"
                element={<VerificationLogsPage />}
              />
              <Route path="analytics" element={<AnalyticsDashboardPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="employers" element={<EmployerListPage />} />
              <Route path="employers/:id" element={<EmployerDetailPage />} />
              <Route path="job-posts" element={<JobModerationListPage />} />
              <Route path="job-posts/:id" element={<JobModerationDetailPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="announcements" element={<AnnouncementListPage />} />
              <Route path="announcements/new" element={<AnnouncementFormPage />} />
              <Route path="announcements/:id/edit" element={<AnnouncementFormPage />} />
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
              <Route path="jobs" element={<AlumniJobBoardPage />} />
              <Route path="jobs/:id" element={<AlumniJobDetailPage />} />
              <Route path="my-applications" element={<AlumniMyApplicationsPage />} />
              <Route path="announcements" element={<AlumniAnnouncementsPage />} />
              <Route path="messages" element={<AlumniInboxPage />} />
              <Route path="messages/:id" element={<AlumniConversationPage />} />
            </Route>
          </Route>
        </Route>

        {/* ─── Employer Routes ───────────────────────── */}
        <Route element={<ProtectedRoute />}>
          <Route element={<RoleGuard roles={["employer"]} />}>
            <Route path="/employer" element={<EmployerLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<EmployerDashboardPage />} />
              <Route path="profile" element={<EmployerProfilePage />} />
              <Route path="jobs" element={<EmployerJobListPage />} />
              <Route path="jobs/new" element={<EmployerJobCreatePage />} />
              <Route path="jobs/:id/edit" element={<EmployerJobCreatePage />} />
              <Route path="jobs/:id/applicants" element={<EmployerJobApplicantsPage />} />
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
