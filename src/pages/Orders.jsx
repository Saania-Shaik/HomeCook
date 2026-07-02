import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import { FaClipboardList, FaUserCircle, FaUtensils, FaCalendarAlt, FaStar, FaRegStar } from 'react-icons/fa';
import Modal from '../components/Modal';
import Toast from '../components/Toast';

const Orders = () => {
  const { API_BASE_URL } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);
  const [orders, setOrders] = useState([]);

  // Review states
  const [selectedOrderForReview, setSelectedOrderForReview] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Toast
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState('success');

  const fetchOrders = async () => {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/orders`);
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  useEffect(() => {
    fetchOrders();

    if (socket) {
      socket.on('order_update', (updatedOrder) => {
        setToastMsg(`🔔 Order status updated to: "${updatedOrder.status.toUpperCase()}"!`);
        setToastType('info');
        fetchOrders();
      });

      return () => {
        socket.off('order_update');
      };
    }
  }, [socket]);

  const handleOpenReview = (order) => {
    setSelectedOrderForReview(order);
    setRating(5);
    setComment('');
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!comment) {
      setToastMsg('Please add a comment.');
      setToastType('error');
      return;
    }

    setIsSubmittingReview(true);
    try {
      await axios.post(`${API_BASE_URL}/reviews`, {
        rating,
        comment,
        dishId: selectedOrderForReview.dish?._id,
        orderId: selectedOrderForReview._id,
      });

      setToastMsg('Thank you! Your review has been submitted.');
      setToastType('success');
      setSelectedOrderForReview(null);
      fetchOrders(); // Refresh order to hide review button if needed (or simply local update)
    } catch (error) {
      setToastMsg(error.response?.data?.message || 'Failed to submit review.');
      setToastType('error');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Helper to convert status to percentage width
  const getStatusPercentage = (status) => {
    switch (status) {
      case 'pending': return '0%';
      case 'accepted': return '20%';
      case 'preparing': return '40%';
      case 'ready': return '60%';
      case 'picked': return '80%';
      case 'delivered': return '100%';
      default: return '0%';
    }
  };

  const statusWorkflow = ['pending', 'accepted', 'preparing', 'ready', 'picked', 'delivered'];

  const getStepClass = (currentStatus, stepStatus) => {
    const currentIndex = statusWorkflow.indexOf(currentStatus);
    const stepIndex = statusWorkflow.indexOf(stepStatus);

    if (currentIndex > stepIndex) return 'tracker-step completed';
    if (currentIndex === stepIndex) return 'tracker-step active';
    return 'tracker-step';
  };

  return (
    <div className="main-content">
      {/* Title */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800 }}>My Food Orders</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Track active deliveries and view complete order history logs</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 2rem' }} className="glass-panel">
            <FaClipboardList style={{ fontSize: '3rem', color: 'var(--text-muted)', marginBottom: '1rem' }} />
            <h3>No Orders Placed</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Explore kitchens and try ordering tasty home-cooked meals!</p>
          </div>
        ) : (
          orders.map((order) => (
            <div
              key={order._id}
              className="glass-panel"
              style={{
                padding: '1.5rem',
                border: '1px solid var(--glass-border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              {/* Top Row: Chef / Listing Summary */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  {order.dish?.image ? (
                    <img
                      src={`http://localhost:5000${order.dish.image}`}
                      alt={order.dish.name}
                      style={{ width: '60px', height: '60px', borderRadius: 'var(--border-radius-sm)', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ width: '60px', height: '60px', background: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FaUtensils style={{ color: 'var(--text-muted)' }} />
                    </div>
                  )}
                  <div>
                    <h3 style={{ fontSize: '1.15rem' }}>{order.dish?.name || 'Custom Meal'}</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.2rem' }}>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        Cooked by: <span style={{ fontWeight: 700 }}>Chef {order.homemaker?.name}</span>
                      </p>
                      {order.deliveryPartner && (
                        <p style={{ color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          🛵 Delivery by: <span>{order.deliveryPartner.name}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>₹{order.totalPrice}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '0.25rem' }}>
                    <FaCalendarAlt /> Ordered: {new Date(order.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
              </div>

              {/* Order Quantities Summary */}
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between' }}>
                <span>Quantity ordered: <strong>{order.quantity} servings</strong></span>
                <span>Order Type: <strong style={{ textTransform: 'uppercase' }}>{order.type}</strong></span>
              </div>

              {/* Order Status Timeline Tracker */}
              <div style={{ margin: '1rem 0' }}>
                <div className="order-tracker">
                  <div className="order-tracker-progress" style={{ width: getStatusPercentage(order.status) }}></div>
                  
                  <div className={getStepClass(order.status, 'pending')}>
                    <div className="tracker-node">1</div>
                    <span className="tracker-label">Ordered</span>
                  </div>

                  <div className={getStepClass(order.status, 'accepted')}>
                    <div className="tracker-node">2</div>
                    <span className="tracker-label">Accepted</span>
                  </div>

                  <div className={getStepClass(order.status, 'preparing')}>
                    <div className="tracker-node">3</div>
                    <span className="tracker-label">Cooking</span>
                  </div>

                  <div className={getStepClass(order.status, 'ready')}>
                    <div className="tracker-node">4</div>
                    <span className="tracker-label">Ready</span>
                  </div>

                  <div className={getStepClass(order.status, 'picked')}>
                    <div className="tracker-node">5</div>
                    <span className="tracker-label">Out for Delivery</span>
                  </div>

                  <div className={getStepClass(order.status, 'delivered')}>
                    <div className="tracker-node">6</div>
                    <span className="tracker-label">Delivered</span>
                  </div>
                </div>
              </div>

              {/* Delivered Review Actions Button */}
              {order.status === 'delivered' && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                  <button className="btn btn-primary" onClick={() => handleOpenReview(order)} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                    Rate & Review Food
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Review Modal Form */}
      <Modal isOpen={!!selectedOrderForReview} onClose={() => setSelectedOrderForReview(null)} title="Rate & Review Meal">
        {selectedOrderForReview && (
          <form onSubmit={handleReviewSubmit}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                How was your "{selectedOrderForReview.dish?.name}" from Chef {selectedOrderForReview.homemaker?.name}?
              </p>
              
              {/* Star rating selector */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', fontSize: '2rem', cursor: 'pointer', margin: '1rem 0' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star} onClick={() => setRating(star)}>
                    {rating >= star ? <FaStar style={{ color: 'var(--warning)' }} /> : <FaRegStar style={{ color: 'var(--text-muted)' }} />}
                  </span>
                ))}
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--warning)', textTransform: 'uppercase' }}>
                {rating === 5 ? 'Excellent!' : rating === 4 ? 'Very Good' : rating === 3 ? 'Good' : rating === 2 ? 'Decent' : 'Poor'}
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Your Review Comments *</label>
              <textarea
                className="form-input"
                placeholder="Delicious meal! Tasted very fresh and authentic. Perfect spice level..."
                value={comment}
                onChange={e => setComment(e.target.value)}
                style={{ minHeight: '100px', resize: 'vertical' }}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.5rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setSelectedOrderForReview(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={isSubmittingReview}>
                {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {toastMsg && (
        <div className="toast-container">
          <Toast message={toastMsg} type={toastType} onClose={() => setToastMsg('')} />
        </div>
      )}
    </div>
  );
};

export default Orders;
