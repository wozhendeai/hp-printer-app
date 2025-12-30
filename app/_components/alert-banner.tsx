import Link from "next/link";
import { AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AlertBannerProps {
  message: string;
  action: string;
  href?: string;
  onDismiss?: () => void;
}

export function AlertBanner({
  message,
  action,
  href,
  onDismiss,
}: AlertBannerProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-status-busy/10 border border-status-busy/20">
      <AlertCircle className="size-5 text-status-busy shrink-0" />
      <span className="text-sm font-medium flex-1">{message}</span>
      {href ? (
        <Link
          href={href}
          className="text-sm font-semibold text-status-busy hover:underline shrink-0"
        >
          {action}
        </Link>
      ) : (
        <span className="text-sm font-semibold text-status-busy shrink-0">
          {action}
        </span>
      )}
      {onDismiss && (
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onDismiss}
          className="hover:bg-status-busy/15 shrink-0"
        >
          <X className="size-4 text-status-busy" />
        </Button>
      )}
    </div>
  );
}
