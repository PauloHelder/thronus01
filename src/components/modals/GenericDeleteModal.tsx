import React, { useState } from 'react';
import { X, AlertTriangle, Trash2, Loader2 } from 'lucide-react';

interface GenericDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  itemName?: string;
  itemType: string;
}

const GenericDeleteModal: React.FC<GenericDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  itemType
}) => {
  const [confirmName, setConfirmName] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !itemName) return null;

  const handleConfirm = async () => {
    if (confirmName !== itemName) return;
    
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error(`Error deleting ${itemType}:`, error);
    } finally {
      setLoading(false);
      setConfirmName('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-red-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-red-500/20">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-red-800">Confirmar Exclusão</h2>
              <p className="text-xs text-red-600 font-medium">Esta ação é irreversível</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-red-400 hover:text-red-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
            <p className="text-sm text-slate-600 leading-relaxed">
              Você está prestes a excluir o(a) {itemType} <span className="font-bold text-slate-800">{itemName}</span>. Todos os dados vinculados a este item serão afetados.
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700">
              Para confirmar, digite o nome do(a) {itemType}:
            </label>
            <input
              type="text"
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder={itemName}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-red-500 transition-all text-sm"
              autoComplete="off"
            />
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold transition-all hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={confirmName !== itemName || loading}
            className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <><Trash2 size={18} /> Confirmar Exclusão</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GenericDeleteModal;
