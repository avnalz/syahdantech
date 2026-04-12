import { useNavigate } from "react-router-dom";

interface LeadLabelSummaryProps {
  hot: number;
  warm: number;
  cold: number;
}

export function LeadLabelSummary({ hot, warm, cold }: LeadLabelSummaryProps) {
  const navigate = useNavigate();

  const items = [
    { label: "HOT", value: hot, filter: "hot", className: "bg-destructive/10 text-destructive hover:bg-destructive/20", subClass: "text-destructive/70" },
    { label: "WARM", value: warm, filter: "warm", className: "bg-warning/10 text-warning hover:bg-warning/20", subClass: "text-warning/70" },
    { label: "COLD", value: cold, filter: "cold", className: "bg-muted text-muted-foreground hover:bg-muted/80", subClass: "text-muted-foreground/70" },
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {items.map((item) => (
        <button
          key={item.filter}
          onClick={() => navigate(`/leads?filter=${item.filter}`)}
          className={`rounded-xl py-4 text-center transition-colors cursor-pointer ${item.className}`}
        >
          <p className="text-2xl font-bold">{item.value}</p>
          <p className={`text-xs font-semibold mt-0.5 ${item.subClass}`}>{item.label}</p>
        </button>
      ))}
    </div>
  );
}
