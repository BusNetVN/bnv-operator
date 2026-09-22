export function WorkspacePlaceholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto w-full max-w-6xl">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-800">
        {title}
      </h1>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
      <div className="mt-6 rounded-xl border bg-card p-6 text-sm text-muted-foreground">
        Khu vực này dùng chung layout dashboard. Dữ liệu vận hành sẽ được bổ sung sau.
      </div>
    </div>
  );
}
