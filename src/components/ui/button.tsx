import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-buttons text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-vibrant/50 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-forest text-white shadow-sm hover:bg-forest-container",
        destructive: "bg-error text-white shadow-sm hover:bg-error/90",
        outline: "border border-[#ececec] bg-paper-white text-ink-black hover:bg-mist-gray",
        secondary: "bg-lime text-white shadow-sm hover:bg-lime/90",
        ghost: "text-slate-gray hover:bg-mist-gray hover:text-ink-black",
        link: "text-lime underline-offset-4 hover:underline",
        success: "bg-lime-vibrant text-forest shadow-sm hover:brightness-95",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-buttons px-3 text-xs",
        lg: "h-10 rounded-buttons px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
