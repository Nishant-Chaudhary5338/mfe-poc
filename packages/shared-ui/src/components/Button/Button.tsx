/**
 * Button component library for @repo/ui
 * @module Button
 */

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"

import { cn } from "../../lib/utils"

import { type ButtonProps } from "./Button.types"
import { buttonVariants } from "./Button.variants"

/**
 * A versatile button component with multiple variants and sizes.
 * 
 * Features:
 * - 6 visual variants: default, destructive, outline, secondary, ghost, link
 * - 4 size options: default, sm, lg, icon
 * - Polymorphic rendering with `asChild` prop
 * - Full accessibility support with focus-visible states
 * - Icon integration with automatic sizing
 * 
 * @component
 * @example
 * ```tsx
 * // Primary action button
 * <Button variant="default">Save Changes</Button>
 * 
 * // Destructive action
 * <Button variant="destructive">Delete</Button>
 * 
 * // Outline style
 * <Button variant="outline">Cancel</Button>
 * 
 * // Icon button
 * <Button variant="ghost" size="icon">
 *   <SettingsIcon />
 * </Button>
 * 
 * // As a link
 * <Button asChild>
 *   <a href="/dashboard">Go to Dashboard</a>
 * </Button>
 * ```
 * 
 * @param {ButtonProps} props - The component props
 * @param {React.Ref<HTMLButtonElement>} ref - Forwarded ref
 * @returns {JSX.Element} The rendered button element
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
