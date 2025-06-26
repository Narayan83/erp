import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChartLine, FaUsersCog, FaCalendarCheck, FaUserClock, FaRoute, FaArrowLeft, FaCheck, FaPencilAlt, FaCog } from 'react-icons/fa';
import { MdMissedVideoCall } from 'react-icons/md';
import './_customize.scss';

const ReportCard = ({ title, description, icon }) => (
  <div className="report-card">
    <div className="card-header">
      <div className="icon">{icon}</div>
      <h3>{title}</h3>
    </div>
    <p>{description}</p>
  </div>
);

const DataFieldsSelector = () => {
  const [selectedFields, setSelectedFields] = useState({
    business: true,
    name: true,
    designation: true,
    mobile: true,
    email: true,
    website: true,
    country: true,
    state: true,
    city: true,
    GSTIN: true,
    source: true,
    product: true,
    potential: true,
    assignedTo: true,
    requirements: true,
    notes: true,
    since: true,
    lastTalk: true,
    nextAction: true,
    transfer: true
  });
  
  const [customField, setCustomField] = useState('');
  const [customFieldChecked, setCustomFieldChecked] = useState(false);

  const handleFieldChange = (fieldName) => {
    if (fieldName === 'business' || fieldName === 'name') return; // These are disabled
    
    setSelectedFields(prev => ({
      ...prev,
      [fieldName]: !prev[fieldName]
    }));
  };

  const handleCustomFieldChange = (event) => {
    setCustomField(event.target.value);
  };

  const handleCustomFieldCheckbox = () => {
    setCustomFieldChecked(!customFieldChecked);
  };

  const fieldLabels = {
    business: 'Business',
    name: 'Name',
    designation: 'Designation',
    mobile: 'Mobile',
    email: 'Email',
    website: 'Website',
    country: 'Country',
    state: 'State',
    city: 'City',
    GSTIN: 'GSTIN',
    source: 'Source',
    product: 'Product',
    potential: 'Potential',
    assignedTo: 'Assigned To',
    requirements: 'Requirements',
    notes: 'Notes',
    since: 'Since',
    lastTalk: 'Last Talk',
    nextAction: 'Next Action',
    transfer: 'Transfer on'
  };

  return (
    <div className="data-fields-selector">
      <h3>Data Fields</h3>
      <p className="subtitle">What columns do you wish to see in your lead list?</p>
      
      <div className="fields-grid">
        {Object.entries(fieldLabels).map(([fieldName, label]) => {
          const isDisabled = fieldName === 'business' || fieldName === 'name';
          const isChecked = selectedFields[fieldName];
          
          return (
            <label 
              key={fieldName} 
              className={`field-option ${isDisabled ? 'disabled' : ''} ${isChecked ? 'checked' : ''}`}
            >
              <input
                type="checkbox"
                checked={isChecked}
                disabled={isDisabled}
                onChange={() => handleFieldChange(fieldName)}
              />
              <span className="checkmark">
                {isChecked && <FaCheck />}
              </span>
              <span className="field-label">{label}</span>
            </label>
          );
        })}
      </div>
      
      <div className="custom-field-section">
        <div className={`field-option custom-field ${customField ? 'has-value' : ''}`}>
          <div className="checkmark">
            <input
              type="checkbox"
              checked={customFieldChecked}
              onChange={handleCustomFieldCheckbox}
            />
            {customFieldChecked && <FaCheck className="tick-icon" />}
          </div>
          <div className="custom-field-wrapper">
            <input
              type="text"
              placeholder="Enter field"
              value={customField}
              onChange={handleCustomFieldChange}
              className="custom-field-input"
            />
          </div>
          <div className="right-mark">✓</div>
        </div>
      </div>
    </div>
  );
};

const ProspectFunnel = () => {
  const [activeStage, setActiveStage] = useState(0);
  
  const stages = [
    'Raw Lead',
    'New',
    'Discussion',
    'Demo',
    'Proposal',
    'Decided',
    'Customer'
  ];

  const handleStageClick = (index) => {
    setActiveStage(index);
  };

  return (
    <div className="prospect-funnel">
      <div className="funnel-header">
        <h3>
          Prospect Conversion Funnel
          <FaPencilAlt className="edit-icon" />
        </h3>
      </div>
      
      <p className="funnel-subtitle">
        Leads will be auto imported as Raw Leads (i.e. Unqualified). You can set up five stages to track progress till conversion to customer.
      </p>
      
      <div className="stages-container">
        {stages.map((stage, index) => (
          <button
            key={index}
            className={`stage-button ${activeStage === index ? 'active' : ''}`}
            onClick={() => handleStageClick(index)}
            data-stage={index}
          >
            {stage}
          </button>
        ))}
      </div>
    </div>
  );
};

const Customize = () => {
  const navigate = useNavigate();
  const [customerType, setCustomerType] = useState('');

  const handleBack = () => {
    navigate(-1);
  };

  const handleCustomerTypeChange = (event) => {
    setCustomerType(event.target.value);
  };

  return (
    // Add a wrapper class for responsive width
    <div className="customize-main-wrapper">
      <div className="customize-container">
        <div className="header">
          <h2>Customization (CRM)</h2>
          <button className="back-btn" onClick={handleBack}>
            <FaArrowLeft style={{ marginRight: '5px' }} />
            Back
          </button>
        </div>
        <div className="custom-nav-buttons">
  {[
    'Customer Type',
    'Data Fields',
    'Prospect Funnel',
    'Platform Integrations',
    'Email Integration',
    'Policies'
  ].map((label, index) => (
    <button key={index} className="nav-btn">{label}</button>
  ))}
</div>
      
      <div className="customer-type-section">
        <h3>Customer Type</h3>
        <div className="question-row">
          <h4>Who do you sell to?</h4>
          <div className="radio-group">
            <label className="radio-option">
              <input
                type="radio"
                name="customerType"
                value="business"
                checked={customerType === 'business'}
                onChange={handleCustomerTypeChange}
              />
              <span className="radio-label">Business</span>
            </label>
            
            <label className="radio-option">
              <input
                type="radio"
                name="customerType"
                value="individual"
                checked={customerType === 'individual'}
                onChange={handleCustomerTypeChange}
              />
              <span className="radio-label">Individual</span>
            </label>
            
            <label className="radio-option">
              <input
                type="radio"
                name="customerType"
                value="both"
                checked={customerType === 'both'}
                onChange={handleCustomerTypeChange}
              />
              <span className="radio-label">Both</span>
            </label>
          </div>
        </div>
      </div>

      <DataFieldsSelector />
      
      <ProspectFunnel />

      <PlatformIntegrations />
      
      <EmailPoliciesSection />
    </div>
    </div>
  );
};

const PlatformIntegrations = () => {
  const [connectedPlatforms, setConnectedPlatforms] = useState(new Set());
  const [loadingPlatforms, setLoadingPlatforms] = useState(new Set());

  const platforms = [
    { id: 'indiamart', name: 'IndiaMART', icon: null, fallbackClass: 'indiamart' },
    { id: 'tradeindia', name: 'TradeIndia', icon: null, fallbackClass: 'tradeindia' },
    { id: 'justdial', name: 'JustDial', icon: null, fallbackClass: 'justdial' },
    { id: 'meta', name: 'Meta', icon: null, fallbackClass: 'meta' },
    { id: 'housing', name: 'Housing.com', icon: null, fallbackClass: 'housing' },
    { id: 'acres99', name: '99acres', icon: null, fallbackClass: 'acres99' },
    { id: 'magicbricks', name: 'MagicBricks', icon: null, fallbackClass: 'magicbricks' },
    { id: 'website', name: 'Custom Website', icon: null, fallbackClass: 'website' }
  ];

  const handlePlatformClick = (platformId) => {
    if (loadingPlatforms.has(platformId)) return;

    setLoadingPlatforms(prev => new Set([...prev, platformId]));

    setTimeout(() => {
      setConnectedPlatforms(prev => {
        const updated = new Set(prev);
        if (updated.has(platformId)) updated.delete(platformId);
        else updated.add(platformId);
        return updated;
      });

      setLoadingPlatforms(prev => {
        const updated = new Set(prev);
        updated.delete(platformId);
        return updated;
      });
    }, 1500);
  };

  const getCardClasses = (id) => {
    let classes = 'platform-card';
    if (connectedPlatforms.has(id)) classes += ' connected';
    if (loadingPlatforms.has(id)) classes += ' loading';
    return classes;
  };

  const getIconClasses = (platform) => {
    let classes = 'platform-icon';
    if (!platform.icon) {
      classes += ` fallback-icon ${platform.fallbackClass}`;
    }
    return classes;
  };

  return (
    <div className="platform-integrations">
      <div className="integration-header">
        <h3>Platform Integrations</h3>
        <p className="integration-subtitle">
          Import leads from popular platforms and your own website.
        </p>
      </div>

      <div className="platforms-container">
        {platforms.map((platform) => (
          <div
            key={platform.id}
            className={getCardClasses(platform.id)}
            onClick={() => handlePlatformClick(platform.id)}
          >
            <div className={getIconClasses(platform)}>
              {platform.icon ? (
                <img src={platform.icon} alt={platform.name} />
              ) : (
                <span>{platform.name.charAt(0)}</span>
              )}
            </div>
            <p className="platform-name">{platform.name}</p>
          </div>
        ))}
      </div>

      <div className="integration-status">
        <p className="status-text">
          <span className="connected-count">{connectedPlatforms.size}</span> of {platforms.length} platforms connected
        </p>
      </div>
    </div>
  );
};

// Emali Policies Section

const EmailPoliciesSection = () => {
  const [salesMode, setSalesMode] = useState('india');

  const handleSalesModeChange = (event) => {
    setSalesMode(event.target.value);
  };

  return (
    <div className="email-policies-section">
      {/* Email Integration Section */}
      <div className="email-integration">
        <h3>Email Integration</h3>
        <p className="integration-subtext">
          Send Lead assignment alerts, follow-ups, quotes, invoices, from your own email account.
        </p>
        <button className="configure-btn email-configure">
          <FaCog className="gear-icon" />
          Configure
        </button>
      </div>

      {/* Policies Section */}
      <div className="policies-section">
        <h3>Policies</h3>
        <div className="policies-cards">
          {/* Auto-Assignment Card */}
          <div className="policy-card">
            <div className="card-header">
              <h4>Auto-Assignment</h4>
              <span className="status-label inactive">Inactive</span>
            </div>
            <p className="card-description">
              Assign leads automatically by selecting a Sales Executive from the list.
            </p>
            <button className="configure-btn">
              <FaCog className="gear-icon" />
              Configure
            </button>
          </div>

          {/* Duplication Card */}
          <div className="policy-card">
            <div className="card-header">
              <h4>Duplication</h4>
              <span className="status-label disallowed">Disallowed</span>
            </div>
            <p className="card-description">
              Do you want to allow duplicate leads?
            </p>
            <button className="allow-btn">
              <FaCheck className="check-icon" />
              Allow
            </button>
          </div>

          {/* Sales Mode Card */}
          <div className="policy-card">
            <div className="card-header">
              <h4>Sales Mode</h4>
            </div>
            <p className="card-description">
              Choose your sales mode to define your sales reach.
            </p>
            <div className="radio-group sales-mode">
              <label className="radio-option">
                <input
                  type="radio"
                  name="salesMode"
                  value="india"
                  checked={salesMode === 'india'}
                  onChange={handleSalesModeChange}
                />
                <span className="radio-label">India only</span>
              </label>
              
              <label className="radio-option">
                <input
                  type="radio"
                  name="salesMode"
                  value="global"
                  checked={salesMode === 'global'}
                  onChange={handleSalesModeChange}
                />
                <span className="radio-label">Global</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Customize;
