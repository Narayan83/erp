import React, { useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "../../../config/Config";
import AddTandCModal from "./AddTandCModal";
import "../../styles/master.scss";

export default function TandCManager({ isOpen = false, onClose = () => {} }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/api/tandc/`, { params: { page: 1, limit: 1000 } });
      setItems(res.data.data || []);
    } catch (err) {
      console.error(err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchItems();
  }, [isOpen]);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const addItem = () => { setEditingItem(null); setIsAddOpen(true); };
  const editItem = (idx) => { const it = items[idx]; if (!it) return; setEditingItem(it); setIsAddOpen(true); }; 

  const removeItem = (index) => {
    setItems((prev) => {
      const items = [...prev];
      const it = items[index];
      if (!it) return items;
      if (it.ID) items[index] = { ...it, _deleted: true };
      else items.splice(index, 1);
      return items;
    });
  };

  const handleChange = (index, value) => {
    setItems((prev) => {
      const items = [...prev];
      items[index] = { ...items[index], TandcName: value, _edited: true };
      return items;
    });
  };

  const handleSave = async () => {
    try {
      for (const it of items) {
        if (it._deleted && it.ID) {
          await axios.delete(`${BASE_URL}/api/tandc/${it.ID}`);
        } else if (it.ID) {
          if (it._edited) {
            await axios.put(`${BASE_URL}/api/tandc/${it.ID}`, {
              TandcName: it.TandcName,
              TandcType: it.TandcType || "",
            });
          }
        } else {
          // new
          if ((it.TandcName && it.TandcName.trim()) || (it.TandcType && it.TandcType.trim())) {
            await axios.post(`${BASE_URL}/api/tandc`, {
              TandcName: it.TandcName,
              TandcType: it.TandcType || "",
            });
          }
        }
      }
      await fetchItems();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Error saving T&C list");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="tandc-overlay">
      <AddTandCModal isOpen={isAddOpen} item={editingItem} onClose={() => { setIsAddOpen(false); setEditingItem(null); }} onSaved={() => { setIsAddOpen(false); setEditingItem(null); fetchItems(); }} />
      <div className="tandc-dialog">
        <div className="tandc-dialog-header">
          <div className="title">Manage Terms & Conditions</div>
          <div className="actions">
            <button className="btn-add small" onClick={addItem}>+ Add</button>
            <button className="close" onClick={onClose}>✕</button>
          </div>
        </div>

        <div className="tandc-dialog-body">
          {loading ? (
            <div className="muted">Loading...</div>
          ) : items.filter((i) => !i._deleted).length === 0 ? (
            <div className="muted">No Terms & Conditions yet. Add one.</div>
          ) : (
            items
              .map((it, idx) => ({ ...it, _idx: idx }))
              .filter((i) => !i._deleted)
              .map((it) => (
                <div className="tandc-item" key={it.ID || it._idx}>
                  <div className="tandc-name">{it.TandcName || ""}</div>
                  <div className="item-actions">
                    <button className="icon-button edit" title="Edit" onClick={() => editItem(it._idx)}>
                      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z" fill="currentColor"/>
                      </svg>
                    </button>
                    <button className="icon-button delete" title="Delete" onClick={() => removeItem(it._idx)}>
                      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
                        <path d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/>
                      </svg>
                    </button>
                  </div>
                </div>
              ))
          )}
        </div>

        <div className="tandc-dialog-footer">
          <button className="btn-primary save" onClick={async () => { try { await handleSave(); } finally { onClose(); } }}>Done</button>
        </div>
      </div>
    </div>
  );
}
