import React, { useState } from 'react';
import { FaFileExcel, FaCloud, FaFacebook, FaGlobe } from 'react-icons/fa';
import IndiaMartIntegration from './IndiaMartIntegration';
import LeadsCSVImport from './LeadsCSVImport';
import './import_leads_dialog.scss';

const Tile = ({ children, onClick, title }) => (
  <div className="import-tile" onClick={onClick} title={title}>
    {children}
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
              <Tile onClick={() => setShowCSVImport(true)} title="Upload CSV">
                <FaFileExcel className="tile-icon excel" />
                <div className="tile-label">Excel/CSV</div>
              </Tile>
              <Tile onClick={() => setActiveIntegration('indiamart')} title="Fetch from IndiaMART">
                <FaGlobe className="tile-icon" />
                <div className="tile-label">Indiamart</div>
              </Tile>
              <Tile>
                <FaFacebook className="tile-icon" />
                <div className="tile-label">Meta</div>
              </Tile>
            </div>
          </section>

          <section className="integration-section">
            <h4>Push Integrations</h4>
            <p className="muted">Leads from these sources will be directly fetched and imported.</p>
            <div className="tiles">
              <Tile>
                <FaCloud className="tile-icon" />
                <div className="tile-label">Justdial</div>
              </Tile>
              <Tile>
                <FaCloud className="tile-icon" />
                <div className="tile-label">MB</div>
              </Tile>
              <Tile>
                <FaGlobe className="tile-icon" />
                <div className="tile-label">Indiamart</div>
              </Tile>
              <Tile>
                <FaGlobe className="tile-icon" />
                <div className="tile-label">Website</div>
              </Tile>
            </div>
          </section>

          <section className="integration-section">
            <h4>No Integrations</h4>
            <p className="muted">Please visit customization to set up your integrations with these sources.</p>
            <div className="tiles">
              <Tile>
                <FaGlobe className="tile-icon" />
                <div className="tile-label">TradeIndia</div>
              </Tile>
              <Tile>
                <FaGlobe className="tile-icon" />
                <div className="tile-label">Housing</div>
              </Tile>
              <Tile>
                <FaGlobe className="tile-icon" />
                <div className="tile-label">99acres</div>
              </Tile>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ImportLeadsDialog;
