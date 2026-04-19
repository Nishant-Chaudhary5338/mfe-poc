/**
 * Textarea component type definitions
 * @module Textarea
 */

import * as React from "react"

/**
 * Props for the Textarea component.
 * Extends native textarea attributes.
 * 
 * @example
 * ```tsx
 * <Textarea placeholder="Enter your message" rows={4} />
 * ```
 */
export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /**
   * Size variant of the textarea.
   * @default "default"
   */
  inputSize?: "sm" | "default" | "lg"

  /**
   * When true, the textarea is displayed in an error state.
   * @default false
   */
  error?: boolean

  /**
   * When true, the textarea is displayed in a success state.
   * @default false
   */
  success?: boolean
}