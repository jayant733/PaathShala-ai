import { useState } from 'react';
import { quizApi, downloadBlob } from '../../api/quiz.api';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface ExportMenuProps {
  quizId: string;
  /** Used to build a friendly download filename. */
  quizTitle: string;
  disabled?: boolean;
}

type ExportFormat = 'pdf' | 'docx' | 'json' | 'appsscript' | 'google-forms-json';

const FORMATS: { key: ExportFormat; label: string; desc: string; icon: string; ext: string }[] = [
  { key: 'pdf', label: 'PDF', desc: 'Print-ready document', icon: 'picture_as_pdf', ext: 'pdf' },
  { key: 'docx', label: 'Word', desc: 'Editable Word document', icon: 'description', ext: 'docx' },
  { key: 'json', label: 'JSON', desc: 'Raw quiz data', icon: 'data_object', ext: 'json' },
  { key: 'appsscript', label: 'Google Apps Script', desc: 'Build a Google Form', icon: 'integration_instructions', ext: 'gs' },
  { key: 'google-forms-json', label: 'Google Forms JSON', desc: 'Forms API v1 payload', icon: 'format_list_numbered', ext: 'forms.json' },
];

/** Dropdown that exports a quiz in one of five formats. */
export default function ExportMenu({ quizId, quizTitle, disabled }: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<ExportFormat | null>(null);
  const [error, setError] = useState<string | null>(null);
  const trapRef = useFocusTrap<HTMLDivElement>(open, () => setOpen(false));

  const slug = quizTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'quiz';

  const onExport = async (key: ExportFormat, ext: string) => {
    setBusy(key);
    setError(null);
    try {
      let blob: Blob;
      switch (key) {
        case 'pdf': blob = await quizApi.exportPdf(quizId); break;
        case 'docx': blob = await quizApi.exportDocx(quizId); break;
        case 'json': blob = await quizApi.exportJson(quizId); break;
        case 'appsscript': blob = await quizApi.exportAppsScript(quizId); break;
        case 'google-forms-json': blob = await quizApi.exportGoogleFormsJson(quizId); break;
      }
      downloadBlob(blob, `${slug}.${ext}`);
      setOpen(false);
    } catch (e) {
      setError((e as Error).message || 'Export failed');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="relative" ref={trapRef}>
      <button
        onClick={() => !disabled && setOpen(o => !o)}
        disabled={disabled}
        className="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant/30 bg-surface-container-high px-3 py-2 text-label-md font-label-md text-on-surface transition-colors hover:border-primary/50 disabled:opacity-50"
      >
        <span className="material-symbols-outlined text-[18px]">download</span>
        Export
        <span className="material-symbols-outlined text-[16px]">expand_more</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div
            role="menu"
            aria-label="Export quiz"
            className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-outline-variant/20 bg-surface-container-high p-1.5 shadow-2xl shadow-black/20"
          >
            {error && <p className="px-3 py-2 text-label-sm text-error">{error}</p>}
            {FORMATS.map((f) => (
              <button
                key={f.key}
                role="menuitem"
                disabled={busy !== null}
                onClick={() => onExport(f.key, f.ext)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-surface-container-highest disabled:opacity-50"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-on-primary">
                  {busy === f.key ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  ) : (
                    <span className="material-symbols-outlined text-[18px]">{f.icon}</span>
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block text-label-md font-label-md text-on-surface">{f.label}</span>
                  <span className="block text-label-xs text-on-surface-variant">{f.desc}</span>
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
