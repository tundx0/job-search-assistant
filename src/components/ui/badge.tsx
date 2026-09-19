import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-[0.625rem] uppercase tracking-[0.1em] transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-muted-foreground",
        success:
          "border-[color-mix(in_oklch,var(--success),transparent_65%)] bg-[color-mix(in_oklch,var(--success),transparent_88%)] text-success",
        warning:
          "border-[color-mix(in_oklch,var(--warning),transparent_65%)] bg-[color-mix(in_oklch,var(--warning),transparent_88%)] text-warning",
        signal:
          "border-[color-mix(in_oklch,var(--primary),transparent_65%)] bg-[color-mix(in_oklch,var(--primary),transparent_88%)] text-primary",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
