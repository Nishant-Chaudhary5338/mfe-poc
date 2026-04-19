/**
 * Checkbox component type definitions
 * @module Checkbox
 */

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"

/**
 * Props for the Checkbox component.
 * Extends Radix UI Checkbox primitive props.
 * 
 * @example
 * ```tsx
 * <Checkbox checked={isChecked} onCheckedChange={setIsChecked} />
 * ```
 */
export interface CheckboxProps
  extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> {
  /**
   * The controlled checked state of the checkbox.
   */
  checked?: boolean
  
  /**
   * Event handler called when the checked state changes.
   */
  onCheckedChange?: (checked: boolean | "indeterminate") => void
  
  /**
   * When true, prevents the user from interacting with the checkbox.
   * @default false
   */
  disabled?: boolean
  
  /**
   * When true, indicates that the user must check the checkbox before the owning form can be submitted.
   * @default false
   */
  required?: boolean
  
  /**
   * The name of the checkbox. Submitted with its owning form as part of a name/value pair.
   */
  name?: string
  
  /**
   * The value given as data when submitted with a name.
   * @default "on"
   */
  value?: string
}

/**
 * Props for the CheckboxIndicator component.
 */
export interface CheckboxIndicatorProps
  extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Indicator> {
  /**
   * Used to force mounting when more control is needed. Useful when controlling animation with React animation libraries.
   */
  forceMount?: true
}