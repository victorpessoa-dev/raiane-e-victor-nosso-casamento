'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Download, Eye, EyeOff, Loader as Loader2, RefreshCw, Search, Trash2, Video, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { MediaLightbox } from '@/components/admin/media-lightbox';
import { formatDateTime } from '@/lib/format';

function DeleteDialog({ count, loading, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl animate-slide-up sm:p-8">
        <h3 className="mb-2 font-playfair text-xl text-burgundy-800">Confirmar exclusao</h3>
        <p className="mb-6 font-lato text-sm text-muted-foreground">
          Voce esta prestes a excluir <strong>{count}</strong> arquivo{count > 1 ? 's' : ''}. Esta acao nao pode ser desfeita.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-full border border-zinc-200 py-2.5 font-lato text-sm text-burgundy-700 transition-colors hover:bg-zinc-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-red-600 py-2.5 font-lato text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
}

function MediaCard({ item, selected, togglingId, onDownload, onPreview, onSelect, onToggleVisibility }) {
  const isToggling = togglingId === item.id;

  return (
    <div
      className={`group relative cursor-pointer overflow-hidden rounded-xl border transition-all ${selected
        ? 'border-burgundy-500 ring-2 ring-burgundy-300 shadow-lg'
        : 'border-zinc-200 hover:border-burgundy-300 hover:shadow-md'
        }`}
    >
      <div className="relative aspect-square bg-white" onClick={() => onPreview(item)}>
        {item.fileType === 'image' ? (
          <img
            src={item.signedUrl}
            alt={item.fileName}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-burgundy-400">
            <Video size={40} strokeWidth={1.5} />
          </div>
        )}

        {item.isVisible ? (
          <div className="absolute left-2 top-2 rounded-full bg-green-500 p-1.5 text-white shadow-md">
            <Eye size={12} />
          </div>
        ) : null}

        <div className="absolute inset-0 flex items-center justify-center gap-3 bg-black/0 opacity-0 transition-all group-hover:bg-black/30 group-hover:opacity-100">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onPreview(item);
            }}
            className="rounded-full bg-white/90 p-2 transition-colors hover:bg-white"
          >
            <Eye size={16} className="text-burgundy-800" />
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onDownload(item);
            }}
            className="rounded-full bg-white/90 p-2 transition-colors hover:bg-white"
          >
            <Download size={16} className="text-burgundy-800" />
          </button>
        </div>
      </div>

      <div
        className="absolute right-2 top-2"
        onClick={(event) => {
          event.stopPropagation();
          onSelect(item.id);
        }}
      >
        <div
          className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-all ${selected
            ? 'border-burgundy-800 bg-burgundy-800'
            : 'border-white/80 bg-white/80 group-hover:border-burgundy-400'
            }`}
        >
          {selected ? (
            <svg viewBox="0 0 12 10" className="h-3 w-3 fill-none stroke-white stroke-2">
              <polyline points="1,5 4,8 11,1" />
            </svg>
          ) : null}
        </div>
      </div>

      <div className="border-t border-zinc-100 bg-white p-3">
        {item.uploaderName ? (
          <p className="mb-1 truncate font-lato text-xs font-semibold text-burgundy-800">{item.uploaderName}</p>
        ) : null}
        <p className="mb-2 truncate font-lato text-xs text-muted-foreground">{formatDateTime(item.createdAt)}</p>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onToggleVisibility(item.id, !item.isVisible);
          }}
          disabled={isToggling}
          className={`flex w-full items-center justify-center gap-1.5 rounded-lg py-1.5 font-lato text-xs font-semibold transition-all disabled:opacity-50 ${item.isVisible
            ? 'bg-green-100 text-green-700 hover:bg-green-200'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
        >
          {isToggling ? (
            <Loader2 size={12} className="animate-spin" />
          ) : item.isVisible ? (
            <>
              <Eye size={12} />
              Visivel
            </>
          ) : (
            <>
              <EyeOff size={12} />
              Oculta
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export function AdminDashboard() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [preview, setPreview] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [togglingId, setTogglingId] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/media', { cache: 'no-store' });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || 'Falha ao carregar arquivos.');
      }

      setItems(Array.isArray(payload.items) ? payload.items : []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Falha ao carregar arquivos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchesFilter =
        filter === 'all' ? true :
        filter === 'image' ? item.fileType === 'image' :
        filter === 'video' ? item.fileType === 'video' :
        filter === 'visible' ? item.isVisible :
        filter === 'hidden' ? !item.isVisible :
        true;

      const query = search.trim().toLowerCase();
      const matchesSearch = !query ||
        item.uploaderName?.toLowerCase().includes(query) ||
        item.message?.toLowerCase().includes(query) ||
        item.fileName?.toLowerCase().includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [filter, items, search]);

  const selectedCount = selected.size;
  const visibleCount = items.filter((item) => item.isVisible).length;
  const allVisibleSelected = filtered.length > 0 && filtered.every((item) => selected.has(item.id));

  const toggleSelect = (id) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    const ids = filtered.map((item) => item.id);

    setSelected((current) => {
      const next = new Set(current);
      if (ids.every((id) => next.has(id))) {
        ids.forEach((id) => next.delete(id));
      } else {
        ids.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const handleToggleVisibility = async (id, isVisible) => {
    setTogglingId(id);
    try {
      const response = await fetch(`/api/admin/media/${id}/visibility`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVisible }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || 'Falha ao atualizar visibilidade.');
      }

      setItems((current) => current.map((item) => (
        item.id === id ? { ...item, isVisible } : item
      )));
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : 'Falha ao atualizar visibilidade.');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget?.length) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch('/api/admin/media', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: deleteTarget }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || 'Falha ao excluir arquivos.');
      }

      setItems((current) => current.filter((item) => !deleteTarget.includes(item.id)));
      setSelected((current) => {
        const next = new Set(current);
        deleteTarget.forEach((id) => next.delete(id));
        return next;
      });
      setDeleteTarget(null);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Falha ao excluir arquivos.');
    } finally {
      setDeleting(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } finally {
      router.replace('/admin/login');
      router.refresh();
      setLoggingOut(false);
    }
  };

  const downloadSelected = () => {
    items.filter((item) => selected.has(item.id)).forEach((item) => {
      window.open(item.downloadUrl || item.signedUrl, '_blank', 'noopener,noreferrer');
    });
  };

  return (
    <div
      className="min-h-screen"
      style={{ background: 'linear-gradient(160deg, #faf8f5 0%, #fdf2f4 50%, #faf8f5 100%)' }}
    >
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4 sm:py-4">
          <Link href="/" className="flex min-w-0 items-center gap-3 transition-opacity hover:opacity-80">
            <Image src="/brasao 2x bg.png" alt="R&V" width={36} height={42} className="object-contain" />
            <div className="min-w-0">
              <h1 className="font-playfair text-lg leading-tight text-burgundy-800">Galeria - R &amp; V</h1>
              <p className="truncate font-lato text-xs text-muted-foreground">{items.length} arquivos - {visibleCount} visiveis</p>
            </div>
          </Link>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={loadItems}
              className="rounded-lg p-2 text-burgundy-600 transition-colors hover:bg-zinc-50"
              title="Atualizar"
            >
              <RefreshCw size={16} />
            </button>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="rounded-full border border-zinc-200 px-3 py-1.5 font-lato text-xs text-burgundy-700 transition-colors hover:bg-zinc-50 disabled:opacity-50"
            >
              {loggingOut ? 'Saindo...' : 'Sair'}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-5 sm:py-6">
        <div className="mb-5 flex flex-col gap-3 sm:mb-6">
          <div className="relative min-w-0 flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nome ou mensagem..."
              className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-9 pr-4 font-lato text-sm transition focus:outline-none focus:ring-2 focus:ring-burgundy-300"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'image', label: 'Fotos' },
              { id: 'video', label: 'Videos' },
              { id: 'visible', label: 'Visiveis' },
              { id: 'hidden', label: 'Ocultas' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                className={`rounded-full px-3 py-2 font-lato text-xs font-semibold transition-all ${filter === item.id
                  ? 'bg-burgundy-800 text-white shadow-md'
                  : 'border border-zinc-200 bg-white text-burgundy-700 hover:border-burgundy-300'
                  }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {error ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-lato text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {selectedCount > 0 ? (
          <div className="mb-4 flex flex-col gap-3 rounded-xl bg-burgundy-800 px-4 py-3 text-white shadow-lg animate-slide-up sm:flex-row sm:items-center">
            <span className="font-lato text-sm sm:flex-1">
              {selectedCount} selecionado{selectedCount > 1 ? 's' : ''}
            </span>
            <div className="flex flex-wrap gap-2 sm:justify-end">
              <button
                type="button"
                onClick={downloadSelected}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-white/20 px-3 py-2 font-lato text-sm transition-all hover:bg-white/30 sm:flex-none"
              >
                <Download size={14} />
                Baixar
              </button>
              <button
                type="button"
                onClick={() => setDeleteTarget(Array.from(selected))}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-red-500/80 px-3 py-2 font-lato text-sm transition-all hover:bg-red-500 sm:flex-none"
              >
                <Trash2 size={14} />
                Excluir
              </button>
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                className="rounded-lg p-2 transition-colors hover:bg-white/20"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        ) : null}

        {filtered.length > 0 ? (
          <div className="mb-4 flex items-center gap-2">
            <button
              type="button"
              onClick={toggleSelectAll}
              className="flex items-center gap-2 font-lato text-sm text-burgundy-700 transition-colors hover:text-burgundy-900"
            >
              <div className={`flex h-4 w-4 items-center justify-center rounded border-2 transition-colors ${allVisibleSelected ? 'border-burgundy-800 bg-burgundy-800' : 'border-burgundy-400'}`}>
                {allVisibleSelected ? (
                  <svg viewBox="0 0 12 10" className="h-2.5 w-2.5 fill-none stroke-white stroke-2">
                    <polyline points="1,5 4,8 11,1" />
                  </svg>
                ) : null}
              </div>
              {allVisibleSelected ? 'Desmarcar todos' : 'Selecionar todos'}
            </button>
            <span className="font-lato text-sm text-muted-foreground">({filtered.length})</span>
          </div>
        ) : null}

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={32} className="animate-spin text-burgundy-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-24 text-center">
            <Video size={48} className="mx-auto mb-4 text-zinc-300" strokeWidth={1.5} />
            <p className="mb-2 font-playfair text-xl text-burgundy-700">Nenhum arquivo encontrado</p>
            <p className="font-lato text-sm text-muted-foreground">
              {items.length === 0 ? 'Os convidados ainda nao enviaram fotos.' : 'Tente mudar os filtros.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {filtered.map((item) => (
              <MediaCard
                key={item.id}
                item={item}
                selected={selected.has(item.id)}
                togglingId={togglingId}
                onDownload={(mediaItem) => window.open(mediaItem.downloadUrl || mediaItem.signedUrl, '_blank', 'noopener,noreferrer')}
                onPreview={setPreview}
                onSelect={toggleSelect}
                onToggleVisibility={handleToggleVisibility}
              />
            ))}
          </div>
        )}
      </main>

      {preview ? <MediaLightbox item={preview} onClose={() => setPreview(null)} /> : null}
      {deleteTarget ? (
        <DeleteDialog
          count={deleteTarget.length}
          loading={deleting}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      ) : null}
    </div>
  );
}
