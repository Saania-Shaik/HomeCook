import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { isDishStale, getDishPriceLabel, getOrderTotal, getDistance } from '../utils/dishUtils';
import { FaSearch, FaStar, FaUserCircle, FaUtensils, FaClock, FaHeart, FaRegHeart, FaChevronRight, FaMapMarkerAlt, FaCompass, FaLocationArrow } from 'react-icons/fa';
import Modal from '../components/Modal';
import Toast from '../components/Toast';

const CustomerHome = () => {
  const { user, API_BASE_URL, updateProfile } = useContext(AuthContext);
  const [dishes, setDishes] = useState([]);
  const [homemakers, setHomemakers] = useState([]);
  const [selectedChef, setSelectedChef] = useState(null);
  const [chefReviews, setChefReviews] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [distanceFilter, setDistanceFilter] = useState('');

  // Order modal states
  const [selectedDish, setSelectedDish] = useState(null);
  const [orderQty, setOrderQty] = useState(1);
  const [isOrdering, setIsOrdering] = useState(false);

  // General Toast states
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState('success');

  const fetchDishes = async () => {
    try {
      let url = `${API_BASE_URL}/dishes`;
      const params = {};
      if (dateFilter) params.date = dateFilter;
      const { data } = await axios.get(url, { params });
      setDishes(data);
    } catch (error) {
      console.error('Error fetching dishes:', error);
    }
  };

  const fetchHomemakers = async () => {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/homemakers`);
      setHomemakers(data);
    } catch (error) {
      console.error('Error fetching homemakers:', error);
    }
  };

  useEffect(() => {
    fetchDishes();
    fetchHomemakers();
  }, [dateFilter]);

  const handleChefClick = async (chef) => {
    setSelectedChef(chef);
    // Fetch chef specific reviews
    try {
      const { data } = await axios.get(`${API_BASE_URL}/reviews/homemaker/${chef._id}`);
      setChefReviews(data);

      // Check follow status
      const statusRes = await axios.get(`${API_BASE_URL}/homemakers/${chef._id}/follow-status`);
      setIsFollowing(statusRes.data.isFollowing);
    } catch (error) {
      console.error('Error loading chef details:', error);
    }
  };

  const handleFollowToggle = async () => {
    if (!selectedChef) return;
    try {
      if (isFollowing) {
        await axios.post(`${API_BASE_URL}/homemakers/${selectedChef._id}/unfollow`);
        setIsFollowing(false);
        setToastMsg(`Unfollowed ${selectedChef.name}`);
        setToastType('info');
      } else {
        await axios.post(`${API_BASE_URL}/homemakers/${selectedChef._id}/follow`);
        setIsFollowing(true);
        setToastMsg(`Now following Chef ${selectedChef.name}! You will receive notifications when they post new dishes.`);
        setToastType('success');
      }
      fetchHomemakers(); // refresh followers stats
    } catch (error) {
      setToastMsg('Error updating follow status');
      setToastType('error');
    }
  };

  const handleOpenOrder = (dish) => {
    if (dish.quantity <= 0 || dish.status === 'sold_out') {
      setToastMsg('This dish is sold out!');
      setToastType('error');
      return;
    }
    setSelectedDish(dish);
    setOrderQty(dish.isCustomListing ? dish.quantity : 1);
  };

  const handlePlaceOrder = async () => {
    if (!selectedDish) return;
    setIsOrdering(true);
    try {
      const isCustom = selectedDish.isCustomListing;
      await axios.post(`${API_BASE_URL}/orders`, {
        dishId: selectedDish._id,
        quantity: isCustom ? selectedDish.quantity : orderQty,
        type: isCustom ? 'request' : 'standard',
      });

      setToastMsg(`Order placed successfully! Check status in 'My Orders'.`);
      setToastType('success');
      setSelectedDish(null);
      fetchDishes(); // Refresh list to update remaining quantities
    } catch (error) {
      setToastMsg(error.response?.data?.message || 'Failed to place order');
      setToastType('error');
    } finally {
      setIsOrdering(false);
    }
  };

  const filteredDishes = dishes.filter((dish) => {
    // 1. Text Search Filter
    const matchesSearch =
      dish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dish.homemaker?.name.toLowerCase().includes(searchQuery.toLowerCase());
      
    // 2. Distance Filter
    let matchesDistance = true;
    if (distanceFilter && user?.latitude && user?.longitude && dish.homemaker?.latitude && dish.homemaker?.longitude) {
      const dist = getDistance(user.latitude, user.longitude, dish.homemaker.latitude, dish.homemaker.longitude);
      if (dist !== null) {
        matchesDistance = dist <= Number(distanceFilter);
      }
    }
    
    return matchesSearch && matchesDistance;
  });

  return (
    <div className="main-content" style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '2rem' }}>
      
      {/* Left side: Search and Dish Catalog */}
      <div>
        {/* Geolocation Notice Banner */}
        {(!user?.latitude || !user?.longitude || (Number(user.latitude) === 0 && Number(user.longitude) === 0)) && (
          <div className="glass-panel" style={{
            background: 'var(--primary-light)',
            border: '1px solid var(--primary)',
            padding: '1.25rem',
            borderRadius: 'var(--border-radius-lg)',
            marginBottom: '2rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <FaMapMarkerAlt style={{ color: 'var(--primary)', fontSize: '1.5rem' }} />
              <div>
                <h4 style={{ margin: 0, fontWeight: 700 }}>Enable Location for Nearby Food</h4>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Set your coordinates to see distance to chefs and filter home kitchens near you.
                </p>
              </div>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => {
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(
                    async (position) => {
                      const lat = position.coords.latitude;
                      const lng = position.coords.longitude;
                      
                      const formData = new FormData();
                      formData.append('name', user.name);
                      formData.append('email', user.email);
                      formData.append('latitude', lat);
                      formData.append('longitude', lng);
                      formData.append('address', user.address || 'My Current Location');
                      
                      const res = await updateProfile(formData);
                      if (res.success) {
                        alert('Location updated successfully!');
                      } else {
                        alert('Failed to update location.');
                      }
                    },
                    (err) => {
                      alert('Could not retrieve your location automatically. Please update it in Settings.');
                    }
                  );
                } else {
                  alert('Geolocation not supported. Please update coordinates in Settings.');
                }
              }}
              style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
            >
              <FaCompass /> Get Current Location
            </button>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 800 }}>Explore Home Kitchens</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Authentic homemade dishes cooked with love and care</p>
          </div>

          {/* Search/Filter controls */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <FaSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-input"
                placeholder="Search dishes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '2.3rem', width: '200px' }}
              />
            </div>
            
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <FaLocationArrow style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
              <select
                className="form-input"
                value={distanceFilter}
                onChange={(e) => setDistanceFilter(e.target.value)}
                style={{ paddingLeft: '2.3rem', width: '160px', appearance: 'auto', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: 'var(--border-radius-sm)', cursor: 'pointer' }}
              >
                <option value="">Any distance</option>
                <option value="2">Within 2 km</option>
                <option value="5">Within 5 km</option>
                <option value="10">Within 10 km</option>
                <option value="25">Within 25 km</option>
                <option value="50">Within 50 km</option>
              </select>
            </div>

            <input
              type="date"
              className="form-input"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              style={{ width: '160px' }}
            />
            {dateFilter && (
              <button className="btn btn-secondary" onClick={() => setDateFilter('')}>Clear Date</button>
            )}
          </div>
        </div>

        {/* Dish Catalog Grid */}
        {filteredDishes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 2rem' }} className="glass-panel">
            <FaUtensils style={{ fontSize: '3rem', color: 'var(--text-muted)', marginBottom: '1rem' }} />
            <h3>No Dishes Available</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Try adjusting your search criteria or date filter.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {filteredDishes.map((dish) => {
              const stale = isDishStale(dish);
              return (
              <div key={dish._id} className={`dish-card glass-panel ${stale ? 'dish-card-stale' : ''}`} style={{ border: stale ? '2px solid var(--danger)' : '1px solid var(--glass-border)' }}>
                <div className="dish-card-img-wrapper">
                  {dish.image ? (
                    <img src={`http://localhost:5000${dish.image}`} alt={dish.name} className="dish-card-img" />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-tertiary)' }}>
                      <FaUtensils style={{ color: 'rgba(255,255,255,0.05)', fontSize: '4rem' }} />
                    </div>
                  )}
                  {stale ? (
                    <span className="dish-card-badge badge-stale">24+ hrs old</span>
                  ) : (
                    <span className={`dish-card-badge ${dish.quantity > 0 ? 'badge-available' : 'badge-soldout'}`}>
                      {dish.quantity > 0 ? `${dish.quantity} left` : 'Sold Out'}
                    </span>
                  )}
                </div>

                <div className="dish-card-body">
                  <div className="dish-title" style={stale ? { color: 'var(--danger)' } : undefined}>{dish.name}</div>
                  
                  {/* Homemaker mini details */}
                  <div
                    className="dish-chef"
                    onClick={() => handleChefClick(dish.homemaker)}
                    style={{ cursor: 'pointer', hover: { color: 'var(--primary)' } }}
                  >
                    {dish.homemaker?.avatar ? (
                      <img src={`http://localhost:5000${dish.homemaker.avatar}`} alt={dish.homemaker.name} className="dish-chef-img" />
                    ) : (
                      <FaUserCircle style={{ color: 'var(--primary)' }} />
                    )}
                    <span style={{ textDecoration: 'underline' }}>Chef {dish.homemaker?.name}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '2px', color: 'var(--warning)', fontWeight: 700, marginLeft: 'auto' }}>
                      <FaStar style={{ fontSize: '0.8rem' }} /> {dish.homemaker?.rating || '0'}
                    </span>
                  </div>

                  {/* Distance display if coordinates are present */}
                  {(() => {
                    if (user?.latitude && user?.longitude && dish.homemaker?.latitude && dish.homemaker?.longitude) {
                      const dist = getDistance(user.latitude, user.longitude, dish.homemaker.latitude, dish.homemaker.longitude);
                      if (dist !== null) {
                        return (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700, marginBottom: '0.75rem' }}>
                            <FaMapMarkerAlt /> 📍 {dist.toFixed(1)} km away
                          </div>
                        );
                      }
                    }
                    return null;
                  })()}

                  <p className="dish-desc">{dish.description}</p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    <FaClock /> Available: {new Date(dish.availableDate).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                  </div>

                  <div className="dish-footer">
                    <div className="dish-price">
                      {getDishPriceLabel(dish)}
                      {dish.isCustomListing && (
                        <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                          for {dish.quantity} servings
                        </span>
                      )}
                    </div>
                    <button
                      className="btn btn-primary"
                      onClick={() => handleOpenOrder(dish)}
                      disabled={dish.quantity <= 0}
                    >
                      {dish.quantity > 0 ? 'Order Now' : 'Sold Out'}
                    </button>
                  </div>
                </div>
              </div>
            );})}
          </div>
        )}
      </div>

      {/* Right side: Top Chefs / Quick profiles list */}
      <div>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '1.25rem' }}>Top Home Cooks</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {homemakers.map((chef) => (
            <div
              key={chef._id}
              onClick={() => handleChefClick(chef)}
              className="glass-panel"
              style={{
                padding: '1rem',
                border: '1px solid var(--glass-border)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                transition: 'var(--transition-fast)',
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--glass-border)'}
            >
              {chef.avatar ? (
                <img src={`http://localhost:5000${chef.avatar}`} alt={chef.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FaUserCircle style={{ color: 'var(--text-secondary)', fontSize: '1.5rem' }} />
                </div>
              )}
              <div style={{ flexGrow: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>Chef {chef.name}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  {chef.specialty}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--warning)', marginTop: '0.2rem' }}>
                  <FaStar /> <span>{chef.rating} ({chef.ratingCount || 0})</span>
                </div>
              </div>
              <FaChevronRight style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }} />
            </div>
          ))}
        </div>
      </div>

      {/* Place Order Modal */}
      <Modal isOpen={!!selectedDish} onClose={() => setSelectedDish(null)} title="Place Food Order">
        {selectedDish && (
          <div>
            <div style={{ display: 'flex', gap: '1.25rem', marginBottom: '1.5rem' }}>
              {selectedDish.image && (
                <img
                  src={`http://localhost:5000${selectedDish.image}`}
                  alt={selectedDish.name}
                  style={{ width: '90px', height: '90px', borderRadius: 'var(--border-radius-sm)', objectFit: 'cover' }}
                />
              )}
              <div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>{selectedDish.name}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Cooked by Chef {selectedDish.homemaker?.name}</p>
                <p style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '1.2rem', marginTop: '0.5rem' }}>
                  {getDishPriceLabel(selectedDish)}
                  {selectedDish.isCustomListing && (
                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                      Agreed total for {selectedDish.quantity} servings
                    </span>
                  )}
                </p>
              </div>
            </div>

            {!selectedDish.isCustomListing ? (
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Select Quantity</span>
                <span style={{ color: 'var(--text-secondary)' }}>Max: {selectedDish.quantity} servings</span>
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ width: '40px', height: '40px', padding: 0 }}
                  onClick={() => setOrderQty(Math.max(1, orderQty - 1))}
                  disabled={orderQty <= 1}
                >
                  -
                </button>
                <span style={{ fontSize: '1.5rem', fontWeight: 800, width: '40px', textAlign: 'center' }}>{orderQty}</span>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ width: '40px', height: '40px', padding: 0 }}
                  onClick={() => setOrderQty(Math.min(selectedDish.quantity, orderQty + 1))}
                  disabled={orderQty >= selectedDish.quantity}
                >
                  +
                </button>
              </div>
            </div>
            ) : (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Quantity: <strong>{selectedDish.quantity} servings</strong> (full custom order)
              </div>
            )}

            <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)', margin: '1.5rem 0' }}>
              {!selectedDish.isCustomListing && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                <span>Subtotal</span>
                <span>₹{selectedDish.price} x {orderQty}</span>
              </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.15rem' }}>
                <span>Total Payment</span>
                <span style={{ color: 'var(--primary)' }}>₹{getOrderTotal(selectedDish, orderQty)}</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedDish(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handlePlaceOrder} disabled={isOrdering}>
                {isOrdering ? 'Placing Order...' : 'Confirm Order'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Chef Profile Modal */}
      <Modal isOpen={!!selectedChef} onClose={() => setSelectedChef(null)} title={selectedChef ? `Chef Profile: ${selectedChef.name}` : ''}>
        {selectedChef && (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '1.5rem' }}>
              {selectedChef.avatar ? (
                <img src={`http://localhost:5000${selectedChef.avatar}`} alt={selectedChef.name} style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', marginBottom: '0.75rem' }} />
              ) : (
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
                  <FaUserCircle style={{ color: 'var(--text-secondary)', fontSize: '3rem' }} />
                </div>
              )}
              <h3 style={{ fontSize: '1.3rem' }}>Chef {selectedChef.name}</h3>
              <p style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', marginTop: '0.2rem' }}>
                {selectedChef.specialty}
              </p>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--warning)' }}>
                  <FaStar /> {selectedChef.rating} ({selectedChef.ratingCount || 0} ratings)
                </span>
              </div>

              {/* Follow Button */}
              <button
                className={`btn ${isFollowing ? 'btn-secondary' : 'btn-primary'}`}
                onClick={handleFollowToggle}
                style={{ marginTop: '1rem', padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
              >
                {isFollowing ? (
                  <>
                    <FaHeart style={{ color: 'var(--danger)' }} /> Following
                  </>
                ) : (
                  <>
                    <FaRegHeart /> Follow Chef
                  </>
                )}
              </button>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem' }}>Chef's Kitchen Bio</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.5', background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)' }}>
                {selectedChef.bio || "No kitchen bio provided."}
              </p>
            </div>

            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                Reviews & Ratings
              </h4>
              <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {chefReviews.length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>No reviews yet for this chef.</p>
                ) : (
                  chefReviews.map((review) => (
                    <div key={review._id} style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.8rem' }}>{review.customer?.name}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '2px', color: 'var(--warning)', fontSize: '0.75rem' }}>
                          <FaStar /> {review.rating}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{review.comment}</p>
                    </div>
                  ))
                )}
              </div>
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

export default CustomerHome;
