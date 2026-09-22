import { redirect } from "next/navigation";

export default function StaffRedirectPage() {
  redirect("/v1/khai-bao/nhan-su");
}
