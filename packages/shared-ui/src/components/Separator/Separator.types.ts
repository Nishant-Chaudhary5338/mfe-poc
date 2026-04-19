/**
 * Separator component type definitions
 * @module Separator
 */

import * as React from "react"

/**
 * Props for the Separator component.
 * Extends native div attributes.
 * 
 * @example
 * ```tsx
 * <Separator orientation="horizontal" />
 * ```
 */
export interface SeparatorProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The orientation of the separator.
   * @default "horizontal"
   */
  orientation?: "horizontal" | "vertical"

  /**
   * Visual style of the separator line.
   * @default "solid"
   */
  variant?: "solid" | "dashed" | "dotted"

  /**
   * Whether the separator is purely decorative or has semantic meaning.
   * When true, separator will have aria-hidden="true".
   * @default true
   */
  decorative?: boolean
}