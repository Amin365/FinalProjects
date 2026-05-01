import React, { Suspense, lazy } from "react";
import { Routes, Route } from "react-router";
import ProtectedRoute from "./pages/ProtectedRoute";
import Loader from "./components/Loader";
import ReadingRecaps from "./components/Members/ReadingRecap";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import ScrollToHash from "./components/ScrollToHash";


// lazy-loaded route components
const DashboardPage = lazy(() => import("./pages/Dashboard"));

const LoginPage = lazy(() => import("./pages/Loginpage"));
const ForgotPassword = lazy(() => import("./components/login/ForgetPassword"));
const ResetPassword = lazy(() => import("./components/login/ResetPasswordForm"));
const VerifyOtp= lazy(() => import("./components/login/VerifyOtp"));
const BookTable = lazy(() => import("./components/Books/BookTable"));
const BookDetails = lazy(() => import("./components/Books/BookDetails"));
const MembersForm = lazy(() => import("./components/Members/MemberForm"));
const MemberTable = lazy(() => import("./components/Members/MembersTable"));
const Leaderboard = lazy(() => import("./components/Members/Leaderboard"));
const MemberDetails = lazy(() => import("./components/Members/MemberDetails"));
const SectionCards = lazy(() =>
  import("./components/Section-cards").then((m) => ({ default: m.SectionCards }))
);
const DashboardHome = lazy(() => import("./pages/DashboardHome"));

const Users = lazy(() => import("./components/Users/UserTable"));
const UsersFromMember = lazy(() => import("./components/Users/UserFromMember"));
const UserDetails = lazy(() => import("./components/Users/UserDetails"));
const Report = lazy(() => import("./components/Members/DailyReport"));
// const Report= lazy(()=>import('./components/Members/DailyReport'))
const MemberGate=lazy(()=>import( "./components/Issue/IssueMemberGate"));
const IssueMembersForm=lazy(()=>import( "./components/Issue/IssueForm"));
const Issuetable=lazy(()=>import( "./components/Issue/IssueTable"));
const RequestBooksPage=lazy(()=>import( "./components/Issue/RequestBooksPage"));
const ReservationsPage=lazy(()=>import( "./components/Issue/ReservationsPage"));
const DailyActivity=lazy(()=>import('./components/Members/DailyActivity'));

const Homepage=lazy(()=>import("./components/Homepage/Herroes"))
const File=lazy(()=>import("./components/Homepage/File"))

const JoinClub=lazy(()=>import("./components/Homepage/JoinClubsTable"))
const Profile = lazy(() => import("./components/Users/UserProfile"));
const IDcard = lazy(() => import("./components/IDcard/PVCIDCard"));
const MembersFormPublic = lazy(() => import("./components/Members/MemberForm"));
const NotificationCenter = lazy(() => import('./components/Notifications/NotificationCenter'));
const NotificationPreferences = lazy(() => import('./components/Notifications/NotificationPreferences'));
const AdminAnnouncements = lazy(() => import('./components/Notifications/AdminAnnouncements'));
const AdminReportingCenter = lazy(() => import("./components/Reporting/AdminReportingCenter"));

// Phase 7: Content Moderation and Resource Hub components

const ResourceTable = lazy(() => import("./components/Resources/ResourceTable"));

// Phase 8: Admin Governance and Safety components
const AuditLogViewer = lazy(() => import("./components/Admin/AuditLogViewer"));
const SystemHealth = lazy(() => import("./components/Admin/SystemHealth"));
const PermissionMatrix = lazy(() => import("./components/Admin/PermissionMatrix"));
const SetupPassword = lazy(() => import("./components/login/SetupPassword"));
const ResourceCreate = lazy(() => import("./components/Resources/ResourceCreatePage"));
const ResourceDetails = lazy(() => import("./components/Resources/ResourceDetails"));
// const ResourceCreate = lazy(() => import("./components/Resources/ResourceCreatePage"));
const StudentResources = lazy(() => import("./components/Resources/StudentResource"));
const ProgrammeTables = lazy(() => import("./components/Programme/ProgramTable"));
const ProgrammeCard=lazy(()=>import("./components/Programme/ProgrammeLists"))
const EnrollmentsTable = lazy(() => import("./components/Enrollments/EnrollmentsTable"));
const EnrollmentDetails = lazy(() => import("./components/Enrollments/EnrollmentDetails"));
const Attendance = lazy(() => import("./components/Attendance/AttendancePage"));
const TeamVolunteer= lazy(() => import("./components/Volunteer/TeamVal"));
function App() {
  return (
    <>
      <PWAInstallPrompt />
      <ScrollToHash/>
 
      <Routes>
        {/* auth */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/file" element={<File />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
       

       
        <Route path="/" element={<Homepage />} />
           <Route path="/programmecards" element={<Suspense fallback={<Loader size="lg" colorClass="text-orange-600" />}><ProgrammeCard /></Suspense>} />
 
           <Route path="/volunteer" element={<Suspense fallback={<Loader size="lg" colorClass="text-orange-600" />}><TeamVolunteer /></Suspense>} />
 
        <Route path="/members/new" element={<Suspense fallback={<Loader size="lg" colorClass="text-orange-600" />}><MembersFormPublic /></Suspense>} />
        {/* Phase 7: Public Resource Hub routes */}
      
 <Route path="/forgot-password" element= { <Suspense fallback={<Loader size="lg" colorClass="text-orange-600" />}><ForgotPassword /></Suspense>} />
<Route path="/verify-otp" element= { <Suspense fallback={<Loader size="lg" colorClass="text-orange-600" />}><VerifyOtp /></Suspense>} />
<Route path="/reset-password" element= { <Suspense fallback={<Loader size="lg" colorClass="text-orange-600" />}><ResetPassword /></Suspense>} />
{/* Phase 8: Invite-based password setup */}
<Route path="/setup-password" element= { <Suspense fallback={<Loader size="lg" colorClass="text-orange-600" />}><SetupPassword /></Suspense>} />
        {/* protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        >
          <Route
            index
            element={
              <Suspense fallback={<Loader size="lg" colorClass="text-orange-600" />}>
                <DashboardHome />
              </Suspense>
            }
          />
           <Route path="Leaderboard" element={<Leaderboard />} />
       
          <Route path="books" element=
          {<Suspense fallback={<Loader size="lg" colorClass="text-orange-600" />}>
          <BookTable /></Suspense>} />

          <Route path="books/:id" element={<BookDetails />} />
          <Route path="members" element={<Suspense fallback={<Loader size="lg" colorClass="text-orange-600" />}><MemberTable /></Suspense>} />
          <Route path="members/new"  element={<Suspense fallback={<Loader size="lg" colorClass="text-orange-600" />}><MembersForm /></Suspense>} />
          <Route path="members/edit/:id"  element={<Suspense fallback={<Loader size="lg" colorClass="text-orange-600" />}><MembersForm /></Suspense>} />
          <Route path="members/:id" element={<MemberDetails />} />
          <Route path="users" element={<Suspense fallback={<Loader size="lg" colorClass="text-orange-600" />}><Users /></Suspense>} />
  <Route path="users/new" element={<Suspense fallback={<Loader size="lg" colorClass="text-orange-600" />}><UsersFromMember /></Suspense>} />
          <Route path="users/:id" element={<Suspense fallback={<Loader size="lg" colorClass="text-orange-600" />}><UserDetails /></Suspense>} />
  <Route path="report" element={<Suspense fallback={<Loader size="lg" colorClass="text-orange-600" />}><Report /></Suspense>} />
  <Route path="issues/request" element={<Suspense fallback={<Loader size="lg" colorClass="text-orange-600" />}><RequestBooksPage /></Suspense>} />
<Route path="issue/new" element={<Suspense fallback={<Loader size="lg" colorClass="text-orange-600" />}><IssueMembersForm /></Suspense>} />
  <Route path="issues" element={<Suspense fallback={<Loader size="lg" colorClass="text-orange-600" />}><Issuetable /></Suspense>} />
  <Route path="reservations" element={<Suspense fallback={<Loader size="lg" colorClass="text-orange-600" />}><ReservationsPage /></Suspense>} />
  <Route path="activity" element={<Suspense fallback={<Loader size="lg" colorClass="text-orange-600" />}><DailyActivity /></Suspense>} />
  
 
  <Route path="profile" element={<Suspense fallback={<Loader size="lg" colorClass="text-orange-600" />}><Profile /></Suspense>} />
  <Route path="id-card/:memberId" element={<Suspense fallback={<Loader size="lg" colorClass="text-orange-600" />}><IDcard /></Suspense>} />
  <Route path="join-clubs" element={<Suspense fallback={<Loader size="lg" colorClass="text-orange-600" />}><JoinClub /></Suspense>} />
 
  <Route path="notifications" element={<Suspense fallback={<Loader size="lg" colorClass="text-orange-600" />}><NotificationCenter /></Suspense>} />
  <Route path="notification-settings" element={<Suspense fallback={<Loader size="lg" colorClass="text-orange-600" />}><NotificationPreferences /></Suspense>} />
  <Route path="announcements" element={<Suspense fallback={<Loader size="lg" colorClass="text-orange-600" />}><AdminAnnouncements /></Suspense>} />
  <Route path="reporting" element={<Suspense fallback={<Loader size="lg" colorClass="text-orange-600" />}><AdminReportingCenter /></Suspense>} />
  
 {/* Resources */}
  <Route path="resources" element={<Suspense fallback={<Loader size="lg" colorClass="text-orange-600" />}><ResourceTable /></Suspense>} />
  <Route path="studentsresources" element={<Suspense fallback={<Loader size="lg" colorClass="text-orange-600" />}><StudentResources /></Suspense>} />
  <Route path="resources/new" element={<Suspense fallback={<Loader size="lg" colorClass="text-orange-600" />}><ResourceCreate /></Suspense>} />
  <Route path="resources/edit/:id" element={<Suspense fallback={<Loader size="lg" colorClass="text-orange-600" />}><ResourceCreate /></Suspense>} />
  <Route path="resources/:id" element={<Suspense fallback={<Loader size="lg" colorClass="text-orange-600" />}><ResourceDetails /></Suspense>} />
 {/*  Prograame */}
 
  <Route path="programme" element={<Suspense fallback={<Loader size="lg" colorClass="text-orange-600" />}><ProgrammeTables /></Suspense>} />
 
  <Route path="programmecards" element={<Suspense fallback={<Loader size="lg" colorClass="text-orange-600" />}><ProgrammeCard /></Suspense>} />
 
  <Route path="attendance" element={<Suspense fallback={<Loader size="lg" colorClass="text-orange-600" />}><Attendance /></Suspense>} />
 
  <Route path="enrollments" element={<Suspense fallback={<Loader size="lg" colorClass="text-orange-600" />}><EnrollmentsTable /></Suspense>} />
  <Route path="enrollments/:id" element={<Suspense fallback={<Loader size="lg" colorClass="text-orange-600" />}><EnrollmentDetails /></Suspense>} />


  <Route path="audit-log" element={<Suspense fallback={<Loader size="lg" colorClass="text-orange-600" />}><AuditLogViewer /></Suspense>} />
  <Route path="system-health" element={<Suspense fallback={<Loader size="lg" colorClass="text-orange-600" />}><SystemHealth /></Suspense>} />
  <Route path="permissions" element={<Suspense fallback={<Loader size="lg" colorClass="text-orange-600" />}><PermissionMatrix /></Suspense>} />
        </Route>
      </Routes>
      </>

  );
}

export default App;
