export type UserRole = "admin" | "contributor" | "analyst";

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  status: "active" | "inactive";
}
