"use client";

import { useState } from "react";
import { BookOpen, ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

export function CopyGuide() {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <CollapsibleTrigger className="w-full p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors">
          <div className="size-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <BookOpen className="size-5 text-muted-foreground" />
          </div>
          <div className="flex-1 text-left">
            <h3 className="font-medium">Copy Guide</h3>
            <p className="text-sm text-muted-foreground">
              Multi-page, both sides on one sheet, books & more
            </p>
          </div>
          <ChevronDown
            className={cn(
              "size-5 text-muted-foreground transition-transform",
              open && "rotate-180",
            )}
          />
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 pt-2 space-y-3 text-sm border-t border-border">
            <div>
              <p className="font-medium text-foreground">Multi-page from ADF</p>
              <p className="text-muted-foreground">
                Load pages face-up in the document feeder. They&apos;ll scan
                automatically in sequence.
              </p>
            </div>
            <div>
              <p className="font-medium text-foreground">Two-sided copies</p>
              <p className="text-muted-foreground">
                Enable &quot;Two-sided&quot; in settings to print on both sides
                of paper.
              </p>
            </div>
            <div>
              <p className="font-medium text-foreground">Book copying</p>
              <p className="text-muted-foreground">
                Use flatbed. Place the book spine against the left edge of the
                glass.
              </p>
            </div>
            <div>
              <p className="font-medium text-foreground">ID card copy</p>
              <p className="text-muted-foreground">
                Place card in the corner of the flatbed. Use &quot;Actual
                size&quot; for best results.
              </p>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
