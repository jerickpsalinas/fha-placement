export function PageHeader({
  eyebrow = "Father's Harbor Academy",
  title,
  subtitle,
  pills,
  action,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  pills?: string[];
  action?: React.ReactNode;
}) {
  return (
    <div className="bg-navy px-8 py-10 text-white">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[.15em] text-gold font-bold mb-2">{eyebrow}</p>
          <h1 className="text-2xl font-bold font-serif">{title}</h1>
          {subtitle && <p className="text-[11px] text-white/60 mt-2 max-w-xl">{subtitle}</p>}
          {pills && pills.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {pills.map((pill) => (
                <span key={pill} className="text-[9px] bg-white/10 text-white/80 px-3 py-1 rounded-full">{pill}</span>
              ))}
            </div>
          )}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    </div>
  );
}
