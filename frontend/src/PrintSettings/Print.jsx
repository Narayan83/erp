import React, { useState, useEffect, useRef } from "react";
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
			"Org. / Dup. / Trip.",
			"Party Information",
			"GSTIN",
			"GST Summary",
			"GST in export also",
			"HSN in export also",
			"Branch",
			"Bank Details",
			"Disclaimer",
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
			"Non-Stock Item Code",
			"Auto-pad small docs",
		],
	},
];

export default function PrintSettingsDialog({ onClose, initialConfig = {}, onSave, docType }) {
	// map human labels to config keys used by callers
	const labelToKey = {
		"Header": 'header',
		"Footer": 'footer',
		"Digital Signature": 'digitalSignature',
		"Org. / Dup. / Trip.": 'orgDupTrip',
		"Party Information": 'partyInformation',
		"GSTIN": 'gstin',
		"GST Summary": 'gstSummary',
		"GST in export also": 'gstInExport',
		"HSN in export also": 'hsnInExport',
		"Branch": 'branch',
		"Bank Details": 'bankDetails',
		"Disclaimer": 'disclaimer',
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
		"Non-Stock Item Code": 'nonStockItemCode',
		"Auto-pad small docs": 'autoPadSmallDocs',
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

	useEffect(() => {
		function onKey(e) {
			if (e.key === "Escape") onClose && onClose();
		}
		document.addEventListener("keydown", onKey);
		// focus close button for accessibility
		if (closeRef.current) closeRef.current.focus();
		return () => document.removeEventListener("keydown", onKey);
	}, [onClose]);

	function toggle(name) {
		setChecked((c) => ({ ...c, [name]: !c[name] }));
	}

	function buildConfigFromChecked() {
		const out = {};
		Object.keys(checked).forEach((label) => {
			const key = labelToKey[label] || label;
			out[key] = !!checked[label];
		});
		return out;
	}

	function handleDone() {
		const cfg = buildConfigFromChecked();
		onSave && onSave(cfg);
		onClose && onClose();
	}

	return (
		<div className="print-overlay" onClick={onClose} role="presentation">
			<div
				className="print-dialog"
				role="dialog"
				aria-modal="true"
				aria-labelledby="print-settings-title"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="dialog-card">
					<div className="dialog-header">
						<h2 id="print-settings-title">Print Settings{docType ? ` — ${docType}` : ''}</h2>
						<div className="dialog-actions">
							<button className="config-btn" onClick={() => navigate('/sales-configuration')}>Sales Configuration</button>
							<button ref={closeRef} className="close-btn" onClick={handleDone}>Done</button>
						</div>
					</div>

					<div className="dialog-body">
						{sections.map((sec) => (
							<section className="print-section" key={sec.title}>
								<h3 className="section-title">{sec.title}</h3>
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

