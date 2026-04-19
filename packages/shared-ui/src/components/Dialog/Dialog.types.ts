/**
 * Dialog component type definitions
 * @module Dialog
 */

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"

/**
 * Props for the Dialog component.
 * Wraps Radix UI Dialog root.
 */
export type DialogProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Root>

/**
 * Props for the DialogTrigger component.
 * Wraps Radix UI Dialog trigger.
 */
export type DialogTriggerProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Trigger>

/**
 * Props for the DialogPortal component.
 * Wraps Radix UI Dialog portal.
 */
export type DialogPortalProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Portal>

/**
 * Props for the DialogClose component.
 * Wraps Radix UI Dialog close.
 */
export type DialogCloseProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Close>

/**
 * Props for the DialogOverlay component.
 * Wraps Radix UI Dialog overlay with custom styling.
 */
export type DialogOverlayProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>

/**
 * Props for the DialogContent component.
 * Wraps Radix UI Dialog content with custom styling.
 */
export type DialogContentProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>

/**
 * Props for the DialogHeader component.
 * Simple wrapper for dialog header content.
 */
export type DialogHeaderProps = React.HTMLAttributes<HTMLDivElement>

/**
 * Props for the DialogFooter component.
 * Simple wrapper for dialog footer content.
 */
export type DialogFooterProps = React.HTMLAttributes<HTMLDivElement>

/**
 * Props for the DialogTitle component.
 * Wraps Radix UI Dialog title.
 */
export type DialogTitleProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>

/**
 * Props for the DialogDescription component.
 * Wraps Radix UI Dialog description.
 */
export type DialogDescriptionProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>