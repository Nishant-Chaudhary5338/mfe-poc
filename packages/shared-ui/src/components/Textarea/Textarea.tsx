import * as React from "react"

import { cn } from "../../lib/utils"
import { textareaVariants } from "./Textarea.variants"
import type { TextareaProps } from "./Textarea.types"

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, inputSize, error, success, ...props }, ref) => {
    const state = error ? "error" : success ? "success" : "default"
    return (
      <textarea
        className={cn(textareaVariants({ inputSize, state }), className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea, textareaVariants }
