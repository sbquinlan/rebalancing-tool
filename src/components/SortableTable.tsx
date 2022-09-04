import React, { ReactNode, useState } from "react";
import { Down, Up } from "./icons";

export type IKeyableRow = { key: string }

export interface TableColumn<TRow extends IKeyableRow> {
  sort(a: TRow, b: TRow): number;
  renderHeader(sort_direction?: (1 | -1 | undefined), props?: React.ThHTMLAttributes<HTMLTableCellElement>): ReactNode;
  renderCell(r: TRow, props?: React.TdHTMLAttributes<HTMLTableCellElement>): ReactNode;
  renderFooter(rs: TRow[], props?: React.TdHTMLAttributes<HTMLTableCellElement>): ReactNode;
}

export class CustomColumn<TRow extends IKeyableRow> implements TableColumn<TRow> {
  constructor(
    private readonly _renderHeader?: (sort_direction?: (1 | -1 | undefined), _props?: React.ThHTMLAttributes<HTMLTableCellElement>) => ReactNode,
    private readonly _renderCell?: (r: TRow, props?: React.TdHTMLAttributes<HTMLTableCellElement>) => ReactNode,
    private readonly _renderFooter?: (rs: TRow[], props?: React.TdHTMLAttributes<HTMLTableCellElement>) => ReactNode,
    private readonly _sort?: (a: TRow, b: TRow) => number,
  ) {}

  sort(a: TRow, b: TRow): number {
    return this._sort ? this._sort(a, b) : 0;
  }

  renderHeader(sort_direction?: (1 | -1 | undefined), props?: React.ThHTMLAttributes<HTMLTableCellElement>): React.ReactNode {
    return this._renderHeader ? this._renderHeader(sort_direction, props) : undefined;
  }

  renderCell(r: TRow, props?: React.TdHTMLAttributes<HTMLTableCellElement>) { 
    return this._renderCell ? this._renderCell(r, props) : undefined;
  }

  renderFooter(rs: TRow[], props?: React.TdHTMLAttributes<HTMLTableCellElement>): ReactNode {
    return this._renderFooter ? this._renderFooter(rs, props) : undefined;
  }
}

export class ValueColumn<TRow extends IKeyableRow, TVal extends ReactNode>implements TableColumn<TRow> {
  constructor(
    protected readonly header: string,
    protected readonly footer: string,
    protected readonly getValue: (r: TRow) => TVal,
    protected readonly _valSort: (a: TVal, b: TVal) => number,
    protected readonly headerClassname: string = '',
    protected readonly rowClassname: string = '',
  ) {}

  sort(a: TRow, b: TRow) {
    return this._valSort(this.getValue(a), this.getValue(b));
  }

  renderHeader(sort_direction?: (1 | -1 | undefined), props?: React.ThHTMLAttributes<HTMLTableCellElement>): ReactNode {
    return (
      <th className={this.headerClassname} {... props} key={this.header}>
        {this.header}
        {
          sort_direction === 1 
            ? <Down className="inline-block w-5 h-5"/> 
            : (sort_direction === -1 ? <Up className="inline-block w-5 h-5"/> : undefined)
        }
      </th>
    );
  }

  renderCell(r: TRow, props?: React.TdHTMLAttributes<HTMLTableCellElement>): ReactNode {
    return (
      <td className={this.rowClassname} {... props} key={`${this.header}_${r.key}`}>
        {this.getValue(r)}
      </td>
    );
  }

  renderFooter(rs: TRow[], props?: React.TdHTMLAttributes<HTMLTableCellElement>): ReactNode {
    return (
      <td {... props} key={this.header}>
        {this.footer}
      </td>
    );
  }
}

export function TableHeader({ children, ... rest }: React.PropsWithChildren & React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead { ... rest }><tr>{children}</tr></thead>;
}

type Sorter<TRow> = (a: TRow, b: TRow) => number;
export type TSortableProps<TRow extends IKeyableRow> = {
  cols: TableColumn<TRow>[],
  onSortChange: (s: Sorter<TRow>) => void,
}
export function SortableTableHeader<TRow extends IKeyableRow>(
  { cols, onSortChange, ... rest }: TSortableProps<TRow> & React.HTMLAttributes<HTMLTableSectionElement>
) {
  const [[dir, col], setSort] = useState<[1 | -1, number | undefined]>([1, undefined]);
  function toggleSort(new_col: number) {
    const new_dir = col === new_col ? -dir : 1;
    setSort([new_dir as (1 | -1), new_col]);
    onSortChange((a, b) => new_dir * (new_col !== undefined ? cols[new_col].sort(a, b) : 0));
  }
  return (
    <TableHeader { ... rest }>
      {cols.map((c, i) => c.renderHeader(i === col ? dir : undefined, { onClick: () => toggleSort(i) }))}
    </TableHeader>
  )
}

export type TSortableTableProps<TRow extends IKeyableRow> = {
  rows: TRow[],
  cols: TableColumn<TRow>[],
}
export function SortableTable<TRow extends IKeyableRow>({ rows, cols }: TSortableTableProps<TRow>) {
  const [sorter, setSorter] = useState(
    () => ((_a: TRow, _b: TRow) => 0)
  );
  return (
    <table className='w-full table-auto bg-gray-100 border-y-2'>
      <SortableTableHeader className="text-xs"
        cols={cols} 
        onSortChange={(s) => setSorter(() => s)} 
      />
      <tbody>
        {rows.sort(sorter).map(
          r => <tr key={r.key}>{cols.map(c => c.renderCell(r))}</tr>
        )}
      </tbody>
    </table>
  )
}