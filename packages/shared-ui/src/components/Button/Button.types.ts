/**
 * Button component type definitions
 * @module Button
 */

import * as React from "react"
import { type VariantProps } from "class-variance-authority"

import { type buttonVariants } from "./Button.variants"

/**
 * Props for the Button component.
 * Extends native button attributes with variant styling options.
 * 
 * @example
 * ```tsx
 * <Button variant="primary" size="lg">Click me</Button>
 * ```
 */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /**
   * When true, the component will render its child as the button element.
   * Useful for composing with other components like Link.
   * 
   * @default false
   * @example
   * ```tsx
   * <Button asChild>
   *   <a href="/about">About</a>
   * </Button>
   * ```
   */
  asChild?: boolean
}