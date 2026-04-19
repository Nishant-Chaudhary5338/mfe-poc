import { cva } from "class-variance-authority"

export const checkboxVariants = cva(
  "grid place-content-center peer shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
  {
    variants: {
      size: {
        sm: "h-3.5 w-3.5",
        default: "h-4 w-4",
        lg: "h-5 w-5",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

export const checkboxIndicatorSizeVariants = cva("", {
  variants: {
    size: {
      sm: "[&>svg]:h-3 [&>svg]:w-3",
      default: "[&>svg]:h-4 [&>svg]:w-4",
      lg: "[&>svg]:h-5 [&>svg]:w-5",
    },
  },
  defaultVariants: {
    size: "default",
  },
})
