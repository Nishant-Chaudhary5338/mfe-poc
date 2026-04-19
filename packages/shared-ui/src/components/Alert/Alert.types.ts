/**
 * Alert component type definitions
 * @module Alert
 */

import * as React from "react"
import { type VariantProps } from "class-variance-authority"

import { type alertVariants } from "./Alert.variants"

/**
 * Props for the Alert component.
 * Extends native div attributes with variant styling options.
 */
export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {}

/**
 * Props for the AlertTitle component.
 * Extends native heading attributes.
 */
export type AlertTitleProps = React.HTMLAttributes<HTMLHeadingElement>

/**
 * Props for the AlertDescription component.
 * Extends native paragraph attributes.
 */
export type AlertDescriptionProps = React.HTMLAttributes<HTMLParagraphElement>