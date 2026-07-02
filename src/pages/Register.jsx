import { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FaUser, FaEnvelope, FaLock, FaCheck, FaUtensils, FaCamera, FaEye, FaEyeSlash, FaMapMarkerAlt, FaCompass } from 'react-icons/fa';
import Toast from '../components/Toast';

const Register = () => {
  const { register, user, logout } = useContext(AuthContext);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('customer');
  const [bio, setBio] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [serviceRadius, setServiceRadius] = useState(10);
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
  
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState('success');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // Password rules validation helper
  const isLengthValid = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password);
  const isPasswordValid = isLengthValid && hasUppercase && hasLowercase && hasNumber && hasSpecialChar;

  // If user is already logged in when visiting this page, log them out to allow registering fresh
  useEffect(() => {
    if (user) {
      logout();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !role || !address) {
      setToastMsg('Please fill in all required fields, including Address.');
      setToastType('error');
      return;
    }

    if (!isPasswordValid) {
      setToastMsg('Password must be at least 8 characters and include uppercase, lowercase, numbers, and special characters.');
      setToastType('error');
      return;
    }

    if (role === 'homemaker' && (!bio || !specialty)) {
      setToastMsg('Please fill in your Chef bio and specialties.');
      setToastType('error');
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    formData.append('password', password);
    formData.append('role', role);
    formData.append('address', address);
    formData.append('latitude', latitude ? Number(latitude) : 0);
    formData.append('longitude', longitude ? Number(longitude) : 0);
    if (role === 'homemaker') {
      formData.append('bio', bio);
      formData.append('specialty', specialty);
      formData.append('serviceRadius', Number(serviceRadius) || 10);
    }
    if (avatar) {
      formData.append('avatar', avatar);
    }

    const result = await register(formData);
    setIsSubmitting(false);

    if (result.success) {
      navigate('/dashboard', { state: { message: 'Registered successfully!', type: 'success' } });
    } else {
      setToastMsg(result.message);
      setToastType('error');
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '90vh',
        padding: '2rem 1rem',
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '500px',
          padding: '2.5rem',
          boxShadow: 'var(--glass-shadow)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.25rem' }}>Create Account</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Choose your role and join HomeCook Connect
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Avatar Upload */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'var(--bg-tertiary)',
                  border: '2px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <FaUser style={{ color: 'var(--text-muted)', fontSize: '2rem' }} />
                )}
              </div>
              <label
                htmlFor="avatar-upload"
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  background: 'var(--primary)',
                  color: 'white',
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  border: '2px solid var(--bg-secondary)',
                }}
              >
                <FaCamera />
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          {/* Role Select Buttons */}
          <div className="form-group">
            <label className="form-label">I want to register as a:</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                className="btn"
                onClick={() => setRole('customer')}
                style={{
                  background: role === 'customer' ? 'var(--primary-light)' : 'var(--bg-secondary)',
                  border: role === 'customer' ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                  color: role === 'customer' ? 'var(--primary)' : 'var(--text-secondary)',
                  padding: '0.8rem 0.5rem',
                  fontSize: '0.85rem',
                }}
              >
                Customer
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => setRole('homemaker')}
                style={{
                  background: role === 'homemaker' ? 'var(--primary-light)' : 'var(--bg-secondary)',
                  border: role === 'homemaker' ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                  color: role === 'homemaker' ? 'var(--primary)' : 'var(--text-secondary)',
                  padding: '0.8rem 0.5rem',
                  fontSize: '0.85rem',
                }}
              >
                Homemaker (Chef)
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => setRole('delivery')}
                style={{
                  background: role === 'delivery' ? 'var(--primary-light)' : 'var(--bg-secondary)',
                  border: role === 'delivery' ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                  color: role === 'delivery' ? 'var(--primary)' : 'var(--text-secondary)',
                  padding: '0.8rem 0.5rem',
                  fontSize: '0.85rem',
                }}
              >
                Delivery Partner
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Full Name</label>
            <div style={{ position: 'relative' }}>
              <FaUser style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-input"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <FaEnvelope style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="email"
                className="form-input"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <FaLock style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Create a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '14px',
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
            {/* Password Strength Indicator */}
            {password && (
              <div
                style={{
                  marginTop: '0.75rem',
                  padding: '0.75rem',
                  borderRadius: 'var(--border-radius-sm)',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.75rem',
                }}
              >
                <p style={{ fontWeight: 700, marginBottom: '0.5rem', color: isPasswordValid ? 'var(--secondary)' : 'var(--text-secondary)' }}>
                  Password Requirements:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: isLengthValid ? 'var(--secondary)' : 'var(--text-muted)' }}>
                    <FaCheck style={{ fontSize: '0.7rem', opacity: isLengthValid ? 1 : 0.4 }} />
                    <span>At least 8 characters</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: hasUppercase ? 'var(--secondary)' : 'var(--text-muted)' }}>
                    <FaCheck style={{ fontSize: '0.7rem', opacity: hasUppercase ? 1 : 0.4 }} />
                    <span>At least 1 uppercase letter (A-Z)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: hasLowercase ? 'var(--secondary)' : 'var(--text-muted)' }}>
                    <FaCheck style={{ fontSize: '0.7rem', opacity: hasLowercase ? 1 : 0.4 }} />
                    <span>At least 1 lowercase letter (a-z)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: hasNumber ? 'var(--secondary)' : 'var(--text-muted)' }}>
                    <FaCheck style={{ fontSize: '0.7rem', opacity: hasNumber ? 1 : 0.4 }} />
                    <span>At least 1 number (0-9)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: hasSpecialChar ? 'var(--secondary)' : 'var(--text-muted)' }}>
                    <FaCheck style={{ fontSize: '0.7rem', opacity: hasSpecialChar ? 1 : 0.4 }} />
                    <span>At least 1 special character (e.g., !@#$)</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Location Fields (For all users) */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', marginTop: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FaMapMarkerAlt style={{ color: 'var(--primary)' }} /> Location Details
            </h3>

            <div className="form-group">
              <label className="form-label">Delivery / Kitchen Address *</label>
              <div style={{ position: 'relative' }}>
                <FaMapMarkerAlt style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Street Name, Area, City"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  style={{ paddingLeft: '2.5rem' }}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
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
          </div>

          {/* Homemaker Specific Fields */}
          {role === 'homemaker' && (
            <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
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
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Maximum distance (in km) you are willing to deliver to.</span>
              </div>
              <div className="form-group">
                <label className="form-label">Specialties (e.g. Biryani, Desserts, Italian)</label>
                <div style={{ position: 'relative' }}>
                  <FaUtensils style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Biryani, South Indian, Desserts"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    style={{ paddingLeft: '2.5rem' }}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Chef Bio (Tell customers about your kitchen)</label>
                <textarea
                  className="form-input"
                  placeholder="I have 10 years of experience cooking authentic regional dishes..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  style={{ minHeight: '80px', resize: 'vertical' }}
                  required
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.9rem', marginTop: '1rem' }}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 700 }}>
            Sign In
          </Link>
        </div>
      </div>

      {toastMsg && (
        <div className="toast-container">
          <Toast message={toastMsg} type={toastType} onClose={() => setToastMsg('')} />
        </div>
      )}
    </div>
  );
};

export default Register;
