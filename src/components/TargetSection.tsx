import { useState } from 'react';
import { useAppSelector, useAppDispatch } from '../data/store';
import { TargetPosition, removeTarget, saveTarget } from '../data/targets';
import TargetRow from './TargetRow';
import { TargetEditor } from './TargetEditor';

type TProps = {
};
function TargetSection({}: TProps) {
  const targets = useAppSelector(
    ({ targets }) => Object.values(targets).sort((a, b) => b.weight - a.weight)
  );
  const dispatch = useAppDispatch();
  const [selected, setSelected] = useState<TargetPosition | undefined>(undefined);
  return (
    <div>
      <div className="flex flex-row items-center py-2 px-4">
        <h1 className="flex-1 text-lg font-bold">Targets</h1>
      </div>
      <TargetEditor 
        target={selected} 
        saveTarget={t => { 
          dispatch(saveTarget(t))
          setSelected(undefined)
        }}
        clearTarget={() => setSelected(undefined)}
      />
      <ul className="border border-gray-500">
        {targets.map((p) => (
          <TargetRow
            key={p.key}
            target={p}
            onSelectTarget={setSelected}
            onDeleteTarget={t => dispatch(removeTarget(t))}
          />
        ))}
      </ul>
    </div>
  );
}

export default TargetSection;
