"use client";
import React, { useState, useMemo } from "react";

// Generic interfaces for any entity
export interface TableColumn<T = Record<string, unknown>> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: unknown, row: T) => React.ReactNode;
  width?: string;
}

export interface TableAction<T = Record<string, unknown>> {
  label: string;
  icon: React.ReactNode;
  onClick: (row: T) => void;
  className?: string;
  title?: string;
}

export interface GenericTableProps<T = Record<string, unknown>> {
  data: T[];
  columns: TableColumn<T>[];
  actions?: TableAction<T>[];
  searchable?: boolean;
  searchPlaceholder?: string;
  searchableColumns?: (keyof T)[];
  selectable?: boolean;
  onSelectionChange?: (selectedIds: string[]) => void;
  exportable?: boolean;
  exportFilename?: string;
  addButton?: {
    label: string;
    onClick: () => void;
  };
  itemsPerPage?: number;
  idField?: keyof T;
}

export default function GenericTable<T extends Record<string, unknown>>({
  data,
  columns,
  actions = [],
  searchable = true,
  searchPlaceholder = "Search...",
  searchableColumns,
  selectable = false,
  onSelectionChange,
  exportable = false,
  exportFilename = "export",
  addButton,
  itemsPerPage = 7,
  idField = "id" as keyof T
}: GenericTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const filteredData = useMemo(() => {
    if (!searchable || !searchTerm) return data;
    
    return data.filter(item => {
      const columnsToSearch = searchableColumns || columns.map(col => col.key);
      return columnsToSearch.some(key => {
        const value = item[key];
        return value?.toString().toLowerCase().includes(searchTerm.toLowerCase());
      });
    });
  }, [data, searchTerm, searchableColumns, columns, searchable]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSelection = e.target.checked 
      ? paginatedData.map(item => item[idField]?.toString() || "")
      : [];
    setSelectedItems(newSelection);
    onSelectionChange?.(newSelection);
  };

  const handleSelectItem = (itemId: string) => {
    const newSelection = selectedItems.includes(itemId)
      ? selectedItems.filter(id => id !== itemId)
      : [...selectedItems, itemId];
    setSelectedItems(newSelection);
    onSelectionChange?.(newSelection);
  };

  const handleExport = () => {
    if (!exportable) return;
    
    const headers = columns.map(col => col.label);
    const csvContent = [
      headers.join(","),
      ...filteredData.map(item => 
        columns.map(col => {
          const value = item[col.key];
          return typeof value === "string" ? `"${value}"` : value;
        }).join(",")
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${exportFilename}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center space-x-4">
          {addButton && (
            <button
              onClick={addButton.onClick}
              className="flex items-center space-x-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>{addButton.label}</span>
            </button>
          )}
          {exportable && (
            <button
              onClick={handleExport}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Export</span>
            </button>
          )}
        </div>
        {selectable && selectedItems.length > 0 && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {selectedItems.length} selected
          </div>
        )}
      </div>

      {/* Search */}
      {searchable && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
            />
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {selectable && (
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedItems.length === paginatedData.length && paginatedData.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key as string}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  style={{ width: column.width }}
                >
                  {column.label}
                </th>
              ))}
              {actions.length > 0 && (
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
            {paginatedData.map((item) => {
              const itemId = item[idField]?.toString() || "";
              return (
                <tr key={itemId} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  {selectable && (
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(itemId)}
                        onChange={() => handleSelectItem(itemId)}
                        className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                      />
                    </td>
                  )}
                                     {columns.map((column) => (
                     <td key={column.key as string} className="px-4 py-4 text-sm text-gray-900 dark:text-white">
                       {column.render ? column.render(item[column.key], item) : String(item[column.key] || "")}
                     </td>
                   ))}
                  {actions.length > 0 && (
                    <td className="px-4 py-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-2">
                        {actions.map((action, index) => (
                          <button
                            key={index}
                            onClick={() => action.onClick(item)}
                            className={action.className || "p-1 text-gray-400 hover:text-brand-500 rounded"}
                            title={action.title}
                          >
                            {action.icon}
                          </button>
                        ))}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredData.length)} of {filteredData.length} results
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
            >
              Previous
            </button>
            <span className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 