import { useState, useEffect } from 'react';
import { Pencil, Trash2, Check, X, CheckCircle2, XCircle, AlertCircle, Calendar } from 'lucide-react';
import { formatCHF, formatPercent, formatDate, isoToEuropean, europeanToIso, isValidEuropeanDate } from '../lib/formatters';
import type { RenovationEntry, RenovationCategory } from '../lib/types';

interface EditableEntryRowProps {
  entry: RenovationEntry;
  category: RenovationCategory | undefined;
  categories: RenovationCategory[];
  groupLabels: Record<string, string>;
  grouped: Record<string, RenovationCategory[]>;
  taxYear: number;
  getDeductionInfo: (cat: RenovationCategory | undefined) => {
    isDeductible: boolean;
    percentage: number;
    note: string;
  };
  onSave: (id: string, updates: {
    category_id: string;
    description: string;
    amount: number;
    renovation_date: string;
    is_deductible: boolean;
    deduction_percentage: number;
    deduction_amount: number;
  }) => Promise<void>;
  onDelete: (id: string) => void;
}

export default function EditableEntryRow({
  entry,
  category,
  categories,
  groupLabels,
  grouped,
  taxYear,
  getDeductionInfo,
  onSave,
  onDelete,
}: EditableEntryRowProps) {
  const [editing, setEditing] = useState(false);
  const [editCategoryId, setEditCategoryId] = useState(entry.category_id);
  const [editDescription, setEditDescription] = useState(entry.description);
  const [editAmount, setEditAmount] = useState(String(entry.amount));
  const [editDate, setEditDate] = useState(isoToEuropean(entry.renovation_date));
  const [saving, setSaving] = useState(false);
  const [dateError, setDateError] = useState<string | null>(null);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (editing) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [editing]);

  function validateYear(europeanDate: string): boolean {
    if (!isValidEuropeanDate(europeanDate)) return false;
    const iso = europeanToIso(europeanDate);
    const year = new Date(iso).getFullYear();
    return year === taxYear;
  }

  function handleDateChange(date: string) {
    setEditDate(date);
    if (!isValidEuropeanDate(date)) {
      setDateError('Bitte geben Sie ein gültiges Datum im Format TT.MM.JJJJ ein.');
    } else if (!validateYear(date)) {
      setDateError(`Das Datum muss im Steuerjahr ${taxYear} liegen.`);
    } else {
      setDateError(null);
    }
  }

  function startEdit() {
    setEditCategoryId(entry.category_id);
    setEditDescription(entry.description);
    setEditAmount(String(entry.amount));
    setEditDate(isoToEuropean(entry.renovation_date));
    setDateError(null);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setDateError(null);
  }

  async function saveEdit() {
    if (!editCategoryId || !editAmount) return;

    if (!isValidEuropeanDate(editDate)) {
      setDateError('Bitte geben Sie ein gültiges Datum im Format TT.MM.JJJJ ein.');
      return;
    }

    if (!validateYear(editDate)) {
      setDateError(`Das Datum muss im Steuerjahr ${taxYear} liegen.`);
      return;
    }

    setSaving(true);
    const cat = categories.find(c => c.id === editCategoryId);
    const info = getDeductionInfo(cat);
    const amountNum = parseFloat(editAmount);
    const deductionAmount = info.isDeductible
      ? Math.round(amountNum * info.percentage / 100)
      : 0;

    await onSave(entry.id, {
      category_id: editCategoryId,
      description: editDescription,
      amount: amountNum,
      renovation_date: europeanToIso(editDate),
      is_deductible: info.isDeductible,
      deduction_percentage: info.percentage,
      deduction_amount: deductionAmount,
    });
    setSaving(false);
    setEditing(false);
    setDateError(null);
  }

  if (editing) {
    return (
      <>
        <tr className="bg-amber-50/50">
          <td className="px-6 py-2">
            <select
              value={editCategoryId}
              onChange={e => setEditCategoryId(e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm bg-white text-gray-900 focus:outline-none focus:border-swiss-red"
            >
              {Object.entries(grouped).map(([type, cats]) =>
                cats.length > 0 && (
                  <optgroup key={type} label={groupLabels[type]}>
                    {cats.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </optgroup>
                )
              )}
            </select>
          </td>
          <td className="px-6 py-2">
            <input
              type="text"
              value={editDescription}
              onChange={e => setEditDescription(e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:border-swiss-red"
            />
          </td>
          <td className="px-6 py-2">
            <input
              type="number"
              value={editAmount}
              onChange={e => setEditAmount(e.target.value)}
              min="0"
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm text-gray-900 text-right focus:outline-none focus:border-swiss-red"
            />
          </td>
          <td className="px-6 py-2 text-center">
            <div className="relative inline-block">
              <input
                type="text"
                value={editDate}
                readOnly
                placeholder="TT.MM.JJJJ"
                className={`px-2 py-1.5 pr-8 border rounded text-sm text-gray-900 cursor-pointer focus:outline-none pointer-events-none ${
                  dateError
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:border-swiss-red'
                }`}
              />
              <input
                id={`date-picker-${entry.id}`}
                type="date"
                value={editDate ? europeanToIso(editDate) : ''}
                onChange={e => {
                  if (e.target.value) {
                    handleDateChange(isoToEuropean(e.target.value));
                  }
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <Calendar className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-20" />
            </div>
          </td>
          <td className="px-6 py-2 text-center">
            {(() => {
              const cat = categories.find(c => c.id === editCategoryId);
              const info = getDeductionInfo(cat);
              return info.isDeductible ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3" />
                  {formatPercent(info.percentage)}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
                  <XCircle className="w-3 h-3" />
                  Nein
                </span>
              );
            })()}
          </td>
          <td className="px-6 py-2 text-right">
            {(() => {
              const cat = categories.find(c => c.id === editCategoryId);
              const info = getDeductionInfo(cat);
              const amt = parseFloat(editAmount) || 0;
              const ded = info.isDeductible ? Math.round(amt * info.percentage / 100) : 0;
              return (
                <span className={`text-sm font-medium ${info.isDeductible ? 'text-green-700' : 'text-gray-400'}`}>
                  {info.isDeductible ? formatCHF(ded) : '—'}
                </span>
              );
            })()}
          </td>
          <td className="px-6 py-2">
            <div className="flex items-center gap-1">
              <button
                onClick={saveEdit}
                disabled={saving || !editCategoryId || !editAmount || !!dateError}
                className="p-1 text-green-600 hover:text-green-700 disabled:opacity-50 transition-colors"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={cancelEdit}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </td>
        </tr>
        {dateError && (
          <tr className="bg-amber-50/50">
            <td colSpan={7} className="px-6 py-2">
              <div className="flex items-center gap-1.5 text-sm text-red-600">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{dateError}</span>
              </div>
            </td>
          </tr>
        )}
      </>
    );
  }

  return (
    <tr className="hover:bg-gray-50 transition-colors group">
      <td className="px-6 py-3 text-sm text-gray-900">
        {category?.name ?? '—'}
      </td>
      <td className="px-6 py-3 text-sm text-gray-600 max-w-[200px] truncate">
        {entry.description || '—'}
      </td>
      <td className="px-6 py-3 text-sm text-gray-900 text-right font-medium">
        {formatCHF(entry.amount)}
      </td>
      <td className="px-6 py-3 text-sm text-gray-600 text-center">
        {formatDate(entry.renovation_date)}
      </td>
      <td className="px-6 py-3 text-center">
        {entry.is_deductible ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3" />
            {formatPercent(entry.deduction_percentage)}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
            <XCircle className="w-3 h-3" />
            Nein
          </span>
        )}
      </td>
      <td className="px-6 py-3 text-sm text-right font-medium">
        {entry.is_deductible ? (
          <span className="text-green-700">{formatCHF(entry.deduction_amount)}</span>
        ) : (
          <span className="text-gray-400">—</span>
        )}
      </td>
      <td className="px-6 py-3">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={startEdit}
            className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(entry.id)}
            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
