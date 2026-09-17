import dashboardData from "../data/dashboard.json";
import type { AnalystDashboardData } from "../models/dashboard.model";

export function getAnalystDashboard(): AnalystDashboardData {
  return dashboardData as AnalystDashboardData;
}
