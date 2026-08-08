import { useEffect, useState } from 'react';
import { X, Plus, Trash2, ArrowUp, ArrowDown, Pencil, Check, Cpu, Cloud, Loader2 } from 'lucide-react';
import { routingApi, type RoutingRule, type RoutingRuleInput, type RoutingConditionType } from '../../api/routing.api';
import { useAIStore } from '../../store/aiStore';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface RoutingTableProps {
  open: boolean;
  onClose: () => void;
}

const CONDITION_LABELS: Record<RoutingConditionType, string> = {
  message_contains: 'Message contains',
  message_regex: 'Message matches regex',
  always: 'Always',
};

export default function RoutingTable({ open, onClose }: RoutingTableProps) {
  const health = useAIStore(state => state.health);
  const fetchHealth = useAIStore(state => state.fetchHealth);

  const [rules, setRules] = useState<RoutingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Add/edit form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<RoutingRuleInput>({
    name: '',
    condition_type: 'message_contains',
    condition_value: '',
    provider: 'gemini',
    model: null,
    enabled: true,
  });

  const localModels = health?.ollama?.models ?? [];

  const loadRules = async () => {
    setLoading(true);
    try {
      const data = await routingApi.list();
      setRules(data);
    } catch (e) {
      console.error('Failed to load routing rules', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchHealth();
      loadRules();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const resetForm = () => {
    setEditingId(null);
    setForm({
      name: '',
      condition_type: 'message_contains',
      condition_value: '',
      provider: 'gemini',
      model: null,
      enabled: true,
    });
  };

  const startEdit = (rule: RoutingRule) => {
    setEditingId(rule.id);
    setForm({
      name: rule.name,
      condition_type: rule.condition_type,
      condition_value: rule.condition_value ?? '',
      provider: rule.provider,
      model: rule.model,
      enabled: rule.enabled,
    });
  };

  const handleSubmit = async () => {
    if (form.condition_type !== 'always' && !form.condition_value?.trim()) return;
    const payload: RoutingRuleInput = {
      ...form,
      condition_value: form.condition_type === 'always' ? null : form.condition_value?.trim() || null,
    };
    setSaving(true);
    try {
      if (editingId) {
        await routingApi.update(editingId, payload);
      } else {
        await routingApi.create(payload);
      }
      resetForm();
      await loadRules();
    } catch (e) {
      console.error('Failed to save routing rule', e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await routingApi.delete(id);
      setRules(prev => prev.filter(r => r.id !== id));
    } catch (e) {
      console.error('Failed to delete routing rule', e);
    }
  };

  const handleToggle = async (rule: RoutingRule) => {
    try {
      const updated = await routingApi.update(rule.id, { enabled: !rule.enabled });
      setRules(prev => prev.map(r => (r.id === rule.id ? updated : r)));
    } catch (e) {
      console.error('Failed to update routing rule', e);
    }
  };

  const move = async (index: number, direction: -1 | 1) => {
    const next = [...rules];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setRules(next);
    try {
      await routingApi.reorder(next.map(r => r.id));
    } catch (e) {
      console.error('Failed to reorder routing rules', e);
      await loadRules();
    }
  };

  const targetLabel = (rule: RoutingRule) =>
    rule.provider === 'gemini' ? 'Gemini (Cloud)' : `${rule.model || 'Local model'} (Local)`;

  const panelRef = useFocusTrap<HTMLDivElement>(open, onClose);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="routing-table-title"
        className="w-full max-w-4xl max-h-[85vh] flex flex-col bg-surface-container-low rounded-2xl shadow-2xl border border-surface-container-highest/20"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-container-highest/30">
          <div>
            <h3 id="routing-table-title" className="font-title-md text-title-md text-on-surface flex items-center gap-2">
              <Cpu className="w-5 h-5 text-primary" /> Model Routing Table
            </h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
              In Auto mode, rules are checked top to bottom. The first match decides which model runs. No match → Gemini (with local fallback).
            </p>
          </div>
          <button onClick={onClose} aria-label="Close routing table" className="w-8 h-8 rounded-full hover:bg-surface-container-highest flex items-center justify-center text-on-surface-variant transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Add / edit form */}
          <div className="bg-surface-container rounded-xl p-4 border border-outline-variant/10 space-y-4">
            <div className="flex items-center gap-3">
              <h4 className="font-label-md text-label-md text-on-surface font-semibold">{editingId ? 'Edit rule' : 'New rule'}</h4>
              {editingId && (
                <button onClick={resetForm} className="text-xs text-on-surface-variant hover:text-primary">Cancel edit</button>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <label className="flex flex-col gap-1 col-span-2">
                <span className="font-label-sm text-label-sm text-on-surface-variant">Name (optional)</span>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="bg-surface-container-highest rounded-lg px-3 py-2 text-body-sm text-on-surface border border-outline-variant/20 focus:ring-1 focus:ring-primary outline-none"
                  placeholder="e.g. Coding questions"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="font-label-sm text-label-sm text-on-surface-variant">Condition</span>
                <select
                  value={form.condition_type}
                  onChange={e => setForm(f => ({ ...f, condition_type: e.target.value as RoutingConditionType }))}
                  className="bg-surface-container-highest rounded-lg px-3 py-2 text-body-sm text-on-surface border border-outline-variant/20 focus:ring-1 focus:ring-primary outline-none"
                >
                  <option value="message_contains">Message contains</option>
                  <option value="message_regex">Regex match</option>
                  <option value="always">Always</option>
                </select>
              </label>

              <label className="flex flex-col gap-1 col-span-2">
                <span className="font-label-sm text-label-sm text-on-surface-variant">Value {form.condition_type === 'always' ? '(ignored)' : ''}</span>
                <input
                  value={form.condition_value ?? ''}
                  disabled={form.condition_type === 'always'}
                  onChange={e => setForm(f => ({ ...f, condition_value: e.target.value }))}
                  className="bg-surface-container-highest rounded-lg px-3 py-2 text-body-sm text-on-surface border border-outline-variant/20 focus:ring-1 focus:ring-primary outline-none disabled:opacity-40"
                  placeholder={form.condition_type === 'always' ? '—' : 'e.g. explain, code, poem'}
                />
              </label>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <label className="flex flex-col gap-1">
                <span className="font-label-sm text-label-sm text-on-surface-variant">Provider</span>
                <select
                  value={form.provider}
                  onChange={e => {
                    const provider = e.target.value as 'gemini' | 'ollama';
                    setForm(f => ({ ...f, provider, model: provider === 'gemini' ? null : (localModels[0] || null) }));
                  }}
                  className="bg-surface-container-highest rounded-lg px-3 py-2 text-body-sm text-on-surface border border-outline-variant/20 focus:ring-1 focus:ring-primary outline-none"
                >
                  <option value="gemini">Gemini (Cloud)</option>
                  <option value="ollama">Ollama (Local)</option>
                </select>
              </label>

              {form.provider === 'ollama' ? (
                <label className="flex flex-col gap-1 col-span-2">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Local model</span>
                  <select
                    value={form.model ?? ''}
                    onChange={e => setForm(f => ({ ...f, model: e.target.value || null }))}
                    className="bg-surface-container-highest rounded-lg px-3 py-2 text-body-sm text-on-surface border border-outline-variant/20 focus:ring-1 focus:ring-primary outline-none"
                  >
                    <option value="">Default local model</option>
                    {localModels.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </label>
              ) : (
                <div className="col-span-2 flex items-end pb-2 text-body-sm text-on-surface-variant">
                  <Cloud className="w-4 h-4 mr-2 text-blue-400" /> Uses your default Gemini model
                </div>
              )}

              <div className="flex items-end">
                <button
                  onClick={handleSubmit}
                  disabled={saving || (form.condition_type !== 'always' && !form.condition_value?.trim())}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-on-primary text-label-md font-semibold hover:bg-primary-container transition-colors disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {editingId ? 'Save' : 'Add rule'}
                </button>
              </div>
            </div>
          </div>

          {/* Rules table */}
          <div className="bg-surface-container rounded-xl overflow-hidden border border-outline-variant/10">
            {loading ? (
              <div className="flex items-center justify-center p-10 text-on-surface-variant">
                <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading routing rules...
              </div>
            ) : rules.length === 0 ? (
              <div className="p-10 text-center">
                <Cpu className="w-8 h-8 text-on-surface-variant/40 mx-auto mb-2" />
                <p className="font-body-sm text-body-sm text-on-surface-variant">No routing rules yet. Add one above to control which model runs in Auto mode.</p>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="text-label-sm text-on-surface-variant uppercase tracking-wider border-b border-surface-container-highest/30">
                    <th className="px-4 py-2.5 w-16">Order</th>
                    <th className="px-4 py-2.5">Condition</th>
                    <th className="px-4 py-2.5">Target</th>
                    <th className="px-4 py-2.5 w-20 text-center">On</th>
                    <th className="px-4 py-2.5 w-32 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map((rule, i) => (
                    <tr key={rule.id} className={`border-b border-surface-container-highest/10 ${!rule.enabled ? 'opacity-50' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => move(i, -1)}
                            disabled={i === 0}
                            className="p-1 rounded hover:bg-surface-container-highest text-on-surface-variant disabled:opacity-30"
                            title="Move up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => move(i, 1)}
                            disabled={i === rules.length - 1}
                            className="p-1 rounded hover:bg-surface-container-highest text-on-surface-variant disabled:opacity-30"
                            title="Move down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-label-sm text-label-sm text-on-surface-variant bg-surface-container-highest px-2 py-0.5 rounded">
                            {CONDITION_LABELS[rule.condition_type]}
                          </span>
                          <span className="font-body-sm text-body-sm text-on-surface">
                            {rule.condition_type === 'always' ? 'All messages' : <code className="font-mono text-primary">{rule.condition_value}</code>}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-body-sm text-body-sm inline-flex items-center gap-1.5 ${rule.provider === 'gemini' ? 'text-blue-400' : 'text-green-400'}`}>
                          {rule.provider === 'gemini' ? <Cloud className="w-3.5 h-3.5" /> : <Cpu className="w-3.5 h-3.5" />}
                          {targetLabel(rule)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleToggle(rule)}
                          className={`w-9 h-5 rounded-full relative transition-colors ${rule.enabled ? 'bg-primary' : 'bg-surface-container-highest'}`}
                          title={rule.enabled ? 'Disable' : 'Enable'}
                        >
                          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${rule.enabled ? 'left-4' : 'left-0.5'}`} />
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => startEdit(rule)} className="p-1.5 rounded hover:bg-surface-container-highest text-on-surface-variant hover:text-primary transition-colors" title="Edit">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(rule.id)} className="p-1.5 rounded hover:bg-surface-container-highest text-on-surface-variant hover:text-error transition-colors" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="px-6 py-3 border-t border-surface-container-highest/30 flex items-center justify-between">
          <span className="font-body-sm text-body-sm text-on-surface-variant">
            {health?.ollama?.status === 'healthy' ? `${localModels.length} local model(s) available` : 'Ollama offline — local rules won\'t work until it runs'}
          </span>
          <button onClick={onClose} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-container-highest text-on-surface text-label-md hover:bg-primary/10 transition-colors">
            <Check className="w-4 h-4" /> Done
          </button>
        </div>
      </div>
    </div>
  );
}
