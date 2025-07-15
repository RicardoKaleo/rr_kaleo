"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  ColumnDef,
  Row,
  TableOptions,
} from "@tanstack/react-table";
import { Button } from "./button";
import { Card } from "./card";
import { Separator } from "./separator";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  onRowUpdate?: (row: Row<TData>, values: Partial<TData>) => void;
  actions?: (row: Row<TData>) => React.ReactNode;
  pageSize?: number;
  minWidthClass?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  onRowUpdate,
  actions,
  pageSize = 10,
  minWidthClass = "min-w-full",
}: DataTableProps<TData, TValue>) {
  const [editingRowId, setEditingRowId] = React.useState<string | null>(null);
  const [editingValues, setEditingValues] = React.useState<Partial<TData>>({});
  const [page, setPage] = React.useState(0);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: {},
  });

  const totalPages = Math.ceil(data.length / pageSize);
  const paginatedRows = table.getRowModel().rows.slice(
    page * pageSize,
    (page + 1) * pageSize
  );

  const startEdit = (row: Row<TData>) => {
    setEditingRowId(row.id as string);
    setEditingValues(row.original);
  };

  const cancelEdit = () => {
    setEditingRowId(null);
    setEditingValues({});
  };

  const saveEdit = (row: Row<TData>) => {
    if (onRowUpdate) onRowUpdate(row, editingValues);
    setEditingRowId(null);
    setEditingValues({});
  };

  return (
    <Card className="p-4">
      <div className="w-full overflow-x-auto">
        <table className="min-w-[900px] text-sm" style={{ tableLayout: 'fixed' }}>
          <thead>
            {table.getHeaderGroups().map((headerGroup: any) => (
              <tr key={headerGroup.id} className="bg-muted">
                {headerGroup.headers.map((header: any) => (
                  <th
                    key={header.id}
                    className="p-2 text-left font-semibold"
                    style={header.column.columnDef.meta?.width ? { width: header.column.columnDef.meta.width } : {}}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
                {actions && <th className="p-2 text-left" style={{ width: 120 }}>Actions</th>}
              </tr>
            ))}
          </thead>
          <tbody>
            {paginatedRows.map((row: any) => (
              <tr key={row.id} className="border-b hover:bg-accent transition-colors h-10">
                {row.getVisibleCells().map((cell: any) => {
                  const colId = cell.column.id;
                  const isEditing = editingRowId === row.id;
                  const width = cell.column.columnDef.meta?.width;
                  return (
                    <td
                      key={cell.id}
                      className="p-2 h-10 align-middle"
                      style={width ? { width } : {}}
                    >
                        <div className="flex items-center h-8 w-full">
                            {isEditing && cell.column.columnDef.meta?.editable ? (
                                flexRender(cell.column.columnDef.meta?.editComponent, {
                                    ...cell.getContext(),
                                    value: (editingValues as any)[colId],
                                    onChange: (val: any) =>
                                        setEditingValues((prev) => ({ ...prev, [colId]: val })),
                                })
                            ) : (
                                <span
                                    className="h-8 w-full flex items-center px-2 py-0 text-sm font-normal min-w-0 truncate"
                                    style={{ fontFamily: 'inherit', fontSize: 'inherit', fontWeight: 'inherit' }}
                                    onClick={() =>
                                        cell.column.columnDef.meta?.editable ? startEdit(row) : undefined
                                    }
                                >
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </span>
                            )}
                        </div>
                    </td>
                  );
                })}
                {actions && (
                  <td className="p-2" style={{ width: 120 }}>
                    <div className="w-32 flex justify-start">
                      {editingRowId === row.id ? (
                        <div className="flex gap-2 justify-start w-full">
                          <Button size="sm" onClick={() => saveEdit(row)}>Save</Button>
                          <Button size="sm" variant="ghost" onClick={cancelEdit}>Cancel</Button>
                        </div>
                      ) : (
                        <div className="flex justify-start w-full">
                          {actions(row)}
                        </div>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Separator className="my-4" />
      <div className="flex justify-between items-center">
        <div>
          <Button disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>Previous</Button>
          <span className="mx-2">Page {page + 1} of {totalPages || 1}</span>
          <Button disabled={page === totalPages - 1 || totalPages === 0} onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}>Next</Button>
        </div>
      </div>
    </Card>
  );
} 