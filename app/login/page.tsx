import { Activity, RadioTower, ShieldCheck } from "lucide-react";
import { LoginCard } from "@/components/login-card";

const highlights = [
  {
    icon: RadioTower,
    title: "Điều phối trực tuyến",
    description: "Theo dõi lịch chạy, ca và trạng thái xe ngay khi có thay đổi.",
  },
  {
    icon: Activity,
    title: "Vận hành tập trung",
    description: "Một màn hình làm việc cho điều hành, tài xế và nhân viên nhà xe.",
  },
  {
    icon: ShieldCheck,
    title: "Truy cập nội bộ",
    description: "Chỉ tài khoản được cấp phát mới vào được hệ thống vận hành.",
  },
];

export default function Home() {
  return (
    <main className="relative flex min-h-full flex-1 overflow-hidden">
      <div className="login-canvas absolute inset-0" />
      <div className="pointer-events-none absolute top-20 left-[12%] size-56 rounded-full bg-sky-400/20 blur-3xl" />
      <div className="pointer-events-none absolute right-[8%] bottom-16 size-64 rounded-full bg-teal-400/16 blur-3xl" />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center gap-10 px-6 py-10 xl:flex-row xl:items-center xl:gap-16 xl:px-10">
        <section className="hidden max-w-lg xl:block">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-sky-200/80 bg-white/70 px-3 py-1 text-xs font-medium text-sky-700 shadow-sm backdrop-blur-sm">
            <span className="size-1.5 rounded-full bg-teal-500" />
            Nền tảng công nghệ vận hành nhà xe
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-balance text-slate-800">
            Điều hành đội xe trên một hệ thống hiện đại.
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-500">
            BusNetVN kết nối lịch chạy, nhân sự và thiết bị nhà xe trong cùng
            một không gian làm việc số.
          </p>

          <ul className="mt-8 space-y-4">
            {highlights.map((item) => (
              <li key={item.title} className="flex gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-sky-100 bg-white/80 text-sky-600 shadow-sm">
                  <item.icon className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">{item.title}</p>
                  <p className="mt-0.5 text-sm leading-6 text-slate-500">
                    {item.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="mx-auto w-full max-w-[440px] xl:ml-auto">
          <div className="rounded-2xl border border-white/80 bg-white/80 p-6 shadow-[0_20px_50px_-24px_rgb(14_165_233_/_0.45)] ring-1 ring-sky-100 backdrop-blur-xl">
            <LoginCard />
          </div>

          <p className="mt-6 text-center text-xs text-slate-500">
            Hệ thống nội bộ. Liên hệ điều hành nếu bạn chưa có tài khoản.
          </p>
        </section>
      </div>
    </main>
  );
}
