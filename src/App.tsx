import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import Spinner from './components/Spinner/Spinner';
import { MANAGEMENT_ROLES } from './constants/roles';
import type { Role } from './api/authApi';

const GroupsPage = lazy(() => import('./pages/GroupsPage/GroupsPage'));
const LandingPage = lazy(() => import('./pages/LandingPage/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage/SignupPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage/DashboardPage'));
const ExamsPage = lazy(() => import('./pages/ExamsPage/ExamsPage'));
const StudentsPage = lazy(() => import('./pages/StudentsPage/StudentsPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage/ReportsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage/SettingsPage'));
const ExamRunnerPage = lazy(() =>
  import('./pages/ExamRunnerPage/ExamRunnerPage')
);
const QuestionsPage = lazy(() => import('./pages/QuestionsPage/QuestionsPage'));
const LessonsPage = lazy(() => import('./pages/LessonsPage/LessonsPage'));
const GroupLessonsPage = lazy(() =>
  import('./pages/GroupLessonsPage/GroupLessonsPage')
);
const MyResultsPage = lazy(() => import('./pages/MyResultsPage/MyResultsPage'));
const PlansPage = lazy(() => import('./pages/PlansPage/PlansPage'));

type RouteConfig = {
  path: string;
  Component: React.ComponentType;
  protected?: boolean;
  allowedRoles?: Role[];
};

const routes: RouteConfig[] = [
  { path: '/', Component: LandingPage },
  { path: '/login', Component: LoginPage },
  { path: '/signup', Component: SignupPage },
  { path: '/dashboard', Component: DashboardPage, protected: true },
  {
    path: '/exams',
    Component: ExamsPage,
    protected: true,
  },
  { path: '/exams/:examId/take', Component: ExamRunnerPage, protected: true },
  {
    path: '/exams/:examId/questions',
    Component: QuestionsPage,
    protected: true,
    allowedRoles: MANAGEMENT_ROLES,
  },
  {
    path: '/students',
    Component: StudentsPage,
    protected: true,
    allowedRoles: MANAGEMENT_ROLES,
  },
  { path: '/lessons', Component: LessonsPage, protected: true },
  {
    path: '/lessons/:groupId',
    Component: GroupLessonsPage,
    protected: true,
  },
  {
    path: '/reports',
    Component: ReportsPage,
    protected: true,
    allowedRoles: ['SuperAdmin'],
  },
  {
    path: '/my-results',
    Component: MyResultsPage,
    protected: true,
    allowedRoles: ['Student'],
  },
  { path: '/settings', Component: SettingsPage, protected: true },
  {
    path: '/groups',
    Component: GroupsPage,
    protected: true,
    allowedRoles: MANAGEMENT_ROLES,
  },
  {
    path: '/plans',
    Component: PlansPage,
    protected: true,
    allowedRoles: ['Instructor'],
  },
];

function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        {routes.map(
          ({ path, Component, protected: isProtected, allowedRoles }) => (
            <Route
              key={path}
              path={path}
              element={
                isProtected ? (
                  <ProtectedRoute allowedRoles={allowedRoles}>
                    <Component />
                  </ProtectedRoute>
                ) : (
                  <Component />
                )
              }
            />
          )
        )}
      </Routes>
    </Suspense>
  );
}

export default App;
