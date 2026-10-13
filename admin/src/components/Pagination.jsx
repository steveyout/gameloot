import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export default function Pagination({
  page = 1,
  totalPages = 1,
  totalItems = 0,
  limit = 10,
  onPageChange,
  onLimitChange,
  limitOptions = [10, 25, 50]
}) {
  if (totalItems === 0) return null;

  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, totalItems);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let start = Math.max(1, page - 2);
      let end = Math.min(totalPages, page + 2);

      if (page <= 3) {
        start = 1;
        end = maxVisible;
      } else if (page >= totalPages - 2) {
        start = totalPages - (maxVisible - 1);
        end = totalPages;
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-3 px-4 bg-slate-950/40 rounded-xl border border-slate-800 text-xs text-slate-400">
      {/* Left: Summary & items per page */}
      <div className="flex items-center gap-3">
        <span>
          Showing <span className="font-semibold text-white">{startItem}</span> to{' '}
          <span className="font-semibold text-white">{endItem}</span> of{' '}
          <span className="font-semibold text-white">{totalItems}</span> records
        </span>

        {onLimitChange && (
          <div className="flex items-center gap-1.5 pl-3 border-l border-slate-800">
            <span className="text-[11px] text-slate-500">Per page:</span>
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-white text-[11px] focus:outline-none focus:border-cyan-500"
            >
              {limitOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right: Page buttons */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={page <= 1}
          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-slate-900 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer disabled:cursor-not-allowed"
          title="First Page"
        >
          <ChevronsLeft className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-slate-900 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer disabled:cursor-not-allowed"
          title="Previous Page"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {pages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            className={`min-w-[28px] h-7 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              p === page
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm shadow-cyan-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800 hover:bg-slate-800'
            }`}
          >
            {p}
          </button>
        ))}

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-slate-900 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer disabled:cursor-not-allowed"
          title="Next Page"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={page >= totalPages}
          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-slate-900 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer disabled:cursor-not-allowed"
          title="Last Page"
        >
          <ChevronsRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
