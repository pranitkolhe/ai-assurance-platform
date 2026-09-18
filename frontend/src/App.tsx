import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";

import ProtectedRoute from "./routes/ProtectedRoute";
import DashboardLayout from "./views/layouts/DashboardLayout";

import LoginPage from "./views/pages/auth/LoginPage";

// Admin
import AdminDashboard from "./views/pages/admin/AdminDashboard";

// Contributor
import ContributorDashboard from "./views/pages/contributor/ContributorDashboard";
import MyAssessmentsPage from "./views/pages/contributor/MyAssessmentsPage";
import SubmitAssetPage from "./views/pages/contributor/SubmitAssetPage";
import ContributorAssetsPage from "./views/pages/contributor/ContributorAssetsPage";
import AssessmentStatusPage from "./views/pages/contributor/AssessmentStatusPage";
import ContributorReportsPage from "./views/pages/contributor/ContributorReportsPage";
import ContributorReportDetailsPage from "./views/pages/contributor/ContributorReportDetailsPage";

// Analyst
import AnalystDashboard from "./views/pages/analyst/AnalystDashboard";
import AssessmentQueuePage from "./views/pages/analyst/AssessmentQueuePage";
import AssessmentsPage from "./views/pages/analyst/AssessmentsPage";
import AssessmentDetailsPage from "./views/pages/analyst/AssessmentDetailsPage";
import ReferenceRepositoryPage from "./views/pages/analyst/ReferenceRepositoryPage";
import DataIntegrityPage from "./views/pages/analyst/DataIntegrityPage";
import ModelIntegrityPage from "./views/pages/analyst/ModelIntegrityPage";
import InferenceVerificationPage from "./views/pages/analyst/InferenceVerificationPage";
import DistributionAnalysisPage from "./views/pages/analyst/DistributionAnalysisPage";
import FindingsPage from "./views/pages/analyst/FindingsPage";
import FlaggedImagesPage from "./views/pages/analyst/FlaggedImagesPage";
import FlaggedImageDetailsPage from "./views/pages/analyst/FlaggedImageDetailsPage";
import EvidencePage from "./views/pages/analyst/EvidencePage";
import RiskAssessmentPage from "./views/pages/analyst/RiskAssessmentPage";

function RoleRedirect() {
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          {/* Admin */}

          <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
            </Route>
          </Route>

          {/* Contributor */}

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

              <Route path="/contributor/submit" element={<SubmitAssetPage />} />

              <Route
                path="/contributor/assets"
                element={<ContributorAssetsPage />}
              />

              <Route
                path="/contributor/status"
                element={<AssessmentStatusPage />}
              />

              <Route
                path="/contributor/reports"
                element={<ContributorReportsPage />}
              />

              <Route
                path="/contributor/reports/:id"
                element={<ContributorReportDetailsPage />}
              />
            </Route>
          </Route>

          {/* Analyst */}

          <Route element={<ProtectedRoute allowedRoles={["analyst"]} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/analyst/dashboard" element={<AnalystDashboard />} />

              <Route path="/analyst/queue" element={<AssessmentQueuePage />} />

              <Route
                path="/analyst/assessments"
                element={<AssessmentsPage />}
              />

              <Route
                path="/analyst/assessments/:id"
                element={<AssessmentDetailsPage />}
              />

              <Route
                path="/analyst/references"
                element={<ReferenceRepositoryPage />}
              />

              <Route
                path="/analyst/flagged-images"
                element={<FlaggedImagesPage />}
              />

              <Route
                path="/analyst/flagged-images/:id"
                element={<FlaggedImageDetailsPage />}
              />

              <Route path="/analyst/evidence" element={<EvidencePage />} />

              <Route path="/analyst/risk" element={<RiskAssessmentPage />} />

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

          <Route path="*" element={<RoleRedirect />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
