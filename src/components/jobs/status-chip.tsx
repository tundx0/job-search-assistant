const STATUS_TONE: Record<string, string> = {
  accepted: "chip-success",
  submitted: "chip-info",
  interviewing: "chip-warning",
  pending: "chip-neutral",
  draft: "chip-neutral",
  rejected: "chip-danger",
};

interface StatusChipProps {
  status: string;
  className?: string;
}

/** One status vocabulary, used by the dashboard, job detail and admin tables. */
export function StatusChip({ status, className = "" }: StatusChipProps) {
  const tone = STATUS_TONE[status?.toLowerCase()] ?? "chip-neutral";
  const label = status ? status.charAt(0).toUpperCase() + status.slice(1) : "Unknown";

  return <span className={`chip ${tone} ${className}`}>{label}</span>;
}
