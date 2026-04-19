/**
 * Pagination component type definitions
 * @module Pagination
 */

import type * as React from "react"

/**
 * Props for the Pagination root component.
 */
export interface PaginationProps extends React.ComponentProps<"nav"> {}

/**
 * Props for the PaginationContent component.
 */
export interface PaginationContentProps extends React.ComponentProps<"ul"> {}

/**
 * Props for the PaginationItem component.
 */
export interface PaginationItemProps extends React.ComponentProps<"li"> {}

/**
 * Props for the PaginationLink component.
 */
export interface PaginationLinkProps extends Omit<React.ComponentProps<"button">, "size"> {
  /**
   * Whether the link represents the current page.
   */
  isActive?: boolean
  /**
   * The size of the pagination link.
   */
  size?: "default" | "sm" | "lg" | "icon"
}

/**
 * Props for the PaginationPrevious component.
 */
export interface PaginationPreviousProps extends PaginationLinkProps {}

/**
 * Props for the PaginationNext component.
 */
export interface PaginationNextProps extends PaginationLinkProps {}

/**
 * Props for the PaginationEllipsis component.
 */
export interface PaginationEllipsisProps extends React.ComponentProps<"span"> {}