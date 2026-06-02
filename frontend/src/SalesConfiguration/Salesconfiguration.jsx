
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../config/Config";
import "./salesconfiguration.scss";

import { FaUsers, FaTag, FaBox, FaBoxOpen, FaCity, FaPlus, FaTimesCircle, FaThumbsDown, FaFileAlt, FaSignature, FaUniversity, FaClipboardList, FaQrcode, FaMoneyBillWave, FaEnvelope, FaShareAlt, FaStar, FaCode, FaFileInvoiceDollar, FaColumns, FaListAlt, FaFileContract, FaTasks, FaUserFriends, FaCalendarAlt, FaBoxes, FaChevronLeft, FaBarcode } from 'react-icons/fa';
import Sources from "../CRM/Components/Configuration/Sources/Sources";
import Tags from "../CRM/Components/Configuration/Tags/Tags";
import RejectionReasons from "../CRM/Components/Configuration/RejectionReasons/RejectionReasons";
import TandCManager from "../Admin Master/page/TANDC/TandCManager";
import CompanyManager from "../Admin Master/page/Company/CompanyManager";
import BranchManager from "../Admin Master/page/Branch/BranchManager";
import BankManager from "../Admin Master/page/Bank/BankManager";
import PrintHeader from "../Admin Master/page/PrintHeader/PrintHeader";
import DigitalSign from "../Admin Master/page/DigitalSign/DigitalSign";
import NonStock from "../Admin Master/page/NonStock/NonStock";
import PaymentLink from "../Admin Master/page/PaymentLink/PaymentLink";
import Email from "../Admin Master/page/Email/Email";
import Integrations from "../Admin Master/page/Integrations/Integrations";
import QrCode from "../Admin Master/page/QrCode/QrCode";
import SavedTemplate from "../Admin Master/page/SavedTemplate/SavedTemplate";

const Salesconfiguration = () => {
	const navigate = useNavigate();

	const saveIntegration = async (type, provider, config, name) => {
		try {
			// Check if already exists
			const res = await axios.get(`${BASE_URL}/api/integrations`, {
				params: { type, provider }
			});

			const existing = res.data && res.data.length > 0 ? res.data[0] : null;

			const payload = {
				name: name || provider,
				type,
				provider,
				config,
				is_active: true
			};

			if (existing) {
				await axios.put(`${BASE_URL}/api/integrations/${existing.id}`, payload);
			} else {
				await axios.post(`${BASE_URL}/api/integrations`, payload);
			}
			return true;
		} catch (error) {
			console.error(`Error saving integration ${type}/${provider}:`, error);
			throw error;
		}
	};

	const [showSources, setShowSources] = useState(false);
	const [showTags, setShowTags] = useState(false);
	const [showRejectionReasons, setShowRejectionReasons] = useState(false);
	const [showTandc, setShowTandc] = useState(false);
	const [showCompany, setShowCompany] = useState(false);
	const [showBranch, setShowBranch] = useState(false);
	const [showBank, setShowBank] = useState(false);
	const [showPrintHeader, setShowPrintHeader] = useState(false);
	const [showDigitalSign, setShowDigitalSign] = useState(false);
	const [showNonStock, setShowNonStock] = useState(false);
	const [showPaymentLink, setShowPaymentLink] = useState(false);
	const [showEmail, setShowEmail] = useState(false);
	const [showIntegrations, setShowIntegrations] = useState(false);
	const [showQrCode, setShowQrCode] = useState(false);
	const [showSavedTemplates, setShowSavedTemplates] = useState(false);

	const formats = [
		{ title: "Print Header", desc: "Upload or create a header image to include in printables.", key: "header", icon: FaFileAlt },
		{ title: "Print Footer", desc: "Upload or create a footer image to include in printables.", key: "footer", icon: FaFileAlt },
		{ title: "Digital Signature", desc: "Upload the digital signature of your company to include in printables.", key: "signature", icon: FaSignature },
		{ title: "Company / Firm Name", desc: "Set or update your company's official name to display on documents.", key: "company-name", icon: FaFileAlt },
		{ title: "Branch", desc: "Manage branch details that appear on invoices and orders.", key: "branch", icon: FaCity },
		{ title: "Bank Configuration", desc: "Enter your bank details and configuration for payments and invoices.", key: "bank", icon: FaUniversity },
		{ title: "Terms & Conditions", desc: "Manage default terms and conditions to be used in sales orders, invoices, etc.", key: "tandc", icon: FaClipboardList },
	];

	const integrations = [
		{ title: "QR Code", desc: "Upload your company QR Code to include in invoices and documents.", key: "qrcode", icon: FaQrcode },
		{ title: "Payment Link", desc: "Add Payment Link of your company to enable quicker payments.", key: "payment", icon: FaMoneyBillWave },
		{ title: "Email Account", desc: "Link your own email account to send emails from.", key: "email", icon: FaEnvelope },
		{ title: "Lead Platforms", desc: "Integrate with other lead platforms like IndiaMART, TradeIndia, Razorpay, JustDial & WhatsApp.", key: "leads", icon: FaShareAlt },
		{ title: "Google Reviews", desc: "Add Google Review Link of your company to get google reviews from your customers.", key: "greviews", icon: FaStar },
		{ title: "Website API Integration", desc: "Get API for website integration.", key: "api", icon: FaCode },
		{ title: "E-Invoice (Beta)", desc: "Set up your credentials to enable e-invoice facility.(Gold editions only)", key: "einvoice", icon: FaFileInvoiceDollar }
	];

	const salesDocuments = [
		{ title: "Templates", desc: "Manage document templates to quickly create new documents.", key: "templates", icon: FaFileAlt },
		{ title: "Document Series", desc: "Manage series for invoices, quotes etc.", key: "document-series", icon: FaListAlt },
		{ title: "Services / Non-Stock Items", desc: "Manage Services / Non-Stock items.", key: "quotes", icon: FaFileContract },
	];

	const settingsCards = [
		{ title: "Batch Selection", desc: "Activate the option to keep track of certain stock items at Batch level, with option of Expiry also.", key: "batch-selection", icon: FaBoxes },
		{ title: "MRP", desc: "Show MRP instead of pre-tax rate at limited places.", key: "mrp", icon: FaTag },
		{ title: "Barcode Generation", desc: "Enter a range to generate and print numeric barcodes.", key: "barcode-generation", icon: FaBarcode }
	];

	const handleCardClick = (key) => {
		// Navigation mapped to routes defined in App.jsx
		if (key === "tandc") { setShowTandc(true); return; }
		else if (key === "bank") { setShowBank(true); return; }
		else if (key === "company-name") { setShowCompany(true); return; }
		else if (key === "branch") { setShowBranch(true); return; }
		else if (key === "header") { setShowPrintHeader(true); return; }
		else if (key === "signature") { setShowDigitalSign(true); return; }
		else if (key === "quotes") { setShowNonStock(true); return; }
		else if (key === "templates") { setShowSavedTemplates(true); return; }
		else if (key === "document-series") { navigate("/ManageSeries"); return; }
		else navigate(`/configuration/${key}`);
	};

	const configurationCards = [
		{ id: 'sources', title: 'Sources', description: 'Add all the different sources from where your leads are coming.', icon: FaUsers, color: 'sources-card' },
		{ id: 'tags', title: 'Tags', description: 'Manage the master entries of tags used for prospects & connections.', icon: FaTag, color: 'tags-card' },
		{ id: 'rejection-reasons', title: 'Rejection Reasons', description: 'List reasons why a prospect may reject your appointment request.', icon: FaThumbsDown, color: 'rejection-reasons-card' },
		{ id: 'inactive-reasons', title: 'Inactive Reasons', description: 'List reasons why a lead or prospect may become inactive.', icon: FaTimesCircle, color: 'inactive-reasons-card' },
		{ id: 'products', title: 'Product List', description: 'Add products or services provided by you.', icon: FaBox, color: 'products-card' },
		{ id: 'cities', title: 'City List', description: 'Manage the master entries of cities used for leads & connections.', icon: FaCity, color: 'cities-card' }
	];

	const handleCrmCardClick = (cardId) => {
		if (cardId === 'sources') { setShowSources(true); return; }
		if (cardId === 'tags') { setShowTags(true); return; }
		if (cardId === 'rejection-reasons') { setShowRejectionReasons(true); return; }
		navigate(`/configuration/${cardId}`);
	};

	// Click handlers are attached directly to clickable cards via onClick handlers.

	const location = useLocation();
	const params = new URLSearchParams(location.search || window.location.search || '');
	const showOnlyCRM = params.get('section') === 'crm';

	return (
		<div className="sales-config-page">
			<div className="page-header">
				<h1 className="page-title">Sales Configuration</h1>
				{/* <button type="button" className="back-btn" onClick={() => navigate(-1)} aria-label="Go back">
					<FaChevronLeft /> Back
				</button> */}
			</div>
		{!showOnlyCRM && (			<section className="section">
				<div className="section-ribbon blue">
					<div className="ribbon-title">Formats</div>
					<div className="ribbon-sub">Set up the formats for your business identity & other details.</div>
				</div>

				<div className="cards-grid">
					{formats.map((c) => {
					const Icon = c.icon;
					const clickableKeys = ['company-name', 'branch', 'bank', 'tandc', 'header', 'signature', 'document-series'];
					if (clickableKeys.includes(c.key)) {
							return (
								<button key={c.key} className="config-card" onClick={() => handleCardClick(c.key)}>
									<div className="card-icon">{Icon ? <Icon /> : c.title.charAt(0)}</div>
									<div className="card-body">
										<div className="card-title">{c.title}</div>
										<div className="card-desc">{c.desc}</div>
									</div>
								</button>
							);
						}						return (
							<div key={c.key} className="config-card">
								<div className="card-icon">{Icon ? <Icon /> : c.title.charAt(0)}</div>
								<div className="card-body">
									<div className="card-title">{c.title}</div>
									<div className="card-desc">{c.desc}</div>
								</div>
							</div>
						);
					})}
				</div>
			</section>
			)}

			<section className="section">
				<div className="section-ribbon green">
					<div className="ribbon-title">CRM (Leads & Prospects)</div>
					<div className="ribbon-sub">Set up your CRM to manage leads and prospects effectively.</div>
				</div>

				<div className="cards-grid crm-cards">
					{configurationCards.map((card) => {
						const Icon = card.icon;
						const clickableIds = ['sources', 'tags', 'rejection-reasons'];
						if (clickableIds.includes(card.id)) {
							return (
								<button key={card.id} className={`config-card ${card.color}`} onClick={() => handleCrmCardClick(card.id)}>
									<div className="card-icon"><Icon /></div>
									<div className="card-body">
										<div className="card-title">{card.title}</div>
										<div className="card-desc">{card.description}</div>
									</div>
								</button>
							);
						}
						return (
							<div key={card.id} className={`config-card ${card.color}`}>
								<div className="card-icon"><Icon /></div>
								<div className="card-body">
									<div className="card-title">{card.title}</div>
									<div className="card-desc">{card.description}</div>
								</div>
							</div>
						);
					})}
				</div>
			</section>

			<Sources isOpen={showSources} onClose={() => setShowSources(false)} />
			<Tags isOpen={showTags} onClose={() => setShowTags(false)} />
			<RejectionReasons isOpen={showRejectionReasons} onClose={() => setShowRejectionReasons(false)} />
		<TandCManager isOpen={showTandc} onClose={() => setShowTandc(false)} />
	<CompanyManager isOpen={showCompany} onClose={() => setShowCompany(false)} />
	<BranchManager isOpen={showBranch} onClose={() => setShowBranch(false)} />
	<BankManager isOpen={showBank} onClose={() => setShowBank(false)} />

	{/* Non-Stock / Services modal opened directly from Sales Configuration */}
	<NonStock isOpen={showNonStock} onClose={() => setShowNonStock(false)} />

	{/* Print Header modal opened directly from Sales Configuration */}
	<PrintHeader show={showPrintHeader} onClose={() => setShowPrintHeader(false)} onSave={(data) => { /* TODO: call API to save header. For now close modal */ setShowPrintHeader(false); }} />

	{/* Digital Signature modal opened directly from Sales Configuration */}
	<DigitalSign 
		show={showDigitalSign} 
		onClose={() => setShowDigitalSign(false)} 
		onSave={async (data) => { 
			try {
				await saveIntegration('digital_signature', 'custom', data, 'Digital Signature');
				setShowDigitalSign(false);
			} catch (e) {
				alert("Failed to save digital signature");
			}
		}} 
	/>

	<PaymentLink 
		isOpen={showPaymentLink} 
		onClose={() => setShowPaymentLink(false)} 
		onSave={async (link) => {
			try {
				await saveIntegration('payment', 'custom', { link }, 'Payment Link');
				setShowPaymentLink(false);
			} catch (e) {
				alert("Failed to save payment link");
			}
		}}
	/>
	<Email 
		isOpen={showEmail} 
		onClose={() => setShowEmail(false)} 
		onSave={async (data) => {
			try {
				await saveIntegration('email', data.provider, data, 'Email Account');
				setShowEmail(false);
			} catch (e) {
				alert("Failed to save email account");
			}
		}}
	/>
	<Integrations 
		isOpen={showIntegrations} 
		onClose={() => setShowIntegrations(false)} 
		onSaveIntegration={saveIntegration}
	/>
	<QrCode 
		isOpen={showQrCode} 
		onClose={() => setShowQrCode(false)} 
		onSave={async (data) => {
			try {
				await saveIntegration('qr', 'custom', data, 'QR Code');
				setShowQrCode(false);
			} catch (e) {
				alert("Failed to save QR code");
			}
		}}
	/>

	{showSavedTemplates && (
		<SavedTemplate 
			onClose={() => setShowSavedTemplates(false)} 
			onSelect={(template) => {
				// In settings we probably just want to view/delete, 
				// but we could also navigate to the create page with this template
				console.log("Selected template in settings:", template);
				setShowSavedTemplates(false);
			}}
		/>
	)}

		{!showOnlyCRM && (
		<section className="section">
			<div className="section-ribbon green">
				<div className="ribbon-title">Integrations</div>
				<div className="ribbon-sub">Set up these integrations to make your workflow smoother.</div>
			</div>

			<div className="cards-grid">
					{integrations.map((c) => {
						const Icon = c.icon;
						const handleClick = () => {
							if (c.key === 'payment') setShowPaymentLink(true);
							else if (c.key === 'email') setShowEmail(true);
							else if (c.key === 'leads') setShowIntegrations(true);
							// others can navigate or do nothing for now
						};
						return (
						<div key={c.key} className="config-card" onClick={() => { if (c.key === 'qrcode') setShowQrCode(true); else if (c.key === 'payment') setShowPaymentLink(true); else if (c.key === 'email') setShowEmail(true); else if (c.key === 'leads') setShowIntegrations(true); }}>
								<div className="card-icon">{Icon ? <Icon /> : c.title.charAt(0)}</div>
								<div className="card-body">
									<div className="card-title">{c.title}</div>
									<div className="card-desc">{c.desc}</div>
								</div>
							</div>
						);
					})}
				</div>
			</section>

			)}

				{!showOnlyCRM && (
				<section className="section">
					<div className="section-ribbon blue">
						<div className="ribbon-title">Sales Documents</div>
						<div className="ribbon-sub">Set up your sales documents to simplify your sales process.</div>
					</div>

					<div className="cards-grid">
						{salesDocuments.map((c) => {
							const Icon = c.icon;
						if (c.key === 'document-series' || c.key === 'quotes' || c.key === 'templates') {
								return (
									<button key={c.key} className="config-card" onClick={() => handleCardClick(c.key)}>
										<div className="card-icon">{Icon ? <Icon /> : c.title.charAt(0)}</div>
										<div className="card-body">
											<div className="card-title">{c.title}</div>
											<div className="card-desc">{c.desc}</div>
										</div>
									</button>
								);
							}
							return (
								<div key={c.key} className="config-card">
									<div className="card-icon">{Icon ? <Icon /> : c.title.charAt(0)}</div>
									<div className="card-body">
										<div className="card-title">{c.title}</div>
										<div className="card-desc">{c.desc}</div>
									</div>
								</div>
							);
						})}
					</div>
				</section>
				)}

				{!showOnlyCRM && (
				<section className="section">
					<div className="section-ribbon orange">
						<div className="ribbon-title">Settings</div>
						<div className="ribbon-sub">Set up other settings you might need.</div>
					</div>

					<div className="cards-grid">
						{settingsCards.map((c) => {
							const Icon = c.icon;
							const handleClick = () => {
								if (c.key === 'barcode-generation') setShowQrCode(true);
								// others can be added later
							};
							return (
								<div key={c.key} className="config-card" onClick={handleClick}>
									<div className="card-icon">{Icon ? <Icon /> : c.title.charAt(0)}</div>
									<div className="card-body">
										<div className="card-title">{c.title}</div>
										<div className="card-desc">{c.desc}</div>
									</div>
								</div>
							);
						})}
					</div>
				</section>
			)}
		</div>
	);
};

export default Salesconfiguration;
