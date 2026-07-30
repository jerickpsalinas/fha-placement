export function Table({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`overflow-x-auto border border-hairline rounded-lg ${className}`}>
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}

export function TableHead({ children }: { children: React.ReactNode }) {
  return <thead className="bg-cream text-navy/60 text-[10px] uppercase tracking-wide">{children}</thead>;
}

export function TableBody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-hairline">{children}</tbody>;
}

export function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`text-left px-4 py-3 font-semibold ${className}`}>{children}</th>;
}

export function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 ${className}`}>{children}</td>;
}
