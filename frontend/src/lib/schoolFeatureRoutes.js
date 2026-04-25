import {
  AcademicCap,
  Award,
  BarChart3,
  Calendar,
  CalendarCheck,
  ClipboardList,
  DollarSign,
  FileSpreadsheet,
  FileText,
  Receipt,
  TrendingUp,
  UserPlus,
  Wallet,
} from "lucide-react";

export const schoolFeatureRoutes = [
  {
    path: "attendance",
    url: "/dashboard/attendance",
    title: "Attendance",
    icon: CalendarCheck,
    description:
      "Track daily attendance, monitor absences, and review class participation from one place.",
    highlights: [
      "Create daily, weekly, and monthly attendance registers.",
      "Flag late arrivals, absences, and attendance exceptions.",
      "Connect attendance summaries to class and student detail pages.",
    ],
  },
  {
    path: "attendance-reports",
    url: "/dashboard/attendance-reports",
    title: "Attendance Reports",
    icon: BarChart3,
    description:
      "Generate reports that show trends, risk cases, and attendance performance across the institution.",
    highlights: [
      "Break reports down by student, class, department, and academic year.",
      "Add export actions for PDF, CSV, and Excel summaries.",
      "Highlight low-attendance learners that need follow-up.",
    ],
  },
  {
    path: "timetable",
    url: "/dashboard/timetable",
    title: "Timetable",
    icon: Calendar,
    description:
      "Organize class schedules, lecturer assignments, and room usage in a single timetable workspace.",
    highlights: [
      "Manage weekly class schedules and room allocations.",
      "Prevent clashes between lecturers, rooms, and student groups.",
      "Publish view-only timetables for students and staff.",
    ],
  },
  {
    path: "grades",
    url: "/dashboard/grades",
    title: "Grades",
    icon: FileText,
    description:
      "Capture assessment scores, review results, and prepare report-card style academic summaries.",
    highlights: [
      "Store coursework, exam, and final grade values.",
      "Validate grade ranges before submission and approval.",
      "Link grading flows to exams, subjects, and academic periods.",
    ],
  },
  {
    path: "fees/categories",
    url: "/dashboard/fees/categories",
    title: "Fee Categories",
    icon: DollarSign,
    description:
      "Define tuition, transport, library, and other billing categories used across student accounts.",
    highlights: [
      "Configure category names, due dates, and default amounts.",
      "Support recurring and one-time fee structures.",
      "Control which programs or years each category applies to.",
    ],
  },
  {
    path: "fees/assignments",
    url: "/dashboard/fees/assignments",
    title: "Fee Assignments",
    icon: Wallet,
    description:
      "Assign fee structures to students, classes, or programs and keep balances in sync.",
    highlights: [
      "Bulk-assign fees by cohort, department, or academic year.",
      "Track pending, partially paid, and fully paid balances.",
      "Prepare integration points for payment collection workflows.",
    ],
  },
  {
    path: "fees/students",
    url: "/dashboard/fees/students",
    title: "Student Fees",
    icon: Receipt,
    description:
      "Review each student's fee ledger, balances, waivers, and payment history.",
    highlights: [
      "Display student-by-student statements and outstanding balances.",
      "Record discounts, waivers, and manual adjustments.",
      "Support receipts and downloadable account statements.",
    ],
  },
  {
    path: "fees/payments",
    url: "/dashboard/fees/payments",
    title: "Payments",
    icon: FileSpreadsheet,
    description:
      "Register incoming payments and reconcile them against assigned fees and student accounts.",
    highlights: [
      "Capture cash, bank, and mobile-money payment records.",
      "Match transactions to fee categories automatically.",
      "Export payment registers for finance review.",
    ],
  },
  {
    path: "exams",
    url: "/dashboard/exams",
    title: "Exams",
    icon: ClipboardList,
    description:
      "Plan examinations, manage exam sessions, and prepare related academic workflows.",
    highlights: [
      "Create exam periods, papers, and sitting schedules.",
      "Link exams to grading and progression workflows.",
      "Track exam status from draft to published results.",
    ],
  },
  {
    path: "academic-years",
    url: "/dashboard/academic-years",
    title: "Academic Years",
    icon: AcademicCap,
    description:
      "Manage academic sessions, terms, and the active school year used by other modules.",
    highlights: [
      "Open and close academic years with clear status controls.",
      "Configure terms, semesters, and reporting periods.",
      "Ensure dependent modules always know the active year.",
    ],
  },
  {
    path: "promotions",
    url: "/dashboard/promotions",
    title: "Promotions",
    icon: TrendingUp,
    description:
      "Handle class promotion decisions using grades, attendance, and progression rules.",
    highlights: [
      "Review pass/fail criteria before advancing learners.",
      "Promote students in bulk while keeping an audit trail.",
      "Keep progression decisions linked to academic years and exams.",
    ],
  },
  {
    path: "graduation",
    url: "/dashboard/graduation",
    title: "Graduation",
    icon: Award,
    description:
      "Prepare graduation cohorts, confirm completion requirements, and track award readiness.",
    highlights: [
      "Verify completion against credits, results, and fee clearance.",
      "Generate graduation candidate lists by program or year.",
      "Create room for certificate and alumni workflows later.",
    ],
  },
  {
    path: "admissions",
    url: "/dashboard/admissions",
    title: "Admissions",
    icon: UserPlus,
    description:
      "Manage applicant intake, review decisions, and convert approved applicants into active students.",
    highlights: [
      "Capture applicant records and required documents.",
      "Move candidates through review, approval, and enrollment stages.",
      "Prepare handoff into members, users, and billing modules.",
    ],
  },
  {
    path: "calendar",
    url: "/dashboard/calendar",
    title: "School Calendar",
    icon: Calendar,
    description:
      "Publish academic events, deadlines, holidays, and institutional milestones in a single calendar view.",
    highlights: [
      "Manage events, deadlines, holidays, and school-wide reminders.",
      "Filter items by audience such as students, staff, or departments.",
      "Use calendar entries to support attendance, exams, and reporting.",
    ],
  },
  {
    path: "settings",
    url: "/dashboard/settings",
    title: "Settings",
    icon: FileText,
    description:
      "Centralize institution-wide configuration for academic, finance, and operational modules.",
    highlights: [
      "Store defaults for attendance, fees, grading, and notifications.",
      "Manage feature toggles and module-level validation rules.",
      "Prepare a safe place for future admin-only configuration panels.",
    ],
  },
];
