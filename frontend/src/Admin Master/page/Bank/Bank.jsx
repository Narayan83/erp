import React, { useEffect, useState } from 'react'
import './bank.scss'
import axios from 'axios'
import { BASE_URL } from "../../../config/Config"
import { FaEdit, FaTrash } from 'react-icons/fa'

export default function Bank() {
  const [banks, setBanks] = useState([])
  const [branches, setBranches] = useState([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [editData, setEditData] = useState({})
  const [showModal, setShowModal] = useState(false)
  const [modalEditingId, setModalEditingId] = useState(null)
  const [newBank, setNewBank] = useState({
    company_branch_id: '',
    bank_name: '',
    branch_name: '',
    branch_address: '',
    account_number: '',
    ifsc_code: '',
    balance: 0
  })

  // on mount load branches and banks
  useEffect(() => {
    fetchBranches()
    fetchBanks()
  }, [])

  async function fetchBranches() {
    try {
      const res = await axios.get(`${BASE_URL}/api/company-branches?limit=1000`)
      const data = res.data && res.data.data ? res.data.data : res.data
      if (Array.isArray(data)) {
        setBranches(data)
      }
    } catch (e) {
      console.error('fetchBranches error', e)
      setBranches([])
    }
  }

  async function fetchBanks() {
    setLoading(true)
    try {
      const res = await axios.get(`${BASE_URL}/api/company-branch-banks`)
      const data = res.data
      if (Array.isArray(data)) {
        setBanks(data)
      }
    } catch (e) {
      console.error('fetchBanks error', e)
      setBanks([])
    } finally {
      setLoading(false)
    }
  }

  const filtered = banks.filter(b => {
    if (!query) return true
    const q = query.toLowerCase()
    const branch = branches.find(br => br.id === b.company_branch_id)
    const branchName = branch ? branch.name : ''
    return (
      String(branchName).toLowerCase().includes(q) ||
      String(b.bank_name || '').toLowerCase().includes(q) ||
      String(b.branch_name || '').toLowerCase().includes(q) ||
      String(b.branch_address || '').toLowerCase().includes(q) ||
      String(b.account_number || '').toLowerCase().includes(q) ||
      String(b.ifsc_code || '').toLowerCase().includes(q)
    )
  })

  function startEdit(bank) {
    // legacy inline edit — open modal instead
    setModalEditingId(bank.id)
    setNewBank({
      company_branch_id: bank.company_branch_id || '',
      bank_name: bank.bank_name || '',
      branch_name: bank.branch_name || '',
      branch_address: bank.branch_address || '',
      account_number: bank.account_number || '',
      ifsc_code: bank.ifsc_code || '',
      balance: bank.balance || 0
    })
    setShowModal(true)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditData({})
  }

  function handleInlineEdit(name, value) {
    setEditData(prev => ({ ...prev, [name]: value }))
  }
  
  // We'll use modalEditingId + newBank form for create/update

  async function deleteBank(bank) {
    if (!bank.id) {
      alert('Cannot delete entries without ID')
      return
    }
    if (!window.confirm('Are you sure you want to delete this bank record?')) return
    try {
      await axios.delete(`${BASE_URL}/api/company-branch-banks/${bank.id}`)
      // Update local state instead of refetching
      setBanks(currentBanks => currentBanks.filter(b => b.id !== bank.id))
    } catch (e) {
      console.error('Failed to delete bank', e)
      alert('Failed to delete bank: ' + (e.response?.data?.error || e.message))
    }
  }

  async function handleCreateBank() {
    const payload = {
      company_branch_id: parseInt(newBank.company_branch_id),
      bank_name: newBank.bank_name,
      branch_name: newBank.branch_name,
      branch_address: newBank.branch_address,
      account_number: newBank.account_number,
      ifsc_code: newBank.ifsc_code,
      balance: parseFloat(newBank.balance) || 0
    }

    if (!payload.company_branch_id || !payload.bank_name || !payload.account_number) {
      alert('Please fill company branch, bank name, and account number')
      return
    }

    try {
      if (modalEditingId) {
        // Update existing bank
        const res = await axios.put(`${BASE_URL}/api/company-branch-banks/${modalEditingId}`, payload)
        const updated = res.data
        setBanks(current => current.map(b => (b.id === modalEditingId ? updated : b)))
      } else {
        // Create new bank
        const res = await axios.post(`${BASE_URL}/api/company-branch-banks`, payload)
        const created = res.data
        setBanks(current => [created, ...current])
      }
      setShowModal(false)
      setModalEditingId(null)
      setNewBank({ 
        company_branch_id: '', 
        bank_name: '', 
        branch_name: '', 
        branch_address: '', 
        account_number: '', 
        ifsc_code: '',
        balance: 0
      })
    } catch (e) {
      console.error('Failed to create/update bank', e)
      alert('Failed to save bank: ' + (e.response?.data?.error || e.message))
    }
  }

  return (
    <div className="bank-root">
      <div className="bank-header">
        <h3>Manage Bank Accounts</h3>
        <div className="bank-actions">
          <button
            className="btn primary"
            onClick={() => { setModalEditingId(null); setNewBank({ company_branch_id: '', bank_name: '', branch_name: '', branch_address: '', account_number: '', ifsc_code: '', balance: 0 }); setShowModal(true); }}
          >
            + Add Bank
          </button>
        </div>
      </div>

      <div className="bank-table-wrap">
        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <table className="bank-table">
            <thead>
              <tr>
                <th>Company Branch</th>
                <th>Bank Name</th>
                <th>Account No.</th>
                <th>Branch</th>
                <th>Branch Address</th>
                <th>IFSC</th>
                <th>Balance</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="muted">No banks found</td></tr>
              ) : (
                filtered.map(b => {
                  const isEditing = editingId === b.id
                  const rowData = isEditing ? editData : b
                  const branch = branches.find(br => br.id === b.company_branch_id)
                  
                  return (
                    <tr key={b.id} className={isEditing ? 'editing' : ''}>
                      <td>{branch ? branch.name : '-'}</td>
                      <td>{b.bank_name || ''}</td>
                      <td>{b.account_number || ''}</td>
                      <td>{b.branch_name || ''}</td>
                      <td>{b.branch_address || ''}</td>
                      <td>{b.ifsc_code || ''}</td>
                      <td>{b.balance ? `₹${b.balance.toLocaleString()}` : '₹0'}</td>
                      <td>
                        <button className="action-btn edit-btn" onClick={() => startEdit(b)} title="Edit">
                          <FaEdit />
                        </button>
                        <button className="action-btn delete-btn" onClick={() => deleteBank(b)} title="Delete">
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="bank-modal">
          <div className="bank-form">
            <h3>{modalEditingId ? 'Edit Bank Detail' : 'Add a Bank Detail'}</h3>
            <div className="form-grid">
              <label>
                Company Branch :
                <select
                  value={newBank.company_branch_id}
                  onChange={e => setNewBank(prev => ({ ...prev, company_branch_id: e.target.value }))}
                >
                  <option value="">Select Branch</option>
                  {branches.map(br => (
                    <option key={br.id} value={br.id}>{br.name}</option>
                  ))}
                </select>
              </label>

              <label>
                Bank Name :
                <input
                  value={newBank.bank_name}
                  onChange={e => setNewBank(prev => ({ ...prev, bank_name: e.target.value }))}
                />
              </label>

              <label>
                Account No. :
                <input
                  value={newBank.account_number}
                  onChange={e => setNewBank(prev => ({ ...prev, account_number: e.target.value }))}
                />
              </label>

              <label>
                Branch :
                <input
                  value={newBank.branch_name}
                  onChange={e => setNewBank(prev => ({ ...prev, branch_name: e.target.value }))}
                />
              </label>

              <label>
                Branch Address :
                <input
                  value={newBank.branch_address}
                  onChange={e => setNewBank(prev => ({ ...prev, branch_address: e.target.value }))}
                />
              </label>

              <label>
                IFSC :
                <input
                  value={newBank.ifsc_code}
                  onChange={e => setNewBank(prev => ({ ...prev, ifsc_code: e.target.value }))}
                />
              </label>

              <label>
                Balance :
                <input
                  type="number"
                  step="0.01"
                  value={newBank.balance}
                  onChange={e => setNewBank(prev => ({ ...prev, balance: e.target.value }))}
                />
              </label>
            </div>

            <div className="form-actions">
              <button className="btn primary" onClick={handleCreateBank}>{modalEditingId ? 'Update' : 'Save'}</button>
              <button className="btn" onClick={() => { setShowModal(false); setModalEditingId(null); setNewBank({ company_branch_id: '', bank_name: '', branch_name: '', branch_address: '', account_number: '', ifsc_code: '', balance: 0 }); }}>Cancel</button>
            </div>
          </div>
        </div>
      )}


    </div>
  )
}
