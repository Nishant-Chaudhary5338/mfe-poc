/**
 * Table component type definitions
 * @module Table
 */

import type * as React from "react"

/**
 * Props for the Table component.
 */
export interface TableProps extends React.HTMLAttributes<HTMLTableElement> {}

/**
 * Props for the TableHeader component.
 */
export interface TableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

/**
 * Props for the TableBody component.
 */
export interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

/**
 * Props for the TableFooter component.
 */
export interface TableFooterProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

/**
 * Props for the TableRow component.
 */
export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {}

/**
 * Props for the TableHead component.
 */
export interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {}

/**
 * Props for the TableCell component.
 */
export interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {}

/**
 * Props for the TableCaption component.
 */
export interface TableCaptionProps extends React.HTMLAttributes<HTMLTableCaptionElement> {}