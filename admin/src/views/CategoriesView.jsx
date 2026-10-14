import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FolderTree, Plus, Edit2, Trash2, Check, X, Gamepad2 } from 'lucide-react';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../services/api';
import { useAlert } from '../context/AlertContext';

export default function CategoriesView() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const { success, error, confirm } = useAlert();

  const fetchCats = async () => {
    try {
      setLoading(true);
      const res = await getCategories();
      if (res.success) setCategories(res.categories);
    } catch (err) {
      error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCats();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formName) return;
    try {
      await createCategory({ name: formName, description: formDesc });
      setFormName('');
      setFormDesc('');
      setIsAdding(false);
      success(`Category "${formName}" created.`);
      fetchCats();
    } catch (err) {
      error(err.message);
    }
  };

  const handleUpdate = async (id) => {
    try {
      await updateCategory(id, { name: formName, description: formDesc });
      setEditingId(null);
      success(`Category updated.`);
      fetchCats();
    } catch (err) {
      error(err.message);
    }
  };

  const handleDelete = async (id, name) => {
    const ok = await confirm({
      title: 'Delete Category?',
      message: `Are you sure you want to delete category "${name}"? Games assigned will become uncategorized.`,
      confirmText: 'Delete Category',
      type: 'danger'
    });
    if (!ok) return;

    try {
      await deleteCategory(id);
      success(`Category "${name}" removed.`);
      fetchCats();
    } catch (err) {
      error(err.message);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white m-0">Game Categories</h2>
          <p className="text-xs text-slate-400 m-0">Organize games into discoverable genres</p>
        </div>

        <button
          onClick={() => { setIsAdding(true); setFormName(''); setFormDesc(''); }}
          className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Category</span>
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleCreate} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
          <h3 className="text-xs font-bold text-cyan-400">Add New Category</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Category Name (e.g. Strategy & Tower Defense)"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs"
              required
            />
            <input
              type="text"
              placeholder="Description"
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg bg-cyan-600 text-white text-xs font-semibold cursor-pointer"
            >
              Save Category
            </button>
          </div>
        </form>
      )}

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map((c) => (
          <div key={c.id} className="glass-card p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex items-center justify-between">
            {editingId === c.id ? (
              <div className="flex-1 space-y-2 mr-3">
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                />
                <input
                  type="text"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdate(c.id)}
                    className="px-2 py-1 bg-cyan-600 rounded text-[11px] text-white cursor-pointer"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="px-2 py-1 bg-slate-800 rounded text-[11px] text-slate-300 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white m-0">{c.name}</h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-cyan-400 font-mono">
                    {c.game_count || 0} games
                  </span>
                </div>
                <p className="text-xs text-slate-400 m-0 mt-1">{c.description || 'No description'}</p>
              </div>
            )}

            {editingId !== c.id && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => { setEditingId(c.id); setFormName(c.name); setFormDesc(c.description || ''); }}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(c.id, c.name)}
                  className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
