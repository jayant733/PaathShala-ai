import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { PrivateRoute, PublicRoute } from './routes/RouteWrappers';
import DashboardLayout from './layouts/DashboardLayout';
import { ErrorBoundary } from './components/ErrorBoundary';

// Lazy load pages for performance
const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AIChat = lazy(() => import('./pages/AIChat'));
const AgentChat = lazy(() => import('./pages/AgentChat'));
const QuizLibrary = lazy(() => import('./pages/QuizLibrary'));
const QuizCreate = lazy(() => import('./pages/QuizCreate'));
const QuizEdit = lazy(() => import('./pages/QuizEdit'));
const QuizTake = lazy(() => import('./pages/QuizTake'));
const QuizResults = lazy(() => import('./pages/QuizResults'));
const Progress = lazy(() => import('./pages/Progress'));
const QuizMastery = lazy(() => import('./pages/QuizMastery'));
const ProfileSettings = lazy(() => import('./pages/ProfileSettings'));

const PageLoader = () => (
  <div className="flex-1 min-h-screen flex items-center justify-center bg-surface">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
  </div>
);

function App() {
  return (
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <Routes>
            {/* Public Routes */}
            <Route element={<PublicRoute />}>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>

            {/* Protected Routes */}
            <Route element={<PrivateRoute />}>
              <Route path="/dashboard" element={<DashboardLayout><Dashboard /></DashboardLayout>} />
              <Route path="/settings" element={<DashboardLayout><ProfileSettings /></DashboardLayout>} />
              <Route path="/ai-tutor" element={<DashboardLayout><AIChat /></DashboardLayout>} />
              <Route path="/agent-chat" element={<DashboardLayout><AgentChat /></DashboardLayout>} />
              <Route path="/progress" element={<DashboardLayout><Progress /></DashboardLayout>} />
              <Route path="/learning-path/quiz/:quizId" element={<DashboardLayout><QuizMastery /></DashboardLayout>} />
              <Route path="/quizzes" element={<DashboardLayout><QuizLibrary /></DashboardLayout>} />
              <Route path="/quizzes/create" element={<DashboardLayout><QuizCreate /></DashboardLayout>} />
              <Route path="/quizzes/:quizId/edit" element={<DashboardLayout><QuizEdit /></DashboardLayout>} />
              <Route path="/quizzes/:quizId/take" element={<DashboardLayout><QuizTake /></DashboardLayout>} />
              <Route path="/quizzes/:quizId/results/:attemptId" element={<DashboardLayout><QuizResults /></DashboardLayout>} />
            </Route>
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </BrowserRouter>
    </MotionConfig>
  );
}

export default App;
