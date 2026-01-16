import React, { useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "../../../config/Config";
import "../../styles/master.scss";

export default function BranchManager({ isOpen = false, onClose = () => {} }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [editingBranch, setEditingBranch] = useState(null);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/api/company-branches`, { params: { limit: 1000 } });
      setItems(res.data.data || []);
    } catch (err) {
      console.error(err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/companies`, { params: { limit: 1000 } });
      setCompanies(res.data.data || []);
    } catch (err) {
      console.error(err);
      setCompanies([]);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchItems();
      fetchCompanies();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!showAddModal) return;
    // fetch companies for selector
    (async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/companies`, { params: { limit: 1000 } });
        setCompanies(res.data.data || []);
      } catch (err) {
        console.error(err);
        setCompanies([]);
      }
    })();
  }, [showAddModal]);

  const ensureSingleHeadOffice = async (excludeId) => {
    try {
      const existing = items.find(b => b.IsHeadOffice || b.is_head_office);
      const existingId = existing && (existing.ID || existing.id);
      if (existingId && existingId !== excludeId) {
        await axios.put(`${BASE_URL}/api/company-branches/${existingId}`, { is_head_office: false });
      }
    } catch (err) {
      // do not block; just log
      console.error('Error unsetting previous head office', err);
    }
  };

  const handleAddSave = async (payload, onDone, setSaving) => {
    try {
      setSaving(true);
      if (payload.is_head_office) {
        await ensureSingleHeadOffice(null);
      }
      await axios.post(`${BASE_URL}/api/company-branches`, payload);
      await fetchItems();
      setShowAddModal(false);
      if (onDone) onDone();
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.error || 'Error adding branch');
    } finally {
      setSaving(false);
    }
  };

  const handleEditSave = async (id, payload, setSaving) => {
    try {
      setSaving(true);
      if (payload.is_head_office) {
        await ensureSingleHeadOffice(id);
      }
      await axios.put(`${BASE_URL}/api/company-branches/${id}`, payload);
      await fetchItems();
      setEditingBranch(null);
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.error || 'Error updating branch');
    } finally {
      setSaving(false);
    }
  };

  // AddBranchForm component
  function AddBranchForm({ companies, onSave, onCancel }) {
    const [companyId, setCompanyId] = useState(companies?.[0]?.ID || companies?.[0]?.id || '');
    const [code, setCode] = useState('');
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [stateVal, setStateVal] = useState('');
    const [pincode, setPincode] = useState('');
    const [gstin, setGstin] = useState('');
    const [isHeadOffice, setIsHeadOffice] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
      if (companies && companies.length && !companyId) {
        setCompanyId(companies[0].ID || companies[0].id);
      }
    }, [companies]);

    const submit = async () => {
      if (!companyId || !name.trim()) {
        alert('Company and Branch name are required');
        return;
      }
      const payload = {
        company_id: Number(companyId),
        code: code.trim(),
        name: name.trim(),
        gst_number: gstin.trim(),
        address: address.trim(),
        city: city.trim(),
        state: stateVal.trim(),
        pincode: pincode.trim(),
        is_head_office: !!isHeadOffice,
      };
      await onSave(payload, () => {
        setCode(''); setName(''); setAddress(''); setCity(''); setStateVal(''); setPincode(''); setGstin(''); setIsHeadOffice(false);
      }, setSaving);
    };

    return (
      <>
        <div className="tandc-dialog-body">
          <div className="form-grid stacked">
            <div className="form-row">
              <label>Company</label>
              <select value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
                {companies.map((c) => (
                  <option key={c.ID || c.id} value={c.ID || c.id}>{c.Name || c.name}</option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <label>Code</label>
              <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Branch code" />
            </div>

            <div className="form-row">
              <label>Branch Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Branch name" />
            </div>

            <div className="form-row">
              <label>Address</label>
              <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address" />
            </div>

            <div className="form-row two-col">
              <div>
                <label>City</label>
                <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" />
              </div>
              <div>
                <label>State</label>
                <input value={stateVal} onChange={(e) => setStateVal(e.target.value)} placeholder="State" />
              </div>
            </div>

            <div className="form-row two-col">
              <div>
                <label>Pincode</label>
                <input value={pincode} onChange={(e) => setPincode(e.target.value)} placeholder="Pincode" />
              </div>
              <div>
                <label>GSTIN</label>
                <input value={gstin} onChange={(e) => setGstin(e.target.value)} placeholder="GST Number" />
              </div>
            </div>

            <div className="form-row checkbox-row">
              <label />
              <div className="checkbox-field">
                <input type="checkbox" checked={isHeadOffice} onChange={(e) => setIsHeadOffice(e.target.checked)} id="isHeadOffice" />
                <label htmlFor="isHeadOffice">Is Head Office</label>
              </div>
            </div>
          </div>
        </div>

        <div className="tandc-dialog-footer">
          <button className="btn-primary save" onClick={submit} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
        </div>
      </>
    );
  }

  function EditBranchForm({ branch, companies, onSave, onCancel }) {
    const [companyId, setCompanyId] = useState(branch.CompanyID || branch.company_id || '');
    const [code, setCode] = useState(branch.Code || branch.code || '');
    const [name, setName] = useState(branch.Name || branch.name || branch.BranchName || '');
    const [address, setAddress] = useState(branch.Address || branch.address || '');
    const [city, setCity] = useState(branch.City || branch.city || '');
    const [stateVal, setStateVal] = useState(branch.State || branch.state || '');
    const [pincode, setPincode] = useState(branch.Pincode || branch.pincode || '');
    const [gstin, setGstin] = useState(branch.GSTNumber || branch.gst_number || branch.GST || branch.gst || '');
    const [isHeadOffice, setIsHeadOffice] = useState(!!(branch.IsHeadOffice || branch.is_head_office));
    const [saving, setSaving] = useState(false);

    useEffect(() => {
      setCompanyId(branch.CompanyID || branch.company_id || '');
      setCode(branch.Code || branch.code || '');
      setName(branch.Name || branch.name || branch.BranchName || '');
      setAddress(branch.Address || branch.address || '');
      setCity(branch.City || branch.city || '');
      setStateVal(branch.State || branch.state || '');
      setPincode(branch.Pincode || branch.pincode || '');
      setGstin(branch.GSTNumber || branch.gst_number || branch.GST || branch.gst || '');
      setIsHeadOffice(!!(branch.IsHeadOffice || branch.is_head_office));
    }, [branch]);

    const submit = async () => {
      if (!companyId || !name.trim()) {
        alert('Company and Branch name are required');
        return;
      }
      const payload = {
        company_id: Number(companyId),
        code: code.trim(),
        name: name.trim(),
        gst_number: gstin.trim(),
        address: address.trim(),
        city: city.trim(),
        state: stateVal.trim(),
        pincode: pincode.trim(),
        is_head_office: !!isHeadOffice,
      };
      await onSave(branch.ID || branch.id, payload, setSaving);
    };

    return (
      <>
        <div className="tandc-dialog-body">
          <div className="form-grid stacked">
            <div className="form-row">
              <label>Company</label>
              <select value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
                {companies.map((c) => (
                  <option key={c.ID || c.id} value={c.ID || c.id}>{c.Name || c.name}</option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <label>Code</label>
              <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Branch code" />
            </div>

            <div className="form-row">
              <label>Branch Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Branch name" />
            </div>

            <div className="form-row">
              <label>Address</label>
              <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address" />
            </div>

            <div className="form-row two-col">
              <div>
                <label>City</label>
                <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" />
              </div>
              <div>
                <label>State</label>
                <input value={stateVal} onChange={(e) => setStateVal(e.target.value)} placeholder="State" />
              </div>
            </div>

            <div className="form-row two-col">
              <div>
                <label>Pincode</label>
                <input value={pincode} onChange={(e) => setPincode(e.target.value)} placeholder="Pincode" />
              </div>
              <div>
                <label>GSTIN</label>
                <input value={gstin} onChange={(e) => setGstin(e.target.value)} placeholder="GST Number" />
              </div>
            </div>

            <div className="form-row checkbox-row">
              <label />
              <div className="checkbox-field">
                <input type="checkbox" checked={isHeadOffice} onChange={(e) => setIsHeadOffice(e.target.checked)} id="isHeadOfficeEdit" />
                <label htmlFor="isHeadOfficeEdit">Is Head Office</label>
              </div>
            </div>
          </div>
        </div>

        <div className="tandc-dialog-footer">
          <button className="btn-primary save" onClick={submit} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
        </div>
      </>
    );
  }

  const addItem = () => setItems((prev) => [...prev, { ID: null, BranchName: "", _new: true }]);
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
      arr[index] = { ...arr[index], BranchName: value, _edited: true };
      return arr;
    });
  };

  const handleSave = async () => {
    try {
      for (const it of items) {
        if (it._deleted && it.ID) await axios.delete(`${BASE_URL}/api/company-branches/${it.ID}`);
        else if (it.ID) {
          if (it._edited) await axios.put(`${BASE_URL}/api/company-branches/${it.ID}`, { name: it.BranchName });
        } else {
          if (it.BranchName && it.BranchName.trim()) await axios.post(`${BASE_URL}/api/company-branches`, { name: it.BranchName });
        }
      }
      await fetchItems();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Error saving branch list");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="tandc-overlay">
      <div className="tandc-dialog">
        <div className="tandc-dialog-header">
          <div className="title">Manage Branches</div>
          <div className="actions">
            <button className="btn-add small" onClick={() => setShowAddModal(true)}>+ Add</button>
            <button className="close" onClick={onClose}>✕</button>
          </div>
        </div>

        <div className="tandc-dialog-body">
          {loading ? (
            <div className="muted">Loading...</div>
          ) : items.filter((i) => !i._deleted).length === 0 ? (
            <div className="muted">No branches. Add one.</div>
          ) : (
            items.map((it) => ({ ...it })).filter((i) => !i._deleted).map((it) => (
              <div className="branch-card" key={it.ID || it.id}>
                <div className="branch-card-body">
                  <div className="branch-row branch-company">{(companies.find(c => (c.ID || c.id) === (it.CompanyID || it.company_id)) || {}).Name || (companies.find(c => (c.ID || c.id) === (it.CompanyID || it.company_id)) || {}).name || 'Company #' + (it.CompanyID || it.company_id)}</div>
                  <div className="branch-row branch-code-name"><span className="branch-code">{it.Code || it.code}</span>-<span className="branch-name">{it.Name || it.name || it.BranchName}</span></div>
                  {it.Address || it.address ? <div className="branch-row branch-address">{it.Address || it.address}</div> : null}
                  <div className="branch-row branch-city-state">{it.City || it.city}{it.City || it.city ? ',' : ''} {it.State || it.state}</div>
                  <div className="branch-row branch-pincode">{it.Pincode || it.pincode}</div>
                  <div className="branch-row branch-gst">{it.GSTNumber || it.gst_number || it.GST || it.gst}</div>
                </div>

                { (it.IsHeadOffice || it.is_head_office) && (
                  <div className="branch-star" title="Head Office">★</div>
                ) }

                <div className="branch-actions">
                  <button className="icon-button edit" title="Edit" onClick={() => setEditingBranch(it)}>
                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
                      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z" fill="currentColor"/>
                    </svg>
                  </button>
                  <button className="icon-button delete" title="Delete" onClick={async () => {
                    if (!confirm('Delete this branch?')) return;
                    try {
                      if (!it.ID && !it.id) {
                        // local unsaved item - remove from state
                        setItems(prev => prev.filter(x => x !== it));
                        return;
                      }
                      await axios.delete(`${BASE_URL}/api/company-branches/${it.ID || it.id}`);
                      await fetchItems();
                    } catch (err) {
                      console.error(err);
                      alert('Error deleting branch');
                    }
                  }}>
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
          <div className="tandc-dialog large">
            <div className="tandc-dialog-header">
              <div className="title">Add Branch</div>
              <div className="actions">
                <button className="close" onClick={() => setShowAddModal(false)}>✕</button>
              </div>
            </div>

            <AddBranchForm companies={companies} onSave={handleAddSave} onCancel={() => setShowAddModal(false)} />
          </div>
        </div>
      )}

      {editingBranch && (
        <div className="tandc-overlay">
          <div className="tandc-dialog large">
            <div className="tandc-dialog-header">
              <div className="title">Edit Branch</div>
              <div className="actions">
                <button className="close" onClick={() => setEditingBranch(null)}>✕</button>
              </div>
            </div>

            <EditBranchForm branch={editingBranch} companies={companies} onSave={handleEditSave} onCancel={() => setEditingBranch(null)} />
          </div>
        </div>
      )}
    </div>
  );
}
