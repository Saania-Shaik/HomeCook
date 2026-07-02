import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import { FaTruck, FaMapMarkerAlt, FaCheckCircle, FaUser, FaUtensils, FaCoins, FaBoxOpen, FaDirections } from 'react-icons/fa';
import Toast from '../components/Toast';
import confetti from 'canvas-confetti';

const DeliveryDashboard = () => {
  const { API_BASE_URL } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);

  const [orders, setOrders] = useState([]);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState('success');
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/orders`);
      setOrders(data);
    } catch (error) {
      console.error('Error fetching delivery orders:', error);
      setToastMsg('Failed to load orders.');
      setToastType('error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    if (socket) {
      // Listen to new orders marked as READY by chefs
      socket.on('delivery_ready', (readyOrder) => {
        setToastMsg(`🔔 New pickup job available: "${readyOrder.dish?.name || 'Meal'}"!`);
        setToastType('info');
        fetchOrders();
      });

      // Listen to orders taken by other delivery partners
      socket.on('delivery_taken', () => {
        fetchOrders();
      });

      // Listen to order updates generally
      socket.on('order_update', () => {
        fetchOrders();
      });

      return () => {
        socket.off('delivery_ready');
        socket.off('delivery_taken');
        socket.off('order_update');
      };
    }
  }, [socket]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await axios.put(`${API_BASE_URL}/orders/${orderId}/status`, { status: newStatus });
      setToastMsg(newStatus === 'picked' ? '🛵 Order picked up successfully!' : '✅ Order delivered!');
      setToastType('success');
      
      if (newStatus === 'delivered') {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
      }

      fetchOrders();
    } catch (error) {
      setToastMsg(error.response?.data?.message || 'Failed to update delivery status.');
      setToastType('error');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--border-color)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Filter orders
  const availableJobs = orders.filter(o => o.status === 'ready');
  const activeDeliveries = orders.filter(o => o.status === 'picked');
  const completedDeliveries = orders.filter(o => o.status === 'delivered');

  // Stats calculation (Let's say delivery partner gets ₹50 per delivery)
  const baseDeliveryRate = 50;
  const totalEarnings = completedDeliveries.length * baseDeliveryRate;

  return (
    <div className="main-content">
      {/* Title */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800 }}>Delivery Workspace</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Pick up ready food listings and deliver fresh meals to neighborhood foodies</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div className="stat-card glass-panel" style={{ borderLeft: '4px solid var(--primary)' }}>
          <div className="stat-card-info">
            <h3>Delivery Earnings</h3>
            <p>₹{totalEarnings}</p>
          </div>
          <div className="stat-icon" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
            <FaCoins />
          </div>
        </div>

        <div className="stat-card glass-panel" style={{ borderLeft: '4px solid var(--info)' }}>
          <div className="stat-card-info">
            <h3>Active Pickups</h3>
            <p>{activeDeliveries.length}</p>
          </div>
          <div className="stat-icon" style={{ background: 'rgba(14, 165, 233, 0.15)', color: 'var(--info)' }}>
            <FaTruck />
          </div>
        </div>

        <div className="stat-card glass-panel" style={{ borderLeft: '4px solid var(--secondary)' }}>
          <div className="stat-card-info">
            <h3>Completed Runs</h3>
            <p>{completedDeliveries.length}</p>
          </div>
          <div className="stat-icon" style={{ background: 'var(--secondary-light)', color: 'var(--secondary)' }}>
            <FaCheckCircle />
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '2rem' }}>
        
        {/* Left Side: Available Jobs & Active Deliveries */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          
          {/* Section 1: Active Deliveries */}
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FaTruck style={{ color: 'var(--info)' }} /> My Active Trips ({activeDeliveries.length})
            </h2>

            {activeDeliveries.length === 0 ? (
              <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <p>No active deliveries right now. Claim a job from the available list!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {activeDeliveries.map((order) => (
                  <div key={order._id} className="glass-panel" style={{ padding: '1.5rem', border: '1px solid var(--info)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{order.dish?.name}</h3>
                      <span style={{ fontSize: '0.75rem', background: 'rgba(14, 165, 233, 0.12)', color: 'var(--info)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>
                        ON THE WAY
                      </span>
                    </div>

                    {/* Routing coordinates/Addresses */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <FaMapMarkerAlt style={{ color: 'var(--primary)', marginTop: '3px' }} />
                        <div>
                          <strong>Pick Up From (Chef):</strong>
                          <div>{order.homemaker?.name}</div>
                          {order.homemaker?.address && (
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.15rem' }}>
                              📍 {order.homemaker.address}
                            </div>
                          )}
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{order.homemaker?.email}</div>
                          {order.homemaker?.latitude && order.homemaker?.longitude && (
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${order.homemaker.latitude},${order.homemaker.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-secondary"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', padding: '0.2rem 0.5rem', marginTop: '0.4rem', borderRadius: '4px' }}
                            >
                              <FaDirections /> Navigate to Chef
                            </a>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <FaMapMarkerAlt style={{ color: 'var(--secondary)', marginTop: '3px' }} />
                        <div>
                          <strong>Deliver To (Customer):</strong>
                          <div>{order.customer?.name}</div>
                          {order.customer?.address && (
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.15rem' }}>
                              📍 {order.customer.address}
                            </div>
                          )}
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{order.customer?.email}</div>
                          {order.customer?.latitude && order.customer?.longitude && (
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${order.customer.latitude},${order.customer.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-secondary"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', padding: '0.2rem 0.5rem', marginTop: '0.4rem', borderRadius: '4px' }}
                            >
                              <FaDirections /> Navigate to Customer
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      className="btn btn-success"
                      onClick={() => handleUpdateStatus(order._id, 'delivered')}
                      style={{ width: '100%', marginTop: '1.25rem', padding: '0.6rem' }}
                    >
                      Mark as Delivered
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Available Jobs */}
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FaBoxOpen style={{ color: 'var(--primary)' }} /> Available Deliveries ({availableJobs.length})
            </h2>

            {availableJobs.length === 0 ? (
              <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <p>No new orders ready for delivery at this moment. Stay tuned!</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                {availableJobs.map((order) => (
                  <div key={order._id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ flex: 1, minWidth: '250px' }}>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.5rem' }}>{order.dish?.name} ({order.quantity} servings)</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                          <span style={{ fontWeight: 600, minWidth: '75px' }}>Pickup:</span>
                          <div>
                            <strong>Chef {order.homemaker?.name}</strong>
                            {order.homemaker?.address && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>📍 {order.homemaker.address}</div>}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                          <span style={{ fontWeight: 600, minWidth: '75px' }}>Delivery:</span>
                          <div>
                            <strong>{order.customer?.name}</strong>
                            {order.customer?.address && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>📍 {order.customer.address}</div>}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, color: 'var(--primary)', marginBottom: '0.5rem' }}>Fare: ₹50</div>
                      <button
                        className="btn btn-primary"
                        onClick={() => handleUpdateStatus(order._id, 'picked')}
                        style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                      >
                        🛵 Accept & Pick Up
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Completed Run Log */}
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaCheckCircle style={{ color: 'var(--secondary)' }} /> Completed Runs ({completedDeliveries.length})
          </h2>

          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '550px', overflowY: 'auto' }}>
            {completedDeliveries.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '2rem 0' }}>No completed runs logged today.</p>
            ) : (
              completedDeliveries.map((order) => (
                <div key={order._id} style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, marginBottom: '0.25rem' }}>
                    <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '140px' }}>{order.dish?.name}</span>
                    <span style={{ color: 'var(--secondary)' }}>+₹50</span>
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                    To: {order.customer?.name}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '0.25rem' }}>
                    Completed: {new Date(order.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))
            )}
          </div>
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

export default DeliveryDashboard;
