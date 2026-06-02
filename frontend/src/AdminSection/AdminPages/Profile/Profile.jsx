import React, { useState } from 'react';
import './profile.scss';

const Profile = ({ user: initialUser }) => {
  const defaultUser = initialUser || {
    name: 'John Doe',
    phone: '+1 (555) 123-4567',
    email: 'john.doe@example.com',
  };

  const [user, setUser] = useState(defaultUser);
  const [photo, setPhoto] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPhoto(ev.target.result);
    reader.readAsDataURL(file);
  };

  return (
    <div className="profile-page">
      <div className="profile-card">
        <div className="profile-avatar">
          {photo ? (
            <img src={photo} alt={`Avatar of ${user.name}`} />
          ) : (
            <div className="avatar-placeholder" aria-hidden>
              {user.name
                .split(' ')
                .map((s) => s[0])
                .slice(0, 2)
                .join('')}
            </div>
          )}
          <label className="upload-btn">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              aria-label="Upload profile photo"
            />
            <span>Change</span>
          </label>
        </div>

        <div className="profile-info">
          <h2 className="name">{user.name}</h2>

          <div className="info-row">
            <span className="label">Phone</span>
            <span className="value">{user.phone}</span>
          </div>

          <div className="info-row">
            <span className="label">Email</span>
            <span className="value">{user.email}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
