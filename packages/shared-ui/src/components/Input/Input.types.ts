/**
 * Input component type definitions
 * @module Input
 */

import * as React from "react"

/**
 * Props for the Input component.
 * Extends native input attributes.
 * 
 * @example
 * ```tsx
 * <Input type="email" placeholder="Enter your email" />
 * ```
 */
export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  /**
   * The type of the input.
   * @default "text"
   */
  type?: "text" | "email" | "password" | "number" | "tel" | "url" | "search" | "date" | "datetime-local" | "month" | "week" | "time" | "file"
  
  /**
   * Size variant of the input.
   * @default "default"
   */
  inputSize?: "sm" | "default" | "lg"
  
  /**
   * When true, the input is displayed in an error state.
   * @default false
   */
  error?: boolean
  
  /**
   * When true, the input is displayed in a success state.
   * @default false
   */
  success?: boolean
  
  /**
   * Icon to display at the start of the input.
   */
  startIcon?: React.ReactNode
  
  /**
   * Icon to display at the end of the input.
   */
  endIcon?: React.ReactNode
}
