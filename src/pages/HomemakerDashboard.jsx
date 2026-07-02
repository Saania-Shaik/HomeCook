import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import { FaDollarSign, FaUtensils, FaClipboardList, FaPlus, FaCheck, FaTruck, FaFire, FaHourglassHalf, FaRegClock, FaImage, FaTrash } from 'react-icons/fa';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import confetti from 'canvas-confetti';
import { isDishStale, getDishPriceLabel } from '../utils/dishUtils';

// Chart.js imports
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const HomemakerDashboard = () => {
  const { API_BASE_URL } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);

  // States
  const [orders, setOrders] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [earnings, setEarnings] = useState({
    todayEarnings: 0,
    weeklyEarnings: 0,
    monthlyEarnings: 0,
    totalEarnings: 0,
    totalOrders: 0,
    dailyStats: [],
  });

  // Modal forms
  const [showAddDish, setShowAddDish] = useState(false);
  const [dishName, setDishName] = useState('');
  const [dishPrice, setDishPrice] = useState('');
  const [dishQty, setDishQty] = useState('');
  const [dishDate, setDishDate] = useState('');
  const [dishDesc, setDishDesc] = useState('');
  const [dishImg, setDishImg] = useState(null);
  const [dishImgPreview, setDishImgPreview] = useState(null);

  // Toast states
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState('success');
  const [isSaving, setIsSaving] = useState(false);

  const fetchDashboardData = async () => {
    try {
      // 1. Fetch Orders
      const ordersRes = await axios.get(`${API_BASE_URL}/orders`);
      setOrders(ordersRes.data);

      // 2. Fetch Dishes
      const dishesRes = await axios.get(`${API_BASE_URL}/dishes?homemaker=${socket?.id || ''}`); // we populate inside controller
      // Filter dishes owned by homemaker locally to be safe, since getDishes handles homemaker filter via query params
      const myDishesRes = await axios.get(`${API_BASE_URL}/dishes`, {
        params: { homemaker: socket ? undefined : undefined } // Will filter on homemaker inside controller using jwt auth, but let's query with parameter:
      });
      // Wait, we populated getDishes to filter by query: `/dishes?homemaker=ID`
      // But wait! In dishController, if req.query.homemaker is provided, it returns all dishes by that homemaker.
      // So we can pass our own user ID! Let's get it from the AuthContext user object.
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const getMyData = async () => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (!storedUser) return;
    
    try {
      // Fetch stats
      const statsRes = await axios.get(`${API_BASE_URL}/homemakers/earnings`);
      setEarnings(statsRes.data);

      // Fetch dishes
      const dishesRes = await axios.get(`${API_BASE_URL}/dishes`, {
        params: { homemaker: storedUser._id }
      });
      setDishes(dishesRes.data);

      // Fetch orders
      const ordersRes = await axios.get(`${API_BASE_URL}/orders`);
      setOrders(ordersRes.data);
    } catch (error) {
      console.error('Error loading homemaker metrics:', error);
    }
  };

  useEffect(() => {
    getMyData();

    // Socket listeners for new orders placed
    if (socket) {
      socket.on('new_order', (newOrder) => {
        setToastMsg('🔔 New order received!');
        setToastType('info');
        getMyData();
      });

      return () => {
        socket.off('new_order');
      };
    }
  }, [socket]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setDishImg(file);
      setDishImgPreview(URL.createObjectURL(file));
    }
  };

  const handleAddDishSubmit = async (e) => {
    e.preventDefault();
    if (!dishName || !dishPrice || !dishQty || !dishDate) {
      setToastMsg('Please fill in all required fields.');
      setToastType('error');
      return;
    }

    setIsSaving(true);
    const formData = new FormData();
    formData.append('name', dishName);
    formData.append('price', dishPrice);
    formData.append('quantity', dishQty);
    formData.append('availableDate', dishDate);
    formData.append('description', dishDesc);
    if (dishImg) {
      formData.append('image', dishImg);
    }

    try {
      await axios.post(`${API_BASE_URL}/dishes`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setToastMsg('New recipe listed successfully!');
      setToastType('success');
      setShowAddDish(false);
      // Reset form
      setDishName('');
      setDishPrice('');
      setDishQty('');
      setDishDate('');
      setDishDesc('');
      setDishImg(null);
      setDishImgPreview(null);
      
      getMyData(); // Reload list
    } catch (error) {
      setToastMsg('Failed to post dish.');
      setToastType('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteDish = async (id) => {
    if (!window.confirm('Are you sure you want to remove this dish listing?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/dishes/${id}`);
      setToastMsg('Dish listing removed.');
      setToastType('info');
      getMyData();
    } catch (error) {
      setToastMsg('Failed to delete dish.');
      setToastType('error');
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await axios.put(`${API_BASE_URL}/orders/${orderId}/status`, { status: newStatus });
      setToastMsg(`Order marked as "${newStatus.toUpperCase()}"`);
      setToastType('success');
      
      // Celebrate if delivered!
      if (newStatus === 'delivered') {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }

      getMyData(); // Reload
    } catch (error) {
      setToastMsg('Failed to update status.');
      setToastType('error');
    }
  };

  // Group orders for Kanban
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const acceptedOrders = orders.filter(o => o.status === 'accepted');
  const preparingOrders = orders.filter(o => o.status === 'preparing');
  const readyOrders = orders.filter(o => o.status === 'ready');
  const pickedOrders = orders.filter(o => o.status === 'picked');
  const deliveredOrders = orders.filter(o => o.status === 'delivered');

  // Chart data configuration
  const chartLabels = earnings.dailyStats.map(s => s.date);
  const chartDataPoints = earnings.dailyStats.map(s => s.revenue);

  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        fill: true,
        label: 'Revenue (₹)',
        data: chartDataPoints,
        borderColor: '#f97316',
        backgroundColor: 'rgba(249, 115, 22, 0.15)',
        tension: 0.4,
        pointBackgroundColor: '#f97316',
        pointHoverRadius: 7,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: 'var(--text-secondary)' } },
      y: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: 'var(--text-secondary)' } },
    },
  };

  return (
    <div className="main-content">
      {/* Welcome & Heading */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800 }}>Chef Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage your kitchen, monitor analytics, and prepare incoming orders</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddDish(true)}>
          <FaPlus /> Post Today's Menu
        </button>
      </div>

      {/* Analytics Statistics Grid */}
      <div className="stats-grid">
        <div className="stat-card glass-panel" style={{ borderLeft: '4px solid var(--primary)' }}>
          <div className="stat-card-info">
            <h3>Today's Revenue</h3>
            <p>₹{earnings.todayEarnings}</p>
          </div>
          <div className="stat-icon" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
            <FaDollarSign />
          </div>
        </div>

        <div className="stat-card glass-panel" style={{ borderLeft: '4px solid var(--info)' }}>
          <div className="stat-card-info">
            <h3>Weekly Sales</h3>
            <p>₹{earnings.weeklyEarnings}</p>
          </div>
          <div className="stat-icon" style={{ background: 'rgba(14, 165, 233, 0.15)', color: 'var(--info)' }}>
            <FaDollarSign />
          </div>
        </div>

        <div className="stat-card glass-panel" style={{ borderLeft: '4px solid var(--secondary)' }}>
          <div className="stat-card-info">
            <h3>Total Orders</h3>
            <p>{earnings.totalOrders}</p>
          </div>
          <div className="stat-icon" style={{ background: 'var(--secondary-light)', color: 'var(--secondary)' }}>
            <FaClipboardList />
          </div>
        </div>

        <div className="stat-card glass-panel" style={{ borderLeft: '4px solid var(--warning)' }}>
          <div className="stat-card-info">
            <h3>Total Earnings</h3>
            <p>₹{earnings.totalEarnings}</p>
          </div>
          <div className="stat-icon" style={{ background: 'var(--warning-light)', color: 'var(--warning)' }}>
            <FaDollarSign />
          </div>
        </div>
      </div>

      {/* Charts & active dishes catalog */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginBottom: '3rem' }}>
        {/* Sales Chart */}
        <div className="glass-panel" style={{ padding: '1.5rem', border: '1px solid var(--glass-border)' }}>
          <h3 style={{ marginBottom: '1.25rem', fontSize: '1.1rem' }}>Revenue Analytics (Last 7 Days)</h3>
          <div style={{ height: '240px' }}>
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* Dishes list */}
        <div className="glass-panel" style={{ padding: '1.5rem', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '1.25rem', fontSize: '1.1rem' }}>Active Menu Listings</h3>
          <div style={{ overflowY: 'auto', maxHeight: '240px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {dishes.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', margin: 'auto' }}>No dishes posted yet.</p>
            ) : (
              dishes.map((dish) => {
                const stale = isDishStale(dish);
                return (
                <div key={dish._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: stale ? 'var(--danger-light)' : 'var(--bg-secondary)', borderRadius: 'var(--border-radius-sm)', border: stale ? '1px solid var(--danger)' : '1px solid var(--border-color)' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', color: stale ? 'var(--danger)' : undefined }}>{dish.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {getDishPriceLabel(dish)} • {dish.quantity} servings left
                      {dish.isCustomListing && ' (custom)'}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteDish(dish._id)}
                    style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.25rem' }}
                    title="Delete dish"
                  >
                    <FaTrash />
                  </button>
                </div>
              );})
            )}
          </div>
        </div>
      </div>

      {/* Kanban Order Management Workflow Board */}
      <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '1.25rem' }}>Active Kitchen Orders</h2>
      <div className="kanban-grid">
        {/* column 1: Pending */}
        <div className="kanban-column glass-panel">
          <div className="kanban-column-header">
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FaHourglassHalf style={{ color: 'var(--warning)' }} /> Pending</span>
            <span className="kanban-count">{pendingOrders.length}</span>
          </div>
          {pendingOrders.map(order => (
            <OrderCard key={order._id} order={order} nextStatus="accepted" nextLabel="Accept Order" onStatusUpdate={handleUpdateOrderStatus} />
          ))}
        </div>

        {/* column 2: Accepted */}
        <div className="kanban-column glass-panel">
          <div className="kanban-column-header">
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FaCheck style={{ color: 'var(--info)' }} /> Accepted</span>
            <span className="kanban-count">{acceptedOrders.length}</span>
          </div>
          {acceptedOrders.map(order => (
            <OrderCard key={order._id} order={order} nextStatus="preparing" nextLabel="Start Prep" onStatusUpdate={handleUpdateOrderStatus} />
          ))}
        </div>

        {/* column 3: Preparing */}
        <div className="kanban-column glass-panel">
          <div className="kanban-column-header">
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FaFire style={{ color: 'var(--primary)' }} /> Cooking</span>
            <span className="kanban-count">{preparingOrders.length}</span>
          </div>
          {preparingOrders.map(order => (
            <OrderCard key={order._id} order={order} nextStatus="ready" nextLabel="Ready for Pick" onStatusUpdate={handleUpdateOrderStatus} />
          ))}
        </div>

        {/* column 4: Ready */}
        <div className="kanban-column glass-panel">
          <div className="kanban-column-header">
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FaRegClock style={{ color: 'var(--secondary)' }} /> Ready</span>
            <span className="kanban-count">{readyOrders.length}</span>
          </div>
          {readyOrders.map(order => (
            <OrderCard key={order._id} order={order} nextStatus={null} nextLabel="" onStatusUpdate={handleUpdateOrderStatus} />
          ))}
        </div>

        {/* column 5: Out for Delivery */}
        <div className="kanban-column glass-panel">
          <div className="kanban-column-header">
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FaTruck style={{ color: 'var(--primary)' }} /> Out for Delivery</span>
            <span className="kanban-count">{pickedOrders.length}</span>
          </div>
          {pickedOrders.map(order => (
            <OrderCard key={order._id} order={order} nextStatus={null} nextLabel="" onStatusUpdate={handleUpdateOrderStatus} />
          ))}
        </div>
      </div>

      {/* Add Dish Modal */}
      <Modal isOpen={showAddDish} onClose={() => setShowAddDish(false)} title="Create Food Listing">
        <form onSubmit={handleAddDishSubmit}>
          <div className="form-group">
            <label className="form-label">Dish Name *</label>
            <input type="text" className="form-input" placeholder="e.g. Chicken Biryani" value={dishName} onChange={e => setDishName(e.target.value)} required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Price (₹) *</label>
              <input type="number" className="form-input" placeholder="120" value={dishPrice} onChange={e => setDishPrice(e.target.value)} min="1" required />
            </div>
            <div className="form-group">
              <label className="form-label">Servings Available *</label>
              <input type="number" className="form-input" placeholder="10" value={dishQty} onChange={e => setDishQty(e.target.value)} min="1" required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Available Date *</label>
            <input type="date" className="form-input" value={dishDate} onChange={e => setDishDate(e.target.value)} min={new Date().toISOString().split('T')[0]} required />
          </div>

          <div className="form-group">
            <label className="form-label">Dish Description</label>
            <textarea className="form-input" placeholder="e.g. Fragrant basmati rice layered with marinated chicken, cooked in authentic spices..." value={dishDesc} onChange={e => setDishDesc(e.target.value)} style={{ minHeight: '80px', resize: 'vertical' }} />
          </div>

          {/* Dish Image Upload */}
          <div className="form-group">
            <label className="form-label">Dish Photo</label>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: 'var(--border-radius-sm)', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {dishImgPreview ? <img src={dishImgPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <FaImage style={{ color: 'var(--text-muted)' }} />}
              </div>
              <input type="file" accept="image/*" onChange={handleFileChange} style={{ fontSize: '0.85rem' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowAddDish(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              {isSaving ? 'Saving Listing...' : 'Publish Listing'}
            </button>
          </div>
        </form>
      </Modal>

      {toastMsg && (
        <div className="toast-container">
          <Toast message={toastMsg} type={toastType} onClose={() => setToastMsg('')} />
        </div>
      )}
    </div>
  );
};

// Sub-component for Kanban Card
const OrderCard = ({ order, nextStatus, nextLabel, onStatusUpdate }) => {
  return (
    <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.5rem', animation: 'slideUp 0.3s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>{order.dish?.name}</h4>
        {order.type === 'request' && (
          <span style={{ fontSize: '0.65rem', background: 'var(--primary)', color: 'white', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 800 }}>
            CUSTOM
          </span>
        )}
      </div>
      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
        Customer: <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{order.customer?.name}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        <span>Qty: {order.quantity} servings</span>
        <span style={{ fontWeight: 700, color: 'var(--primary)' }}>₹{order.totalPrice}</span>
      </div>
      {nextStatus && (
        <button
          className="btn btn-success"
          style={{ width: '100%', padding: '0.4rem', fontSize: '0.8rem', marginTop: '0.5rem' }}
          onClick={() => onStatusUpdate(order._id, nextStatus)}
        >
          {nextLabel}
        </button>
      )}
      {order.status === 'ready' && (
        <div style={{ fontSize: '0.75rem', background: 'rgba(14, 165, 233, 0.08)', color: 'var(--info)', border: '1px solid rgba(14, 165, 233, 0.2)', borderRadius: '4px', padding: '0.4rem', textAlign: 'center', marginTop: '0.5rem', fontWeight: 600 }}>
          ⏳ Awaiting Delivery Pickup
        </div>
      )}
      {order.status === 'picked' && (
        <div style={{ fontSize: '0.75rem', background: 'var(--primary-light)', color: 'var(--primary)', border: '1px solid rgba(249, 115, 22, 0.2)', borderRadius: '4px', padding: '0.4rem', textAlign: 'center', marginTop: '0.5rem', fontWeight: 600 }}>
          🛵 Out with: {order.deliveryPartner?.name || 'Partner'}
        </div>
      )}
    </div>
  );
};

export default HomemakerDashboard;
