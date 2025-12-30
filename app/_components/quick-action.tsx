import Link from "next/link";
import { cn } from "@/lib/utils";

interface QuickActionProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  href: string;
  variant?: "default" | "primary";
}

export function QuickAction({
  icon: Icon,
  title,
  description,
  href,
  variant = "default",
}: QuickActionProps) {
  const isPrimary = variant === "primary";

  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col p-5 rounded-2xl transition-all duration-200",
        isPrimary
          ? "bg-foreground text-background hover:bg-foreground/90"
          : "bg-card border border-border hover:border-border/80 hover:shadow-sm",
      )}
    >
      <div
        className={cn(
          "size-12 rounded-xl flex items-center justify-center mb-4",
          isPrimary ? "bg-background/15" : "bg-muted",
        )}
      >
        <Icon
          className={cn(
            "size-6",
            isPrimary ? "text-background" : "text-foreground",
          )}
        />
      </div>
      <span
        className={cn(
          "font-semibold",
          isPrimary ? "text-background" : "text-foreground",
        )}
      >
        {title}
      </span>
      <span
        className={cn(
          "text-sm mt-0.5",
          isPrimary ? "text-background/70" : "text-muted-foreground",
        )}
      >
        {description}
      </span>
    </Link>
  );
}
