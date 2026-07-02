import React, { useContext, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import CustomerHome from './CustomerHome';
import HomemakerDashboard from './HomemakerDashboard';
import AdminDashboard from './AdminDashboard';
import DeliveryDashboard from './DeliveryDashboard';
import Toast from '../components/Toast';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState('success');

  useEffect(() => {
    if (location.state?.message) {
      setToastMsg(location.state.message);
      setToastType(location.state.type || 'success');
      // Clear location state so the message doesn't display again on refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  if (!user) return null;

  const renderDashboardContent = () => {
    switch (user.role) {
      case 'homemaker':
        return <HomemakerDashboard />;
      case 'admin':
        return <AdminDashboard />;
      case 'delivery':
        return <DeliveryDashboard />;
      case 'customer':
      default:
        return <CustomerHome />;
    }
  };

  return (
    <>
      {toastMsg && (
        <div className="toast-container">
          <Toast message={toastMsg} type={toastType} onClose={() => setToastMsg('')} />
        </div>
      )}
      {renderDashboardContent()}
    </>
  );
};

export default Dashboard;
