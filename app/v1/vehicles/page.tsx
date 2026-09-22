import { redirect } from "next/navigation";

export default function VehiclesRedirectPage() {
  redirect("/v1/khai-bao/doi-xe");
}
