'use client';

import type { Options, ToolOption } from '@/tools/types';
import { SegmentedControl } from './SegmentedControl';

const field = 'rounded-lg border border-border bg-surface px-2.5 py-1.5 text-[13px] outline-none focus:border-accent';

export function OptionsForm({ options, values, onChange }: { options: ToolOption[]; values: Options; onChange: (v: Options) => void }) {
  if (!options.length) return null;
  const set = (key: string, value: string | number | boolean) => onChange({ ...values, [key]: value });

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
      {options.map((o) => (
        <label key={o.key} className="flex items-center gap-2 text-[13px] text-muted">
          {o.type !== 'checkbox' && <span>{o.label}</span>}
          {o.type === 'segmented' && (
            <SegmentedControl label={o.label} value={String(values[o.key])} choices={o.choices} onChange={(v) => set(o.key, v)} />
          )}
          {o.type === 'select' && (
            <select className={field} value={String(values[o.key])} onChange={(e) => set(o.key, e.target.value)}>
              {o.choices.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          )}
          {o.type === 'number' && (
            <input
              type="number"
              className={`${field} w-24`}
              min={o.min}
              max={o.max}
              step={o.step}
              value={Number(values[o.key])}
              onChange={(e) => set(o.key, e.target.value === '' ? 0 : Number(e.target.value))}
            />
          )}
          {o.type === 'range' && (
            <>
              <input type="range" min={o.min} max={o.max} step={o.step} value={Number(values[o.key])} onChange={(e) => set(o.key, Number(e.target.value))} />
              <span className="w-10 tabular-nums text-text">{Number(values[o.key])}</span>
            </>
          )}
          {o.type === 'color' && <input type="color" value={String(values[o.key])} onChange={(e) => set(o.key, e.target.value)} />}
          {o.type === 'text' && (
            <input type="text" className={`${field} w-56`} placeholder={o.placeholder} value={String(values[o.key])} onChange={(e) => set(o.key, e.target.value)} />
          )}
          {o.type === 'checkbox' && (
            <>
              <input type="checkbox" checked={Boolean(values[o.key])} onChange={(e) => set(o.key, e.target.checked)} />
              <span>{o.label}</span>
            </>
          )}
        </label>
      ))}
    </div>
  );
}
