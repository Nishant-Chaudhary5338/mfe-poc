/**
 * Switch component type definitions
 * @module Switch
 */

import * as React from "react"

/**
 * Props for the Switch component.
 * Extends native button attributes.
 * 
 * @example
 * ```tsx
 * <Switch checked={isEnabled} onCheckedChange={setIsEnabled} />
 * ```
 */
export interface SwitchProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  /**
   * The controlled checked state of the switch.
   */
  checked?: boolean
  
  /**
   * Event handler called when the checked state changes.
   */
  onCheckedChange?: (checked: boolean) => void
  
  /**
   * When true, prevents the user from interacting with the switch.
   * @default false
   */
  disabled?: boolean
  
  /**
   * When true, indicates that the user must check the switch before the owning form can be submitted.
   * @default false
   */
  required?: boolean
  
  /**
   * The name of the switch. Submitted with its owning form as part of a name/value pair.
   */
  name?: string
  
  /**
   * The value given as data when submitted with a name.
   * @default "on"
   */
  value?: string
}