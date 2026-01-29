import React, { useState, useEffect } from "react";
import axios from "axios";
import { BASE_URL } from "../../../config/Config";
import "../Email/Email.scss";
import "./Integrations.scss";

const INDiamart_INIT = { keyId: "", keySecret: "" };
const RAZORPAY_INIT = { keyId: "", keySecret: "" };
const TRADE_INIT = { userId: "", profileId: "", key: "" };
const RENAV_INIT = { mobile: "" };
const ACRES_INIT = { username: "", password: "" };

export default function Integrations({ isOpen = false, onClose = () => {}, onSaveIntegration }) {
  const [indiamart, setIndiamart] = useState(INDiamart_INIT);
  const [razorpay, setRazorpay] = useState(RAZORPAY_INIT);
  const [trade, setTrade] = useState(TRADE_INIT);
  const [renav, setRenav] = useState(RENAV_INIT);
  const [acres, setAcres] = useState(ACRES_INIT);

  // saved state per integration
  const [indiamartSaved, setIndiamartSaved] = useState(false);
  const [indiamartSavedData, setIndiamartSavedData] = useState(null);
  const [razorpaySaved, setRazorpaySaved] = useState(false);
  const [razorpaySavedData, setRazorpaySavedData] = useState(null);
  const [tradeSaved, setTradeSaved] = useState(false);
  const [tradeSavedData, setTradeSavedData] = useState(null);
  const [renavSaved, setRenavSaved] = useState(false);
  const [renavSavedData, setRenavSavedData] = useState(null);
  const [acresSaved, setAcresSaved] = useState(false);
  const [acresSavedData, setAcresSavedData] = useState(null);

  const fetchIntegrations = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/integrations`);
      const data = res.data || [];
      
      data.forEach(item => {
        if (item.type === 'lead_platform' && item.provider === 'indiamart') {
          setIndiamartSavedData(item.config);
          setIndiamartSaved(true);
        } else if (item.type === 'payment' && item.provider === 'razorpay') {
          setRazorpaySavedData(item.config);
          setRazorpaySaved(true);
        } else if (item.type === 'lead_platform' && item.provider === 'tradeindia') {
          setTradeSavedData(item.config);
          setTradeSaved(true);
        } else if (item.type === 'whatsapp' && item.provider === 'renav') {
          setRenavSavedData(item.config);
          setRenavSaved(true);
        } else if (item.type === 'lead_platform' && item.provider === '99acres') {
          setAcresSavedData(item.config);
          setAcresSaved(true);
        }
      });
    } catch (error) {
      console.error("Error fetching integrations:", error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      // reset to initial values whenever modal opens
      setIndiamart(INDiamart_INIT);
      setRazorpay(RAZORPAY_INIT);
      setTrade(TRADE_INIT);
      setRenav(RENAV_INIT);
      setAcres(ACRES_INIT);

      fetchIntegrations();
    }
  }, [isOpen]);

  const handleSave = async (type, provider, config, name, setSaved, setSavedData) => {
    try {
      if (onSaveIntegration) {
        await onSaveIntegration(type, provider, config, name);
        setSavedData(config);
        setSaved(true);
      }
    } catch (error) {
      alert(`Failed to save ${name} integration`);
    }
  };

  if (!isOpen) return null;

  const handleCopyJustDial = () => {
    const text = "https://biziverse.com/External.asmx/setJDLead?mob=9449804522";
    if (navigator.clipboard) navigator.clipboard.writeText(text);
    else console.log("Copy: ", text);
  };

  return (
    <div className="tandc-overlay" onClick={onClose}>
      <div className="tandc-dialog large integrations-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="tandc-dialog-header">
          <div className="title">Integration</div>
          <div className="actions">
            <button className="close" onClick={onClose}>✕</button>
          </div>
        </div>

        <div className="tandc-dialog-body">
          <div className="integration-grid">
            <div className="integration-card">
              <div className="integration-title">IndiaMART</div>
              {indiamartSaved ? (
                <>
                  <div className="tandc-item"><div className="tandc-name">Mobile: {indiamartSavedData.keyId}</div></div>
                  <div className="tandc-item"><div className="tandc-name">Key: {indiamartSavedData.keySecret}</div></div>
                  <div className="integration-actions">
                    <button className="btn-primary small yellow" onClick={() => { setIndiamart(indiamartSavedData); setIndiamartSaved(false); }}>Edit</button>
                  </div>
                </>
              ) : (
                <>
                  <div className="integration-row"><label>Mobile :</label><input value={indiamart.keyId} onChange={(e)=>setIndiamart({...indiamart, keyId: e.target.value})} type="text" /></div>
                  <div className="integration-row"><label>Key :</label><input value={indiamart.keySecret} onChange={(e)=>setIndiamart({...indiamart, keySecret: e.target.value})} type="text" /></div>
                  <div className="integration-actions">
                    <button className="btn-primary save green" onClick={() => handleSave('lead_platform', 'indiamart', indiamart, 'IndiaMART', setIndiamartSaved, setIndiamartSavedData)}>Save</button>
                    <button className="btn-secondary" style={{marginLeft:8}} onClick={() => setIndiamart(INDiamart_INIT)}>Cancel</button>
                  </div>
                </>
              )}
            </div>

            <div className="integration-card">
              <div className="integration-title">Razorpay</div>
              {razorpaySaved ? (
                <>
                  <div className="tandc-item"><div className="tandc-name">Key ID: {razorpaySavedData.keyId}</div></div>
                  <div className="tandc-item"><div className="tandc-name">Key Secret: {razorpaySavedData.keySecret}</div></div>
                  <div className="integration-actions">
                    <button className="btn-primary small yellow" onClick={() => { setRazorpay(razorpaySavedData); setRazorpaySaved(false); }}>Edit</button>
                  </div>
                </>
              ) : (
                <>
                  <div className="integration-row"><label>Key ID :</label><input value={razorpay.keyId} onChange={(e)=>setRazorpay({...razorpay, keyId: e.target.value})} type="text" /></div>
                  <div className="integration-row"><label>Key Secret :</label><input value={razorpay.keySecret} onChange={(e)=>setRazorpay({...razorpay, keySecret: e.target.value})} type="text" /></div>
                  <div className="integration-actions">
                    <button className="btn-primary save green" onClick={() => handleSave('payment', 'razorpay', razorpay, 'Razorpay', setRazorpaySaved, setRazorpaySavedData)}>Save</button>
                    <button className="btn-secondary" style={{marginLeft:8}} onClick={() => setRazorpay(RAZORPAY_INIT)}>Cancel</button>
                  </div>
                </>
              )}
            </div>

            <div className="integration-card">
              <div className="integration-title">TradeIndia</div>
              {tradeSaved ? (
                <>
                  <div className="tandc-item"><div className="tandc-name">User ID: {tradeSavedData.userId}</div></div>
                  <div className="tandc-item"><div className="tandc-name">Profile ID: {tradeSavedData.profileId}</div></div>
                  <div className="tandc-item"><div className="tandc-name">Key: {tradeSavedData.key}</div></div>
                  <div className="integration-actions">
                    <button className="btn-primary small yellow" onClick={() => { setTrade(tradeSavedData); setTradeSaved(false); }}>Edit</button>
                  </div>
                </>
              ) : (
                <>
                  <div className="integration-row"><label>User ID :</label><input value={trade.userId} onChange={(e)=>setTrade({...trade, userId: e.target.value})} type="text" /></div>
                  <div className="integration-row"><label>Profile ID :</label><input value={trade.profileId} onChange={(e)=>setTrade({...trade, profileId: e.target.value})} type="text" /></div>
                  <div className="integration-row"><label>Key :</label><input value={trade.key} onChange={(e)=>setTrade({...trade, key: e.target.value})} type="text" /></div>
                  <div className="integration-actions">
                    <button className="btn-primary save green" onClick={() => handleSave('lead_platform', 'tradeindia', trade, 'TradeIndia', setTradeSaved, setTradeSavedData)}>Save</button>
                    <button className="btn-secondary" style={{marginLeft:8}} onClick={() => setTrade(TRADE_INIT)}>Cancel</button>
                  </div>
                </>
              )}
            </div>

            <div className="integration-card">
              <div className="integration-title">Renav - Whatsapp</div>
              {renavSaved ? (
                <>
                  <div className="tandc-item"><div className="tandc-name">Mobile: {renavSavedData.mobile}</div></div>
                  <div className="integration-actions">
                    <button className="btn-primary small yellow" onClick={() => { setRenav(renavSavedData); setRenavSaved(false); }}>Edit</button>
                  </div>
                </>
              ) : (
                <>
                  <div className="integration-row"><label>Mobile :</label><input value={renav.mobile} onChange={(e)=>setRenav({...renav, mobile: e.target.value})} type="text" /></div>
                  <div className="integration-actions">
                    <button className="btn-primary save green" onClick={() => handleSave('whatsapp', 'renav', renav, 'Renav', setRenavSaved, setRenavSavedData)}>Save</button>
                    <button className="btn-secondary" style={{marginLeft:8}} onClick={() => setRenav(RENAV_INIT)}>Cancel</button>
                  </div>
                </>
              )}
            </div>

            <div className="integration-card">
              <div className="integration-title">JustDial</div>
              <div className="muted small">JustDial can call our API whenever a new lead is received. Please share the following link with the JustDial Support team to enable this: https://biziverse.com/External.asmx/setJDLead?mob=9449804522</div>
              <div className="integration-actions">
                <button className="btn-primary save small orange" onClick={handleCopyJustDial}>Copy</button>
              </div>
            </div>

            <div className="integration-card">
              <div className="integration-title">99Acres</div>
              {acresSaved ? (
                <>
                  <div className="tandc-item"><div className="tandc-name">Username: {acresSavedData.username}</div></div>
                  <div className="integration-actions">
                    <button className="btn-primary small yellow" onClick={() => { setAcres(acresSavedData); setAcresSaved(false); }}>Edit</button>
                  </div>
                </>
              ) : (
                <>
                  <div className="integration-row"><label>Username :</label><input value={acres.username} onChange={(e)=>setAcres({...acres, username: e.target.value})} type="text" /></div>
                  <div className="integration-row"><label>Password :</label><input value={acres.password} onChange={(e)=>setAcres({...acres, password: e.target.value})} type="password" /></div>
                  <div className="integration-actions">
                    <button className="btn-primary save green" onClick={() => handleSave('lead_platform', '99acres', acres, '99Acres', setAcresSaved, setAcresSavedData)}>Save</button>
                    <button className="btn-secondary" style={{marginLeft:8}} onClick={() => setAcres(ACRES_INIT)}>Cancel</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
