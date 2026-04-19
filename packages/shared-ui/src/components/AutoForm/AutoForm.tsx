"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import type { ZodSchema, TypeOf, ZodTypeDef } from "zod"

import { cn } from "../../lib/utils"
import { Button } from "../Button/Button"
import { Input } from "../Input/Input"
import { Label } from "../Label/Label"
import { Textarea } from "../Textarea/Textarea"
import { Checkbox } from "../Checkbox/Checkbox"
import { Switch } from "../Switch/Switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../Select/Select"
import { RadioGroup, RadioGroupItem } from "../RadioGroup/RadioGroup"
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "../Form/Form"

import type {
  AutoFormProps,
  FieldType,
  FieldConfig,
} from "./AutoForm.types"

// Utility to get field type from Zod schema
function getFieldTypeFromSchema(
  schema: ZodSchema,
  fieldName: string
): FieldType {
  const shape = (schema as any)._def?.shape?.()
  if (!shape) return "text"

  const fieldSchema = shape[fieldName]
  if (!fieldSchema) return "text"

  const typeName = fieldSchema._def?.typeName

  // Check for email validation
  const checks = fieldSchema._def?.checks || []
  const hasEmailCheck = checks.some(
    (c: any) => c.kind === "email" || (c.value && c.value === "email")
  )

  if (hasEmailCheck || fieldName.toLowerCase().includes("email")) return "email"
  if (fieldName.toLowerCase().includes("password")) return "password"
  if (fieldName.toLowerCase().includes("description")) return "textarea"
  if (fieldName.toLowerCase().includes("bio")) return "textarea"

  switch (typeName) {
    case "ZodString":
      return "text"
    case "ZodNumber":
      return "number"
    case "ZodBoolean":
      return "switch"
    case "ZodDate":
      return "date"
    case "ZodEnum":
      return "select"
    case "ZodNativeEnum":
      return "select"
    case "ZodOptional":
    case "ZodNullable":
    case "ZodDefault":
      return getFieldTypeFromSchema(fieldSchema, fieldName)
    default:
      return "text"
  }
}

// Get enum options from Zod schema
function getEnumOptions(
  schema: ZodSchema,
  fieldName: string
): Array<{ label: string; value: string }> {
  const shape = (schema as any)._def?.shape?.()
  if (!shape) return []

  let fieldSchema = shape[fieldName]
  if (!fieldSchema) return []

  // Unwrap optional/nullable/default wrappers
  while (
    fieldSchema._def?.typeName === "ZodOptional" ||
    fieldSchema._def?.typeName === "ZodNullable" ||
    fieldSchema._def?.typeName === "ZodDefault"
  ) {
    fieldSchema = fieldSchema._def?.innerType || fieldSchema._def?.defaultValue
  }

  const typeName = fieldSchema._def?.typeName

  if (typeName === "ZodEnum") {
    const values = fieldSchema._def?.values || []
    return values.map((v: string) => ({ label: v.charAt(0).toUpperCase() + v.slice(1), value: v }))
  }

  if (typeName === "ZodNativeEnum") {
    const enumObj = fieldSchema._def?.values || {}
    return Object.entries(enumObj)
      .filter(([key]) => isNaN(Number(key)))
      .map(([key, value]) => ({ label: key, value: String(value) }))
  }

  return []
}

// Check if field is required
function isFieldRequired(schema: ZodSchema, fieldName: string): boolean {
  const shape = (schema as any)._def?.shape?.()
  if (!shape) return false

  const fieldSchema = shape[fieldName]
  if (!fieldSchema) return false

  // Check if it's optional/nullable
  const typeName = fieldSchema._def?.typeName
  return typeName !== "ZodOptional" && typeName !== "ZodNullable" && typeName !== "ZodDefault"
}

// Get all field names from schema
function getFieldNames(schema: ZodSchema): string[] {
  const shape = (schema as any)._def?.shape?.()
  if (!shape) return []
  return Object.keys(shape)
}

// Field renderers
function renderField(
  fieldType: FieldType,
  field: any,
  config: FieldConfig,
  isRequired: boolean
) {
  switch (fieldType) {
    case "text":
    case "email":
    case "password":
      return (
        <Input
          type={fieldType === "email" ? "email" : fieldType === "password" ? "password" : "text"}
          placeholder={config.placeholder}
          disabled={config.disabled}
          {...field}
          {...config.inputProps}
        />
      )

    case "number":
      return (
        <Input
          type="number"
          placeholder={config.placeholder}
          disabled={config.disabled}
          {...field}
          onChange={(e) => field.onChange(e.target.valueAsNumber || undefined)}
          {...config.inputProps}
        />
      )

    case "textarea":
      return (
        <Textarea
          placeholder={config.placeholder}
          disabled={config.disabled}
          {...field}
        />
      )

    case "select":
      const options = config.options || []
      return (
        <Select
          onValueChange={field.onChange}
          defaultValue={field.value}
          disabled={config.disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder={config.placeholder || "Select..."} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={String(option.value)} value={String(option.value)}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )

    case "checkbox":
      return (
        <div className="flex items-center space-x-2">
          <Checkbox
            id={field.name}
            checked={field.value}
            onCheckedChange={field.onChange}
            disabled={config.disabled}
          />
          <label
            htmlFor={field.name}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {config.label || field.name}
          </label>
        </div>
      )

    case "switch":
      return (
        <div className="flex items-center space-x-2">
          <Switch
            id={field.name}
            checked={field.value}
            onCheckedChange={field.onChange}
            disabled={config.disabled}
          />
          <label
            htmlFor={field.name}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {config.label || field.name}
          </label>
        </div>
      )

    case "radio":
      const radioOptions = config.options || []
      return (
        <RadioGroup
          onValueChange={field.onChange}
          defaultValue={field.value}
          disabled={config.disabled}
          className="flex flex-col space-y-1"
        >
          {radioOptions.map((option) => (
            <div key={String(option.value)} className="flex items-center space-x-2">
              <RadioGroupItem value={String(option.value)} id={`${field.name}-${option.value}`} />
              <Label htmlFor={`${field.name}-${option.value}`}>{option.label}</Label>
            </div>
          ))}
        </RadioGroup>
      )

    case "date":
      return (
        <Input
          type="date"
          disabled={config.disabled}
          {...field}
        />
      )

    default:
      return (
        <Input
          placeholder={config.placeholder}
          disabled={config.disabled}
          {...field}
        />
      )
  }
}

/**
 * AutoForm - A declarative form component that auto-generates forms from a Zod schema.
 * 
 * @example
 * ```tsx
 * const schema = z.object({
 *   name: z.string().min(2),
 *   email: z.string().email(),
 *   role: z.enum(["admin", "user"]),
 * })
 * 
 * <AutoForm
 *   schema={schema}
 *   onSubmit={(values) => console.log(values)}
 *   fieldConfig={{
 *     name: { label: "Full Name", placeholder: "Enter name" },
 *     email: { label: "Email", placeholder: "you@example.com" },
 *   }}
 * />
 * ```
 */
function AutoForm<TSchema extends ZodSchema>({
  schema,
  defaultValues,
  fieldConfig = {},
  include,
  exclude = [],
  order,
  onSubmit,
  onValidationError,
  submitText = "Submit",
  showSubmit = true,
  isLoading = false,
  className,
  renderSubmit,
  children,
}: AutoFormProps<TSchema>) {
  type FormValues = TypeOf<TSchema>

  const form = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema as any),
    defaultValues: defaultValues as any,
  })

  const {
    handleSubmit,
    formState: { isSubmitting, isValid, errors },
    control,
  } = form

  // Get field names to render
  let fieldNames = getFieldNames(schema)

  // Apply include/exclude filters
  if (include) {
    fieldNames = fieldNames.filter((name) => include.includes(name as any))
  }
  fieldNames = fieldNames.filter((name) => !exclude.includes(name as any))

  // Apply order
  if (order) {
    fieldNames = (order as string[]).filter((name) => fieldNames.includes(name))
  }

  // Convert errors to simple object
  const errorMessages: Record<string, string> = {}
  Object.entries(errors).forEach(([key, error]) => {
    if (error?.message) {
      errorMessages[key] = String(error.message)
    }
  })

  const handleValidSubmit = async (values: FormValues) => {
    try {
      await onSubmit(values)
    } catch (error) {
      console.error("Form submission error:", error)
    }
  }

  const handleInvalidSubmit = () => {
    if (onValidationError) {
      onValidationError(errorMessages)
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={handleSubmit(handleValidSubmit, handleInvalidSubmit)}
        className={cn("space-y-6", className)}
      >
        {fieldNames.map((fieldName) => {
          const config = (fieldConfig as any)[fieldName] || {}
          const fieldType =
            config.fieldType || getFieldTypeFromSchema(schema, fieldName)
          const fieldOptions = config.options || getEnumOptions(schema, fieldName)
          const required = isFieldRequired(schema, fieldName)

          // Skip checkbox/switch in FormField wrapper (they handle their own labels)
          if (fieldType === "checkbox" || fieldType === "switch") {
            return (
              <FormField
                key={fieldName}
                control={control}
                name={fieldName as any}
                render={({ field }) => (
                  <FormItem className={config.className}>
                    <FormControl>
                      {renderField(fieldType, field, { ...config, options: fieldOptions }, required)}
                    </FormControl>
                    {config.description && (
                      <FormDescription>{config.description}</FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            )
          }

          return (
            <FormField
              key={fieldName}
              control={control}
              name={fieldName as any}
              render={({ field }) => (
                <FormItem className={config.className}>
                  <FormLabel>
                    {config.label || fieldName}
                    {required && <span className="ml-1 text-destructive">*</span>}
                  </FormLabel>
                  <FormControl>
                    {renderField(fieldType, field, { ...config, options: fieldOptions }, required)}
                  </FormControl>
                  {config.description && (
                    <FormDescription>{config.description}</FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          )
        })}

        {children}

        {showSubmit && (
          <div className="flex justify-end">
            {renderSubmit ? (
              renderSubmit({ isLoading: isLoading || isSubmitting, isValid })
            ) : (
              <Button
                type="submit"
                disabled={isLoading || isSubmitting}
              >
                {isSubmitting ? "Submitting..." : submitText}
              </Button>
            )}
          </div>
        )}
      </form>
    </Form>
  )
}

AutoForm.displayName = "AutoForm"

export { AutoForm }