export type Role = "admin" | "pengurus" | "anggota";
export type GroupStatus = "pending" | "active" | "inactive";
export type Condition = "bersih" | "kotor" | "rusak";

export type Me = {
  id: string;
  email: string | null;
  fullName: string;
  role: Role;
  isActive: boolean;
  group: {
    id: string;
    name: string;
    status: GroupStatus;
    wage_per_hour: number;
    default_margin: number;
  } | null;
};

export type ActionResult<T = null> = { ok: true; data: T } | { ok: false; error: string };
