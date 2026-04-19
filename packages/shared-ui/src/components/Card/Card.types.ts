/**
 * Card component type definitions
 * @module Card
 */

import * as React from "react"

/**
 * Props for the Card component.
 * Extends native div attributes.
 * 
 * @example
 * ```tsx
 * <Card className="p-4">Content</Card>
 * ```
 */
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * When true, the component will render its child as the card element.
   * @default false
   */
  asChild?: boolean
}

/**
 * Props for the CardHeader component.
 */
export type CardHeaderProps = React.HTMLAttributes<HTMLDivElement>

/**
 * Props for the CardTitle component.
 */
export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  /**
   * The heading level to render.
   * @default "h3"
   */
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
}

/**
 * Props for the CardDescription component.
 */
export type CardDescriptionProps = React.HTMLAttributes<HTMLParagraphElement>

/**
 * Props for the CardContent component.
 */
export type CardContentProps = React.HTMLAttributes<HTMLDivElement>

/**
 * Props for the CardFooter component.
 */
export type CardFooterProps = React.HTMLAttributes<HTMLDivElement>
