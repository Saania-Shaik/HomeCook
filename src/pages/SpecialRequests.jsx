import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import { FaUtensils, FaUserCircle, FaCalendarAlt, FaClipboardList, FaPlus, FaCheck, FaExclamationTriangle, FaHourglassHalf, FaArrowRight, FaMapMarkerAlt, FaCompass, FaLocationArrow } from 'react-icons/fa';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import { getDistance } from '../utils/dishUtils';

const SpecialRequests = () => {
  const { user, API_BASE_URL } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);

  // States
  const [requests, setRequests] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [dishName, setDishName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [neededDate, setNeededDate] = useState('');
  const [filterNearby, setFilterNearby] = useState(false);

  // Homemaker custom dish listing states
  const [selectedRequestForListing, setSelectedRequestForListing] = useState(null);
  const [listingPrice, setListingPrice] = useState('');
  const [listingDesc, setListingDesc] = useState('');
  const [isFulfilling, setIsFulfilling] = useState(false);

  // Customer order confirmation states
  const [selectedRequestForOrder, setSelectedRequestForOrder] = useState(null);
  const [isOrdering, setIsOrdering] = useState(false);

  // Toast
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState('success');

  const fetchRequests = async () => {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/requests`);
      setRequests(data);
    } catch (error) {
      console.error('Error fetching custom requests:', error);
    }
  };

  useEffect(() => {
    fetchRequests();

    if (socket) {
      socket.on('new_custom_request', (req) => {
        if (user?.role === 'homemaker') {
          setToastMsg(`🔔 New custom dish requested: "${req.dishName}"!`);
          setToastType('info');
        }
        fetchRequests();
      });

      socket.on('custom_request_taken', () => {
        fetchRequests();
      });

      socket.on('request_accepted_update', (updatedReq) => {
        if (user?.role === 'customer') {
          setToastMsg(`🎉 Your request for "${updatedReq.dishName}" was accepted!`);
          setToastType('success');
        }
        fetchRequests();
      });

      socket.on('request_dish_created', (data) => {
        if (user?.role === 'customer') {
          setToastMsg(`🍽️ Chef posted a listing for your "${data.request.dishName}" request!`);
          setToastType('success');
        }
        fetchRequests();
      });

      return () => {
        socket.off('new_custom_request');
        socket.off('custom_request_taken');
        socket.off('request_accepted_update');
        socket.off('request_dish_created');
      };
    }
  }, [socket, user]);

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    if (!dishName || !quantity || !neededDate) {
      setToastMsg('Please fill in all fields.');
      setToastType('error');
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/requests`, {
        dishName,
        quantity,
        neededDate,
      });

      setToastMsg('Special request posted successfully! Homemakers will review it.');
      setToastType('success');
      setShowAddForm(false);
      setDishName('');
      setQuantity(1);
      setNeededDate('');
      fetchRequests();
    } catch (error) {
      setToastMsg('Failed to post request.');
      setToastType('error');
    }
  };

  const handleAcceptRequest = async (id) => {
    try {
      await axios.put(`${API_BASE_URL}/requests/${id}/accept`);
      setToastMsg('Special request accepted! Now publish the custom menu for the customer.');
      setToastType('success');
      fetchRequests();
    } catch (error) {
      setToastMsg('Failed to accept request.');
      setToastType('error');
    }
  };

  const handleOpenListingModal = (req) => {
    setSelectedRequestForListing(req);
    setListingPrice('');
    setListingDesc(`Custom listing prepared for your special request: "${req.dishName}".`);
  };

  const handlePublishCustomDish = async (e) => {
    e.preventDefault();
    if (!listingPrice) {
      setToastMsg('Please specify a price.');
      setToastType('error');
      return;
    }

    setIsFulfilling(true);
    try {
      await axios.post(`${API_BASE_URL}/requests/${selectedRequestForListing._id}/dish`, {
        price: listingPrice,
        description: listingDesc,
      });

      setToastMsg('Custom listing published! Customer has been notified to place their order.');
      setToastType('success');
      setSelectedRequestForListing(null);
      fetchRequests();
    } catch (error) {
      setToastMsg('Failed to publish custom listing.');
      setToastType('error');
    } finally {
      setIsFulfilling(false);
    }
  };

  const handlePlaceRequestOrder = async () => {
    if (!selectedRequestForOrder || !selectedRequestForOrder.dishCreated) return;
    setIsOrdering(true);
    try {
      await axios.post(`${API_BASE_URL}/orders`, {
        dishId: selectedRequestForOrder.dishCreated._id,
        quantity: selectedRequestForOrder.quantity,
        type: 'request',
        specialRequestId: selectedRequestForOrder._id,
      });

      setToastMsg('Custom order locked and paid successfully!');
      setToastType('success');
      setSelectedRequestForOrder(null);
      fetchRequests();
    } catch (error) {
      setToastMsg('Failed to purchase custom order.');
      setToastType('error');
    } finally {
      setIsOrdering(false);
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (user?.role === 'homemaker' && filterNearby) {
      if (user.latitude && user.longitude && r.customer?.latitude && r.customer?.longitude) {
        const dist = getDistance(user.latitude, user.longitude, r.customer.latitude, r.customer.longitude);
        const radius = user.serviceRadius || 10;
        return dist !== null && dist <= radius;
      }
      return false;
    }
    return true;
  });

  return (
    <div className="main-content">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800 }}>Custom Culinary Requests</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            {user?.role === 'customer'
              ? 'Can\'t find what you want? Request custom dishes cooked on-demand by home chefs'
              : 'Review custom requests from neighbors, accept jobs, and publish custom menus'}
          </p>
        </div>
        {user?.role === 'customer' && (
          <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
            <FaPlus /> Post Custom Request
          </button>
        )}
        {user?.role === 'homemaker' && (
          <button
            className={`btn ${filterNearby ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterNearby(!filterNearby)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <FaLocationArrow /> {filterNearby ? 'Showing Nearby' : 'Filter by Service Radius'}
          </button>
        )}
      </div>

      {/* Requests table listing */}
      <div className="glass-panel" style={{ padding: '1.5rem', overflowX: 'auto', border: '1px solid var(--glass-border)' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem' }}>
          {user?.role === 'customer' ? 'My Custom Requests' : 'Incoming Custom Orders'}
        </h3>
        
        {filteredRequests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            <FaClipboardList style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }} />
            <p>No custom requests to display.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Requested Dish</th>
                <th style={{ padding: '0.75rem 1rem' }}>Customer / Date</th>
                <th style={{ padding: '0.75rem 1rem' }}>Quantity</th>
                <th style={{ padding: '0.75rem 1rem' }}>Agreed Price</th>
                <th style={{ padding: '0.75rem 1rem' }}>Assignee Chef</th>
                <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((r) => (
                <tr key={r._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.9rem' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{r.dishName}</div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>{r.customer?.name || 'You'}</div>
                    {user?.role === 'homemaker' && (() => {
                      if (user?.latitude && user?.longitude && r.customer?.latitude && r.customer?.longitude) {
                        const dist = getDistance(user.latitude, user.longitude, r.customer.latitude, r.customer.longitude);
                        if (dist !== null) {
                          return (
                            <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '0.15rem' }}>
                              <FaMapMarkerAlt /> {dist.toFixed(1)} km away
                            </div>
                          );
                        }
                      }
                      return null;
                    })()}
                    {user?.role === 'homemaker' && r.customer?.address && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.customer.address}>
                        📍 {r.customer.address}
                      </div>
                    )}
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '0.3rem' }}>
                      <FaCalendarAlt /> Need by: {new Date(r.neededDate).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                    </div>
                  </td>
                  <td style={{ padding: '1rem', fontWeight: 700 }}>{r.quantity} Servings</td>
                  <td style={{ padding: '1rem' }}>
                    {r.agreedPrice || r.dishCreated?.price ? (
                      <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
                        ₹{r.agreedPrice ?? r.dishCreated.price}
                        <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>total for all servings</span>
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {r.acceptedBy ? (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                          {r.acceptedBy.avatar ? (
                            <img src={`http://localhost:5000${r.acceptedBy.avatar}`} alt="chef" style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover' }} />
                          ) : (
                            <FaUserCircle style={{ color: 'var(--primary)' }} />
                          )}
                          <span style={{ fontWeight: 600 }}>Chef {r.acceptedBy.name}</span>
                        </div>
                        {(() => {
                          if (user?.latitude && user?.longitude && r.acceptedBy?.latitude && r.acceptedBy?.longitude) {
                            const dist = getDistance(user.latitude, user.longitude, r.acceptedBy.latitude, r.acceptedBy.longitude);
                            if (dist !== null) {
                              return (
                                <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '0.2rem' }}>
                                  <FaMapMarkerAlt /> {dist.toFixed(1)} km away
                                </div>
                              );
                            }
                          }
                          return null;
                        })()}
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pending claim</span>
                    )}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {r.status === 'pending' && (
                      <span style={{ color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: 700 }}>
                        <FaHourglassHalf /> Pending Accept
                      </span>
                    )}
                    {r.status === 'accepted' && (
                      <span style={{ color: 'var(--info)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: 700 }}>
                        <FaUtensils /> Accepted
                      </span>
                    )}
                    {r.status === 'fulfilled' && (
                      <span style={{ color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: 700 }}>
                        <FaCheck /> Fulfilled
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    {/* HOMEMAKER ACTIONS */}
                    {user?.role === 'homemaker' && r.status === 'pending' && (
                      <button className="btn btn-success" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => handleAcceptRequest(r._id)}>
                        Accept Job
                      </button>
                    )}
                    {user?.role === 'homemaker' && r.status === 'accepted' && !r.dishCreated && (
                      <button className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => handleOpenListingModal(r)}>
                        Publish Custom Menu
                      </button>
                    )}
                    {user?.role === 'homemaker' && r.status === 'accepted' && r.dishCreated && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Awaiting customer order lock</span>
                    )}

                    {/* CUSTOMER ACTIONS */}
                    {user?.role === 'customer' && r.status === 'accepted' && r.dishCreated && (
                      <button
                        className="btn btn-primary"
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                        onClick={() => setSelectedRequestForOrder(r)}
                      >
                        Confirm & Lock Order <FaArrowRight style={{ fontSize: '0.7rem' }} />
                      </button>
                    )}
                    {user?.role === 'customer' && r.status === 'accepted' && !r.dishCreated && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Chef preparing menu details...</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Request Modal */}
      <Modal isOpen={showAddForm} onClose={() => setShowAddForm(false)} title="Request a Custom Dish">
        <form onSubmit={handleCreateRequest}>
          <div className="form-group">
            <label className="form-label">Dish Name *</label>
            <input type="text" className="form-input" placeholder="e.g. Mutton Biryani / Homemade Pasta" value={dishName} onChange={e => setDishName(e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="form-label">Quantity (Servings Required) *</label>
            <input type="number" className="form-input" value={quantity} onChange={e => setQuantity(Number(e.target.value))} min="1" required />
          </div>

          <div className="form-group">
            <label className="form-label">Needed On (Date) *</label>
            <input type="date" className="form-input" value={neededDate} onChange={e => setNeededDate(e.target.value)} min={new Date().toISOString().split('T')[0]} required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowAddForm(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Publish Request</button>
          </div>
        </form>
      </Modal>

      {/* Homemaker: Publish custom listing modal */}
      <Modal isOpen={!!selectedRequestForListing} onClose={() => setSelectedRequestForListing(null)} title="Publish Custom Menu Listing">
        {selectedRequestForListing && (
          <form onSubmit={handlePublishCustomDish}>
            <div style={{ marginBottom: '1.25rem', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
              <p style={{ fontWeight: 700 }}>Requested Details:</p>
              <ul style={{ paddingLeft: '1.25rem', marginTop: '0.25rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <li>Dish: {selectedRequestForListing.dishName}</li>
                <li>Quantity: {selectedRequestForListing.quantity} Servings</li>
                <li>Needed On: {new Date(selectedRequestForListing.neededDate).toLocaleDateString()}</li>
              </ul>
            </div>

            <div className="form-group">
              <label className="form-label">Price for whole quantity (₹) *</label>
              <input type="number" className="form-input" placeholder="e.g. 500" value={listingPrice} onChange={e => setListingPrice(e.target.value)} min="1" required />
            </div>

            <div className="form-group">
              <label className="form-label">Preparation details / notes for Customer</label>
              <textarea className="form-input" value={listingDesc} onChange={e => setListingDesc(e.target.value)} style={{ minHeight: '80px', resize: 'vertical' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.5rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setSelectedRequestForListing(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={isFulfilling}>
                {isFulfilling ? 'Publishing...' : 'Publish & Notify'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Customer: Confirm Custom Order lock Modal */}
      <Modal isOpen={!!selectedRequestForOrder} onClose={() => setSelectedRequestForOrder(null)} title="Lock Custom Food Order">
        {selectedRequestForOrder && selectedRequestForOrder.dishCreated && (
          <div>
            <div style={{ marginBottom: '1.25rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{selectedRequestForOrder.dishName}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Prepared by Chef {selectedRequestForOrder.acceptedBy?.name}</p>
              
              <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <div>Quantity: <strong style={{ color: 'var(--text-primary)' }}>{selectedRequestForOrder.quantity} servings</strong></div>
                <div>Needed On: <strong style={{ color: 'var(--text-primary)' }}>{new Date(selectedRequestForOrder.neededDate).toLocaleDateString()}</strong></div>
                {selectedRequestForOrder.dishCreated.description && (
                  <div style={{ marginTop: '0.5rem', fontStyle: 'italic' }}>Chef's Note: {selectedRequestForOrder.dishCreated.description}</div>
                )}
              </div>
            </div>

            <div style={{ padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius-sm)', border: '1px dashed var(--primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <span style={{ fontWeight: 700 }}>Total Agreed Cost</span>
              <span style={{ color: 'var(--primary)', fontSize: '1.4rem', fontWeight: 800 }}>
                ₹{selectedRequestForOrder.agreedPrice ?? selectedRequestForOrder.dishCreated.price}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedRequestForOrder(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handlePlaceRequestOrder} disabled={isOrdering}>
                {isOrdering ? 'Confirming...' : 'Place Order Now'}
              </button>
            </div>
          </div>
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

export default SpecialRequests;
