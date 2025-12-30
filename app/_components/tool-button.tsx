import { Button } from "@/components/ui/button";

interface ToolButtonProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick?: () => void;
}

export function ToolButton({ icon: Icon, label, onClick }: ToolButtonProps) {
  return (
    <Button
      variant="ghost"
      onClick={onClick}
      className="h-auto flex-col gap-2 p-4 rounded-xl bg-muted/30 border border-border/50 hover:bg-muted/50"
    >
      <Icon className="size-6 text-muted-foreground" />
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
    </Button>
  );
}
