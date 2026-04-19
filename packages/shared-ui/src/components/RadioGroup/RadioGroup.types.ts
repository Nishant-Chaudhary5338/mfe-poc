/**
 * RadioGroup component type definitions
 * @module RadioGroup
 */

import type * as React from "react"
import type * as RadioGroupPrimitive from "@radix-ui/react-radio-group"

/**
 * Props for the RadioGroup root component.
 */
export type RadioGroupProps = React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>

/**
 * Props for the RadioGroupItem component.
 */
export type RadioGroupItemProps = React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>