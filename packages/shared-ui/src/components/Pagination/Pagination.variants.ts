import { cva } from "class-variance-authority"

export const paginationLinkVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "hover:bg-accent hover:text-accent-foreground",
        outline: "border border-input hover:bg-accent hover:text-accent-foreground",
        ghost: "hover:bg-accent/60 hover:text-accent-foreground",
      },
      size: {
        sm: "h-8 w-8 text-xs",
        default: "h-10 w-10 text-sm",
        lg: "h-12 w-12 text-base",
      },
      isActive: {
        true: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        false: "",
      },
    },
    compoundVariants: [
      {
        isActive: true,
        variant: "outline",
        class: "border-primary bg-primary/5 text-primary",
      },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
      isActive: false,
    },
  }
)
