import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";

import ProtectedRoute from "./routes/ProtectedRoute";
import DashboardLayout from "./views/layouts/DashboardLayout";

import LoginPage from "./views/pages/auth/LoginPage";

import AdminDashboard from "./views/pages/admin/AdminDashboard";

import ContributorDashboard from "./views/pages/contributor/ContributorDashboard";
import MyAssessmentsPage from "./views/pages/contributor/MyAssessmentsPage";
import AssessmentStatusPage from "./views/pages/contributor/AssessmentStatusPage";
import SubmitAssetPage from "./views/pages/contributor/SubmitAssetPage";

import AnalystDashboard from "./views/pages/analyst/AnalystDashboard";
import AssessmentQueuePage from "./views/pages/analyst/AssessmentQueuePage";
import AssessmentsPage from "./views/pages/analyst/AssessmentsPage";
import AssessmentDetailsPage from "./views/pages/analyst/AssessmentDetailsPage";
import DataIntegrityPage from "./views/pages/analyst/DataIntegrityPage";
import ModelIntegrityPage from "./views/pages/analyst/ModelIntegrityPage";
import InferenceVerificationPage from "./views/pages/analyst/InferenceVerificationPage";
import DistributionAnalysisPage from "./views/pages/analyst/DistributionAnalysisPage";
import FindingsPage from "./views/pages/analyst/FindingsPage";
import FlaggedImagesPage from "./views/pages/analyst/FlaggedImagesPage";
import FlaggedImageDetailsPage from "./views/pages/analyst/FlaggedImageDetailsPage";

function RoleRedirect() {
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* ================================================================
              PUBLIC
          ================================================================ */}

          <Route path="/login" element={<LoginPage />} />

          {/* ================================================================
              ADMIN
          ================================================================ */}

          <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
            </Route>
          </Route>

          {/* ================================================================
              CONTRIBUTOR
          ================================================================ */}

          <Route element={<ProtectedRoute allowedRoles={["contributor"]} />}>
            <Route element={<DashboardLayout />}>
              <Route
                path="/contributor/dashboard"
                element={<ContributorDashboard />}
              />

              <Route
                path="/contributor/assessments"
                element={<MyAssessmentsPage />}
              />

              <Route
                path="/contributor/assessments/:id"
                element={<AssessmentStatusPage />}
              />

              <Route path="/contributor/submit" element={<SubmitAssetPage />} />
            </Route>
          </Route>

          {/* ================================================================
              ANALYST
          ================================================================ */}

          <Route element={<ProtectedRoute allowedRoles={["analyst"]} />}>
            <Route element={<DashboardLayout />}>
              {/* Dashboard */}

              <Route path="/analyst/dashboard" element={<AnalystDashboard />} />

              {/* Assessment Queue */}

              <Route path="/analyst/queue" element={<AssessmentQueuePage />} />

              {/* All Assessments */}

              <Route
                path="/analyst/assessments"
                element={<AssessmentsPage />}
              />

              {/* Assessment Details */}

              <Route
                path="/analyst/assessments/:id"
                element={<AssessmentDetailsPage />}
              />

              <Route
                path="/analyst/flagged-images"
                element={<FlaggedImagesPage />}
              />

              <Route
                path="/analyst/flagged-images/:id"
                element={<FlaggedImageDetailsPage />}
              />

              {/* ============================================================
                  ASSURANCE DOMAINS
              ============================================================ */}

              <Route
                path="/analyst/data-integrity"
                element={<DataIntegrityPage />}
              />

              <Route
                path="/analyst/model-integrity"
                element={<ModelIntegrityPage />}
              />

              <Route
                path="/analyst/inference-verification"
                element={<InferenceVerificationPage />}
              />

              <Route
                path="/analyst/distribution-analysis"
                element={<DistributionAnalysisPage />}
              />

              <Route path="/analyst/findings" element={<FindingsPage />} />
            </Route>
          </Route>

          {/* ================================================================
              UNKNOWN ROUTE
          ================================================================ */}

          <Route path="*" element={<RoleRedirect />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
