/**
 * Form component type definitions
 * @module Form
 */

import type * as React from "react"
import type * as LabelPrimitive from "@radix-ui/react-label"
import type { Slot } from "@radix-ui/react-slot"
import type {
  ControllerProps,
  FieldPath,
  FieldValues,
  FormProviderProps,
} from "react-hook-form"

/**
 * Context value for form field.
 */
export interface FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> {
  name: TName
}

/**
 * Context value for form item.
 */
export interface FormItemContextValue {
  id: string
}

/**
 * Props for the Form component.
 * Extends FormProviderProps from react-hook-form.
 */
export type FormProps<TFieldValues extends FieldValues = FieldValues> =
  FormProviderProps<TFieldValues>

/**
 * Props for the FormField component.
 */
export type FormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = ControllerProps<TFieldValues, TName>

/**
 * Props for the FormItem component.
 */
export interface FormItemProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * Props for the FormLabel component.
 */
export type FormLabelProps = React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>

/**
 * Props for the FormControl component.
 */
export type FormControlProps = React.ComponentPropsWithoutRef<typeof Slot>

/**
 * Props for the FormDescription component.
 */
export interface FormDescriptionProps
  extends React.HTMLAttributes<HTMLParagraphElement> {}

/**
 * Props for the FormMessage component.
 */
export interface FormMessageProps
  extends React.HTMLAttributes<HTMLParagraphElement> {}

/**
 * Return type for useFormField hook.
 */
export interface UseFormFieldReturn {
  id: string
  name: FieldPath<FieldValues>
  formItemId: string
  formDescriptionId: string
  formMessageId: string
  invalid: boolean
  isDirty: boolean
  isTouched: boolean
  error?: {
    type: string
    message: string
  }
}