import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PrivateRoute, PublicRoute } from './routes/RouteWrappers';
import DashboardLayout from './layouts/DashboardLayout';

// Lazy load pages for performance
const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AIChat = lazy(() => import('./pages/AIChat'));
const AgentChat = lazy(() => import('./pages/AgentChat'));
const Quizzes = lazy(() => import('./pages/Quizzes'));

const PageLoader = () => (
  <div className="flex-1 min-h-screen flex items-center justify-center bg-surface">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
  </div>
);

function App() {
  return (
    <BrowserRouter>
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
            <Route path="/ai-tutor" element={<DashboardLayout><AIChat /></DashboardLayout>} />
            <Route path="/quizzes" element={<DashboardLayout><Quizzes /></DashboardLayout>} />
            <Route path="/agent-chat" element={<DashboardLayout><AgentChat /></DashboardLayout>} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
