import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./print.scss";

const sections = [
	{
		title: "Basic Elements",
		cols: 3,
		items: [
			"Header",
			"Footer",
			"Digital Signature",
			"Party Information",
			"GSTIN",
			"GST Summary",
			"GST in export also",
			"HSN in export also",
			"Branch",
			"Bank Details",
			"Total Quantity",
			"Valid till",
		],
	},
	{
		title: "Party Information",
		cols: 3,
		items: ["Mobile", "Email", "Contact Person Name", "GSTIN", "Company before POC", "Total before Round off"],
	},
	{
		title: "Item List",
		cols: 3,
		items: [
			"Item Code",
			"Notes",
			"Discount Rate",
			"Discount Amt",
			"Taxable Amount",
			"HSN / SAC",
			"GST Amounts / Tax",
			"Lead Time",
			"Qty in Services",
			"Item Fixed Rate",
			"Item Rate",
			"Image",
		],
	},
];

export default function PrintSettingsDialog({ onClose, initialConfig = {}, onSave, docType }) {
	// State for selected document type
	const [selectedDocType, setSelectedDocType] = useState(docType || 'Quotation');
	
	// Available document types
	const docTypes = ['All', 'Quotation', 'Proforma Invoice', 'Sales Order', 'Transfer Order', 'Purchase Order', 'Invoice'];
	
	const getHeaderLogos = () => {
		const raw = initialConfig?.headerLogosSource;
		const list = [];
		if (Array.isArray(raw)) {
			raw.forEach((v) => {
				if (typeof v === 'string' && v.trim()) list.push({ name: '', data: v.trim() });
				else if (v && typeof v === 'object' && typeof v.data === 'string' && v.data.trim()) list.push({ name: String(v.name || '').trim(), data: v.data.trim() });
			});
		} else if (typeof raw === 'string') {
			try {
				const parsed = JSON.parse(raw);
				if (Array.isArray(parsed)) {
					parsed.forEach((v) => {
						if (typeof v === 'string' && v.trim()) list.push({ name: '', data: v.trim() });
						else if (v && typeof v === 'object' && typeof v.data === 'string' && v.data.trim()) list.push({ name: String(v.name || '').trim(), data: v.data.trim() });
					});
				}
			} catch (err) {
				// ignore malformed value
			}
		}
		const fallback = typeof initialConfig?.headerLogoFallback === 'string' ? initialConfig.headerLogoFallback.trim() : '';
		if (fallback) list.push({ name: '', data: fallback });

		// Deduplicate by `data` but prefer entries that have a non-empty `name`.
		const map = new Map();
		for (const item of list) {
			if (!item || !item.data) continue;
			const data = item.data;
			const name = String(item.name || '').trim();
			const existing = map.get(data);
			if (!existing) map.set(data, { name, data });
			else if (!existing.name && name) {
				// replace unnamed with named
				map.set(data, { name, data });
			}
		}
		return Array.from(map.values());
	};

	const headerLogos = getHeaderLogos();
	const initialHeaderIndex = Number.isInteger(initialConfig?.headerImageIndex)
		? initialConfig.headerImageIndex
		: Number.parseInt(initialConfig?.headerImageIndex, 10);
	const [headerImageIndex, setHeaderImageIndex] = useState(
		headerLogos.length ? (Number.isNaN(initialHeaderIndex) ? 0 : Math.max(0, Math.min(initialHeaderIndex, headerLogos.length - 1))) : 0
	);

	useEffect(() => {
		if (!headerLogos.length) {
			setHeaderImageIndex(0);
			return;
		}
		setHeaderImageIndex((prev) => Math.max(0, Math.min(prev, headerLogos.length - 1)));
	}, [headerLogos.length]);

	// map human labels to config keys used by callers
	const labelToKey = {
		"Header": 'header',
		"Footer": 'footer',
		"Digital Signature": 'digitalSignature',
		"Party Information": 'partyInformation',
		"GSTIN": 'gstin',
		"GST Summary": 'gstSummary',
		"GST in export also": 'gstInExport',
		"HSN in export also": 'hsnInExport',
		"Branch": 'branch',
		"Bank Details": 'bankDetails',
		"Total Quantity": 'totalQuantity',
		"Valid till": 'validTill',
		// Party Information
		"Mobile": 'mobile',
		"Email": 'email',
		"Contact Person Name": 'contactPersonName',
		"Company before POC": 'companyBeforePOC',
		"Total before Round off": 'totalBeforeRoundOff',
		// Item List
		"Item Code": 'itemCode',
		"Notes": 'notes',
		"Discount Rate": 'discountRate',
		"Discount Amt": 'discountAmt',
		"Taxable Amount": 'taxableAmt',
		"HSN / SAC": 'hsnSac',
		"GST Amounts / Tax": 'gstAmounts',
		"Lead Time": 'leadTime',
		"Qty in Services": 'qtyInServices',
		"Item Fixed Rate": 'itemFixedRate',
		"Item Rate": 'itemRate',
		"Image": 'image',
	};

	const [checked, setChecked] = useState(() => {
		const init = {};
		sections.forEach((s) =>
			s.items.forEach((label) => {
				const key = labelToKey[label] || label;
				if (Object.prototype.hasOwnProperty.call(initialConfig, key)) {
					init[label] = !!initialConfig[key];
				} else {
					init[label] = true; // default to true when not specified
				}
			})
		);
		return init;
	});

	const closeRef = useRef(null);
	const navigate = useNavigate();

	function toggle(name) {
		setChecked((c) => ({ ...c, [name]: !c[name] }));
	}

	function toggleSection(sectionItems) {
		const allChecked = sectionItems.every((item) => checked[item]);
		setChecked((c) => {
			const newChecked = { ...c };
			sectionItems.forEach((item) => {
				newChecked[item] = !allChecked;
			});
			return newChecked;
		});
	}

	function isSectionAllChecked(sectionItems) {
		return sectionItems.every((item) => checked[item]);
	}

	function isSectionSomeChecked(sectionItems) {
		return sectionItems.some((item) => checked[item]) && !isSectionAllChecked(sectionItems);
	}

	function buildConfigFromChecked(checkedState = checked) {
		const out = {};
		Object.keys(checkedState).forEach((label) => {
			const key = labelToKey[label] || label;
			out[key] = !!checkedState[label];
		});
		return out;
	}

	function handleHeaderLogoChange(newIndex) {
		setHeaderImageIndex(newIndex);
	}

	const handleClose = useCallback(() => {
		// Save settings when closing with the currently selected document type
		const cfg = buildConfigFromChecked();
		cfg.headerImageIndex = headerImageIndex;
		onSave && onSave(cfg, selectedDocType);
		onClose && onClose();
	}, [checked, headerImageIndex, selectedDocType, onSave, onClose]);
	
	// Handle document type change - reload settings from localStorage for the new type
	const handleDocTypeChange = (newDocType) => {
		setSelectedDocType(newDocType);
		
		// Load settings for the new document type from localStorage
		try {
			const storedSettings = localStorage.getItem('printSettings');
			if (storedSettings) {
				const allSettings = JSON.parse(storedSettings);
				const typeSettings = allSettings[newDocType] || {};
				
				// Update checked state with the new document type's settings
				const newChecked = {};
				sections.forEach((s) =>
					s.items.forEach((label) => {
						const key = labelToKey[label] || label;
						if (Object.prototype.hasOwnProperty.call(typeSettings, key)) {
							newChecked[label] = !!typeSettings[key];
						} else {
							newChecked[label] = true; // default to true when not specified
						}
					})
				);
				setChecked(newChecked);
				
				// Update header image index if available
				if (Number.isInteger(typeSettings.headerImageIndex)) {
					setHeaderImageIndex(typeSettings.headerImageIndex);
				}
			}
		} catch (err) {
			console.error('Failed to load settings for document type:', err);
		}
	};

	useEffect(() => {
		function onKey(e) {
			if (e.key === "Escape") handleClose();
		}
		document.addEventListener("keydown", onKey);
		// focus close button for accessibility
		if (closeRef.current) closeRef.current.focus();
		return () => document.removeEventListener("keydown", onKey);
	}, [handleClose]);

	return (
		<div className="print-overlay" onClick={handleClose} role="presentation">
			<div
				className="print-dialog"
				role="dialog"
				aria-modal="true"
				aria-labelledby="print-settings-title"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="dialog-card">
					<div className="dialog-header">
						<h2 id="print-settings-title">Print Settings</h2>
						<div className="dialog-actions">
							<button className="config-btn" onClick={() => window.open(`${window.location.origin}/sales-configuration`, '_blank')}>Sales Configuration</button>
							<button ref={closeRef} className="close-btn" onClick={handleClose}>❌</button>
						</div>
					</div>

					<div className="dialog-body">
						<div className="print-section">
							<div className="section-header">
								<h3 className="section-title">Document Type</h3>
								<select
									className="doc-type-selector"
									value={selectedDocType}
									onChange={(e) => handleDocTypeChange(e.target.value)}
								>
									{docTypes.map((type) => (
										<option key={type} value={type}>{type}</option>
									))}
								</select>
							</div>
						</div>
						
						<div className="print-section">
							<div className="section-header">
								<h3 className="section-title">Header Logo</h3>
								<select
									className="logo-selector"
									value={headerImageIndex}
									onChange={(e) => handleHeaderLogoChange(Number.parseInt(e.target.value, 10) || 0)}
									disabled={!headerLogos.length}
								>
									{headerLogos.length ? headerLogos.map((logo, idx) => (
										<option key={`logo-${idx}`} value={idx}>{(logo.name || '').trim() || `Logo ${idx + 1}`}</option>
									)) : <option value={0}>No header image uploaded</option>}
								</select>
							</div>
						</div>

						{sections.map((sec) => (
							<section className="print-section" key={sec.title}>
							<div className="section-header">
								<h3 className="section-title">{sec.title}</h3>
								<label className="select-all-checkbox">
									<input
										type="checkbox"
										checked={isSectionAllChecked(sec.items)}
										ref={(el) => {
											if (el) el.indeterminate = isSectionSomeChecked(sec.items);
										}}
										onChange={() => toggleSection(sec.items)}
									/>
									<span className="label-text">Select All</span>
								</label>
							</div>
								<div
									className="checkbox-grid"
									style={{ gridTemplateColumns: `repeat(${sec.cols}, 1fr)` }}
								>
									{sec.items.map((item) => (
										<label className="checkbox-item" key={item}>
											<input
												type="checkbox"
												checked={!!checked[item]}
												onChange={() => toggle(item)}
											/>
											<span className="label-text">{item}</span>
										</label>
									))}
								</div>
							</section>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}

