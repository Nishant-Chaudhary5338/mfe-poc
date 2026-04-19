/**
 * Label component type definitions
 * @module Label
 */

import * as React from "react"

/**
 * Props for the Label component.
 * Extends native label attributes.
 * 
 * @example
 * ```tsx
 * <Label htmlFor="email">Email</Label>
 * ```
 */
export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {
  /**
   * When true, the label is displayed in an error state.
   * @default false
   */
  error?: boolean
  
  /**
   * When true, the label indicates a required field.
   * @default false
   */
  required?: boolean
}