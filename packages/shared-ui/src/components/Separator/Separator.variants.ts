import { cva } from "class-variance-authority"

export const separatorVariants = cva(
  "shrink-0",
  {
    variants: {
      variant: {
        solid: "bg-border",
        dashed: "border-border",
        dotted: "border-border",
      },
      orientation: {
        horizontal: "",
        vertical: "",
      },
    },
    compoundVariants: [
      {
        variant: "solid",
        orientation: "horizontal",
        class: "h-[1px] w-full",
      },
      {
        variant: "solid",
        orientation: "vertical",
        class: "h-full w-[1px]",
      },
      {
        variant: "dashed",
        orientation: "horizontal",
        class: "h-0 w-full border-t border-dashed",
      },
      {
        variant: "dashed",
        orientation: "vertical",
        class: "w-0 h-full border-l border-dashed",
      },
      {
        variant: "dotted",
        orientation: "horizontal",
        class: "h-0 w-full border-t border-dotted",
      },
      {
        variant: "dotted",
        orientation: "vertical",
        class: "w-0 h-full border-l border-dotted",
      },
    ],
    defaultVariants: {
      variant: "solid",
      orientation: "horizontal",
    },
  }
)
