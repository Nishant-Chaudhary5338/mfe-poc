/**
 * Select component type definitions
 * @module Select
 */

import type * as React from "react"
import type * as SelectPrimitive from "@radix-ui/react-select"

/**
 * Props for the Select root component.
 */
export type SelectProps = SelectPrimitive.SelectProps

/**
 * Props for the SelectGroup component.
 */
export type SelectGroupProps = React.ComponentPropsWithoutRef<typeof SelectPrimitive.Group>

/**
 * Props for the SelectValue component.
 */
export type SelectValueProps = React.ComponentPropsWithoutRef<typeof SelectPrimitive.Value>

/**
 * Props for the SelectTrigger component.
 */
export type SelectTriggerProps = React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>

/**
 * Props for the SelectScrollUpButton component.
 */
export type SelectScrollUpButtonProps = React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>

/**
 * Props for the SelectScrollDownButton component.
 */
export type SelectScrollDownButtonProps = React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>

/**
 * Props for the SelectContent component.
 */
export interface SelectContentProps
  extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content> {
  /**
   * The positioning strategy for the content.
   * @default "popper"
   */
  position?: "item-aligned" | "popper"
}

/**
 * Props for the SelectLabel component.
 */
export type SelectLabelProps = React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>

/**
 * Props for the SelectItem component.
 */
export type SelectItemProps = React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>

/**
 * Props for the SelectSeparator component.
 */
export type SelectSeparatorProps = React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>