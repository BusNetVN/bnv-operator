import type { Metadata } from "next";

import { PermissionPage } from "@/features/permission/components/permission-page";

export const metadata: Metadata = {
  title: "Nhóm quyền",
};

export default function Page() {
  return <PermissionPage />;
}
