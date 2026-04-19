"use client"

import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"
import { type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"
import { switchVariants, switchThumbVariants } from "./Switch.variants"
import type { SwitchProps } from "./Switch.types"

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  SwitchProps & VariantProps<typeof switchVariants>
>(({ className, size, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(switchVariants({ size }), className)}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb className={cn(switchThumbVariants({ size }))} />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch, switchVariants }
