import type { Metadata } from "next";

import { RoleGroupsPage } from "@/components/roles-page";

export const metadata: Metadata = {
  title: "Nhóm quyền",
};

export default function Page() {
  return <RoleGroupsPage />;
}
