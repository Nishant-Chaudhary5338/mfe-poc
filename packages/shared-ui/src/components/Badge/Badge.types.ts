/**
 * Badge component type definitions
 * @module Badge
 */

import * as React from "react"
import { type VariantProps } from "class-variance-authority"

import { type badgeVariants } from "./Badge.variants"

/**
 * Props for the Badge component.
 * Extends native div attributes with variant styling options.
 * 
 * @example
 * ```tsx
 * <Badge variant="default">New</Badge>
 * ```
 */
export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}