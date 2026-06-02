import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { CircularProgress, Alert } from '@mui/material';
import { useAuth } from '../../../context/AuthContext';
import { BASE_URL } from '../../../config/Config';
import './profile.scss';

function ProfileField({ label, value }) {
  const display = value === null || value === undefined || value === '' ? '—' : String(value);
  return (
    <div className="profile-field">
      <span className="label">{label}</span>
      <span className="value">{display}</span>
    </div>
  );
}

function formatDate(d) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString();
  } catch {
    return d;
  }
}

function accountTypeLabels(u) {
  const types = [];
  if (u.is_user) types.push('User');
  if (u.is_customer) types.push('Customer');
  if (u.is_supplier) types.push('Supplier');
  if (u.is_dealer) types.push('Dealer');
  if (u.is_distributor) types.push('Distributor');
  if (u.is_employee) types.push('Employee');
  return types.length ? types.join(', ') : '—';
}

export default function Profile() {
  const { user: authUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [roles, setRoles] = useState([]);

  const userId = authUser?.id;

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      setError('Not logged in. Please sign in again.');
      return;
    }

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [userRes, rolesRes] = await Promise.all([
          axios.get(`${BASE_URL}/api/users/${userId}`),
          axios.get(`${BASE_URL}/api/user/${userId}`).catch(() => ({ data: [] })),
        ]);
        const u = userRes.data?.user || userRes.data;
        const roleList = Array.isArray(rolesRes.data) ? rolesRes.data : (rolesRes.data?.roles || []);
        setUser(u);
        setRoles(roleList);
        const name = [u.firstname, u.lastname].filter(Boolean).join(' ').trim() || u.email || 'User';
        const roleLabel = roleList.length ? roleList.map((r) => r.name || r.Name).filter(Boolean).join(', ') : 'User';
        try {
          localStorage.setItem('userProfile', JSON.stringify({ name, role: roleLabel, avatar: null }));
          window.dispatchEvent(new Event('userProfileUpdated'));
        } catch { /* ignore */ }
      } catch (err) {
        setError(err?.response?.data?.error || err.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  if (loading) {
    return (
      <div className="profile-page profile-page--centered">
        <CircularProgress />
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-page">
        <Alert severity="error">{error}</Alert>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="profile-page">
        <Alert severity="warning">No profile data available.</Alert>
      </div>
    );
  }

  const fullName = [user.salutation, user.firstname, user.lastname].filter(Boolean).join(' ');
  const addresses = user.addresses || [];
  const banks = user.bank_accounts || [];
  const documents = user.documents || [];

  return (
    <div className="profile-page">
      <h1 className="profile-page-title">My Profile</h1>

      <section className="profile-card profile-card--hero">
        <div className="profile-avatar">
          <div className="avatar-placeholder" aria-hidden>
            {(user.firstname?.[0] || '') + (user.lastname?.[0] || user.email?.[0] || 'U')}
          </div>
        </div>
        <div className="profile-hero-info">
          <h2 className="name">{fullName || user.email}</h2>
          <p className="profile-sub">{user.email}</p>
          <p className="profile-sub">
            <span className={`status-pill ${user.active ? 'active' : 'inactive'}`}>
              {user.active ? 'Active' : 'Inactive'}
            </span>
            {user.usercode && <span className="user-code">Code: {user.usercode}</span>}
          </p>
          {roles.length > 0 && (
            <p className="profile-roles">
              Roles: {roles.map((r) => r.name || r.Name).filter(Boolean).join(', ')}
            </p>
          )}
        </div>
      </section>

      <section className="profile-section">
        <h3>Account type</h3>
        <ProfileField label="Types" value={accountTypeLabels(user)} />
        <ProfileField label="Username" value={user.username} />
      </section>

      <section className="profile-section">
        <h3>Personal</h3>
        <div className="profile-grid">
          <ProfileField label="Salutation" value={user.salutation} />
          <ProfileField label="First name" value={user.firstname} />
          <ProfileField label="Last name" value={user.lastname} />
          <ProfileField label="Gender" value={user.gender} />
          <ProfileField label="Date of birth" value={formatDate(user.dob)} />
        </div>
      </section>

      <section className="profile-section">
        <h3>Contact</h3>
        <div className="profile-grid">
          <ProfileField label="Mobile" value={user.mobile_number} />
          <ProfileField label="WhatsApp" value={user.whatsapp_number} />
          <ProfileField label="Emergency" value={user.emergency_number} />
          <ProfileField label="Alternate" value={user.alternate_number} />
          <ProfileField label="Email" value={user.email} />
          <ProfileField label="Website" value={user.website} />
          <ProfileField label="Country" value={user.country} />
          <ProfileField label="Country code" value={user.country_code} />
        </div>
      </section>

      {(user.is_customer || user.is_supplier || user.is_dealer || user.is_distributor) && (
        <section className="profile-section">
          <h3>Business</h3>
          <div className="profile-grid">
            <ProfileField label="Business name" value={user.business_name} />
            <ProfileField label="Company" value={user.company_name} />
            <ProfileField label="Industry" value={user.industry_segment} />
            <ProfileField label="Designation" value={user.designation} />
            <ProfileField label="Title" value={user.title} />
          </div>
        </section>
      )}

      <section className="profile-section">
        <h3>Legal / tax IDs</h3>
        <div className="profile-grid">
          <ProfileField label="Aadhar" value={user.aadhar_number} />
          <ProfileField label="PAN" value={user.pan_number} />
          <ProfileField label="GSTIN" value={user.gstin_number} />
          <ProfileField label="MSME" value={user.msme_no} />
        </div>
      </section>

      {addresses.length > 0 && (
        <section className="profile-section">
          <h3>Addresses ({addresses.length})</h3>
          {addresses.map((addr) => (
            <div key={addr.id || addr.ID} className="profile-subcard">
              <ProfileField label="Title" value={addr.title || addr.Title} />
              <ProfileField label="Line 1" value={addr.address_line1 || addr.AddressLine1} />
              <ProfileField label="City" value={addr.city || addr.City} />
              <ProfileField label="State" value={addr.state || addr.State} />
              <ProfileField label="Pincode" value={addr.pincode || addr.Pincode} />
            </div>
          ))}
        </section>
      )}

      {banks.length > 0 && (
        <section className="profile-section">
          <h3>Bank accounts ({banks.length})</h3>
          {banks.map((b) => (
            <div key={b.id || b.ID} className="profile-subcard">
              <ProfileField label="Bank" value={b.bank_name || b.BankName} />
              <ProfileField label="Account" value={b.account_number || b.AccountNumber} />
              <ProfileField label="IFSC" value={b.ifsc || b.IFSC} />
              <ProfileField label="Branch" value={b.branch || b.Branch} />
            </div>
          ))}
        </section>
      )}

      {documents.length > 0 && (
        <section className="profile-section">
          <h3>Documents ({documents.length})</h3>
          {documents.map((doc) => (
            <div key={doc.id || doc.ID} className="profile-subcard">
              <ProfileField label="Type" value={doc.doc_type || doc.DocType} />
              <ProfileField label="Number" value={doc.doc_number || doc.DocNumber} />
            </div>
          ))}
        </section>
      )}

      <section className="profile-section profile-section--meta">
        <ProfileField label="Member since" value={formatDate(user.created_at)} />
        <ProfileField label="Last updated" value={formatDate(user.updated_at)} />
      </section>
    </div>
  );
}
