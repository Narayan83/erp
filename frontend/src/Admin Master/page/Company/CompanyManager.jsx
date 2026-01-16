import React, { useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "../../../config/Config";
import "../../styles/master.scss";

export default function CompanyManager({ isOpen = false, onClose = () => {} }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/api/companies`, { params: { limit: 1000 } });
      // normalize fields so existing UI continues to work with Name/Code
      setItems((res.data.data || []).map((it) => ({ ...it, CompanyName: it.Name || it.name || it.CompanyName, Code: it.Code || it.code })));
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

  const addItem = () => setItems((prev) => [...prev, { ID: null, CompanyName: "", _new: true }]);

  const removeItem = (index) => {
    setItems((prev) => {
      const arr = [...prev];
      const it = arr[index];
      if (!it) return arr;
      if (it.ID) arr[index] = { ...it, _deleted: true };
      else arr.splice(index, 1);
      return arr;
    });
  };

  const handleChange = (index, value) => {
    setItems((prev) => {
      const arr = [...prev];
      arr[index] = { ...arr[index], CompanyName: value, _edited: true };
      return arr;
    });
  };

  const handleSave = async () => {
    try {
      for (const it of items) {
        if (it._deleted && it.ID) await axios.delete(`${BASE_URL}/api/companies/${it.ID}`);
        else if (it.ID) {
          if (it._edited) await axios.put(`${BASE_URL}/api/companies/${it.ID}`, { name: it.CompanyName, code: it.Code });
        } else {
          if (it.CompanyName && it.CompanyName.trim()) await axios.post(`${BASE_URL}/api/companies`, { name: it.CompanyName, code: it.Code });
        }
      }
      await fetchItems();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Error saving company list");
    }
  };

  const handleAddSave = async (code, name, onDone, setSaving) => {
    try {
      setSaving(true);
      await axios.post(`${BASE_URL}/api/companies`, { code, name });
      await fetchItems();
      setShowAddModal(false);
      if (onDone) onDone();
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.error || "Error adding company");
    } finally {
      setSaving(false);
    }
  };

  const handleEditSave = async (id, code, name, setSaving) => {
    try {
      setSaving(true);
      await axios.put(`${BASE_URL}/api/companies/${id}`, { code, name });
      await fetchItems();
      setEditingCompany(null);
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.error || "Error updating company");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="tandc-overlay">
      <div className="tandc-dialog">
        <div className="tandc-dialog-header">
          <div className="title">Manage Companies</div>
          <div className="actions">
            <button className="btn-add small" onClick={() => setShowAddModal(true)}>+ Add</button>
            <button className="close" onClick={onClose}>✕</button>
          </div>
        </div>

        <div className="tandc-dialog-body">
          {loading ? (
            <div className="muted">Loading...</div>
          ) : items.filter((i) => !i._deleted).length === 0 ? (
            <div className="muted">No companies. Add one.</div>
          ) : (
            items.map((it, idx) => ({ ...it, _idx: idx })).filter((i) => !i._deleted).map((it) => (
              <div className="company-card" key={it.ID || it._idx}>
                <div className="company-card-body">
                   {it.Code ? <div className="company-code">{it.Code}</div> : null} -
                  <div className="company-name">{it.CompanyName || ""}</div>
                </div>
                <div className="card-actions">
                  <button className="icon-button edit" title="Edit" onClick={() => setEditingCompany(it)}>
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

      {showAddModal && (
        <div className="tandc-overlay">
          <div className="tandc-dialog small">
            <div className="tandc-dialog-header">
              <div className="title">Add Company</div>
              <div className="actions">
                <button className="close" onClick={() => setShowAddModal(false)}>✕</button>
              </div>
            </div>

            <AddCompanyForm onSave={handleAddSave} onCancel={() => setShowAddModal(false)} />
          </div>
        </div>
      )}

      {editingCompany && (
        <div className="tandc-overlay">
          <div className="tandc-dialog small">
            <div className="tandc-dialog-header">
              <div className="title">Edit Company</div>
              <div className="actions">
                <button className="close" onClick={() => setEditingCompany(null)}>✕</button>
              </div>
            </div>

            <EditCompanyForm company={editingCompany} onSave={handleEditSave} onCancel={() => setEditingCompany(null)} />
          </div>
        </div>
      )}
    </div>
  );
}

function AddCompanyForm({ onSave, onCancel }) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!code.trim() || !name.trim()) {
      alert("Both code and name are required");
      return;
    }
    await onSave(code.trim(), name.trim(), () => { setCode(""); setName(""); }, setSaving);
  };

  return (
    <>
      <div className="tandc-dialog-body">
        <div className="form-row">
          <label>Code</label>
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Company code" />
        </div>
        <div className="form-row">
          <label>Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Company name" />
        </div>
      </div>

      <div className="tandc-dialog-footer">
        <button className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button className="btn-primary save" onClick={submit} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
      </div>
    </>
  );
}

function EditCompanyForm({ company, onSave, onCancel }) {
  const [code, setCode] = useState(company.Code || company.code || "");
  const [name, setName] = useState(company.CompanyName || company.Name || company.name || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setCode(company.Code || company.code || "");
    setName(company.CompanyName || company.Name || company.name || "");
  }, [company]);

  const submit = async () => {
    if (!code.trim() || !name.trim()) {
      alert("Both code and name are required");
      return;
    }
    await onSave(company.ID, code.trim(), name.trim(), setSaving);
  };

  return (
    <>
      <div className="tandc-dialog-body">
        <div className="form-row">
          <label>Code</label>
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Company code" />
        </div>
        <div className="form-row">
          <label>Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Company name" />
        </div>
      </div>

      <div className="tandc-dialog-footer">
        <button className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button className="btn-primary save" onClick={submit} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
      </div>
    </>
  );
}
