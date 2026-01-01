import React, { useEffect, useState } from "react";
import "./settings.scss";

const STORAGE_KEY = "appSettings";

function Toggle({ id, checked, onChange, label }) {
	return (
		<label className="switch" htmlFor={id}>
			<input id={id} type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
			<span className="slider" aria-hidden />
			<span className="switch-label">{label}</span>
		</label>
	);
}

export default function Settings() {
	const [settings, setSettings] = useState({
		fullName: "",
		email: "",
		language: "en",
		theme: "system",
		notifications: true,
		marketing: false,
	});
	const [editing, setEditing] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [snack, setSnack] = useState(null);

	useEffect(() => {
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (raw) setSettings((s) => ({ ...s, ...JSON.parse(raw) }));
		} catch (e) {
			// ignore
		}
	}, []);

	const persist = (next) => {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
			window.dispatchEvent(new Event("appSettingsUpdated"));
		} catch (e) {
			// ignore
		}
	};

	const handleChange = (e) => {
		const { name, value } = e.target;
		setSettings((prev) => ({ ...prev, [name]: value }));
		setEditing(true);
	};

	const handleToggle = (key) => (val) => {
		const next = { ...settings, [key]: val };
		setSettings(next);
		persist(next);
		setSnack("Saved");
		setTimeout(() => setSnack(null), 1800);
	};

	const handleSave = (e) => {
		e && e.preventDefault();
		setIsSaving(true);
		setTimeout(() => {
			persist(settings);
			setIsSaving(false);
			setEditing(false);
			setSnack("Settings saved");
			setTimeout(() => setSnack(null), 2500);
		}, 700);
	};

	const handleRevert = () => {
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (raw) setSettings(JSON.parse(raw));
			setEditing(false);
			setSnack("Reverted");
			setTimeout(() => setSnack(null), 1600);
		} catch (e) {}
	};

	const handleClear = () => {
		if (!confirm("Clear local settings?")) return;
		localStorage.removeItem(STORAGE_KEY);
		setSettings({ fullName: "", email: "", language: "en", theme: "system", notifications: true, marketing: false });
		setSnack("Cleared local settings");
		setTimeout(() => setSnack(null), 2200);
	};

	return (
		<div className="settings-page profile-page-theme">
			<div className="settings-container">

				<form className="settings-card" onSubmit={handleSave}>
					<section className="card-section">
						<h2>Account</h2>
						<div className="form-grid">
							<div className="field">
								<label htmlFor="fullName">Full name</label>
								<input id="fullName" name="fullName" value={settings.fullName} onChange={handleChange} placeholder="Jane Doe" disabled={!editing} />
							</div>
							<div className="field">
								<label htmlFor="email">Email</label>
								<input id="email" name="email" type="email" value={settings.email} onChange={handleChange} placeholder="you@example.com" disabled={!editing} />
							</div>
							<div className="field">
								<label htmlFor="language">Language</label>
								<select id="language" name="language" value={settings.language} onChange={handleChange} disabled={!editing}>
									<option value="en">English</option>
									<option value="es">Español</option>
									<option value="fr">Français</option>
									<option value="hi">हिन्दी</option>
								</select>
							</div>
							<div className="field">
								<label htmlFor="theme">Theme</label>
								<select id="theme" name="theme" value={settings.theme} onChange={handleChange} disabled={!editing}>
									<option value="system">System</option>
									<option value="light">Light</option>
									<option value="dark">Dark</option>
								</select>
							</div>
						</div>
					</section>

					<section className="card-section">
						<h2>Notifications</h2>
						<div className="form-grid single-column">
							<div className="field">
								<Toggle id="notifications" checked={settings.notifications} onChange={handleToggle('notifications')} label="Desktop notifications" />
							</div>
							<div className="field">
								<Toggle id="marketing" checked={settings.marketing} onChange={handleToggle('marketing')} label="Marketing emails" />
							</div>
						</div>
					</section>

					<section className="card-section">
						<h2>Danger Zone</h2>
						<p className="muted">Operations in this section are destructive or irreversible.</p>
						<div className="danger-actions">
							<button type="button" className="btn-danger" onClick={handleClear}>Clear local settings</button>
						</div>
					</section>

					<footer className="card-footer">
						<div className="footer-left">
							<button type="button" className="btn" onClick={handleRevert} disabled={isSaving}>Revert</button>
						</div>
						<div className="footer-right">
							<button type="button" className="btn" onClick={() => setEditing(false)} disabled={!editing || isSaving}>Cancel</button>
							<button type="submit" className="btn-primary" disabled={!editing || isSaving}>{isSaving ? 'Saving...' : 'Save changes'}</button>
						</div>
					</footer>
				</form>

				{snack && (
					<div className="snackbar" role="status" aria-live="polite">
						<div className="alert">{snack}</div>
					</div>
				)}
			</div>
		</div>
	);
}
