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
			"Item Rate",
			"Non-Stock Item Code",
			"Auto-pad small docs",
		],
	},
];

export default function PrintSettingsDialog({ onClose }) {
	const [checked, setChecked] = useState(() => {
		const init = {};
		sections.forEach((s) => s.items.forEach((i) => (init[i] = true)));
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
						<h2 id="print-settings-title">Print Settings</h2>
						<div className="dialog-actions">
							<button className="config-btn" onClick={() => navigate('/sales-configuration')}>Sales Configuration</button>
							<button ref={closeRef} className="close-btn" onClick={onClose}>Done</button>
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

