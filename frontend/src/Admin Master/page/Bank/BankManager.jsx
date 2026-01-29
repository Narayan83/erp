import React, { useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "../../../config/Config";
import "../../styles/master.scss";

export default function BankManager({ isOpen = false, onClose = () => {} }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [companyBranches, setCompanyBranches] = useState([]);
  const [editingBank, setEditingBank] = useState(null);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/api/company-branch-banks`, { params: { limit: 1000 } });
      // endpoint may return either an array or an object { data: [...] }
      setItems(res.data?.data ?? res.data ?? []);
    } catch (err) {
      console.error(err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanyBranches = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/company-branches`, { params: { limit: 1000 } });
      setCompanyBranches(res.data.data || []);
    } catch (err) {
      console.error(err);
      setCompanyBranches([]);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchItems();
      fetchCompanyBranches();
    }
  }, [isOpen]);

  // Add bank modal save
  const handleAddSave = async (payload, onDone, setSaving) => {
    try {
      setSaving(true);
      await axios.post(`${BASE_URL}/api/company-branch-banks`, payload);
      await fetchItems();
      setShowAddModal(false);
      if (onDone) onDone();
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.error || 'Error adding bank');
    } finally {
      setSaving(false);
    }
  };

  // Edit bank save
  const handleEditSave = async (id, payload, setSaving) => {
    try {
      setSaving(true);
      await axios.put(`${BASE_URL}/api/company-branch-banks/${id}`, payload);
      await fetchItems();
      setEditingBank(null);
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.error || 'Error updating bank');
    } finally {
      setSaving(false);
    }
  };

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

  // Add bank modal component
  function AddBankForm({ branches, onSave, onCancel }) {
    const [branchId, setBranchId] = useState(branches?.[0]?.ID || branches?.[0]?.id || '');
    const [bankName, setBankName] = useState('');
    const [branchName, setBranchName] = useState('');
    const [branchAddress, setBranchAddress] = useState('');
    const [accountNo, setAccountNo] = useState('');
    const [ifsc, setIfsc] = useState('');
    const [balance, setBalance] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
      if (branches && branches.length && !branchId) setBranchId(branches[0].ID || branches[0].id);
    }, [branches]);

    const submit = async () => {
      if (!branchId || !bankName.trim() || !accountNo.trim()) {
        alert('Branch, Bank name and Account number are required');
        return;
      }
      const payload = {
        company_branch_id: Number(branchId),
        bank_name: bankName.trim(),
        branch_name: branchName.trim(),
        branch_address: branchAddress.trim(),
        account_number: accountNo.trim(),
        ifsc_code: ifsc.trim(),
        balance: balance === '' ? null : Number(balance),
      };
      await onSave(payload, () => {
        setBankName(''); setBranchName(''); setBranchAddress(''); setAccountNo(''); setIfsc(''); setBalance('');
      }, setSaving);
    };

    return (
      <>
        <div className="tandc-dialog-body">
          <div className="form-grid stacked">
            <div className="form-row">
              <label>Company Branch</label>
              <select value={branchId} onChange={(e) => setBranchId(e.target.value)}>
                {branches.map(b => <option key={b.ID || b.id} value={b.ID || b.id}>{(b.Name || b.name) + ' (' + ((b.Code||b.code)||b.id) + ')'}</option>)}
              </select>
            </div>

            <div className="form-row">
              <label>Bank Name</label>
              <input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="Bank name" />
            </div>

            <div className="form-row">
              <label>Branch Name</label>
              <input value={branchName} onChange={(e) => setBranchName(e.target.value)} placeholder="Branch name" />
            </div>

            <div className="form-row">
              <label>Branch Address</label>
              <input value={branchAddress} onChange={(e) => setBranchAddress(e.target.value)} placeholder="Address" />
            </div>

            <div className="form-row two-col">
              <div>
                <label>Account No</label>
                <input value={accountNo} onChange={(e) => setAccountNo(e.target.value)} placeholder="Account number" />
              </div>
              <div>
                <label>IFSC</label>
                <input value={ifsc} onChange={(e) => setIfsc(e.target.value)} placeholder="IFSC code" />
              </div>
            </div>

            <div className="form-row">
              <label>Balance</label>
              <input value={balance} onChange={(e) => setBalance(e.target.value)} placeholder="Balance" />
            </div>

          </div>
        </div>
        <div className="tandc-dialog-footer">
          <button className="btn-primary save" onClick={submit} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
        </div>
      </>
    );
  }

  // Edit bank modal
  function EditBankForm({ bank, branches, onSave, onCancel }) {
    const [branchId, setBranchId] = useState(bank.CompanyBranchID || bank.company_branch_id || '');
    const [bankName, setBankName] = useState(bank.BankName || bank.bank_name || '');
    const [branchName, setBranchName] = useState(bank.BranchName || bank.branch_name || '');
    const [branchAddress, setBranchAddress] = useState(bank.BranchAddress || bank.branch_address || '');
    const [accountNo, setAccountNo] = useState(bank.AccountNumber || bank.account_number || bank.AccountNo || bank.account_no || '');
    const [ifsc, setIfsc] = useState(bank.IFSCCode || bank.ifsc_code || bank.IFSC || bank.ifsc || '');
    const [balance, setBalance] = useState(bank.Balance != null ? String(bank.Balance) : (bank.balance != null ? String(bank.balance) : ''));
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setBranchId(bank.CompanyBranchID || bank.company_branch_id || '');
        setBankName(bank.BankName || bank.bank_name || '');
        setBranchName(bank.BranchName || bank.branch_name || '');
        setBranchAddress(bank.BranchAddress || bank.branch_address || '');
      setAccountNo(bank.AccountNumber || bank.account_number || bank.AccountNo || bank.account_no || '');
      setIfsc(bank.IFSCCode || bank.ifsc_code || bank.IFSC || bank.ifsc || '');
        setBalance(bank.Balance != null ? String(bank.Balance) : (bank.balance != null ? String(bank.balance) : ''));
    }, [bank]);

    const submit = async () => {
      if (!branchId || !bankName.trim() || !accountNo.trim()) {
        alert('Branch, Bank name and Account number are required');
        return;
      }
      const payload = {
        company_branch_id: Number(branchId),
        bank_name: bankName.trim(),
        branch_name: branchName.trim(),
        branch_address: branchAddress.trim(),
        account_number: accountNo.trim(),
        ifsc_code: ifsc.trim(),
        balance: balance === '' ? null : Number(balance),
      };
      await onSave(bank.ID || bank.id, payload, setSaving);
    };

    return (
      <>
        <div className="tandc-dialog-body">
          <div className="form-grid stacked">
            <div className="form-row">
              <label>Company Branch</label>
              <select value={branchId} onChange={(e) => setBranchId(e.target.value)}>
                {branches.map(b => <option key={b.ID || b.id} value={b.ID || b.id}>{(b.Name || b.name) + ' (' + ((b.Code||b.code)||b.id) + ')'}</option>)}
              </select>
            </div>

            <div className="form-row">
              <label>Bank Name</label>
              <input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="Bank name" />
            </div>

            <div className="form-row">
              <label>Branch Name</label>
              <input value={branchName} onChange={(e) => setBranchName(e.target.value)} placeholder="Branch name" />
            </div>

            <div className="form-row">
              <label>Branch Address</label>
              <input value={branchAddress} onChange={(e) => setBranchAddress(e.target.value)} placeholder="Address" />
            </div>

            <div className="form-row two-col">
              <div>
                <label>Account No</label>
                <input value={accountNo} onChange={(e) => setAccountNo(e.target.value)} placeholder="Account number" />
              </div>
              <div>
                <label>IFSC</label>
                <input value={ifsc} onChange={(e) => setIfsc(e.target.value)} placeholder="IFSC code" />
              </div>
            </div>

            <div className="form-row">
              <label>Balance</label>
              <input value={balance} onChange={(e) => setBalance(e.target.value)} placeholder="Balance" />
            </div>

          </div>
        </div>
        <div className="tandc-dialog-footer">
          <button className="btn-primary save" onClick={submit} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
        </div>
      </>
    );
  }

  if (!isOpen) return null;

  return (
    <div className="tandc-overlay">
      <div className="tandc-dialog">
        <div className="tandc-dialog-header">
          <div className="title">Manage Bank Details</div>
          <div className="actions">
            <button className="btn-add small" onClick={() => setShowAddModal(true)}>+ Add</button>
            <button className="close" onClick={onClose}>✕</button>
          </div>
        </div>

        <div className="tandc-dialog-body">
          {loading ? (
            <div className="muted">Loading...</div>
          ) : items.filter((i) => !i._deleted).length === 0 ? (
            <div className="muted">No bank details. Add one.</div>
          ) : (
            items.map((it) => ({ ...it })).filter((i) => !i._deleted).map((it) => (
              <div className="bank-card" key={it.ID || it.id}>
                <div className="bank-card-body">
                  <div className="bank-row bank-company"><span className="bank-label">Company branch </span>: {(companyBranches.find(b => (b.ID || b.id) === (it.CompanyBranchID || it.company_branch_id)) || {}).Name || (companyBranches.find(b => (b.ID || b.id) === (it.CompanyBranchID || it.company_branch_id)) || {}).name || 'Branch #' + (it.CompanyBranchID || it.company_branch_id)}</div>
                  <div className="bank-row bank-bankname"><span className="bank-label">Bank name </span>: {it.BankName || it.bank_name}</div>
                  <div className="bank-row bank-branchname"><span className="bank-label">Branch name </span>: {it.BranchName || it.branch_name}</div>
                  <div className="bank-row bank-address"><span className="bank-label">Address </span>: {it.BranchAddress || it.branch_address}</div>
                  <div className="bank-row bank-account"><span className="bank-label">Account No</span>: {it.AccountNumber || it.account_number || it.AccountNo || it.account_no}</div>
                  <div className="bank-row bank-ifsc"><span className="bank-label">IFSC</span>: {it.IFSCCode || it.ifsc_code || it.IFSC || it.ifsc}</div>
                  <div className="bank-row bank-balance"><span className="bank-label">Balance</span>: {(it.Balance != null ? it.Balance : (it.balance != null ? it.balance : ''))}</div>
                </div>

                <div className="bank-actions">
                  <button className="icon-button edit" title="Edit" onClick={() => setEditingBank(it)}>
                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
                      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z" fill="currentColor"/>
                    </svg>
                  </button>
                  <button className="icon-button delete" title="Delete" onClick={async () => {
                    if (!confirm('Delete this bank detail?')) return;
                    try {
                      if (!it.ID && !it.id) {
                        setItems(prev => prev.filter(x => x !== it));
                        return;
                      }
                      await axios.delete(`${BASE_URL}/api/company-branch-banks/${it.ID || it.id}`);
                      await fetchItems();
                    } catch (err) {
                      console.error(err);
                      alert('Error deleting bank detail');
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
          <button className="btn-primary save" onClick={() => { onClose(); }}>Done</button>
        </div>
      </div>

      {showAddModal && (
        <div className="tandc-overlay">
          <div className="tandc-dialog large">
            <div className="tandc-dialog-header">
              <div className="title">Add Bank</div>
              <div className="actions">
                <button className="close" onClick={() => setShowAddModal(false)}>✕</button>
              </div>
            </div>

            <AddBankForm branches={companyBranches} onSave={handleAddSave} onCancel={() => setShowAddModal(false)} />
          </div>
        </div>
      )}

      {editingBank && (
        <div className="tandc-overlay">
          <div className="tandc-dialog large">
            <div className="tandc-dialog-header">
              <div className="title">Edit Bank</div>
              <div className="actions">
                <button className="close" onClick={() => setEditingBank(null)}>✕</button>
              </div>
            </div>

            <EditBankForm bank={editingBank} branches={companyBranches} onSave={handleEditSave} onCancel={() => setEditingBank(null)} />
          </div>
        </div>
      )}

    </div>
  );
}
