import * as React from "react"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"
import { type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"
import { paginationLinkVariants } from "./Pagination.variants"
import type {
  PaginationProps,
  PaginationContentProps,
  PaginationItemProps,
  PaginationLinkProps,
  PaginationPreviousProps,
  PaginationNextProps,
  PaginationEllipsisProps,
} from "./Pagination.types"

const Pagination = ({ className, ...props }: React.ComponentProps<"nav">) => (
  <nav
    role="navigation"
    aria-label="pagination"
    className={cn("mx-auto flex w-full justify-center", className)}
    {...props}
  />
)
Pagination.displayName = "Pagination"

const PaginationContent = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn("flex flex-row items-center gap-1", className)}
    {...props}
  />
))
PaginationContent.displayName = "PaginationContent"

const PaginationItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("", className)} {...props} />
))
PaginationItem.displayName = "PaginationItem"

const PaginationLink = ({
  className,
  isActive,
  size = "default",
  variant = "default",
  ...props
}: PaginationLinkProps & VariantProps<typeof paginationLinkVariants>) => (
  <button
    aria-current={isActive ? "page" : undefined}
    className={cn(paginationLinkVariants({ variant, size, isActive }), className)}
    {...props}
  />
)
PaginationLink.displayName = "PaginationLink"

const PaginationPrevious = ({
  className,
  size,
  variant,
  ...props
}: PaginationPreviousProps & VariantProps<typeof paginationLinkVariants>) => (
  <PaginationLink
    aria-label="Go to previous page"
    size={size ?? "default"}
    variant={variant}
    className={cn("gap-1 pl-2.5 w-auto px-3", className)}
    {...props}
  >
    <ChevronLeft className="w-4 h-4" />
    <span>Previous</span>
  </PaginationLink>
)
PaginationPrevious.displayName = "PaginationPrevious"

const PaginationNext = ({
  className,
  size,
  variant,
  ...props
}: PaginationNextProps & VariantProps<typeof paginationLinkVariants>) => (
  <PaginationLink
    aria-label="Go to next page"
    size={size ?? "default"}
    variant={variant}
    className={cn("gap-1 pr-2.5 w-auto px-3", className)}
    {...props}
  >
    <span>Next</span>
    <ChevronRight className="w-4 h-4" />
  </PaginationLink>
)
PaginationNext.displayName = "PaginationNext"

const PaginationEllipsis = ({
  className,
  ...props
}: PaginationEllipsisProps) => (
  <span
    aria-hidden
    className={cn("flex h-9 w-9 items-center justify-center", className)}
    {...props}
  >
    <MoreHorizontal className="w-4 h-4" />
    <span className="sr-only">More pages</span>
  </span>
)
PaginationEllipsis.displayName = "PaginationEllipsis"

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  paginationLinkVariants,
}
