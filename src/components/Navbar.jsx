import { useContext, useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import { FaBell, FaSignOutAlt, FaUser, FaUtensils } from 'react-icons/fa';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { notifications, unreadCount, markRead, markAllRead } = useContext(SocketContext);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    return (
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 2rem',
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-color)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backdropFilter: 'blur(10px)',
        }}
      >
        {/* Brand Logo */}
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '1.4rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
          }}
        >
          <FaUtensils style={{ color: 'var(--primary)' }} />
          <span>HomeCook<span style={{ color: 'var(--primary)' }}>Connect</span></span>
        </Link>

        {/* Guest Auth Buttons */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Link
            to="/login"
            style={{
              fontSize: '0.95rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              transition: 'var(--transition-fast)',
              padding: '0.5rem 1rem',
            }}
            onMouseEnter={(e) => e.target.style.color = 'var(--text-primary)'}
            onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="btn btn-primary"
            style={{
              fontSize: '0.9rem',
              fontWeight: 600,
              padding: '0.5rem 1.25rem',
              borderRadius: '50px',
            }}
          >
            Sign Up
          </Link>
        </div>
      </nav>
    );
  }

  return (
    <nav
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1rem 2rem',
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-color)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backdropFilter: 'blur(10px)',
      }}
    >
      {/* Brand Logo */}
      <Link
        to="/"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '1.4rem',
          fontWeight: 800,
          color: 'var(--text-primary)',
        }}
      >
        <FaUtensils style={{ color: 'var(--primary)' }} />
        <span>HomeCook<span style={{ color: 'var(--primary)' }}>Connect</span></span>
      </Link>

      {/* Nav Links based on role */}
      {location.pathname !== '/' && (
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          {user.role === 'customer' && (
            <>
              <Link
                to="/dashboard"
                style={{
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  color: location.pathname === '/dashboard' ? 'var(--primary)' : 'var(--text-secondary)',
                  transition: 'var(--transition-fast)',
                }}
              >
                Browse Chefs
              </Link>
              <Link
                to="/orders"
                style={{
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  color: location.pathname === '/orders' ? 'var(--primary)' : 'var(--text-secondary)',
                  transition: 'var(--transition-fast)',
                }}
              >
                My Orders
              </Link>
              <Link
                to="/requests"
                style={{
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  color: location.pathname === '/requests' ? 'var(--primary)' : 'var(--text-secondary)',
                  transition: 'var(--transition-fast)',
                }}
              >
                Custom Requests
              </Link>
            </>
          )}

          {user.role === 'homemaker' && (
            <>
              <Link
                to="/dashboard"
                style={{
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  color: location.pathname === '/dashboard' ? 'var(--primary)' : 'var(--text-secondary)',
                  transition: 'var(--transition-fast)',
                }}
              >
                Dashboard
              </Link>
              <Link
                to="/requests"
                style={{
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  color: location.pathname === '/requests' ? 'var(--primary)' : 'var(--text-secondary)',
                  transition: 'var(--transition-fast)',
                }}
              >
                Customer Requests
              </Link>
            </>
          )}

          {user.role === 'admin' && (
            <>
              <Link
                to="/dashboard"
                style={{
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  color: location.pathname === '/dashboard' ? 'var(--primary)' : 'var(--text-secondary)',
                  transition: 'var(--transition-fast)',
                }}
              >
                Admin Dashboard
              </Link>
            </>
          )}

          {user.role === 'delivery' && (
            <>
              <Link
                to="/dashboard"
                style={{
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  color: location.pathname === '/dashboard' ? 'var(--primary)' : 'var(--text-secondary)',
                  transition: 'var(--transition-fast)',
                }}
              >
                My Deliveries
              </Link>
            </>
          )}
        </div>
      )}

      {/* User Area & Notification Trigger */}
      {location.pathname === '/' ? (
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Link
            to="/login"
            style={{
              fontSize: '0.95rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              transition: 'var(--transition-fast)',
              padding: '0.5rem 1rem',
            }}
            onMouseEnter={(e) => e.target.style.color = 'var(--text-primary)'}
            onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="btn btn-primary"
            style={{
              fontSize: '0.9rem',
              fontWeight: 600,
              padding: '0.5rem 1.25rem',
              borderRadius: '50px',
            }}
          >
            Sign Up
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          {/* Notifications Icon with Dropdown */}
          <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              fontSize: '1.25rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              position: 'relative',
              padding: '0.5rem',
              borderRadius: '50%',
              transition: 'var(--transition-fast)',
            }}
            onMouseEnter={(e) => e.target.style.color = 'var(--text-primary)'}
            onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
          >
            <FaBell />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '2px',
                  right: '2px',
                  background: 'var(--danger)',
                  color: 'white',
                  borderRadius: '50%',
                  width: '18px',
                  height: '18px',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid var(--bg-secondary)',
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Drawer */}
          {showNotifications && (
            <div
              className="glass-panel"
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '0.75rem',
                width: '340px',
                maxHeight: '400px',
                overflowY: 'auto',
                padding: '1rem',
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--primary)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    No notifications yet
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      onClick={() => !n.read && markRead(n._id)}
                      style={{
                        padding: '0.75rem',
                        borderRadius: 'var(--border-radius-sm)',
                        background: n.read ? 'transparent' : 'rgba(249, 115, 22, 0.08)',
                        border: '1px solid',
                        borderColor: n.read ? 'var(--border-color)' : 'rgba(249, 115, 22, 0.2)',
                        cursor: n.read ? 'default' : 'pointer',
                        transition: 'var(--transition-fast)',
                        fontSize: '0.8rem',
                      }}
                    >
                      <p style={{ color: n.read ? 'var(--text-secondary)' : 'var(--text-primary)', lineHeight: '1.4', marginBottom: '0.25rem' }}>
                        {n.text}
                      </p>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Avatar Link */}
        <Link
          to="/profile"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.4rem 0.8rem',
            borderRadius: '50px',
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)',
            fontSize: '0.85rem',
            fontWeight: 600,
          }}
        >
          {user.avatar ? (
            <img
              src={`http://localhost:5000${user.avatar}`}
              alt="avatar"
              style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }}
            />
          ) : (
            <FaUser style={{ color: 'var(--primary)' }} />
          )}
          <span>{(user.name || '').split(' ')[0]}</span>
          <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', background: 'var(--primary)', color: 'white', padding: '0.1rem 0.4rem', borderRadius: '4px', marginLeft: '0.25rem' }}>
            {user.role}
          </span>
        </Link>

        {/* Logout */}
        <button
          onClick={handleLogout}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            fontSize: '1.1rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            padding: '0.5rem',
            borderRadius: '50%',
            transition: 'var(--transition-fast)',
          }}
          onMouseEnter={(e) => e.target.style.color = 'var(--danger)'}
          onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
          title="Sign Out"
        >
          <FaSignOutAlt />
        </button>
      </div>
      )}
    </nav>
  );
};

export default Navbar;
