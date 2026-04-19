import * as React from "react"
import { type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"
import { inputVariants } from "./Input.variants"
import type { InputProps } from "./Input.types"

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", inputSize, error, success, startIcon, endIcon, ...props }, ref) => {
    const state = error ? "error" : success ? "success" : "default"

    if (startIcon || endIcon) {
      return (
        <div className="relative flex items-center w-full">
          {startIcon && (
            <span className="absolute left-3 flex items-center pointer-events-none text-muted-foreground">
              {startIcon}
            </span>
          )}
          <input
            type={type}
            className={cn(
              inputVariants({ inputSize, state }),
              startIcon && "pl-9",
              endIcon && "pr-9",
              className
            )}
            ref={ref}
            {...props}
          />
          {endIcon && (
            <span className="absolute right-3 flex items-center pointer-events-none text-muted-foreground">
              {endIcon}
            </span>
          )}
        </div>
      )
    }

    return (
      <input
        type={type}
        className={cn(inputVariants({ inputSize, state }), className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input, inputVariants }
export type { VariantProps }
