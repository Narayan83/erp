import React, { useEffect, useState } from 'react'
import './bank.scss'
import axios from 'axios'
import { BASE_URL } from "../Config"

export default function Bank() {
  const [banks, setBanks] = useState([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [editData, setEditData] = useState({})

  // on mount load default source (users)
  useEffect(() => {
    fetchBanksFromUsers()
  }, [])

  async function fetchBanksFromUsers() {
    setLoading(true)
    try {
      const res = await axios.get(`${BASE_URL}/api/banks/from-users`)
      const data = res.data && res.data.data ? res.data.data : res.data
      if (Array.isArray(data)) {
        // Ensure all records have consistent field names
        const normalizedData = data.map(bank => ({
          id: bank.id,
          user_id: bank.user_id,
          user_code: bank.user_code || '',
          user_name: bank.user_name || '',
          name: bank.name || '',
          branch_name: bank.branch_name || '',
          branch_address: bank.branch_address || '',
          account_number: bank.account_number || '',
          ifsc_code: bank.ifsc_code || '',
          tempKey: bank.id ? String(bank.id) : `${bank.user_id || ''}_${bank.account_number || ''}`
        }))
        setBanks(normalizedData)
      }
    } catch (e) {
      console.error('fetchBanksFromUsers error', e)
      setBanks([])
    } finally {
      setLoading(false)
    }
  }

  const filtered = banks.filter(b => {
    if (!query) return true
    const q = query.toLowerCase()
    return (
      String(b.user_code || '').toLowerCase().includes(q) ||
      String(b.user_name || '').toLowerCase().includes(q) ||
      String(b.name || '').toLowerCase().includes(q) ||
      String(b.branch_name || '').toLowerCase().includes(q) ||
      String(b.branch_address || '').toLowerCase().includes(q) ||
      String(b.account_number || '').toLowerCase().includes(q) ||
      String(b.ifsc_code || '').toLowerCase().includes(q)
    )
  })

  function startEdit(bank) {
    // Allow editing both existing bank records and derived user rows.
    // Use a stable key for derived rows so we can replace them after creating a bank.
  setEditingId(bank.tempKey || (bank.id ? String(bank.id) : `${bank.user_id || ''}_${bank.account_number || ''}`))
    setEditData({
      id: bank.id,
      user_id: bank.user_id,
      user_code: bank.user_code || '',
      user_name: bank.user_name || '',
      name: bank.name || '',
      branch_name: bank.branch_name || '',
      branch_address: bank.branch_address || '',
      account_number: bank.account_number || '',
      ifsc_code: bank.ifsc_code || ''
    })
  }

  function cancelEdit() {
    setEditingId(null)
    setEditData({})
  }

  function handleInlineEdit(name, value) {
    setEditData(prev => ({ ...prev, [name]: value }))
  }

  async function handleSave(originalBank) {
    const payload = {
      name: editData.name,
      branch_name: editData.branch_name,
      branch_address: editData.branch_address,
      account_number: editData.account_number,
      ifsc_code: editData.ifsc_code,
      user_id: editData.user_id,
      user_code: editData.user_code,
      user_name: editData.user_name
    }

    try {
      if (originalBank.id) {
        // Existing bank -> update
        const res = await axios.put(`${BASE_URL}/api/banks/${originalBank.id}`, payload)
        const updated = res.data
        setBanks(currentBanks => currentBanks.map(b => b.id === originalBank.id ? ({ ...b, ...updated }) : b))
      } else {
        // Derived row -> create new bank, then replace the derived row in-place
        const res = await axios.post(`${BASE_URL}/api/banks`, payload)
        const created = res.data
        const key = originalBank.tempKey || `${originalBank.user_id || ''}_${originalBank.account_number || ''}`
        setBanks(currentBanks => currentBanks.map(b => {
          const bKey = b.tempKey || (b.id ? String(b.id) : `${b.user_id || ''}_${b.account_number || ''}`)
          if (bKey === key) {
            // replace derived entry with the created bank record
            return ({
              id: created.id,
              user_id: created.user_id,
              user_code: created.user_code || created.userCode || '',
              user_name: created.user_name || created.userName || '',
              name: created.name,
              branch_name: created.branch_name,
              branch_address: created.branch_address,
              account_number: created.account_number,
              ifsc_code: created.ifsc_code,
              tempKey: String(created.id)
            })
          }
          return b
        }))
      }

      cancelEdit()
    } catch (e) {
      console.error('Failed to save bank', e)
      alert('Failed to save bank: ' + (e.response?.data?.error || e.message))
    }
  }

  async function deleteBank(bank) {
    if (!bank.id) {
      alert('Cannot delete derived user entries')
      return
    }
    if (!window.confirm('Are you sure you want to delete this bank record?')) return
    try {
      await axios.delete(`${BASE_URL}/api/banks/${bank.id}`)
      // Update local state instead of refetching
      setBanks(currentBanks => currentBanks.filter(b => b.id !== bank.id))
    } catch (e) {
      console.error('Failed to delete bank', e)
      alert('Failed to delete bank: ' + (e.response?.data?.error || e.message))
    }
  }

  return (
    <div className="bank-root">
      <div className="bank-header">
        <h2>User Bank Accounts</h2>
        <div className="bank-actions">
          <input
            className="bank-search"
            placeholder="Search bank accounts..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="bank-table-wrap">
        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <table className="bank-table">
            <thead>
              <tr>
                <th>User Code</th>
                <th>User Name</th>
                <th>Name</th>
                <th>Branch Name</th>
                <th>Branch Address</th>
                <th>Account</th>
                <th>IFSC</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="muted">No banks found</td></tr>
              ) : (
                filtered.map(b => {
                  const isEditing = editingId === b.tempKey
                  const rowData = isEditing ? editData : b
                  
                  return (
                    <tr key={b.tempKey} className={isEditing ? 'editing' : ''}>
                      <td className="read-only">{b.user_code || ''}</td>
                      <td className="read-only">{b.user_name || ''}</td>
                      <td>
                        {isEditing ? (
                          <input
                            name="name"
                            value={rowData.name || ''}
                            onChange={(e) => handleInlineEdit(e.target.name, e.target.value)}
                          />
                        ) : (b.name || '')}
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            name="branch_name"
                            value={rowData.branch_name || ''}
                            onChange={(e) => handleInlineEdit(e.target.name, e.target.value)}
                          />
                        ) : (b.branch_name || '')}
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            name="branch_address"
                            value={rowData.branch_address || ''}
                            onChange={(e) => handleInlineEdit(e.target.name, e.target.value)}
                          />
                        ) : (b.branch_address || '')}
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            name="account_number"
                            value={rowData.account_number || ''}
                            onChange={(e) => handleInlineEdit(e.target.name, e.target.value)}
                          />
                        ) : (b.account_number || '')}
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            name="ifsc_code"
                            value={rowData.ifsc_code || ''}
                            onChange={(e) => handleInlineEdit(e.target.name, e.target.value)}
                          />
                        ) : (b.ifsc_code || '')}
                      </td>
                      <td>
                        {isEditing ? (
                          <>
                            <button className="btn primary" onClick={() => handleSave(b)}>Save</button>
                            <button className="btn" onClick={cancelEdit}>Cancel</button>
                          </>
                        ) : (
                          <>
                            <button 
                              className="btn edit" 
                              onClick={() => startEdit(b)}
                              title={b.id ? 'Edit bank details' : 'Edit derived user entry'}
                            >Edit</button>
                            <button
                              className="btn delete"
                              onClick={() => deleteBank(b)}
                              disabled={!b.id}
                              title={!b.id ? 'Cannot delete derived user entries' : 'Delete bank'}
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        )}
      </div>


    </div>
  )
}
