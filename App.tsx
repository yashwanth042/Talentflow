import { Link, Routes, Route, Navigate, useLocation } from "react-router-dom";
import JobsPage from "./pages/JobsPage";
import CandidatesPage from "./pages/CandidatesPage";
import CandidateProfilePage from "./pages/CandidateProfilePage";
import AssessmentBuilderPage from "./pages/AssessmentBuilderPage";
import AssessmentRunnerPage from "./pages/AssessmentRunnerPage";

export default function App() {
  const location = useLocation();
  return (
    <div className="min-h-screen flex flex-col">
      <header className="h-14 border-b flex items-center px-4 gap-4 bg-white/80 backdrop-blur">
        <div className="font-bold tracking-tight">TalentFlow</div>
        <nav className="flex gap-3 text-sm">
          <Link
            to="/jobs"
            className={location.pathname.startsWith("/jobs") ? "font-semibold" : ""}
          >
            Jobs
          </Link>
          <Link
            to="/candidates"
            className={location.pathname.startsWith("/candidates") ? "font-semibold" : ""}
          >
            Candidates
          </Link>
          <Link
            to="/assessments/1"
            className={location.pathname.startsWith("/assessments") ? "font-semibold" : ""}
          >
            Assessments
          </Link>
        </nav>
      </header>
      <main className="flex-1 bg-slate-50">
        <Routes>
          <Route path="/" element={<Navigate to="/jobs" replace />} />
          <Route path="/jobs" element={<JobsPage />} />
          <Route path="/jobs/:jobId" element={<JobsPage />} />
          <Route path="/candidates" element={<CandidatesPage />} />
          <Route path="/candidates/:id" element={<CandidateProfilePage />} />
          <Route path="/assessments/:jobId" element={<AssessmentBuilderPage />} />
          <Route path="/assessments/:jobId/run" element={<AssessmentRunnerPage />} />
        </Routes>
      </main>
    </div>
  );
}

