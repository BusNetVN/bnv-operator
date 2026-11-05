import type { Metadata } from "next";
import { UsersPage } from "@/features/user/components/users-page";

export const metadata: Metadata = {
  title: "Nhân sự",
};

export default function Page() {
  return <UsersPage />;
}
