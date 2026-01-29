import React, { useState } from 'react';
import IndiaMartIntegration from './IndiaMartIntegration';
import LeadsCSVImport from './LeadsCSVImport';
import excelImg from '../../../assets/images/excel.png';
import indiamartImg from '../../../assets/images/indaimart.webp';
import metaImg from '../../../assets/images/meta.png';
import justdialImg from '../../../assets/images/justdial.png';
import mbImg from '../../../assets/images/mb.png';
import webImg from '../../../assets/images/web.png';
import tradindiaImg from '../../../assets/images/tradindia.png';
import housingImg from '../../../assets/images/housing.png';
import acresImg from '../../../assets/images/99acres.png';
import './import_leads_dialog.scss';

const Tile = ({ imgSrc, label, onClick, title }) => (
  <div className="import-tile" onClick={onClick} title={title}>
    {imgSrc && <img src={imgSrc} alt={label} className="tile-icon-img" />}
    <div className="tile-label">{label}</div>
  </div>
);

const ImportLeadsDialog = ({ isOpen, onClose, onExcelClick, onLeadsImport }) => {
  const [activeIntegration, setActiveIntegration] = useState(null);
  const [showCSVImport, setShowCSVImport] = useState(false);

  if (!isOpen) return null;

  // Show CSV import dialog
  if (showCSVImport) {
    return (
      <LeadsCSVImport
        isOpen={showCSVImport}
        onClose={() => {
          setShowCSVImport(false);
          onClose();
        }}
        onImportSuccess={() => {
          if (onLeadsImport) {
            onLeadsImport([]);
          }
          setShowCSVImport(false);
          onClose();
        }}
      />
    );
  }

  // If an integration is active, show that component
  if (activeIntegration === 'indiamart') {
    return (
      <div className="import-dialog-overlay" onMouseDown={(e) => { if (e.target.className === 'import-dialog-overlay') setActiveIntegration(null); }}>
        <div className="dialog-content integration-view">
          <div className="dialog-header">
            <button className="back-btn" onClick={() => setActiveIntegration(null)}>← Back</button>
            <h3>IndiaMART</h3>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
          <IndiaMartIntegration
            onClose={() => setActiveIntegration(null)}
            onImport={(leads) => {
              if (onLeadsImport) {
                onLeadsImport(leads);
              }
              onClose();
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="import-dialog-overlay" onMouseDown={(e) => { if (e.target.className === 'import-dialog-overlay') onClose(); }}>
      <div className="dialog-content">
        <div className="dialog-header">
          <h3>Import Leads</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="dialog-body">
          <section className="integration-section">
            <h4>Pull Integrations</h4>
            <p className="muted">Click below to fetch leads from these sources.</p>
            <div className="tiles">
              <Tile imgSrc={excelImg} onClick={() => setShowCSVImport(true)} title="Upload CSV" />
              <Tile imgSrc={indiamartImg} onClick={() => setActiveIntegration('indiamart')} title="Fetch from IndiaMART" />
              <Tile imgSrc={metaImg} title={"Fetch from meta"}/>
            </div>
          </section>

          <section className="integration-section">
            <h4>Push Integrations</h4>
            <p className="muted">Leads from these sources will be directly fetched and imported.</p>
            <div className="tiles">
              <Tile imgSrc={justdialImg} title={"Fetch from JustDial"}/>
              <Tile imgSrc={mbImg} title={"Fetch from Magicbricks"}/>
              <Tile imgSrc={indiamartImg} title={"Fetch from IndiaMART"}/>
              <Tile imgSrc={webImg} title={"Fetch from Website"}/>
            </div>
          </section>

          <section className="integration-section">
            <h4>No Integrations</h4>
            <p className="muted">Please visit customization to set up your integrations with these sources.</p>
            <div className="tiles">
              <Tile imgSrc={tradindiaImg} title={"Fetch from TradeIndia"} />
              <Tile imgSrc={housingImg} title={"Fetch from Housing"} />
              <Tile imgSrc={acresImg} title={"Fetch from 99acres"} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ImportLeadsDialog;
