/**
 * AutoForm component type definitions
 * @module AutoForm
 */

import type * as React from "react"
import type { ZodSchema, TypeOf } from "zod"
import type { FieldValues, UseFormReturn } from "react-hook-form"

/**
 * Supported field types for auto-generation
 */
export type FieldType =
  | "text"
  | "email"
  | "password"
  | "number"
  | "textarea"
  | "select"
  | "checkbox"
  | "radio"
  | "date"
  | "switch"

/**
 * Configuration for a single form field
 */
export interface FieldConfig {
  /** Display label for the field */
  label?: string
  /** Placeholder text */
  placeholder?: string
  /** Helper text shown below the field */
  description?: string
  /** Field type override (auto-detected from schema if not provided) */
  fieldType?: FieldType
  /** Options for select/radio fields */
  options?: Array<{ label: string; value: string | number }>
  /** Whether field is disabled */
  disabled?: boolean
  /** Input type for number fields */
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>
  /** Custom className for the field wrapper */
  className?: string
}

/**
 * Configuration for all form fields
 */
export type FieldsConfig<T extends FieldValues> = Partial<
  Record<keyof T, FieldConfig>
>

/**
 * Props for the AutoForm component
 */
export interface AutoFormProps<TSchema extends ZodSchema> {
  /** Zod schema for validation */
  schema: TSchema
  /** Default values for the form */
  defaultValues?: Partial<TypeOf<TSchema>>
  /** Field configurations */
  fieldConfig?: FieldsConfig<TypeOf<TSchema>>
  /** Fields to include (all fields if not specified) */
  include?: Array<keyof TypeOf<TSchema>>
  /** Fields to exclude */
  exclude?: Array<keyof TypeOf<TSchema>>
  /** Order of fields */
  order?: Array<keyof TypeOf<TSchema>>
  /** Called on valid form submission */
  onSubmit: (values: TypeOf<TSchema>) => void | Promise<void>
  /** Called on invalid submission */
  onValidationError?: (errors: Record<string, string>) => void
  /** Submit button text */
  submitText?: string
  /** Whether to show the submit button */
  showSubmit?: boolean
  /** Whether form is in loading state */
  isLoading?: boolean
  /** Custom className for the form */
  className?: string
  /** Custom render for the submit button */
  renderSubmit?: (props: { isLoading: boolean; isValid: boolean }) => React.ReactNode
  /** Children to render after fields (e.g., additional buttons) */
  children?: React.ReactNode
}

/**
 * Props for individual field components
 */
export interface AutoFormFieldProps {
  name: string
  label?: string
  placeholder?: string
  description?: string
  disabled?: boolean
  required?: boolean
  error?: string
  className?: string
}

/**
 * Return type for useAutoForm hook
 */
export interface UseAutoFormReturn<T extends FieldValues> {
  form: UseFormReturn<T>
  handleSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>
  isSubmitting: boolean
  isValid: boolean
  errors: Record<string, string>
}