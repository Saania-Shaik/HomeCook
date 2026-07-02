import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { FaUserCircle, FaShieldAlt, FaTrash, FaCheck, FaBan } from 'react-icons/fa';
import Toast from '../components/Toast';

const AdminDashboard = () => {
  const { API_BASE_URL } = useContext(AuthContext);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCustomers: 0,
    totalHomemakers: 0,
    totalOrders: 0,
    totalSales: 0,
    totalDishes: 0,
  });
  const [users, setUsers] = useState([]);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState('success');

  const fetchAdminData = async () => {
    try {
      const statsRes = await axios.get(`${API_BASE_URL}/admin/stats`);
      setStats(statsRes.data);

      const usersRes = await axios.get(`${API_BASE_URL}/admin/users`);
      setUsers(usersRes.data);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleToggleBan = async (userId) => {
    try {
      const { data } = await axios.put(`${API_BASE_URL}/admin/users/${userId}/ban`);
      setToastMsg(data.message);
      setToastType('success');
      fetchAdminData(); // Refresh lists
    } catch (error) {
      setToastMsg(error.response?.data?.message || 'Action failed.');
      setToastType('error');
    }
  };

  return (
    <div className="main-content">
      {/* Title */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800 }}>Platform Administration</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Overview system performance, sales aggregates, and manage user authorizations</p>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Total Sales</h3>
          <p style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)' }}>₹{stats.totalSales}</p>
        </div>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Total Orders</h3>
          <p style={{ fontSize: '1.75rem', fontWeight: 800 }}>{stats.totalOrders}</p>
        </div>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Active Accounts</h3>
          <p style={{ fontSize: '1.75rem', fontWeight: 800 }}>{stats.totalUsers}</p>
        </div>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Homemakers</h3>
          <p style={{ fontSize: '1.75rem', fontWeight: 800 }}>{stats.totalHomemakers}</p>
        </div>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Total Dishes</h3>
          <p style={{ fontSize: '1.75rem', fontWeight: 800 }}>{stats.totalDishes}</p>
        </div>
      </div>

      {/* User listing table */}
      <div className="glass-panel" style={{ padding: '1.5rem', overflowX: 'auto', border: '1px solid var(--glass-border)' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem' }}>User Registration Accounts</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              <th style={{ padding: '0.75rem 1rem' }}>User Info</th>
              <th style={{ padding: '0.75rem 1rem' }}>Email</th>
              <th style={{ padding: '0.75rem 1rem' }}>Role</th>
              <th style={{ padding: '0.75rem 1rem' }}>Status</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.9rem', hover: { background: 'rgba(255,255,255,0.01)' } }}>
                <td style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {u.avatar ? (
                    <img src={`http://localhost:5000${u.avatar}`} alt="avatar" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <FaUserCircle style={{ fontSize: '1.75rem', color: 'var(--text-muted)' }} />
                  )}
                  <span style={{ fontWeight: 700 }}>{u.name}</span>
                </td>
                <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{u.email}</td>
                <td style={{ padding: '1rem' }}>
                  <span style={{
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    fontWeight: 700,
                    padding: '0.15rem 0.5rem',
                    borderRadius: '4px',
                    background: u.role === 'admin' ? 'var(--danger-light)' : u.role === 'homemaker' ? 'var(--primary-light)' : 'var(--bg-tertiary)',
                    color: u.role === 'admin' ? 'var(--danger)' : u.role === 'homemaker' ? 'var(--primary)' : 'var(--text-primary)',
                  }}>
                    {u.role}
                  </span>
                </td>
                <td style={{ padding: '1rem' }}>
                  {u.isBanned ? (
                    <span style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: 700 }}>
                      <FaBan /> Banned
                    </span>
                  ) : (
                    <span style={{ color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: 700 }}>
                      <FaCheck /> Active
                    </span>
                  )}
                </td>
                <td style={{ padding: '1rem', textAlign: 'right' }}>
                  {u.role !== 'admin' && (
                    <button
                      className={`btn ${u.isBanned ? 'btn-success' : 'btn-danger'}`}
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                      onClick={() => handleToggleBan(u._id)}
                    >
                      {u.isBanned ? 'Unban Account' : 'Ban User'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {toastMsg && (
        <div className="toast-container">
          <Toast message={toastMsg} type={toastType} onClose={() => setToastMsg('')} />
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
