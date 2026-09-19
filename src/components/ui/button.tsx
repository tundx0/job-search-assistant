import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full font-mono text-xs uppercase tracking-[0.14em] whitespace-nowrap ring-offset-background transition-[background-color,border-color,color,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground font-bold hover:brightness-110 hover:-translate-y-px",
        destructive:
          "bg-destructive text-destructive-foreground font-bold hover:brightness-110 hover:-translate-y-px",
        outline:
          "border border-border bg-transparent hover:border-foreground/40 hover:bg-foreground/5 hover:-translate-y-px",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-accent hover:-translate-y-px",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary normal-case tracking-normal font-sans text-sm underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-9 px-3 text-[0.6875rem]",
        lg: "h-12 px-7",
        icon: "h-10 w-10 px-0",
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
        role="button"
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
