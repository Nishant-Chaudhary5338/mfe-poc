/**
 * DataTable component type definitions
 * @module DataTable
 */

import type * as React from "react"
import type {
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  RowSelectionState,
  PaginationState,
  Table as TanStackTable,
  Row,
} from "@tanstack/react-table"

// ─── Column Meta augmentation (used in column defs) ───────────────────────────
//
// Usage in column definitions:
// {
//   accessorKey: "salary",
//   meta: {
//     roles: ["admin", "hr"],     // only these roles can SEE this column
//     editRoles: ["admin"],       // only these roles can EDIT this column
//     editable: true,             // mark cell as editable
//     editType: "number",         // input type for editing
//     validate: (v) => v < 0 ? "Must be positive" : null,
//     align: "right",
//   }
// }

export type DensityMode = "compact" | "default" | "comfortable"

export type EditType = "text" | "number" | "date" | "select" | "boolean" | "textarea"

/**
 * Configuration object for all DataTable features.
 * Every feature is opt-in via a boolean flag.
 *
 * @example
 * features={{
 *   sorting: true,
 *   columnResizing: true,
 *   editableCells: true,
 *   pagination: true,
 * }}
 */
export interface DataTableFeatures {
  // ── Sorting & Filtering ──────────────────────────────────────────────────
  /** Enable click-to-sort on column headers */
  sorting?: boolean
  /** Enable per-column filter inputs (shown in a toggle-able filter row) */
  filtering?: boolean
  /** Enable a global search input that searches across all columns */
  globalFilter?: boolean

  // ── Pagination ───────────────────────────────────────────────────────────
  /** Enable paginated view with page size controls */
  pagination?: boolean

  // ── Selection & Bulk Actions ─────────────────────────────────────────────
  /** Enable row selection checkboxes. Use "single" for single-select */
  rowSelection?: boolean | "single" | "multiple"
  /** Show bulk action bar when rows are selected (requires bulkActions prop) */
  bulkActions?: boolean

  // ── Column Management ────────────────────────────────────────────────────
  /** Enable column show/hide dropdown in the toolbar */
  columnVisibility?: boolean
  /** Enable sticky column pinning left/right (Airtable-style freeze) */
  columnPinning?: boolean
  /** Enable drag-to-reorder columns */
  draggableColumns?: boolean
  /** Enable drag-to-resize columns (Airtable-style resize handle) */
  columnResizing?: boolean

  // ── Row Features ─────────────────────────────────────────────────────────
  /** Enable expandable sub-rows (requires renderSubComponent prop) */
  rowExpansion?: boolean
  /** Show a row number column as the first column */
  rowNumbers?: boolean

  // ── Display & Layout ─────────────────────────────────────────────────────
  /** Enable zoom in/out controls */
  zoom?: boolean
  /** Show alternating row background colors */
  striped?: boolean
  /** Highlight row on hover */
  hoverable?: boolean
  /** Show density switcher (compact / default / comfortable) in toolbar */
  density?: boolean
  /** Fix the table header to the top when scrolling (requires max height on container) */
  stickyHeader?: boolean

  // ── Editing ──────────────────────────────────────────────────────────────
  /**
   * Enable inline cell editing. Double-click a cell to edit.
   * Configure per-column in column meta: editable, editType, editOptions, validate, onCellSave.
   * RBAC: set meta.editRoles to restrict which roles can edit each column.
   */
  editableCells?: boolean

  // ── Export ───────────────────────────────────────────────────────────────
  /** Show Export CSV button in toolbar */
  exportCsv?: boolean
  /** Show Export JSON button in toolbar */
  exportJson?: boolean

  /** @deprecated Use density instead */
  compact?: boolean
}

/**
 * Role-based access control for the DataTable.
 * Controls which columns are visible and editable based on the current user's role.
 * Configure per-column using column meta: meta.roles and meta.editRoles.
 *
 * @example
 * // In your column definition:
 * { accessorKey: "salary", meta: { roles: ["admin", "hr"], editRoles: ["admin"] } }
 *
 * // On the DataTable:
 * <DataTable rbac={{ userRole: "manager" }} ... />
 */
export interface DataTableRBAC {
  /** The current user's role string */
  userRole: string
}

/**
 * A bulk action button shown in the selection toolbar.
 */
export interface BulkAction<TData> {
  /** Unique identifier */
  id: string
  /** Button label */
  label: string
  /** Optional icon element */
  icon?: React.ReactNode
  /** Button variant */
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost"
  /** Disable the action (can be a function of selected rows) */
  disabled?: boolean | ((selectedRows: TData[]) => boolean)
  /** Called with the currently selected rows */
  onClick: (selectedRows: TData[]) => void
}

/**
 * Server-side data fetching options.
 * When provided, the table uses manual pagination/sorting/filtering.
 *
 * @example
 * serverSide={{
 *   totalCount: 5000,
 *   onFetchData: ({ sorting, pagination, columnFilters, globalFilter }) => {
 *     fetchUsers({ page: pagination.pageIndex, ...sorting[0] })
 *   }
 * }}
 */
export interface ServerSideOptions {
  /** Total number of records across all pages */
  totalCount: number
  /** Called whenever sorting, pagination, or filters change */
  onFetchData: (params: {
    sorting: SortingState
    pagination: PaginationState
    columnFilters: ColumnFiltersState
    globalFilter: string
  }) => void
}

/**
 * Pagination display options.
 */
export interface PaginationOptions {
  /** Default number of rows per page */
  pageSize?: number
  /** Available page size choices */
  pageSizeOptions?: number[]
}

/**
 * Zoom level options.
 */
export interface ZoomOptions {
  min?: number
  max?: number
  step?: number
  default?: number
}

/**
 * Main DataTable component props.
 *
 * @example
 * ```tsx
 * type User = { id: string; name: string; role: string; salary: number }
 *
 * const columns: ColumnDef<User>[] = [
 *   { accessorKey: "name", header: "Name" },
 *   {
 *     accessorKey: "salary",
 *     header: "Salary",
 *     meta: {
 *       roles: ["admin", "hr"],
 *       editRoles: ["admin"],
 *       editable: true,
 *       editType: "number",
 *       align: "right",
 *     }
 *   },
 * ]
 *
 * <DataTable
 *   columns={columns}
 *   data={users}
 *   rbac={{ userRole: currentUser.role }}
 *   features={{
 *     sorting: true,
 *     columnResizing: true,
 *     columnPinning: true,
 *     editableCells: true,
 *     pagination: true,
 *     rowSelection: true,
 *     bulkActions: true,
 *     zoom: true,
 *     density: true,
 *     exportCsv: true,
 *   }}
 *   bulkActions={[
 *     { id: "delete", label: "Delete", variant: "destructive", onClick: deleteRows },
 *   ]}
 *   onCellEdit={({ rowId, columnId, newValue }) => save(rowId, columnId, newValue)}
 * />
 * ```
 */
export interface DataTableProps<TData, TValue = unknown> {
  /** TanStack Table column definitions */
  columns: ColumnDef<TData, TValue>[]
  /** Table data */
  data: TData[]
  /** Feature flags — all opt-in */
  features?: DataTableFeatures
  /** RBAC config — controls column visibility and cell editing per role */
  rbac?: DataTableRBAC
  /** Pagination display options */
  paginationOptions?: PaginationOptions
  /** Zoom level options */
  zoomOptions?: ZoomOptions
  /** Server-side mode options */
  serverSide?: ServerSideOptions
  /** Bulk action buttons shown when rows are selected */
  bulkActions?: BulkAction<TData>[]
  /** Show loading skeleton */
  isLoading?: boolean
  /** Message shown when no rows match */
  emptyMessage?: string | React.ReactNode
  /** className for the outer container div */
  className?: string
  /** className for the table element */
  tableClassName?: string
  /** Called when row selection changes */
  onRowSelectionChange?: (selectedRows: TData[]) => void
  /** Called when column drag-reorder changes */
  onColumnOrderChange?: (columnOrder: string[]) => void
  /** Called when sort state changes */
  onSortingChange?: (sorting: SortingState) => void
  /** Called when pagination changes */
  onPaginationChange?: (pagination: PaginationState) => void
  /**
   * Called after a cell edit is saved.
   * Also fires the column-level meta.onCellSave if defined.
   */
  onCellEdit?: (params: {
    rowId: string
    columnId: string
    oldValue: unknown
    newValue: unknown
    row: TData
  }) => void | Promise<void>
  /** Custom row ID getter */
  getRowId?: (row: TData) => string
  /** Render custom toolbar content (receives the table instance) */
  renderToolbar?: (table: TanStackTable<TData>) => React.ReactNode
  /** Render custom empty state */
  renderEmpty?: () => React.ReactNode
  /** Render sub-row content for row expansion (requires features.rowExpansion) */
  renderSubComponent?: (props: { row: Row<TData> }) => React.ReactNode
  /** Extra content rendered inside the right side of the toolbar */
  children?: React.ReactNode
}

// ─── Internal types ───────────────────────────────────────────────────────────

export interface DraggableColumnHeaderProps<TData, TValue> {
  header: any
  children: React.ReactNode
  className?: string
}

export interface DataTableToolbarProps<TData> {
  table: TanStackTable<TData>
  features?: DataTableFeatures
  zoomOptions?: ZoomOptions
  children?: React.ReactNode
}

export interface DataTablePaginationProps<TData> {
  table: TanStackTable<TData>
}

export interface DataTableState {
  sorting: SortingState
  columnFilters: ColumnFiltersState
  columnVisibility: VisibilityState
  rowSelection: RowSelectionState
  pagination: PaginationState
  globalFilter: string
  columnOrder: string[]
  zoom: number
  density: DensityMode
}
