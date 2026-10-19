import { ReactNode } from "react";
import { Inbox } from "lucide-react";
import { Skeleton } from "./Skeleton";

interface Column<T> {
  header: string;
  accessor: (row: T) => ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyLabel?: string;
  keyExtractor: (row: T) => string;
}

export function Table<T>({ columns, data, isLoading, emptyLabel = "Nothing here yet", keyExtractor }: TableProps<T>) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-400">
          <Inbox className="h-6 w-6" />
        </div>
        <p className="text-sm text-slate-400">{emptyLabel}</p>
      </div>
    );
  }

  const [firstColumn, ...otherColumns] = columns;
  const fieldColumns = otherColumns.filter((col) => col.header);
  const actionColumns = otherColumns.filter((col) => !col.header);

  return (
    <>
      {/* Phones: one card per row, so nothing needs to scroll sideways. */}
      <div className="space-y-3 md:hidden">
        {data.map((row) => (
          <div key={keyExtractor(row)} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="min-w-0 text-sm font-medium text-ink">{firstColumn.accessor(row)}</div>
            {fieldColumns.length > 0 && (
              <dl className="mt-3 space-y-2">
                {fieldColumns.map((col, i) => (
                  <div key={`${col.header}-${i}`} className="flex items-start justify-between gap-4 text-sm">
                    <dt className="shrink-0 pt-0.5 text-xs uppercase tracking-wide text-slate-400">{col.header}</dt>
                    <dd className="min-w-0 break-words text-right text-ink">{col.accessor(row)}</dd>
                  </div>
                ))}
              </dl>
            )}
            {actionColumns.length > 0 && (
              <div className="mt-3 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-3">
                {actionColumns.map((col, i) => (
                  <div key={i}>{col.accessor(row)}</div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Tablets and larger: the regular table. */}
      <div className="hidden overflow-x-auto scrollbar-thin md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              {columns.map((col, i) => (
                <th key={`${col.header}-${i}`} className="whitespace-nowrap px-4 py-3 text-xs font-medium uppercase tracking-wide text-slate-400">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={keyExtractor(row)} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors">
                {columns.map((col, i) => (
                  <td key={`${col.header}-${i}`} className={col.className ?? "px-4 py-3.5 text-ink"}>
                    {col.accessor(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
