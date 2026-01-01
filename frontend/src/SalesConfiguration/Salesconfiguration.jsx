
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./salesconfiguration.scss";

import { FaUsers, FaTag, FaBox, FaBoxOpen, FaCity, FaPlus, FaTimesCircle, FaThumbsDown, FaFileAlt, FaSignature, FaUniversity, FaClipboardList, FaQrcode, FaMoneyBillWave, FaEnvelope, FaShareAlt, FaStar, FaCode, FaFileInvoiceDollar, FaColumns, FaListAlt, FaFileContract, FaTasks, FaUserFriends, FaCalendarAlt, FaBoxes, FaBarcode } from 'react-icons/fa';
import Sources from "../CRM/Components/Configuration/Sources/Sources";
import Tags from "../CRM/Components/Configuration/Tags/Tags";
import RejectionReasons from "../CRM/Components/Configuration/RejectionReasons/RejectionReasons";

const Salesconfiguration = () => {
	const navigate = useNavigate();

	const [showSources, setShowSources] = useState(false);
	const [showTags, setShowTags] = useState(false);
	const [showRejectionReasons, setShowRejectionReasons] = useState(false);

	const formats = [
		{ title: "Print Header", desc: "Upload or create a header image to include in printables.", key: "header", icon: FaFileAlt },
		{ title: "Print Footer", desc: "Upload or create a footer image to include in printables.", key: "footer", icon: FaFileAlt },
		{ title: "Digital Signature", desc: "Upload the digital signature of your company to include in printables.", key: "signature", icon: FaSignature },
		{ title: "Bank Details", desc: "Enter your bank details to include those in invoices, orders, etc.", key: "bank", icon: FaUniversity },
		{ title: "Terms & Conditions", desc: "Manage default terms and conditions to be used in sales orders, invoices, etc.", key: "tandc", icon: FaClipboardList },
		{ title: "QR Code", desc: "Upload the QR code of your company to include in printables or enable quicker payments.", key: "qrcode", icon: FaQrcode }
	];

	const integrations = [
		{ title: "Payment Link", desc: "Add Payment Link of your company to enable quicker payments.", key: "payment", icon: FaMoneyBillWave },
		{ title: "Email Account", desc: "Link your own email account to send emails from.", key: "email", icon: FaEnvelope },
		{ title: "Lead Platforms", desc: "Integrate with other lead platforms like IndiaMART, TradeIndia, Razorpay, JustDial & WhatsApp.", key: "leads", icon: FaShareAlt },
		{ title: "Google Reviews", desc: "Add Google Review Link of your company to get google reviews from your customers.", key: "greviews", icon: FaStar },
		{ title: "Website API Integration", desc: "Get API for website integration.", key: "api", icon: FaCode },
		{ title: "E-Invoice (Beta)", desc: "Set up your credentials to enable e-invoice facility.(Gold editions only)", key: "einvoice", icon: FaFileInvoiceDollar }
	];

	const salesDocuments = [
		{ title: "Customer Categories", desc: "Manage the master of categories of customers used for Quotes & Invoices.", key: "customer-categories", icon: FaUsers },
		{ title: "Templates", desc: "Manage document templates to quickly create new documents.", key: "templates", icon: FaFileAlt },
		{ title: "Billables (Services / Non-Stock Items)", desc: "Manage Services / Non-Stock Items.", key: "billables", icon: FaBox },
		{ title: "Document Series", desc: "Manage series for invoices, quotes etc.", key: "document-series", icon: FaListAlt },
		{ title: "Extra Columns", desc: "Configure additional columns to be shown in quotes and invoices.", key: "extra-columns", icon: FaColumns },
		{ title: "Extra Fields", desc: "Configure additional fields to be shown in quotes, invoices etc.", key: "extra-fields", icon: FaListAlt },
		{ title: "Contract Types", desc: "Manage your contract types for contract entries.", key: "contract-types", icon: FaFileContract },
		{ title: "Order Stages", desc: "Manage Order Stages to give quick order updates.", key: "order-stages", icon: FaTasks },
		{ title: "B2C-only Mode", desc: "Enable 'B2C-only Mode' if you only sell to end consumers, not to businesses.", key: "b2c-mode", icon: FaUserFriends },
		{ title: "Invoice Credit Days", desc: "Set the number of days to calculate the Due Date from the invoice date.", key: "invoice-credit-days", icon: FaCalendarAlt }
	];

	const settingsCards = [
		{ title: "Batch Selection", desc: "Activate the option to keep track of certain stock items at Batch level, with option of Expiry also.", key: "batch-selection", icon: FaBoxes },
		{ title: "MRP", desc: "Show MRP instead of pre-tax rate at limited places.", key: "mrp", icon: FaTag },
		{ title: "Barcode Generation", desc: "Enter a range to generate and print numeric barcodes.", key: "barcode-generation", icon: FaBarcode }
	];

	const handleCardClick = (key) => {
		// Placeholder navigation - adjust routes as your app defines them
		if (key === "tandc") navigate("/terms-and-conditions");
		else if (key === "bank") navigate("/bank-details");
		else if (key === "header") navigate("/configuration/header");
		else navigate(`/configuration/${key}`);
	};

	const configurationCards = [
		{ id: 'sources', title: 'Sources', description: 'Add all the different sources from where your leads are coming.', icon: FaUsers, color: 'sources-card' },
		{ id: 'products', title: 'Product List', description: 'Add products or services provided by you.', icon: FaBox, color: 'products-card' },
		{ id: 'cities', title: 'City List', description: 'Manage the master entries of cities used for leads & connections.', icon: FaCity, color: 'cities-card' },
		{ id: 'tags', title: 'Tags', description: 'Manage the master entries of tags used for prospects & connections.', icon: FaTag, color: 'tags-card' },
		{ id: 'extra-fields', title: 'Extra Fields', description: 'Maintain additional fields in leads and connections.', icon: FaPlus, color: 'extra-fields-card' },
		{ id: 'rejection-reasons', title: 'Rejection Reasons', description: 'List reasons why a prospect may reject your appointment request.', icon: FaThumbsDown, color: 'rejection-reasons-card' },
		{ id: 'inactive-reasons', title: 'Inactive Reasons', description: 'List reasons why a lead or prospect may become inactive.', icon: FaTimesCircle, color: 'inactive-reasons-card' }
	];

	const handleCrmCardClick = (cardId) => {
		if (cardId === 'sources') { setShowSources(true); return; }
		if (cardId === 'tags') { setShowTags(true); return; }
		if (cardId === 'rejection-reasons') { setShowRejectionReasons(true); return; }
		navigate(`/configuration/${cardId}`);
	};

	return (
		<div className="sales-config-page">
			<h1 className="page-title">Sales Configuration</h1>

			<section className="section">
				<div className="section-ribbon blue">
					<div className="ribbon-title">Formats</div>
					<div className="ribbon-sub">Set up the formats for your business identity & other details.</div>
				</div>

				<div className="cards-grid">
					{formats.map((c) => {
						const Icon = c.icon;
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

			<section className="section">
				<div className="section-ribbon orange">
					<div className="ribbon-title">Integrations</div>
					<div className="ribbon-sub">Set up these integrations to make your workflow smoother.</div>
				</div>

				<div className="cards-grid">
					{integrations.map((c) => {
						const Icon = c.icon;
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

				<section className="section">
					<div className="section-ribbon blue">
						<div className="ribbon-title">Sales Documents</div>
						<div className="ribbon-sub">Set up your sales documents to simplify your sales process.</div>
					</div>

					<div className="cards-grid">
						{salesDocuments.map((c) => {
							const Icon = c.icon;
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

				<section className="section">
					<div className="section-ribbon orange">
						<div className="ribbon-title">Settings</div>
						<div className="ribbon-sub">Set up other settings you might need.</div>
					</div>

					<div className="cards-grid">
						{settingsCards.map((c) => {
							const Icon = c.icon;
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
		</div>
	);
};

export default Salesconfiguration;
