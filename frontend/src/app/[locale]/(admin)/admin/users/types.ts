export interface YouthProfile {
  phone_number: string;
  gender: string;
  date_of_birth: string | null;
  grade: string;
  municipality: string | null;
  municipality_name: string | null;
  custom_attributes: Record<string, string | string[]>;
}

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  municipality: string | null;
  municipality_name: string | null;
  workplace: string | null;
  workplace_name: string | null;
  youth_profile: YouthProfile | null;
}

export type UserRole =
  | "SUPER_ADMIN"
  | "MUNICIPALITY_ADMIN"
  | "WORKPLACE_ADMIN"
  | "COMPANY_ADMIN"
  | "YOUTH"
  | "GUARDIAN";

export const USER_ROLES: { value: UserRole; label: string }[] = [
  { value: "SUPER_ADMIN", label: "Super Admin" },
  { value: "MUNICIPALITY_ADMIN", label: "Municipality Admin" },
  { value: "WORKPLACE_ADMIN", label: "Workplace Admin" },
  { value: "COMPANY_ADMIN", label: "Company Admin" },
  { value: "YOUTH", label: "Youth" },
  { value: "GUARDIAN", label: "Guardian" },
];

export const getRoleBadgeVariant = (
  role: UserRole
): "default" | "secondary" | "destructive" | "outline" => {
  switch (role) {
    case "SUPER_ADMIN":
      return "default";
    case "MUNICIPALITY_ADMIN":
      return "secondary";
    case "WORKPLACE_ADMIN":
      return "secondary";
    default:
      return "outline";
  }
};
