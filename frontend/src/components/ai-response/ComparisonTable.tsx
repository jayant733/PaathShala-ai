import { Columns3 } from 'lucide-react';
import type { ComparisonData } from './types';

/** Side-by-side comparison table (e.g. React vs Next.js). */
export default function ComparisonTable({ comparison }: { comparison: ComparisonData }) {
  if (!comparison?.columns?.length || !comparison?.rows?.length) return null;

  const numCols = comparison.columns.length;
  const highlight = Math.min(1, numCols - 1); // highlight first feature column

  return (
    <div className="overflow-x-auto rounded-2xl border border-surface-container-highest/40">
      <h4 className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant flex items-center gap-2 px-4 pt-3">
        <Columns3 className="w-4 h-4 text-primary" /> Comparison
      </h4>
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-surface-container-highest/30 bg-surface-container-high/40">
            {comparison.columns.map((col, i) => (
              <th
                key={i}
                className={`px-4 py-3 font-label-md text-label-md ${i === highlight ? 'text-primary' : 'text-on-surface-variant'}`}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {comparison.rows.map((row, r) => (
            <tr key={r} className="border-b border-surface-container-highest/10 last:border-0 hover:bg-surface-container-high/30 transition-colors">
              {row.map((cell, c) => (
                <td
                  key={c}
                  className={`px-4 py-3 font-body-sm text-body-sm ${c === highlight ? 'text-on-surface font-medium' : 'text-on-surface-variant'}`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
