import { CheckCircle2, Circle, Lock, Play } from "lucide-react";
import { cn } from "@/lib/cn";

const configs = {
  "in-progress": {
    label: "In Progress",
    icon: Circle,
    className: "text-primary-500",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    className: "text-success",
  },
  "now-playing": {
    label: "Now Playing",
    icon: Play,
    className: "text-primary-500",
  },
  locked: {
    label: "Locked",
    icon: Lock,
    className: "text-neutral-500",
  },
} as const;

type StatusProps = {
  status: keyof typeof configs;
  className?: string;
};

export function Status({ status, className }: StatusProps) {
  const config = configs[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-body",
        config.className,
        className,
      )}
    >
      <Icon className="size-4 shrink-0" strokeWidth={2} aria-hidden="true" />
      <span>{config.label}</span>
    </span>
  );
}
