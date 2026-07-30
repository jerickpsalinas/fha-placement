export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white border border-hairline rounded-lg ${className}`}>
      {children}
    </div>
  );
}
