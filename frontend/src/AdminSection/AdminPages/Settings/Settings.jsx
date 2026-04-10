import React, { useState } from 'react';
import './settings.scss';

const Settings = () => {
  const [formData, setFormData] = useState({
    // General Settings
    companyName: 'Your Company Name',
    companyEmail: 'company@example.com',
    companyPhone: '+1 (555) 000-0000',
    companyWebsite: 'www.example.com',
    currency: 'USD',
    timezone: 'UTC',
    language: 'English',
    
    // Notifications
    emailNotifications: true,
    smsNotifications: false,
    orderNotifications: true,
    invoiceNotifications: true,
    userActivityNotifications: false,
    
    // Appearance
    theme: 'light',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    itemsPerPage: '25',
    
    // Security
    passwordExpiry: '90',
    sessionTimeout: '30',
    twoFactorAuth: false,
    loginAttempts: '5',
    
    // Backup & Storage
    autoBackup: true,
    backupFrequency: 'daily',
    dataRetention: '365',
  });

  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const renderGeneralSettings = () => (
    <div className="settings-form">
      <h3>Company Information</h3>
      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="companyName">Company Name *</label>
          <input
            type="text"
            id="companyName"
            name="companyName"
            value={formData.companyName}
            onChange={handleInputChange}
            placeholder="Enter company name"
          />
        </div>
        <div className="form-group">
          <label htmlFor="companyEmail">Company Email *</label>
          <input
            type="email"
            id="companyEmail"
            name="companyEmail"
            value={formData.companyEmail}
            onChange={handleInputChange}
            placeholder="company@example.com"
          />
        </div>
        <div className="form-group">
          <label htmlFor="companyPhone">Phone Number *</label>
          <input
            type="tel"
            id="companyPhone"
            name="companyPhone"
            value={formData.companyPhone}
            onChange={handleInputChange}
            placeholder="+1 (555) 000-0000"
          />
        </div>
        <div className="form-group">
          <label htmlFor="companyWebsite">Website</label>
          <input
            type="url"
            id="companyWebsite"
            name="companyWebsite"
            value={formData.companyWebsite}
            onChange={handleInputChange}
            placeholder="www.example.com"
          />
        </div>
      </div>

      <hr className="form-divider" />

      <h3>Regional Settings</h3>
      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="currency">Currency *</label>
          <select
            id="currency"
            name="currency"
            value={formData.currency}
            onChange={handleInputChange}
          >
            <option value="USD">USD - US Dollar</option>
            <option value="EUR">EUR - Euro</option>
            <option value="INR">INR - Indian Rupee</option>
            <option value="GBP">GBP - British Pound</option>
            <option value="JPY">JPY - Japanese Yen</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="timezone">Timezone *</label>
          <select
            id="timezone"
            name="timezone"
            value={formData.timezone}
            onChange={handleInputChange}
          >
            <option value="UTC">UTC (Coordinated Universal Time)</option>
            <option value="EST">EST (Eastern Standard Time)</option>
            <option value="CST">CST (Central Standard Time)</option>
            <option value="PST">PST (Pacific Standard Time)</option>
            <option value="IST">IST (Indian Standard Time)</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="language">Language *</label>
          <select
            id="language"
            name="language"
            value={formData.language}
            onChange={handleInputChange}
          >
            <option value="English">English</option>
            <option value="Spanish">Spanish</option>
            <option value="French">French</option>
            <option value="German">German</option>
            <option value="Hindi">Hindi</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="settings-form">
      <h3>Notification Preferences</h3>
      <p className="form-description">Choose how you want to receive notifications</p>
      
      <div className="notification-group">
        <div className="notification-item">
          <div className="notification-header">
            <h4>Email Notifications</h4>
            <label className="toggle-switch">
              <input
                type="checkbox"
                name="emailNotifications"
                checked={formData.emailNotifications}
                onChange={handleInputChange}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          <p>Receive important updates and alerts via email</p>
        </div>

        <div className="notification-item">
          <div className="notification-header">
            <h4>SMS Notifications</h4>
            <label className="toggle-switch">
              <input
                type="checkbox"
                name="smsNotifications"
                checked={formData.smsNotifications}
                onChange={handleInputChange}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          <p>Receive urgent alerts via SMS</p>
        </div>

        <h3 style={{ marginTop: '30px' }}>Notification Types</h3>

        <div className="checkbox-group">
          <label className="checkbox-item">
            <input
              type="checkbox"
              name="orderNotifications"
              checked={formData.orderNotifications}
              onChange={handleInputChange}
            />
            <span>Order Updates</span>
            <small>Get notified on new orders and status changes</small>
          </label>

          <label className="checkbox-item">
            <input
              type="checkbox"
              name="invoiceNotifications"
              checked={formData.invoiceNotifications}
              onChange={handleInputChange}
            />
            <span>Invoice & Payment</span>
            <small>Notifications about invoices and payments</small>
          </label>

          <label className="checkbox-item">
            <input
              type="checkbox"
              name="userActivityNotifications"
              checked={formData.userActivityNotifications}
              onChange={handleInputChange}
            />
            <span>User Activity</span>
            <small>Track user logins and activities</small>
          </label>
        </div>
      </div>
    </div>
  );

  const renderAppearanceSettings = () => (
    <div className="settings-form">
      <h3>Appearance & Display</h3>
      
      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="theme">Theme *</label>
          <select
            id="theme"
            name="theme"
            value={formData.theme}
            onChange={handleInputChange}
          >
            <option value="light">Light Mode</option>
            <option value="dark">Dark Mode</option>
            <option value="auto">Auto (System Default)</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="dateFormat">Date Format *</label>
          <select
            id="dateFormat"
            name="dateFormat"
            value={formData.dateFormat}
            onChange={handleInputChange}
          >
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            <option value="DD-MM-YYYY">DD-MM-YYYY</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="timeFormat">Time Format *</label>
          <select
            id="timeFormat"
            name="timeFormat"
            value={formData.timeFormat}
            onChange={handleInputChange}
          >
            <option value="24h">24 Hour (23:59)</option>
            <option value="12h">12 Hour (11:59 PM)</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="itemsPerPage">Items Per Page *</label>
          <select
            id="itemsPerPage"
            name="itemsPerPage"
            value={formData.itemsPerPage}
            onChange={handleInputChange}
          >
            <option value="10">10 items</option>
            <option value="25">25 items</option>
            <option value="50">50 items</option>
            <option value="100">100 items</option>
          </select>
        </div>
      </div>

      <div className="theme-preview">
        <h4>Current Theme Preview</h4>
        <div className={`preview-box ${formData.theme}`}>
          <div className="preview-header">Dashboard</div>
          <div className="preview-content">
            <div className="preview-card">Sample Card</div>
            <div className="preview-card">Sample Card</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="settings-form">
      <h3>Security & Access Control</h3>
      
      <div className="security-warning">
        <span className="warning-icon">⚠️</span>
        <div>
          <strong>Security Tip:</strong> Regularly review these settings to protect your account and business data.
        </div>
      </div>

      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="passwordExpiry">Password Expiry (Days) *</label>
          <input
            type="number"
            id="passwordExpiry"
            name="passwordExpiry"
            value={formData.passwordExpiry}
            onChange={handleInputChange}
            min="0"
            max="365"
          />
          <small>Users must change password after this period</small>
        </div>

        <div className="form-group">
          <label htmlFor="sessionTimeout">Session Timeout (Minutes) *</label>
          <input
            type="number"
            id="sessionTimeout"
            name="sessionTimeout"
            value={formData.sessionTimeout}
            onChange={handleInputChange}
            min="5"
            max="480"
          />
          <small>Users will be logged out after inactivity</small>
        </div>

        <div className="form-group">
          <label htmlFor="loginAttempts">Max Login Attempts *</label>
          <input
            type="number"
            id="loginAttempts"
            name="loginAttempts"
            value={formData.loginAttempts}
            onChange={handleInputChange}
            min="1"
            max="10"
          />
          <small>Account will be locked after failed attempts</small>
        </div>
      </div>

      <div className="security-options">
        <div className="security-item">
          <div className="security-header">
            <h4>Two-Factor Authentication</h4>
            <label className="toggle-switch">
              <input
                type="checkbox"
                name="twoFactorAuth"
                checked={formData.twoFactorAuth}
                onChange={handleInputChange}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          <p>Require two-factor authentication for all users</p>
        </div>
      </div>
    </div>
  );

  const renderBackupSettings = () => (
    <div className="settings-form">
      <h3>Backup & Data Management</h3>

      <div className="backup-status">
        <div className="status-card success">
          <div className="status-icon">✅</div>
          <div className="status-info">
            <h4>Last Backup</h4>
            <p>Today at 2:30 AM</p>
          </div>
        </div>
        <div className="status-card">
          <div className="status-icon">📊</div>
          <div className="status-info">
            <h4>Storage Used</h4>
            <p>2.5 GB of 100 GB</p>
          </div>
        </div>
      </div>

      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="backupFrequency">Backup Frequency *</label>
          <select
            id="backupFrequency"
            name="backupFrequency"
            value={formData.backupFrequency}
            onChange={handleInputChange}
          >
            <option value="hourly">Hourly</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="dataRetention">Data Retention (Days) *</label>
          <input
            type="number"
            id="dataRetention"
            name="dataRetention"
            value={formData.dataRetention}
            onChange={handleInputChange}
            min="30"
            max="3650"
          />
          <small>Keep backups for this many days</small>
        </div>
      </div>

      <div className="backup-options">
        <div className="backup-item">
          <div className="backup-header">
            <h4>Automatic Backups</h4>
            <label className="toggle-switch">
              <input
                type="checkbox"
                name="autoBackup"
                checked={formData.autoBackup}
                onChange={handleInputChange}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          <p>Enable automatic backups of your data</p>
        </div>
      </div>

      <div className="backup-actions">
        <button className="btn btn-secondary">
          Download Backup
        </button>
        <button className="btn btn-secondary">
          Restore from Backup
        </button>
      </div>
    </div>
  );

  return (
    <div className="settings-container">
      <div className="settings-header">
        <div>
          <h1>Settings</h1>
          <p>Manage your ERP system configuration and preferences</p>
        </div>
      </div>

      {saveSuccess && (
        <div className="success-banner">
          ✓ Settings saved successfully!
        </div>
      )}

        {/* Main Content */}
        <main className="settings-content">
          <div className="settings-cards">
            <div className="settings-card">{renderGeneralSettings()}</div>
            <div className="settings-card">{renderNotificationSettings()}</div>
            <div className="settings-card">{renderAppearanceSettings()}</div>
            <div className="settings-card">{renderSecuritySettings()}</div>
            <div className="settings-card">{renderBackupSettings()}</div>
          </div>

          {/* Action Buttons */}
          <div className="settings-actions">
            <button className="btn btn-secondary">Cancel</button>
            <button className="btn btn-primary" onClick={handleSave}>
              💾 Save Changes
            </button>
          </div>
        </main>
      
    </div>
  );
};

export default Settings;
