import { Download, File, ImageIcon } from "lucide-react";
import { Item, ItemDescription, ItemMedia } from "@/components/ui/item";
import type { RecentScan } from "../_lib/types";

interface ScanThumbnailProps {
  scan: RecentScan;
  onDownload: () => void;
}

export function ScanThumbnail({ scan, onDownload }: ScanThumbnailProps) {
  const isImage = scan.format === "image/jpeg";

  return (
    <Item
      render={<button type="button" onClick={onDownload} />}
      variant="outline"
      size="xs"
      className="w-20 h-24 shrink-0 flex-col justify-center items-center p-2 gap-1 hover:bg-muted group"
    >
      <ItemMedia className="group-hover:hidden">
        {isImage ? (
          <ImageIcon className="size-6 text-muted-foreground/50" />
        ) : (
          <File className="size-6 text-muted-foreground/50" />
        )}
      </ItemMedia>
      <Download className="size-6 text-foreground hidden group-hover:block" />
      <ItemDescription className="text-[10px] text-center">
        {scan.timestamp.toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
        })}
      </ItemDescription>
    </Item>
  );
}
