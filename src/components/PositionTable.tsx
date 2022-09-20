import React, { ReactNode } from 'react';

import {
  IKeyable,
  StringColumn,
  NumberColumn,
  TSortableTableChildProps,
  TSortableTableRowProps,
  SortableTable
} from '../lib/SortableTable';
import { DisplayTargetState } from '../types/display';
import { AccountPosition } from '../types/portfolio';
import formatDollas from '../lib/formatDollas';
import { CollapsibleTable, TCollapsibleNestedChildProps } from '../lib/CollapsibleTable';
import { useAppSelector } from '../types/store';
class MoneyColumn<TRow extends IKeyable> extends NumberColumn<TRow> {
  constructor(
    label: string,
    getValue: (r: TRow) => number,
  ) {
    super(label, getValue);
  }

  getFormattedValue(r: TRow): ReactNode {
    return formatDollas(this.getValue(r)); 
  }
}

const NESTED_COLUMNS = [
  new StringColumn<AccountPosition>(
    'Symbol',
    (r) => r.ticker,
  ),
  new MoneyColumn<AccountPosition>(
    'Value',
    (r) => r.value,
  ),
  new MoneyColumn<AccountPosition>(
    'Profit',
    (r) => r.gain,
  ),
  new MoneyColumn<AccountPosition>(
    'Loss',
    (r) => r.loss,
  ),
  new MoneyColumn<AccountPosition>(
    'Net',
    (r) => r.loss + r.gain,
  ),
]

function TargetTableRowFragment({
  row,
  cols,
}: TSortableTableRowProps<DisplayTargetState>) {
  return (
    <React.Fragment>
      {cols.map(c => (
        <td key={c.key} className={c.label === 'Name' ? 'max-w-0 truncate text-left' : 'text-center text-sm w-24'}>
          {c.getFormattedValue(row)}
        </td>
      ))}
    </React.Fragment>
  );
}

function TargetTableFooter({
  rows,
  cols
}: TSortableTableChildProps<DisplayTargetState>) {
  return (
    <tfoot>
      <tr className="bg-gray-200">
        <td key='chevy' />
        {cols.map(c => (
          c.label === 'Name' 
          ? (
            <td key={c.key} className='text-center text-sm font-semibold'>
              Total
            </td>
          ) 
          : (
            <td key={c.key} className='text-center text-sm font-semibold'>
              {c instanceof NumberColumn ? formatDollas(rows.reduce((sum, row) => sum + c.getValue(row), 0)) : '--'}
            </td>
          )
        ))}
      </tr>
  </tfoot>
  )
}

function PositionTableBody({
  rows,
  cols,
}: TSortableTableChildProps<AccountPosition>) {
  return (
    <tbody>
      {rows.map(r => (
        <tr key={r.key}>
          {cols.map(c => (
            <td key={c.key} className={c.label === 'Symbol' ? 'max-w-0 truncate text-sm font-medium pl-2' : 'text-center text-xs w-24'}>
              {c.getFormattedValue(r)}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  )
}

function NestedPositionTable({
  row
}: TCollapsibleNestedChildProps<DisplayTargetState>) {
  if (!row.holdings.length) return null;
  return (
    <SortableTable
      rows={row.holdings}
      cols={NESTED_COLUMNS}
      bodyComponent={PositionTableBody}
    />
  )
}

type TProps = { };
function PositionTable({  }: TProps) {  
  const { total_value, positions } = useAppSelector(({ targets, positions }) => {
    const all_targets = Object.values(targets)
    const portfolio_positions = all_targets.reduce<DisplayTargetState[]>(
      (acc, target) => acc.concat(
        new DisplayTargetState(
          target,
          target.tickers
            .map(t => positions[t])
            .filter((n): n is AccountPosition => n !== undefined)
        )
      ),
      []
    );
    const allocated_tickers = all_targets.reduce<string[]>(
      (acc, next) => acc.concat(next.tickers),
      []
    );
    const unallocated = new DisplayTargetState(
      { key: 'unallocated', tickers: ['unallocated'], name: 'Unallocated Positions', weight: 0 },
      Object.values(positions).filter(p => !~allocated_tickers.indexOf(p.ticker))
    );
    const total_value = Object.values(positions).reduce<number>((sum, p) => sum + p.value, 0);
    return {
      total_value,
      positions: [... portfolio_positions, unallocated]
    };
  });
  
  const TARGET_COLUMNS = [
    new StringColumn<DisplayTargetState>(
      'Name',
      (r) => r.target.name,
    ),
    new MoneyColumn<DisplayTargetState>(
      'Value',
      (r) => r.holdings.reduce<number>((sum, p) => sum + p.value, 0),
    ),
    new MoneyColumn<DisplayTargetState>(
      'Target',
      (r) => r.target.weight * total_value,
    ),
    new MoneyColumn<DisplayTargetState>(
      'Profit',
      (r) => r.holdings.reduce<number>((sum, p) => sum + p.gain, 0),
    ),
    new MoneyColumn<DisplayTargetState>(
      'Loss',
      (r) => r.holdings.reduce<number>((sum, p) => sum + p.loss, 0),
    ),
    new MoneyColumn<DisplayTargetState>(
      'Net',
      (r) => r.holdings.reduce<number>((sum, p) => sum + p.loss + p.gain, 0),
    ),
  ];

  return (
    <CollapsibleTable
      className="table-auto w-full border border-black"
      rows={positions}
      cols={TARGET_COLUMNS}
      fragmentComponent={TargetTableRowFragment}
      nestedComponent={NestedPositionTable}
      footerComponent={TargetTableFooter}
    />
  );
}
export default PositionTable;
