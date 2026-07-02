import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { FaUser, FaEnvelope, FaLock, FaUtensils, FaCamera, FaSave, FaEye, FaEyeSlash, FaCheck, FaMapMarkerAlt, FaCompass } from 'react-icons/fa';
import Toast from '../components/Toast';

const Profile = () => {
  const { user, updateProfile } = useContext(AuthContext);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [specialty, setSpecialty] = useState(user?.specialty || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar ? `http://localhost:5000${user.avatar}` : null);
  const [address, setAddress] = useState(user?.address || '');
  const [latitude, setLatitude] = useState(user?.latitude || '');
  const [longitude, setLongitude] = useState(user?.longitude || '');
  const [serviceRadius, setServiceRadius] = useState(user?.serviceRadius || 10);
  const [locationLoading, setLocationLoading] = useState(false);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toFixed(6));
        setLongitude(position.coords.longitude.toFixed(6));
        setLocationLoading(false);
      },
      (error) => {
        console.error('Error fetching location:', error);
        alert('Could not retrieve your location. Please type coordinates manually or allow location permissions.');
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Password rules validation helper
  const isLengthValid = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password);
  const isPasswordValid = isLengthValid && hasUppercase && hasLowercase && hasNumber && hasSpecialChar;

  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState('success');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password) {
      if (password !== confirmPassword) {
        setToastMsg('Passwords do not match.');
        setToastType('error');
        return;
      }
      if (!isPasswordValid) {
        setToastMsg('New password does not meet the complexity requirements.');
        setToastType('error');
        return;
      }
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    formData.append('address', address);
    formData.append('latitude', latitude ? Number(latitude) : 0);
    formData.append('longitude', longitude ? Number(longitude) : 0);
    if (user.role === 'homemaker') {
      formData.append('bio', bio);
      formData.append('specialty', specialty);
      formData.append('serviceRadius', Number(serviceRadius) || 10);
    }
    if (password) {
      formData.append('password', password);
    }
    if (avatar) {
      formData.append('avatar', avatar);
    }

    const result = await updateProfile(formData);
    setIsSubmitting(false);

    if (result.success) {
      setToastMsg('Profile updated successfully!');
      setToastType('success');
      setPassword('');
      setConfirmPassword('');
    } else {
      setToastMsg(result.message);
      setToastType('error');
    }
  };

  if (!user) return null;

  return (
    <div className="main-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', minHeight: '80vh' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', padding: '2.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          Account Settings
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '2rem' }}>
          Manage your personal profiles and login details
        </p>

        <form onSubmit={handleSubmit}>
          {/* Avatar Upload */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem', gap: '0.75rem' }}>
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  background: 'var(--bg-tertiary)',
                  border: '3px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <FaUser style={{ color: 'var(--text-muted)', fontSize: '2.5rem' }} />
                )}
              </div>
              <label
                htmlFor="avatar-edit"
                style={{
                  position: 'absolute',
                  bottom: '2px',
                  right: '2px',
                  background: 'var(--primary)',
                  color: 'white',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  border: '2px solid var(--bg-secondary)',
                }}
              >
                <FaCamera />
              </label>
              <input
                id="avatar-edit"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                style={{ display: 'none' }}
              />
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Role: {user.role.toUpperCase()}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div style={{ position: 'relative' }}>
                <FaUser style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ paddingLeft: '2.3rem' }}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <FaEnvelope style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ paddingLeft: '2.3rem' }}
                  required
                />
              </div>
            </div>
          </div>

          {/* Homemaker specialty details */}
          {user.role === 'homemaker' && (
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', marginTop: '0.5rem' }}>
              <div className="form-group">
                <label className="form-label">Specialties</label>
                <div style={{ position: 'relative' }}>
                  <FaUtensils style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    className="form-input"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    style={{ paddingLeft: '2.3rem' }}
                    placeholder="E.g., Biryani, Desserts"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Kitchen Biography / Details</label>
                <textarea
                  className="form-input"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  style={{ minHeight: '80px', resize: 'vertical' }}
                  required
                />
              </div>
            </div>
          )}

          {/* Location Fields (For all users) */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', marginTop: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FaMapMarkerAlt style={{ color: 'var(--primary)' }} /> Location & Address Details
            </h3>

            <div className="form-group">
              <label className="form-label">Delivery / Kitchen Address</label>
              <div style={{ position: 'relative' }}>
                <FaMapMarkerAlt style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Street Name, Area, City"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  style={{ paddingLeft: '2.3rem' }}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Latitude</label>
                <input
                  type="number"
                  step="any"
                  className="form-input"
                  placeholder="e.g. 12.9716"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Longitude</label>
                <input
                  type="number"
                  step="any"
                  className="form-input"
                  placeholder="e.g. 77.5946"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                />
              </div>
            </div>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleGetCurrentLocation}
              disabled={locationLoading}
              style={{ width: '100%', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <FaCompass /> {locationLoading ? 'Fetching Location...' : 'Get Current Location'}
            </button>

            {user.role === 'homemaker' && (
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Service Radius (km) *</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="e.g. 10"
                  value={serviceRadius}
                  onChange={(e) => setServiceRadius(e.target.value)}
                  min="1"
                  max="100"
                  required
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Maximum distance (in km) you are willing to deliver to.</span>
              </div>
            )}
          </div>

          {/* Password Reset Section */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', marginTop: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Change Password (Optional)</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <div style={{ position: 'relative' }}>
                  <FaLock style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="Leave blank to keep same"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ paddingLeft: '2.3rem', paddingRight: '2.3rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      padding: 0,
                    }}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <FaLock style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{ paddingLeft: '2.3rem', paddingRight: '2.3rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      padding: 0,
                    }}
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>
            </div>

            {/* Password Strength Indicator */}
            {password && (
              <div
                style={{
                  marginTop: '0.5rem',
                  padding: '0.75rem',
                  borderRadius: 'var(--border-radius-sm)',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.75rem',
                  marginBottom: '1rem',
                }}
              >
                <p style={{ fontWeight: 700, marginBottom: '0.5rem', color: isPasswordValid ? 'var(--secondary)' : 'var(--text-secondary)' }}>
                  New Password Requirements:
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: isLengthValid ? 'var(--secondary)' : 'var(--text-muted)' }}>
                    <FaCheck style={{ fontSize: '0.7rem', opacity: isLengthValid ? 1 : 0.4 }} />
                    <span>At least 8 characters</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: hasUppercase ? 'var(--secondary)' : 'var(--text-muted)' }}>
                    <FaCheck style={{ fontSize: '0.7rem', opacity: hasUppercase ? 1 : 0.4 }} />
                    <span>At least 1 uppercase (A-Z)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: hasLowercase ? 'var(--secondary)' : 'var(--text-muted)' }}>
                    <FaCheck style={{ fontSize: '0.7rem', opacity: hasLowercase ? 1 : 0.4 }} />
                    <span>At least 1 lowercase (a-z)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: hasNumber ? 'var(--secondary)' : 'var(--text-muted)' }}>
                    <FaCheck style={{ fontSize: '0.7rem', opacity: hasNumber ? 1 : 0.4 }} />
                    <span>At least 1 number (0-9)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: hasSpecialChar ? 'var(--secondary)' : 'var(--text-muted)' }}>
                    <FaCheck style={{ fontSize: '0.7rem', opacity: hasSpecialChar ? 1 : 0.4 }} />
                    <span>At least 1 special char</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.9rem', marginTop: '1.5rem' }}
            disabled={isSubmitting}
          >
            <FaSave /> {isSubmitting ? 'Saving Changes...' : 'Save Settings'}
          </button>
        </form>
      </div>

      {toastMsg && (
        <div className="toast-container">
          <Toast message={toastMsg} type={toastType} onClose={() => setToastMsg('')} />
        </div>
      )}
    </div>
  );
};

export default Profile;
