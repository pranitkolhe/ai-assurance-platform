import { getAnalystDashboard, fetchAnalystDashboard } from "../services/dashboardService";

export function loadAnalystDashboard() {
  return getAnalystDashboard();
}

export { fetchAnalystDashboard };
