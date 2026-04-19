import { cva } from "class-variance-authority"

export const cardVariants = cva(
  "rounded-lg text-card-foreground",
  {
    variants: {
      variant: {
        default: "border bg-card shadow-sm",
        outlined: "border-2 border-border bg-transparent",
        elevated: "border-0 bg-card shadow-md",
        flat: "border-0 bg-muted/50",
        ghost: "border-0 bg-transparent shadow-none",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)
