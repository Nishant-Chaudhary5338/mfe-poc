/**
 * Skeleton component type definitions
 * @module Skeleton
 */

import * as React from "react"

/**
 * Props for the Skeleton component.
 * Extends native div attributes.
 * 
 * @example
 * ```tsx
 * <Skeleton className="h-4 w-[200px]" />
 * ```
 */
export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The shape/visual variant of the skeleton.
   * @default "default"
   */
  variant?: "default" | "text" | "circle" | "rect" | "card"

  /**
   * Animation style.
   * @default "pulse"
   */
  animate?: "pulse" | "shimmer" | "none"
}