"use client"

import * as React from "react"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getExpandedRowModel,
  useReactTable,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  type RowSelectionState,
  type PaginationState,
  type ColumnOrderState,
  type ColumnPinningState,
  type ExpandedState,
  type ColumnDef,
  type RowData,
} from "@tanstack/react-table"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import { cn } from "../../lib/utils"
import { Button } from "../Button/Button"
import { Input } from "../Input/Input"
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "../Table/Table"

import type {
  DataTableProps,
  DensityMode,
  EditType,
} from "./DataTable.types"

// ─── Column Meta type augmentation ───────────────────────────────────────────
//
// Extend TanStack Table's ColumnMeta so column defs get full type safety for
// RBAC and editing configuration without any imports.
//
// Usage:
//   { accessorKey: "salary", meta: { roles: ["admin"], editable: true, editType: "number" } }

// eslint-disable-next-line @typescript-eslint/no-unused-vars
declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    /**
     * Roles allowed to VIEW this column.
     * If undefined or empty, all roles can see it.
     * Requires <DataTable rbac={{ userRole: "..." }} />
     */
    roles?: string[]
    /**
     * Roles allowed to EDIT this column.
     * If undefined, all roles with editableCells feature can edit.
     * Requires features.editableCells and meta.editable = true.
     */
    editRoles?: string[]
    /** Mark this cell as editable. Requires features.editableCells = true */
    editable?: boolean
    /** Input type rendered when editing this cell */
    editType?: EditType
    /** Options for "select" editType */
    editOptions?: string[]
    /**
     * Per-column save handler, called after the user commits an edit.
     * Also fires the top-level onCellEdit prop.
     */
    onCellSave?: (params: {
      rowId: string
      columnId: string
      oldValue: unknown
      newValue: unknown
    }) => void | Promise<void>
    /** Return an error string to reject the value, or null to accept */
    validate?: (value: unknown) => string | null
    /** Horizontal text alignment for this column */
    align?: "left" | "center" | "right"
  }
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function Icon({ d, d2, children, size = 14, ...rest }: React.SVGProps<SVGSVGElement> & { d?: string; d2?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      {d && <path d={d} />}
      {d2 && <path d={d2} />}
      {children}
    </svg>
  )
}

const ChevronUpIcon = () => <Icon d="m18 15-6-6-6 6" />
const ChevronDownIcon = () => <Icon d="m6 9 6 6 6-6" />
const ChevronsUpDownIcon = () => <Icon d="m7 15 5 5 5-5" d2="m7 9 5-5 5 5" />
const ChevronRightIcon = () => <Icon d="m9 18 6-6-6-6" />
const ZoomInIcon = () => <Icon><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /><path d="M11 8v6" /><path d="M8 11h6" /></Icon>
const ZoomOutIcon = () => <Icon><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /><path d="M8 11h6" /></Icon>
const DownloadIcon = () => <Icon><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></Icon>
const SearchIcon = () => <Icon><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></Icon>
const XIcon = () => <Icon d="M18 6 6 18" d2="m6 6 12 12" />
const FilterIcon = () => <Icon><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></Icon>
const ColumnsIcon = () => <Icon><rect width="18" height="18" x="3" y="3" rx="2" /><line x1="12" x2="12" y1="3" y2="21" /></Icon>
const GripIcon = () => (
  <Icon>
    <circle cx="9" cy="5" r="1" /><circle cx="9" cy="12" r="1" /><circle cx="9" cy="19" r="1" />
    <circle cx="15" cy="5" r="1" /><circle cx="15" cy="12" r="1" /><circle cx="15" cy="19" r="1" />
  </Icon>
)
const PinIcon = ({ active }: { active?: boolean }) => (
  <Icon size={11}>
    <path d="M12 17v5" />
    <path
      d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"
      fill={active ? "currentColor" : "none"}
    />
  </Icon>
)

// ─── Inline cell editor ───────────────────────────────────────────────────────

interface EditableCellInputProps {
  initialValue: unknown
  editType?: EditType
  editOptions?: string[]
  validate?: (value: unknown) => string | null
  onSave: (value: unknown) => void
  onCancel: () => void
}

function EditableCellInput({
  initialValue,
  editType = "text",
  editOptions = [],
  validate,
  onSave,
  onCancel,
}: EditableCellInputProps) {
  const [value, setValue] = React.useState<string>(
    initialValue != null ? String(initialValue) : ""
  )
  const [error, setError] = React.useState<string | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const selectRef = React.useRef<HTMLSelectElement>(null)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  React.useEffect(() => {
    if (editType === "select") selectRef.current?.focus()
    else if (editType === "textarea") textareaRef.current?.focus()
    else {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editType])

  const commit = () => {
    const parsed: unknown =
      editType === "number" ? Number(value) :
      editType === "boolean" ? value === "true" :
      value
    if (validate) {
      const err = validate(parsed)
      if (err) { setError(err); return }
    }
    setError(null)
    onSave(parsed)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && editType !== "textarea") { e.preventDefault(); commit() }
    if (e.key === "Escape") { e.preventDefault(); onCancel() }
    e.stopPropagation()
  }

  const base = "w-full min-w-0 bg-background text-sm outline-none ring-1 ring-primary rounded-sm px-1.5 py-0.5"

  if (editType === "boolean") {
    return (
      <input
        ref={inputRef}
        type="checkbox"
        checked={value === "true"}
        onChange={(e) => { setValue(String(e.target.checked)); onSave(e.target.checked) }}
        className="cursor-pointer accent-primary"
      />
    )
  }

  if (editType === "select") {
    return (
      <div className="w-full">
        <select ref={selectRef} value={value} onChange={(e) => setValue(e.target.value)} onBlur={commit} onKeyDown={onKeyDown} className={base}>
          {editOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        {error && <p className="text-[10px] text-destructive mt-0.5">{error}</p>}
      </div>
    )
  }

  if (editType === "textarea") {
    return (
      <div className="w-full">
        <textarea ref={textareaRef} value={value} onChange={(e) => setValue(e.target.value)} onBlur={commit} onKeyDown={onKeyDown} className={cn(base, "resize-none min-h-[56px]")} rows={3} />
        {error && <p className="text-[10px] text-destructive mt-0.5">{error}</p>}
      </div>
    )
  }

  return (
    <div className="w-full">
      <input
        ref={inputRef}
        type={editType === "number" ? "number" : editType === "date" ? "date" : "text"}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={onKeyDown}
        className={base}
      />
      {error && <p className="text-[10px] text-destructive mt-0.5">{error}</p>}
    </div>
  )
}

// ─── Column visibility dropdown ───────────────────────────────────────────────

function ColumnVisibilityDropdown<TData>({ table }: { table: import("@tanstack/react-table").Table<TData> }) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const allCols = table.getAllLeafColumns().filter(
    (c) => !["_select", "_expand", "_rowNumber"].includes(c.id)
  )
  const hiddenCount = allCols.filter((c) => !c.getIsVisible()).length

  return (
    <div ref={ref} className="relative">
      <Button variant="outline" size="sm" onClick={() => setOpen((o) => !o)}>
        <ColumnsIcon />
        <span className="ml-1.5">Columns</span>
        {hiddenCount > 0 && (
          <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] leading-none text-primary-foreground">
            {hiddenCount}
          </span>
        )}
      </Button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[180px] rounded-md border bg-popover p-1.5 shadow-lg">
          <div className="flex items-center justify-between px-2 pb-1.5 mb-1 border-b">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Columns</span>
            <button className="text-xs text-primary hover:underline" onClick={() => table.resetColumnVisibility()}>
              Reset
            </button>
          </div>
          {allCols.map((col) => (
            <label key={col.id} className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent">
              <input
                type="checkbox"
                checked={col.getIsVisible()}
                onChange={col.getToggleVisibilityHandler()}
                className="cursor-pointer accent-primary"
              />
              <span className="capitalize truncate">
                {typeof col.columnDef.header === "string" ? col.columnDef.header : col.id}
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Resize handle ────────────────────────────────────────────────────────────

function ResizeHandle({ header }: { header: any }) {
  if (!header.column.getCanResize()) return null
  return (
    <div
      onMouseDown={header.getResizeHandler()}
      onTouchStart={header.getResizeHandler()}
      onDoubleClick={() => header.column.resetSize()}
      title="Drag to resize · Double-click to reset"
      className={cn(
        "absolute right-0 top-0 h-full w-1.5 cursor-col-resize select-none touch-none z-10",
        "bg-transparent hover:bg-primary/40 active:bg-primary/70",
        header.column.getIsResizing() && "bg-primary/70"
      )}
    />
  )
}

// ─── Draggable column header ──────────────────────────────────────────────────

function DraggableColumnHeader({
  header,
  children,
  enableColumnResizing,
  enableColumnPinning,
  stickyHeader,
}: {
  header: any
  children: React.ReactNode
  enableColumnResizing?: boolean
  enableColumnPinning?: boolean
  stickyHeader?: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: header.column.id,
  })

  const isPinned = header.column.getIsPinned()

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
    position: isPinned ? "sticky" : "relative",
    left: isPinned === "left" ? `${header.column.getStart("left")}px` : undefined,
    right: isPinned === "right" ? `${header.column.getAfter("right")}px` : undefined,
    zIndex: isDragging ? 200 : isPinned ? (stickyHeader ? 30 : 10) : stickyHeader ? 20 : 1,
    width: enableColumnResizing ? header.column.getSize() : undefined,
    background: "hsl(var(--background))",
  }

  return (
    <TableHead ref={setNodeRef} style={style} className="relative select-none group" {...attributes}>
      <div className="flex items-center gap-1 overflow-hidden">
        <button
          className="flex-shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground/70 touch-none"
          {...listeners}
          tabIndex={-1}
        >
          <GripIcon />
        </button>
        <div className="flex-1 min-w-0 truncate">{children}</div>
        {enableColumnPinning && (
          <button
            className={cn(
              "flex-shrink-0 transition-opacity",
              isPinned ? "opacity-100 text-primary" : "opacity-0 group-hover:opacity-70 text-muted-foreground"
            )}
            onClick={() => header.column.pin(isPinned ? false : "left")}
            title={isPinned ? "Unpin column" : "Pin left"}
          >
            <PinIcon active={!!isPinned} />
          </button>
        )}
      </div>
      {enableColumnResizing && <ResizeHandle header={header} />}
    </TableHead>
  )
}

// ─── Regular column header ────────────────────────────────────────────────────

function ColumnHeader({
  header,
  children,
  enableSorting,
  enableColumnResizing,
  enableColumnPinning,
  stickyHeader,
}: {
  header: any
  children: React.ReactNode
  enableSorting?: boolean
  enableColumnResizing?: boolean
  enableColumnPinning?: boolean
  stickyHeader?: boolean
}) {
  const isPinned = header.column.getIsPinned()
  const canSort = enableSorting && header.column.getCanSort()

  const style: React.CSSProperties = {
    position: isPinned ? "sticky" : stickyHeader ? "sticky" : "relative",
    top: stickyHeader ? 0 : undefined,
    left: isPinned === "left" ? `${header.column.getStart("left")}px` : undefined,
    right: isPinned === "right" ? `${header.column.getAfter("right")}px` : undefined,
    zIndex: isPinned ? (stickyHeader ? 30 : 10) : stickyHeader ? 20 : 1,
    width: enableColumnResizing ? header.column.getSize() : undefined,
    background: "hsl(var(--background))",
  }

  return (
    <TableHead style={style} className="relative group">
      <div className="flex items-center gap-1 overflow-hidden">
        <div className="flex-1 min-w-0">
          {canSort ? (
            <button
              className="flex w-full items-center gap-1 hover:text-foreground"
              onClick={header.column.getToggleSortingHandler()}
            >
              <span className="truncate">{children}</span>
              {header.column.getIsSorted() === "asc" ? (
                <ChevronUpIcon />
              ) : header.column.getIsSorted() === "desc" ? (
                <ChevronDownIcon />
              ) : (
                <span className="text-muted-foreground/40"><ChevronsUpDownIcon /></span>
              )}
            </button>
          ) : (
            <span className="truncate">{children}</span>
          )}
        </div>
        {enableColumnPinning && (
          <button
            className={cn(
              "flex-shrink-0 transition-opacity",
              isPinned ? "opacity-100 text-primary" : "opacity-0 group-hover:opacity-70 text-muted-foreground"
            )}
            onClick={() => header.column.pin(isPinned ? false : "left")}
            title={isPinned ? "Unpin column" : "Pin left"}
          >
            <PinIcon active={!!isPinned} />
          </button>
        )}
      </div>
      {enableColumnResizing && <ResizeHandle header={header} />}
    </TableHead>
  )
}

// ─── DataTable ────────────────────────────────────────────────────────────────

/**
 * DataTable — Feature-rich, Airtable-like table for product applications.
 *
 * All features are opt-in via the `features` prop.
 * RBAC is configured via the `rbac` prop + column `meta.roles` / `meta.editRoles`.
 *
 * @example
 * ```tsx
 * <DataTable
 *   columns={columns}
 *   data={data}
 *   rbac={{ userRole: "admin" }}
 *   features={{
 *     sorting: true,
 *     columnResizing: true,
 *     columnPinning: true,
 *     editableCells: true,
 *     pagination: true,
 *   }}
 * />
 * ```
 */
function DataTable<TData, TValue>({
  columns: rawColumns,
  data,
  features = {},
  rbac,
  paginationOptions,
  zoomOptions,
  serverSide,
  bulkActions: bulkActionDefs,
  isLoading = false,
  emptyMessage = "No results.",
  className,
  tableClassName,
  onRowSelectionChange,
  onColumnOrderChange,
  onSortingChange,
  onPaginationChange,
  onCellEdit,
  getRowId,
  renderToolbar,
  renderEmpty,
  renderSubComponent,
  children,
}: DataTableProps<TData, TValue>) {
  const {
    sorting: enableSorting = false,
    filtering: enableFiltering = false,
    globalFilter: enableGlobalFilter = false,
    pagination: enablePagination = false,
    columnVisibility: enableColumnVisibility = false,
    rowSelection: enableRowSelection = false,
    bulkActions: enableBulkActions = false,
    draggableColumns: enableDraggableColumns = false,
    columnResizing: enableColumnResizing = false,
    columnPinning: enableColumnPinning = false,
    rowExpansion: enableRowExpansion = false,
    rowNumbers: enableRowNumbers = false,
    zoom: enableZoom = false,
    density: enableDensity = false,
    exportCsv: enableExportCsv = false,
    exportJson: enableExportJson = false,
    stickyHeader: enableStickyHeader = false,
    editableCells: enableEditableCells = false,
    striped = false,
    hoverable = true,
    compact = false,
  } = features

  const { min: zoomMin = 50, max: zoomMax = 150, step: zoomStep = 10, default: zoomDefault = 100 } = zoomOptions ?? {}
  const { pageSize: defaultPageSize = 10, pageSizeOptions = [10, 20, 30, 40, 50] } = paginationOptions ?? {}

  // ── State ──────────────────────────────────────────────────────────────────
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [columnPinning, setColumnPinning] = React.useState<ColumnPinningState>({})
  const [expanded, setExpanded] = React.useState<ExpandedState>({})
  const [pagination, setPagination] = React.useState<PaginationState>({ pageIndex: 0, pageSize: defaultPageSize })
  const [zoom, setZoom] = React.useState(zoomDefault)
  const [density, setDensity] = React.useState<DensityMode>(compact ? "compact" : "default")
  const [showFilterRow, setShowFilterRow] = React.useState(false)
  const [editingCell, setEditingCell] = React.useState<{ rowId: string; columnId: string } | null>(null)

  // ── RBAC + system column injection ────────────────────────────────────────
  const columns = React.useMemo<ColumnDef<TData, TValue>[]>(() => {
    // 1. Filter columns by role
    let cols: ColumnDef<TData, TValue>[] = rawColumns.filter((col) => {
      if (!rbac) return true
      const roles = (col.meta as any)?.roles as string[] | undefined
      if (!roles || roles.length === 0) return true
      return roles.includes(rbac.userRole)
    })

    // 2. Row expansion toggle column (prepend)
    if (enableRowExpansion && renderSubComponent) {
      cols = [
        {
          id: "_expand",
          header: "",
          cell: ({ row }) =>
            row.getCanExpand() ? (
              <button
                onClick={row.getToggleExpandedHandler()}
                className={cn("transition-transform duration-150", row.getIsExpanded() && "rotate-90")}
                aria-label={row.getIsExpanded() ? "Collapse row" : "Expand row"}
              >
                <ChevronRightIcon />
              </button>
            ) : null,
          size: 36,
          enableSorting: false,
          enableResizing: false,
        } as ColumnDef<TData, TValue>,
        ...cols,
      ]
    }

    // 3. Row selection column (prepend)
    if (enableRowSelection) {
      cols = [
        {
          id: "_select",
          header: ({ table }) =>
            enableRowSelection !== "single" ? (
              <input
                type="checkbox"
                checked={table.getIsAllPageRowsSelected()}
                ref={(el) => { if (el) el.indeterminate = table.getIsSomePageRowsSelected() }}
                onChange={table.getToggleAllPageRowsSelectedHandler()}
                className="cursor-pointer accent-primary"
                aria-label="Select all rows"
              />
            ) : null,
          cell: ({ row }) => (
            <input
              type="checkbox"
              checked={row.getIsSelected()}
              disabled={!row.getCanSelect()}
              onChange={row.getToggleSelectedHandler()}
              className="cursor-pointer accent-primary"
              aria-label="Select row"
            />
          ),
          size: 40,
          enableSorting: false,
          enableResizing: false,
        } as ColumnDef<TData, TValue>,
        ...cols,
      ]
    }

    // 4. Row number column (prepend last so it's always #1)
    if (enableRowNumbers) {
      cols = [
        {
          id: "_rowNumber",
          header: "#",
          cell: ({ row }) => (
            <span className="text-muted-foreground/60 text-xs tabular-nums select-none">
              {row.index + 1}
            </span>
          ),
          size: 48,
          enableSorting: false,
          enableResizing: false,
        } as ColumnDef<TData, TValue>,
        ...cols,
      ]
    }

    return cols
  }, [rawColumns, rbac, enableRowNumbers, enableRowExpansion, enableRowSelection, renderSubComponent])

  const [columnOrder, setColumnOrder] = React.useState<ColumnOrderState>(() =>
    columns.map((c) => (c as any).id ?? (c as any).accessorKey ?? "")
  )

  // ── DnD sensors ───────────────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // ── Server-side fetch trigger ─────────────────────────────────────────────
  const onFetchDataRef = React.useRef(serverSide?.onFetchData)
  React.useEffect(() => { onFetchDataRef.current = serverSide?.onFetchData })
  React.useEffect(() => {
    if (serverSide) {
      onFetchDataRef.current?.({ sorting, pagination, columnFilters, globalFilter })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sorting, pagination, columnFilters, globalFilter])

  // ── Table instance ────────────────────────────────────────────────────────
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    getFilteredRowModel: enableFiltering || enableGlobalFilter ? getFilteredRowModel() : undefined,
    getPaginationRowModel: enablePagination ? getPaginationRowModel() : undefined,
    getExpandedRowModel: enableRowExpansion ? getExpandedRowModel() : undefined,
    onSortingChange: (updater) => {
      const next = typeof updater === "function" ? updater(sorting) : updater
      setSorting(next); onSortingChange?.(next)
    },
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: (updater) => {
      const next = typeof updater === "function" ? updater(rowSelection) : updater
      setRowSelection(next)
      if (onRowSelectionChange) {
        const selected = Object.keys(next).filter((k) => next[k]).map((k) => data[parseInt(k)]).filter(Boolean)
        onRowSelectionChange(selected)
      }
    },
    onGlobalFilterChange: setGlobalFilter,
    onColumnOrderChange: (updater) => {
      const next = typeof updater === "function" ? updater(columnOrder) : updater
      setColumnOrder(next)
    },
    onPaginationChange: (updater) => {
      const next = typeof updater === "function" ? updater(pagination) : updater
      setPagination(next); onPaginationChange?.(next)
    },
    onColumnPinningChange: setColumnPinning,
    onExpandedChange: setExpanded,
    state: {
      sorting, columnFilters, columnVisibility, rowSelection,
      globalFilter, columnOrder, pagination, columnPinning, expanded,
    },
    enableSorting,
    enableColumnFilters: enableFiltering,
    enableGlobalFilter,
    enableRowSelection: !!enableRowSelection,
    enableMultiRowSelection: enableRowSelection !== "single",
    enableColumnResizing,
    columnResizeMode: "onChange",
    getRowId,
    getRowCanExpand: renderSubComponent ? () => true : undefined,
    manualPagination: !!serverSide,
    manualSorting: !!serverSide,
    manualFiltering: !!serverSide,
    rowCount: serverSide?.totalCount,
  })

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (active && over && active.id !== over.id) {
      setColumnOrder((prev) => {
        const next = arrayMove(prev, prev.indexOf(active.id as string), prev.indexOf(over.id as string))
        onColumnOrderChange?.(next)
        return next
      })
    }
  }

  const handleCellSave = async (
    rowId: string, columnId: string, oldValue: unknown, newValue: unknown, row: TData
  ) => {
    const col = table.getColumn(columnId)
    await col?.columnDef.meta?.onCellSave?.({ rowId, columnId, oldValue, newValue })
    await onCellEdit?.({ rowId, columnId, oldValue, newValue, row })
    setEditingCell(null)
  }

  const exportToCsv = () => {
    const headers = table.getAllLeafColumns()
      .filter((c) => !["_select", "_expand", "_rowNumber"].includes(c.id) && c.getIsVisible())
      .map((c) => c.id)
    const escape = (v: string) =>
      v.includes(",") || v.includes('"') || v.includes("\n") ? `"${v.replace(/"/g, '""')}"` : v
    const rows = table.getFilteredRowModel().rows.map((r) =>
      headers.map((h) => escape(String(r.getValue(h) ?? "")))
    )
    const blob = new Blob([[headers.join(","), ...rows.map((r) => r.join(","))].join("\n")], { type: "text/csv;charset=utf-8;" })
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob); a.download = "export.csv"; a.click()
    URL.revokeObjectURL(a.href)
  }

  const exportToJson = () => {
    const cols = table.getAllLeafColumns()
      .filter((c) => !["_select", "_expand", "_rowNumber"].includes(c.id) && c.getIsVisible())
      .map((c) => c.id)
    const rows = table.getFilteredRowModel().rows.map((r) =>
      Object.fromEntries(cols.map((id) => [id, r.getValue(id)]))
    )
    const blob = new Blob([JSON.stringify(rows, null, 2)], { type: "application/json" })
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob); a.download = "export.json"; a.click()
    URL.revokeObjectURL(a.href)
  }

  // ── Density cell padding ──────────────────────────────────────────────────
  const cellPadding = density === "compact" ? "py-1 px-2 text-xs" : density === "comfortable" ? "py-3 px-4" : "py-2 px-3"
  const headPadding = density === "compact" ? "py-2 px-2 text-xs" : density === "comfortable" ? "py-3 px-4" : "py-3 px-3"

  // ── Render: header ────────────────────────────────────────────────────────
  const renderHeaderContent = () =>
    table.getHeaderGroups().map((hg) => (
      <React.Fragment key={hg.id}>
        <TableRow>
          {enableDraggableColumns ? (
            <SortableContext items={columnOrder} strategy={horizontalListSortingStrategy}>
              {hg.headers.map((header) => (
                <DraggableColumnHeader
                  key={header.id}
                  header={header}
                  enableColumnResizing={enableColumnResizing}
                  enableColumnPinning={enableColumnPinning}
                  stickyHeader={enableStickyHeader}
                >
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </DraggableColumnHeader>
              ))}
            </SortableContext>
          ) : (
            hg.headers.map((header) => (
              <ColumnHeader
                key={header.id}
                header={header}
                enableSorting={enableSorting}
                enableColumnResizing={enableColumnResizing}
                enableColumnPinning={enableColumnPinning}
                stickyHeader={enableStickyHeader}
              >
                {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
              </ColumnHeader>
            ))
          )}
        </TableRow>

        {/* Per-column filter row */}
        {showFilterRow && enableFiltering && (
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            {hg.headers.map((header) => (
              <TableHead key={`f-${header.id}`} className="p-1">
                {header.column.getCanFilter() && !["_select", "_expand", "_rowNumber"].includes(header.column.id) ? (
                  <div className="relative">
                    <Input
                      value={(header.column.getFilterValue() as string) ?? ""}
                      onChange={(e) => header.column.setFilterValue(e.target.value || undefined)}
                      placeholder="Filter…"
                      className="h-7 text-xs pr-6"
                    />
                    {!!header.column.getFilterValue() && (
                      <button
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() => header.column.setFilterValue(undefined)}
                      >
                        <XIcon />
                      </button>
                    )}
                  </div>
                ) : null}
              </TableHead>
            ))}
          </TableRow>
        )}
      </React.Fragment>
    ))

  // ── Render: body ──────────────────────────────────────────────────────────
  const renderBodyContent = () => {
    if (isLoading) {
      return (
        <TableRow>
          <TableCell colSpan={columns.length} className="h-32 text-center">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <span className="text-sm">Loading…</span>
            </div>
          </TableCell>
        </TableRow>
      )
    }

    if (table.getRowModel().rows.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground">
            {renderEmpty ? renderEmpty() : emptyMessage}
          </TableCell>
        </TableRow>
      )
    }

    return table.getRowModel().rows.flatMap((row) => {
      const mainRow = (
        <TableRow
          key={row.id}
          data-state={row.getIsSelected() ? "selected" : undefined}
          className={cn(
            striped && row.index % 2 === 0 && "bg-muted/40",
            hoverable && "hover:bg-muted/50",
            row.getIsSelected() && "bg-primary/5 hover:bg-primary/8"
          )}
        >
          {row.getVisibleCells().map((cell) => {
            const isPinned = cell.column.getIsPinned()
            const meta = cell.column.columnDef.meta
            const isSystemCol = ["_select", "_expand", "_rowNumber"].includes(cell.column.id)
            const canEdit =
              !isSystemCol &&
              enableEditableCells &&
              meta?.editable === true &&
              (!rbac || !meta.editRoles || meta.editRoles.includes(rbac.userRole))
            const isEditing = editingCell?.rowId === row.id && editingCell?.columnId === cell.column.id

            const cellStyle: React.CSSProperties = {
              position: isPinned ? "sticky" : undefined,
              left: isPinned === "left" ? `${cell.column.getStart("left")}px` : undefined,
              right: isPinned === "right" ? `${cell.column.getAfter("right")}px` : undefined,
              zIndex: isPinned ? 1 : undefined,
              background: isPinned ? "hsl(var(--background))" : undefined,
              width: enableColumnResizing ? cell.column.getSize() : undefined,
              textAlign: meta?.align,
            }

            return (
              <TableCell
                key={cell.id}
                style={cellStyle}
                className={cn(
                  cellPadding,
                  canEdit && !isEditing && "cursor-pointer select-none",
                  canEdit && !isEditing && "hover:outline hover:outline-1 hover:outline-primary/30 hover:outline-offset-[-1px]",
                  isEditing && "p-0.5"
                )}
                onDoubleClick={() => {
                  if (canEdit && !isEditing) setEditingCell({ rowId: row.id, columnId: cell.column.id })
                }}
                title={canEdit && !isEditing ? "Double-click to edit" : undefined}
              >
                {isEditing ? (
                  <EditableCellInput
                    initialValue={cell.getValue()}
                    editType={meta?.editType}
                    editOptions={meta?.editOptions}
                    validate={meta?.validate}
                    onSave={(v) => handleCellSave(row.id, cell.column.id, cell.getValue(), v, row.original)}
                    onCancel={() => setEditingCell(null)}
                  />
                ) : (
                  flexRender(cell.column.columnDef.cell, cell.getContext())
                )}
              </TableCell>
            )
          })}
        </TableRow>
      )

      const subRow = row.getIsExpanded() && renderSubComponent ? (
        <TableRow key={`${row.id}--sub`} className="hover:bg-transparent">
          <TableCell colSpan={columns.length} className="p-0">
            <div className="border-t bg-muted/20 px-4 py-3">
              {renderSubComponent({ row })}
            </div>
          </TableCell>
        </TableRow>
      ) : null

      return subRow ? [mainRow, subRow] : [mainRow]
    })
  }

  // ── Bulk actions ──────────────────────────────────────────────────────────
  const selectedRows = table.getSelectedRowModel().rows.map((r) => r.original)
  const hasSelection = selectedRows.length > 0

  // ── Assembled content ─────────────────────────────────────────────────────
  const content = (
    <div
      className={cn("w-full", className)}
      style={enableZoom ? { fontSize: `${zoom}%` } : undefined}
    >
      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3">
        {/* Left side */}
        <div className="flex flex-wrap items-center gap-2">
          {enableGlobalFilter && (
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                <SearchIcon />
              </span>
              <Input
                placeholder="Search…"
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-8 h-9 max-w-xs"
              />
              {globalFilter && (
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setGlobalFilter("")}
                >
                  <XIcon />
                </button>
              )}
            </div>
          )}

          {enableFiltering && (
            <Button
              variant={showFilterRow ? "secondary" : "outline"}
              size="sm"
              onClick={() => setShowFilterRow((v) => !v)}
            >
              <FilterIcon />
              <span className="ml-1.5">Filters</span>
              {columnFilters.length > 0 && (
                <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] leading-none text-primary-foreground">
                  {columnFilters.length}
                </span>
              )}
            </Button>
          )}
        </div>

        {/* Right side */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Density switcher */}
          {enableDensity && (
            <div className="flex items-center rounded-md border overflow-hidden">
              {(["compact", "default", "comfortable"] as DensityMode[]).map((d) => (
                <button
                  key={d}
                  onClick={() => setDensity(d)}
                  className={cn(
                    "px-2.5 py-1.5 text-xs capitalize transition-colors",
                    density === d ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"
                  )}
                  title={`${d} density`}
                >
                  {d === "compact" ? "S" : d === "default" ? "M" : "L"}
                </button>
              ))}
            </div>
          )}

          {/* Zoom */}
          {enableZoom && (
            <div className="flex items-center gap-0.5 rounded-md border px-1">
              <Button
                variant="ghost" size="icon" className="h-7 w-7"
                onClick={() => setZoom((z) => Math.max(z - zoomStep, zoomMin))}
                disabled={zoom <= zoomMin}
              >
                <ZoomOutIcon />
              </Button>
              <span className="min-w-[2.75rem] text-center text-xs tabular-nums">{zoom}%</span>
              <Button
                variant="ghost" size="icon" className="h-7 w-7"
                onClick={() => setZoom((z) => Math.min(z + zoomStep, zoomMax))}
                disabled={zoom >= zoomMax}
              >
                <ZoomInIcon />
              </Button>
            </div>
          )}

          {/* Export */}
          {enableExportCsv && (
            <Button variant="outline" size="sm" onClick={exportToCsv}>
              <DownloadIcon /><span className="ml-1.5">CSV</span>
            </Button>
          )}
          {enableExportJson && (
            <Button variant="outline" size="sm" onClick={exportToJson}>
              <DownloadIcon /><span className="ml-1.5">JSON</span>
            </Button>
          )}

          {/* Column visibility */}
          {enableColumnVisibility && <ColumnVisibilityDropdown table={table} />}

          {/* Custom toolbar slot */}
          {renderToolbar?.(table)}
          {children}
        </div>
      </div>

      {/* ── Bulk actions bar ─────────────────────────────────────────────── */}
      {enableBulkActions && hasSelection && (
        <div className="flex flex-wrap items-center gap-2 mb-2 px-3 py-2 rounded-md border border-primary/20 bg-primary/5">
          <span className="text-sm font-medium text-primary">
            {selectedRows.length} row{selectedRows.length !== 1 ? "s" : ""} selected
          </span>
          <div className="flex-1" />
          {bulkActionDefs?.map((action) => (
            <Button
              key={action.id}
              variant={action.variant ?? "outline"}
              size="sm"
              disabled={typeof action.disabled === "function" ? action.disabled(selectedRows) : action.disabled}
              onClick={() => action.onClick(selectedRows)}
            >
              {action.icon}
              {action.label}
            </Button>
          ))}
          <Button variant="ghost" size="sm" onClick={() => table.resetRowSelection()}>
            <XIcon /><span className="ml-1">Clear</span>
          </Button>
        </div>
      )}

      {/* ── Table ────────────────────────────────────────────────────────── */}
      <div className={cn("rounded-md border", enableStickyHeader && "overflow-auto max-h-[600px]")}>
        <Table
          className={cn(
            tableClassName,
            enableColumnResizing && "table-fixed",
            enableColumnPinning && "border-separate border-spacing-0"
          )}
        >
          <TableHeader>{renderHeaderContent()}</TableHeader>
          <TableBody>{renderBodyContent()}</TableBody>
        </Table>
      </div>

      {/* ── Pagination ───────────────────────────────────────────────────── */}
      {enablePagination && (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
          <p className="text-sm text-muted-foreground">
            {hasSelection && `${selectedRows.length} of `}
            {serverSide
              ? `${serverSide.totalCount.toLocaleString()} rows`
              : `${table.getFilteredRowModel().rows.length.toLocaleString()} row${table.getFilteredRowModel().rows.length !== 1 ? "s" : ""}`}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Rows per page</span>
              <select
                value={table.getState().pagination.pageSize}
                onChange={(e) => { table.setPageSize(Number(e.target.value)) }}
                className="h-8 rounded-md border border-input bg-background px-2 text-sm"
              >
                {pageSizeOptions.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <span className="text-sm text-muted-foreground tabular-nums">
              Page {table.getState().pagination.pageIndex + 1} / {Math.max(table.getPageCount(), 1)}
            </span>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()} aria-label="First page">«</Button>
              <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} aria-label="Previous page">‹</Button>
              <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} aria-label="Next page">›</Button>
              <Button variant="outline" size="sm" onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()} aria-label="Last page">»</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  if (enableDraggableColumns) {
    return (
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        {content}
      </DndContext>
    )
  }

  return content
}

DataTable.displayName = "DataTable"

export { DataTable }
