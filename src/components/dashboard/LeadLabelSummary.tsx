interface LeadLabelSummaryProps {
  hot: number;
  warm: number;
  cold: number;
}

export function LeadLabelSummary({ hot, warm, cold }: LeadLabelSummaryProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="rounded-xl bg-destructive/10 py-4 text-center">
        <p className="text-2xl font-bold text-destructive">{hot}</p>
        <p className="text-xs font-semibold text-destructive/70 mt-0.5">HOT</p>
      </div>
      <div className="rounded-xl bg-warning/10 py-4 text-center">
        <p className="text-2xl font-bold text-warning">{warm}</p>
        <p className="text-xs font-semibold text-warning/70 mt-0.5">WARM</p>
      </div>
      <div className="rounded-xl bg-muted py-4 text-center">
        <p className="text-2xl font-bold text-muted-foreground">{cold}</p>
        <p className="text-xs font-semibold text-muted-foreground/70 mt-0.5">COLD</p>
      </div>
    </div>
  );
}
