import type { RegionResponse } from '@/store/types';

/** Toggleable chips for picking delivery regions (marzes). */
function RegionPicker({
  regions,
  value,
  onChange,
  disabled,
}: {
  regions: RegionResponse[];
  value: number[];
  onChange: (next: number[]) => void;
  disabled?: boolean;
}) {
  const toggle = (id: number) => onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  const all = regions.length > 0 && regions.every((r) => value.includes(r.id));

  return (
    <div className="st-chips">
      <button
        type="button"
        className={`st-chip${all ? ' st-chip--on' : ''}`}
        disabled={disabled}
        onClick={() => onChange(all ? [] : regions.map((r) => r.id))}
      >
        {all ? 'Հանել բոլորը' : 'Ամբողջ Հայաստան'}
      </button>
      {regions.map((r) => (
        <button
          key={r.id}
          type="button"
          className={`st-chip${value.includes(r.id) ? ' st-chip--on' : ''}`}
          aria-pressed={value.includes(r.id)}
          disabled={disabled}
          onClick={() => toggle(r.id)}
        >
          {r.name}
        </button>
      ))}
    </div>
  );
}

export default RegionPicker;
