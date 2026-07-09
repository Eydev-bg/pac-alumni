import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute, RoleGuard, GuestRoute, LoadingScreen } from "../guards";

// Layouts are the app shell and are needed to render any route, so they stay
// eagerly imported. Only page components below are code-split with React.lazy
// so each route ships as its own chunk and the admin entry no longer bundles
// alumni/employer page code.
import AdminLayout from "../components/layout/AdminLayout";
import AuthLayout from "../components/layout/AuthLayout";
import AlumniLayout from "../components/layout/AlumniLayout";
import EmployerLayout from "../components/layout/EmployerLayout";

// ─── Auth pages ──────────────────────────────────────────
const LoginPage = lazy(() => import("../pages/auth/LoginPage"));
const ForgotPasswordPage = lazy(() => import("../pages/auth/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("../pages/auth/ResetPasswordPage"));
const AlumniRegisterPage = lazy(() => import("../pages/auth/AlumniRegisterPage"));

// ─── Admin pages ─────────────────────────────────────────
const DashboardPage = lazy(() => import("../pages/admin/dashboard/DashboardPage"));
const LoginLogsPage = lazy(() => import("../pages/admin/login-logs/LoginLogsPage"));
const DepartmentsListPage = lazy(() => import("../pages/admin/departments/DepartmentsListPage"));
const DepartmentDetailPage = lazy(() => import("../pages/admin/departments/DepartmentDetailPage"));
const GraduateImportPage = lazy(() => import("../pages/admin/graduates/GraduateImportPage"));
const GraduatesListPage = lazy(() => import("../pages/admin/graduates/GraduatesListPage"));
const GraduateDetailPage = lazy(() => import("../pages/admin/graduates/GraduateDetailPage"));
const ImportHistoryPage = lazy(() => import("../pages/admin/graduates/ImportHistoryPage"));
const VerificationLogsPage = lazy(() => import("../pages/admin/verification/VerificationLogsPage"));
const AnalyticsDashboardPage = lazy(() => import("../pages/admin/analytics/AnalyticsDashboardPage"));
const NotificationsPage = lazy(() => import("../pages/admin/notifications/NotificationsPage"));
const EmployerListPage = lazy(() => import("../pages/admin/employers/EmployerListPage"));
const EmployerDetailPage = lazy(() => import("../pages/admin/employers/EmployerDetailPage"));
const JobModerationListPage = lazy(() => import("../pages/admin/job-moderation/JobModerationListPage"));
const JobModerationDetailPage = lazy(() => import("../pages/admin/job-moderation/JobModerationDetailPage"));
const AnnouncementListPage = lazy(() => import("../pages/admin/announcements/AnnouncementListPage"));
const AnnouncementFormPage = lazy(() => import("../pages/admin/announcements/AnnouncementFormPage"));
const SettingsPage = lazy(() => import("../pages/admin/settings/SettingsPage"));

// ─── Alumni pages ────────────────────────────────────────
const AlumniDashboardPage = lazy(() => import("../pages/alumni/dashboard/AlumniDashboardPage"));
const AlumniProfilePageView = lazy(() => import("../pages/alumni/profile/AlumniProfilePage"));
const AlumniEmploymentPage = lazy(() => import("../pages/alumni/employment/AlumniEmploymentPage"));
const AlumniBoardExamPage = lazy(() => import("../pages/alumni/board-exam/AlumniBoardExamPage"));
const AlumniJobBoardPage = lazy(() => import("../pages/alumni/jobs/AlumniJobBoardPage"));
const AlumniJobDetailPage = lazy(() => import("../pages/alumni/jobs/AlumniJobDetailPage"));
const AlumniMyApplicationsPage = lazy(() => import("../pages/alumni/jobs/AlumniMyApplicationsPage"));
const AlumniAnnouncementsPage = lazy(() => import("../pages/alumni/announcements/AlumniAnnouncementsPage"));
const AlumniInboxPage = lazy(() => import("../pages/alumni/messages/AlumniInboxPage"));
const AlumniConversationPage = lazy(() => import("../pages/alumni/messages/AlumniConversationPage"));

// ─── Employer pages ──────────────────────────────────────
const EmployerRegisterPage = lazy(() => import("../pages/employer/auth/EmployerRegisterPage"));
const EmployerDashboardPage = lazy(() => import("../pages/employer/dashboard/EmployerDashboardPage"));
const EmployerProfilePage = lazy(() => import("../pages/employer/profile/EmployerProfilePage"));
const EmployerJobListPage = lazy(() => import("../pages/employer/jobs/EmployerJobListPage"));
const EmployerJobCreatePage = lazy(() => import("../pages/employer/jobs/EmployerJobCreatePage"));
const EmployerJobApplicantsPage = lazy(() => import("../pages/employer/jobs/EmployerJobApplicantsPage"));

export default function AppRouter() {
  return (
    <BrowserRouter>
      {/* Single Suspense boundary wrapping every lazy route element; the
          shared LoadingScreen shows briefly while a route chunk loads. */}
      <Suspense fallback={<LoadingScreen />}>
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
      </Suspense>
    </BrowserRouter>
  );
}
