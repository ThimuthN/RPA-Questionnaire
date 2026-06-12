export interface DataTableColumn<T> {
  header: string;
  width?: string;
  render: (item: T) => React.ReactNode;
}

export function DataTable<T extends { id: string }>({
  columns,
  data,
  emptyMessage = "No data available"
}: {
  columns: DataTableColumn<T>[];
  data: T[];
  emptyMessage?: string;
}) {
  if (data.length === 0) {
    return (
      <div className="rounded-[24px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-6">
        <p className="text-sm text-[color:var(--app-muted)]">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[24px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] shadow-[var(--app-shadow-soft)]">
      <table className="w-full table-fixed">
          <thead className="border-b border-[color:var(--app-border)] bg-[color:var(--app-table-head)]">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={`${col.width ?? ""} px-5 py-4 text-left text-xs font-medium uppercase tracking-[0.16em] text-[color:var(--app-muted)]`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr
                key={item.id}
                className="border-t border-[color:var(--app-border)] transition hover:bg-[color:var(--app-table-row-hover)]"
              >
                {columns.map((col, idx) => (
                  <td key={idx} className={`${col.width ?? ""} px-5 py-4 align-middle`}>
                    {col.render(item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
    </div>
  );
}
