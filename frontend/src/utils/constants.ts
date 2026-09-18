import {
  Activity,
  ClipboardList,
  Database,
  FileCheck2,
  FileText,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Upload,
  Users,
} from "lucide-react";

export const ROLE_NAVIGATION = {
  admin: [
    {
      label: "Dashboard",
      path: "/admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Users",
      path: "/admin/users",
      icon: Users,
    },
    {
      label: "Assessments",
      path: "/admin/assessments",
      icon: ClipboardList,
    },
    {
      label: "Reference Repository",
      path: "/admin/reference-repository",
      icon: Database,
    },
    {
      label: "System Configuration",
      path: "/admin/settings",
      icon: Settings,
    },
  ],

  contributor: [
    {
      label: "Dashboard",
      path: "/contributor/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "My Assessments",
      path: "/contributor/assessments",
      icon: ClipboardList,
    },
    {
      label: "Submit Assets",
      path: "/contributor/submit",
      icon: Upload,
    },
    {
      label: "My Assets",
      path: "/contributor/assets",
      icon: Database,
    },
    {
      label: "Assessment Status",
      path: "/contributor/status",
      icon: Activity,
    },
    {
      label: "Reports",
      path: "/contributor/reports",
      icon: FileText,
    },
  ],

  analyst: [
    {
      label: "Dashboard",
      path: "/analyst/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Assessment Queue",
      path: "/analyst/queue",
      icon: ClipboardList,
    },
    {
      label: "Reference Repository",
      path: "/analyst/references",
      icon: Database,
    },
    {
      label: "Assessments",
      path: "/analyst/assessments",
      icon: FileCheck2,
    },
    {
      label: "Data Integrity",
      path: "/analyst/data-integrity",
      icon: Database,
    },
    {
      label: "Model Integrity",
      path: "/analyst/model-integrity",
      icon: ShieldCheck,
    },
    {
      label: "Inference Verification",
      path: "/analyst/inference-verification",
      icon: FileCheck2,
    },
    {
      label: "Distribution Analysis",
      path: "/analyst/distribution-analysis",
      icon: Activity,
    },
    {
      label: "Findings",
      path: "/analyst/findings",
      icon: ShieldCheck,
    },
    {
      label: "Flagged Images",
      path: "/analyst/flagged-images",
      icon: FileText,
    },
    {
      label: "Evidence",
      path: "/analyst/evidence",
      icon: FileCheck2,
    },
    {
      label: "Risk Assessment",
      path: "/analyst/risk",
      icon: ShieldCheck,
    },
    {
      label: "Reports",
      path: "/analyst/reports",
      icon: FileText,
    },
  ],
} as const;

export const APP_NAME = "AI Assurance Platform";

export const APP_DESCRIPTION =
  "Trustworthy Computer Vision Assurance Framework";
