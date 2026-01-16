import React, { useState, useMemo } from 'react';
import './NonStock.scss';
import AddNonStockModal from './AddNonStockModal';

export default function NonStock({ isOpen = false, onClose = () => {} }) {
  // start with no sample data
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const filtered = useMemo(() => items.filter(it => it.name.toLowerCase().includes(query.toLowerCase())), [items, query]);

  if (!isOpen) return null;

  function handleDelete(id) {
    if (!confirm('Delete this non-stock item?')) return;
    setItems(prev => prev.filter(it => it.id !== id));
  }

  return (
    <div className="tandc-overlay">
      <div className="tandc-dialog">
        <div className="tandc-dialog-header">
          <div className="title">Services / Non-Stock Items</div>
          <div className="actions">
            <button className="btn-add small" onClick={() => { setIsAddOpen(true); setEditingItem(null); }}>+ Add</button>
            <button className="close" aria-label="Close" onClick={onClose}>✕</button>
          </div>
        </div>

        <div className="tandc-dialog-body">
          <div className="ns-search">
            <input placeholder="Search" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>

          {/* Open modal for add/edit */}
          <AddNonStockModal
            isOpen={isAddOpen}
            item={editingItem}
            onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
            onSaved={(it) => {
              if (!it) return;
              setItems(prev => {
                const exists = prev.find(p => p.id === it.id);
                if (exists) return prev.map(p => p.id === it.id ? it : p);
                return [...prev, it];
              });
              setIsAddOpen(false);
              setEditingItem(null);
            }}
          />

          <div className="ns-list">
            {filtered.length === 0 && <div className="muted">No items found.</div>}
            {filtered.map(item => (
              <div className="tandc-item ns-item" key={item.id}>
                <div className="ns-item-left">
                  <div className="ns-item-name">{item.name}</div>
                  <div className="ns-item-price">{item.price}</div>
                </div>
                <div className="item-actions ns-item-actions">
                  <button className="icon-button edit" title="Edit" onClick={() => { setEditingItem(item); setIsAddOpen(true); }}>
                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
                      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z" fill="currentColor"/>
                    </svg>
                  </button>
                  <button className="icon-button delete" title="Delete" onClick={() => handleDelete(item.id)}>
                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
                      <path d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="tandc-dialog-footer">
          <button className="btn-primary save" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}
