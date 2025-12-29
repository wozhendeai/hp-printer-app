"use client";

import * as React from "react";
import { Toggle } from "@base-ui/react/toggle";
import { ToggleGroup as ToggleGroupPrimitive } from "@base-ui/react/toggle-group";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const toggleGroupVariants = cva("inline-flex items-center", {
  variants: {
    variant: {
      default: "gap-0 border border-border bg-card rounded-md",
      segmented: "gap-0 bg-muted p-1 rounded-md",
      cards: "gap-2",
    },
    orientation: {
      horizontal: "flex-row",
      vertical: "flex-col",
    },
  },
  defaultVariants: {
    variant: "default",
    orientation: "horizontal",
  },
});

const toggleGroupItemVariants = cva(
  "inline-flex items-center justify-center font-medium text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: [
          // Base styles
          "border-r border-border last:border-r-0 bg-card text-foreground",
          // Hover (unselected)
          "hover:bg-muted",
          // Selected state
          "data-[pressed]:bg-foreground data-[pressed]:text-background data-[pressed]:border-foreground",
          // First/last border radius
          "first:rounded-l-md last:rounded-r-md",
        ],
        segmented: [
          // Base styles
          "rounded-md bg-transparent text-muted-foreground",
          // Hover (unselected)
          "hover:text-foreground",
          // Selected state - inverted (black)
          "data-[pressed]:bg-foreground data-[pressed]:text-background data-[pressed]:rounded-md",
        ],
        cards: [
          // Base styles - individual cards with their own border
          "rounded-xl border border-border bg-card text-foreground",
          // Hover (unselected)
          "hover:bg-muted",
          // Selected state - inverted
          "data-[pressed]:bg-foreground data-[pressed]:text-background data-[pressed]:border-foreground",
        ],
      },
      size: {
        sm: "h-8 px-2",
        default: "h-9 px-3",
        lg: "h-10 px-4",
      },
      orientation: {
        horizontal: "",
        vertical: "w-full",
      },
    },
    compoundVariants: [
      // Vertical orientation: adjust borders for default variant
      {
        variant: "default",
        orientation: "vertical",
        className:
          "border-r-0 border-b border-border last:border-b-0 first:rounded-l-none first:rounded-t-md last:rounded-r-none last:rounded-b-md",
      },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
      orientation: "horizontal",
    },
  },
);

type ToggleGroupContextValue = VariantProps<typeof toggleGroupItemVariants>;

const ToggleGroupContext = React.createContext<ToggleGroupContextValue>({
  variant: "default",
  size: "default",
  orientation: "horizontal",
});

export interface ToggleGroupProps
  extends
    Omit<ToggleGroupPrimitive.Props, "className">,
    Omit<VariantProps<typeof toggleGroupVariants>, "orientation">,
    Pick<VariantProps<typeof toggleGroupItemVariants>, "size"> {
  className?: string;
}

function ToggleGroup({
  className,
  variant = "default",
  size = "default",
  orientation = "horizontal",
  children,
  ...props
}: ToggleGroupProps) {
  return (
    <ToggleGroupPrimitive
      orientation={orientation}
      className={cn(toggleGroupVariants({ variant, orientation }), className)}
      {...props}
    >
      <ToggleGroupContext.Provider value={{ variant, size, orientation }}>
        {children}
      </ToggleGroupContext.Provider>
    </ToggleGroupPrimitive>
  );
}

export interface ToggleGroupItemProps
  extends
    Omit<Toggle.Props, "className">,
    Partial<VariantProps<typeof toggleGroupItemVariants>> {
  className?: string;
}

function ToggleGroupItem({
  className,
  variant,
  size,
  children,
  ...props
}: ToggleGroupItemProps) {
  const context = React.useContext(ToggleGroupContext);

  const resolvedVariant = variant ?? context.variant;
  const resolvedSize = size ?? context.size;
  const resolvedOrientation = context.orientation;

  return (
    <Toggle
      className={cn(
        toggleGroupItemVariants({
          variant: resolvedVariant,
          size: resolvedSize,
          orientation: resolvedOrientation,
        }),
        className,
      )}
      {...props}
    >
      {children}
    </Toggle>
  );
}

export {
  ToggleGroup,
  ToggleGroupItem,
  toggleGroupVariants,
  toggleGroupItemVariants,
};
