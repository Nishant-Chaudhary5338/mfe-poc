import { cva } from "class-variance-authority"

export const skeletonVariants = cva(
  "bg-muted",
  {
    variants: {
      variant: {
        default: "rounded-md animate-pulse",
        text: "rounded h-4 w-full animate-pulse",
        circle: "rounded-full aspect-square animate-pulse",
        rect: "rounded-none animate-pulse",
        card: "rounded-lg animate-pulse",
      },
      animate: {
        pulse: "animate-pulse",
        shimmer: "animate-pulse opacity-70",
        none: "",
      },
    },
    defaultVariants: {
      variant: "default",
      animate: "pulse",
    },
  }
)
