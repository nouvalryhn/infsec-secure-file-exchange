'use client';

import * as React from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

interface TableProps extends React.HTMLAttributes<HTMLTableElement> {}

export function Table({ className, ...props }: TableProps) {
  return (
    <div className="relative w-full overflow-auto">
      <table
        className={cn(
          'w-full caption-bottom text-sm border-collapse',
          className
        )}
        {...props}
      />
    </div>
  );
}

interface TableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

export function TableHeader({ className, ...props }: TableHeaderProps) {
  return (
    <thead
      className={cn(
        'bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700',
        className
      )}
      {...props}
    />
  );
}

interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

export function TableBody({ className, ...props }: TableBodyProps) {
  return (
    <tbody
      className={cn(
        'divide-y divide-slate-200 dark:divide-slate-700',
        className
      )}
      {...props}
    />
  );
}

interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  hover?: boolean;
}

export function TableRow({ className, hover = true, ...props }: TableRowProps) {
  return (
    <tr
      className={cn(
        'border-b border-slate-200 dark:border-slate-700 transition-colors',
        hover && 'hover:bg-slate-50 dark:hover:bg-slate-800/50',
        className
      )}
      {...props}
    />
  );
}

interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  sortable?: boolean;
  sortDirection?: 'asc' | 'desc' | null;
  onSort?: () => void;
}

export function TableHead({ 
  className, 
  children, 
  sortable = false,
  sortDirection = null,
  onSort,
  ...props 
}: TableHeadProps) {
  return (
    <th
      className={cn(
        'h-12 px-4 text-left align-middle font-medium text-slate-600 dark:text-slate-400',
        sortable && 'cursor-pointer select-none hover:text-slate-900 dark:hover:text-slate-200',
        className
      )}
      onClick={sortable ? onSort : undefined}
      {...props}
    >
      <div className="flex items-center gap-2">
        {children}
        {sortable && (
          <div className="flex flex-col">
            {sortDirection === null && <ChevronsUpDown className="w-4 h-4" />}
            {sortDirection === 'asc' && <ChevronUp className="w-4 h-4" />}
            {sortDirection === 'desc' && <ChevronDown className="w-4 h-4" />}
          </div>
        )}
      </div>
    </th>
  );
}

interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {}

export function TableCell({ className, ...props }: TableCellProps) {
  return (
    <td
      className={cn(
        'p-4 align-middle text-slate-900 dark:text-slate-100',
        className
      )}
      {...props}
    />
  );
}

interface TableCaptionProps extends React.HTMLAttributes<HTMLTableCaptionElement> {}

export function TableCaption({ className, ...props }: TableCaptionProps) {
  return (
    <caption
      className={cn(
        'mt-4 text-sm text-slate-600 dark:text-slate-400',
        className
      )}
      {...props}
    />
  );
}

// Enhanced Data Table with search and sorting
interface Column<T> {
  key: keyof T;
  header: string;
  sortable?: boolean;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  searchable = false,
  searchPlaceholder = 'Search...',
  emptyMessage = 'No data available',
  className
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [sortConfig, setSortConfig] = React.useState<{
    key: keyof T;
    direction: 'asc' | 'desc';
  } | null>(null);

  // Filter data based on search term
  const filteredData = React.useMemo(() => {
    if (!searchTerm) return data;
    
    return data.filter((row) =>
      Object.values(row).some((value) =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [data, searchTerm]);

  // Sort data
  const sortedData = React.useMemo(() => {
    if (!sortConfig) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredData, sortConfig]);

  const handleSort = (key: keyof T) => {
    setSortConfig((current) => {
      if (current?.key === key) {
        if (current.direction === 'asc') {
          return { key, direction: 'desc' };
        } else {
          return null; // Remove sorting
        }
      } else {
        return { key, direction: 'asc' };
      }
    });
  };

  return (
    <div className={cn('space-y-4', className)}>
      {searchable && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      )}

      <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow hover={false}>
              {columns.map((column) => (
                <TableHead
                  key={String(column.key)}
                  sortable={column.sortable}
                  sortDirection={
                    sortConfig?.key === column.key ? sortConfig.direction : null
                  }
                  onSort={() => column.sortable && handleSort(column.key)}
                  className={column.className}
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.length === 0 ? (
              <TableRow hover={false}>
                <TableCell
                  colSpan={columns.length}
                  className="text-center py-8 text-slate-500 dark:text-slate-400"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              sortedData.map((row, index) => (
                <TableRow key={index}>
                  {columns.map((column) => (
                    <TableCell key={String(column.key)} className={column.className}>
                      {column.render
                        ? column.render(row[column.key], row)
                        : String(row[column.key])}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {searchable && searchTerm && (
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Showing {sortedData.length} of {data.length} results for "{searchTerm}"
        </p>
      )}
    </div>
  );
}