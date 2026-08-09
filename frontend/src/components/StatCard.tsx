import { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string;
  delta?: string;
  deltaPositive?: boolean;
  sub?: string;
  onClick?: () => void;
  right?: ReactNode;
}

export function StatCard({ label, value, delta, deltaPositive = true, sub, onClick, right }: StatCardProps) {
  return (
    <div className="card" onClick={onClick} style={onClick ? { cursor: "pointer" } : undefined}>
      <div className="section-header">
        <span className="card-label">{label}</span>
        {right}
      </div>
      <div className="stat-hero">{value}</div>
      {delta && <div className={`stat-delta ${deltaPositive ? "" : "is-negative"}`}>{delta}</div>}
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}
