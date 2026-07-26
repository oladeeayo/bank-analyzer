import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-buttons px-3 py-1 text-[10px] font-semibold uppercase transition-colors focus:outline-none",
  {
    variants: {
      variant: {
        default: "bg-lime-vibrant/20 text-forest",
        secondary: "bg-mist-gray text-slate-gray",
        destructive: "bg-error-container text-error",
        outline: "border border-[#ececec] text-ink-black",
        success: "bg-lime-vibrant/20 text-forest",
        pending: "bg-pending-container text-pending",
        accent: "bg-blush-peach text-sienna-brown",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
