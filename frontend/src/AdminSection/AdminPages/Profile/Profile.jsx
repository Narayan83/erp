import React, { useState, useEffect } from "react";
import "./profile.scss";

function Profile() {
  // In a real app you'd fetch this from an API or context.
  const [user, setUser] = useState({
    name: "John Doe",
    email: "john.doe@example.com",
    role: "Administrator",
    phone: "",
    dob: "",
    gender: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    department: "",
    employeeId: "",
    bio: "",
  });

  const [editing, setEditing] = useState(false);
  const [openSnack, setOpenSnack] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    console.log('Save button clicked');
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      console.log('Save operation completed');
      setEditing(false);
      setOpenSnack(true);
      setIsLoading(false);
    }, 1000);
  };

  // persist to localStorage when saved
  useEffect(() => {
    if (!openSnack) return; // only persist when save was triggered
    try {
      const toStore = {
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      };
      localStorage.setItem("userProfile", JSON.stringify(toStore));
      // notify other listeners in same tab
      window.dispatchEvent(new Event("userProfileUpdated"));
    } catch (err) {
      // ignore storage errors
    }
  }, [openSnack]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("userProfile");
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser((prev) => ({ ...prev, ...parsed }));
      }
    } catch (err) {
      // ignore
    }
  }, []);

  // Auto-close snackbar after 3 seconds
  useEffect(() => {
    if (openSnack) {
      const timer = setTimeout(() => {
        setOpenSnack(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [openSnack]);


  const handleCloseSnack = () => setOpenSnack(false);

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);

    // immediately update local state so UI shows the new avatar
    setUser((prev) => ({ ...prev, avatar: url }));

    // Immediately persist avatar (so it's saved even if user doesn't click Save)
    try {
      const toStore = {
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: url,
      };
      localStorage.setItem("userProfile", JSON.stringify(toStore));
      window.dispatchEvent(new Event("userProfileUpdated"));
    } catch (err) {
      // ignore storage errors
    }

    // simulate an upload/save to server and show feedback
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setOpenSnack(true);
      setEditing(false);
    }, 800);
  };

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-card">
          <div className="card-body">
            <div className="left-col">
              <div className="avatar-wrap">
                <div className="avatar">
                  {user.avatar ? (
                    <img src={user.avatar} />
                  ) : (
                    <div className="initials">{user.name?.charAt(0)}</div>
                  )}
                </div>

                <label className="avatar-edit" htmlFor="avatar-upload">
                  <input
                    accept="image/*"
                    id="avatar-upload"
                    type="file"
                    style={{ display: "none" }}
                    onChange={handleAvatarUpload}
                  />
                  +
                </label>
              </div>

              <div className="profile-info">
                <h2 id="profile-name">{user.name}</h2>
                <div className="role">{user.role}</div>
              </div>
            </div>

            <div className="main-col">
              <div className="header-row">
                <h3>👤 Profile Information</h3>
                <button
                  className="btn"
                  onClick={() => setEditing((v) => !v)}
                  disabled={isLoading}
                >
                  {editing ? "❌ Cancel" : "✏️ Edit Profile"}
                </button>
              </div>

              <form className="profile-form" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                <div className="form-grid">
                  <div className="field">
                    <label htmlFor="name">👤 Full Name</label>
                    <input
                      id="name"
                      name="name"
                      value={user.name}
                      onChange={handleChange}
                      disabled={!editing}
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="email">📧 Email Address</label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={user.email}
                      onChange={handleChange}
                      disabled={!editing}
                      placeholder="your.email@example.com"
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="role">🏢 Job Role</label>
                    <input
                      id="role"
                      name="role"
                      value={user.role}
                      onChange={handleChange}
                      disabled={!editing}
                      placeholder="Your position"
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="department">🏢 Department</label>
                    <input
                      id="department"
                      name="department"
                      value={user.department}
                      onChange={handleChange}
                      disabled={!editing}
                      placeholder="Engineering"
                    />
                  </div>

                   <div className="field">
                    <label htmlFor="employeeId">🆔 Employee ID</label>
                    <input
                      id="employeeId"
                      name="employeeId"
                      value={user.employeeId}
                      onChange={handleChange}
                      disabled={!editing}
                      placeholder="EMP001"
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="phone">📱 Phone Number</label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={user.phone}
                      onChange={handleChange}
                      disabled={!editing}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="dob">🎂 Date of Birth</label>
                    <input
                      id="dob"
                      name="dob"
                      type="date"
                      value={user.dob}
                      onChange={handleChange}
                      disabled={!editing}
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="gender">⚧ Gender</label>
                    <select
                      id="gender"
                      name="gender"
                      value={user.gender}
                      onChange={handleChange}
                      disabled={!editing}
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer-not-to-say">Prefer not to say</option>
                    </select>
                  </div>

                 

                  <div className="field full">
                    <label htmlFor="address">🏠 Address</label>
                    <textarea
                      id="address"
                      name="address"
                      value={user.address}
                      onChange={handleChange}
                      disabled={!editing}
                      placeholder="Enter your full address"
                      rows={2}
                    />
                  </div>
                </div>

                <div className="submit-row">
                  <button
                    type="button"
                    className="btn"
                    onClick={() => setEditing(false)}
                    disabled={!editing || isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`btn-primary ${isLoading ? 'loading' : ''}`}
                    disabled={!editing || isLoading}
                  >
                    {isLoading ? 'Saving...' : '💾 Save Changes'}
                  </button>
                </div>

              </form>
            </div>
          </div>
        </div>
      </div>

      {openSnack && (
        <div className="snackbar" role="status" aria-live="polite">
          <div className="alert success">
            ✅ Profile updated successfully!
          </div>
        </div>
      )}
    </div>
   );
}

export default Profile;
