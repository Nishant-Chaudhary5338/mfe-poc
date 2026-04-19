import * as React from "react"
import { type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"
import { skeletonVariants } from "./Skeleton.variants"
import type { SkeletonProps } from "./Skeleton.types"

function Skeleton({
  className,
  variant,
  animate,
  ...props
}: SkeletonProps & VariantProps<typeof skeletonVariants>) {
  return (
    <div
      className={cn(skeletonVariants({ variant, animate }), className)}
      {...props}
    />
  )
}

export { Skeleton, skeletonVariants }
