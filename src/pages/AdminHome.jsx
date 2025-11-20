import { useState, useEffect } from 'react';
import { FaBars, FaCaretDown, FaEdit, FaTrash, FaSave, FaTimes, FaSignOutAlt, FaSearch, FaUserPlus, FaUserShield, FaHome, FaUsers, FaShoppingCart, FaMoneyBillWave, FaBox, FaChartLine, FaSpinner, FaClipboardList, FaWarehouse, FaUser, FaStore, FaCreditCard, FaReceipt, FaDownload } from 'react-icons/fa';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

const Footer = () => (
  <footer style={{ backgroundColor: '#1A1F2E', padding: '12px 0', textAlign: 'center', borderTop: '2px solid #FF6B35', boxShadow: '0 -2px 10px rgba(0,0,0,0.3)', marginTop: 'auto' }}>
    <p style={{ color: '#E2E8F0', fontSize: '14px', fontWeight: '600', letterSpacing: '0.5px', margin: 0 }}>
      2025 © <span style={{ color: '#FF6B35', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Forge Reactor</span> | Forging Digital Innovation
    </p>
  </footer>
);

function AdminHome() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [currentStatus, setCurrentStatus] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [dashboardData, setDashboardData] = useState({ totalUsers: 0, totalArtisans: 0, totalOrders: 0, totalRevenue: 0, pendingOrders: 0, lowStockProducts: 0 });
  const [chartData, setChartData] = useState({ monthlyRevenue: [], productCategories: [], userRegistrations: [], orderStatus: [] });
  const [employeesList, setEmployeesList] = useState([]);
  const [employeeForm, setEmployeeForm] = useState({ fullName: '', email: '', phone: '', password: '', role: 'employee' });
  const [employeeEditingId, setEmployeeEditingId] = useState(null);
  const [employeeEditForm, setEmployeeEditForm] = useState({ fullName: '', email: '', phone: '', role: '' });
  const [userForm, setUserForm] = useState({ fullName: '', email: '', phone: '', password: '', role: 'customer', status: 'pending' });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [chartsLoading, setChartsLoading] = useState(false);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [inventoryOrders, setInventoryOrders] = useState([]);
  const [paymentsList, setPaymentsList] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const baseURL = 'https://spinners-backend-1.onrender.com/api';

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleDropdown = (key) => setDropdownOpen((prev) => (prev === key ? null : key));

  // === LOGOUT ===
  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminUser");
      sessionStorage.clear();
      window.location.replace("/login");
    }
  };

  // === FIXED: UPDATE USER STATUS FUNCTION ===
  const updateUserStatus = async (userId, newStatus) => {
    try {
      const token = localStorage.getItem('adminToken');
      
      // Use the correct PATCH endpoint from your backend
      const response = await axios.patch(
        `${baseURL}/users/update-status/${userId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        alert(`User status updated to ${newStatus} successfully`);
        
        // Update the local state to reflect the change
        setUsersList(prevUsers => 
          prevUsers.map(user => 
            user._id === userId ? { ...user, status: newStatus } : user
          )
        );
        
        // Refresh the current status list
        if (currentStatus) {
          fetchUsersByStatus(currentStatus);
        }
      } else {
        alert('Failed to update user status');
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      
      if (error.response?.status === 401) {
        alert('Session expired. Please login again.');
        localStorage.removeItem('adminToken');
        window.location.href = '/login';
        return;
      }
      
      if (error.response?.status === 404) {
        alert('User not found or endpoint unavailable');
      } else if (error.response?.status === 403) {
        alert('Access denied. You do not have permission to update user status.');
      } else {
        alert('Failed to update user status. Please try again.');
      }
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const [usersResponse, ordersResponse, inventoryResponse] = await Promise.all([
        axios.get(`${baseURL}/users`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${baseURL}/orders`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${baseURL}/inventory`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const users = Array.isArray(usersResponse.data) ? usersResponse.data : [];
      const orders = Array.isArray(ordersResponse.data) ? ordersResponse.data : [];
      const inventory = Array.isArray(inventoryResponse.data) ? inventoryResponse.data : [];

      const totalUsers = users.length;
      const totalArtisans = users.filter(u => u.role === "artisan").length;
      const totalOrders = orders.length;
      const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
      const pendingOrders = orders.filter(order => ["pending", "processing"].includes(order.status)).length;
      const lowStockProducts = inventory.filter(item => (item.stockQuantity || 0) < 10).length;

      setDashboardData({ totalUsers, totalArtisans, totalOrders, totalRevenue, pendingOrders, lowStockProducts });
      generateChartData(users, orders, inventory);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      if (err.response && err.response.status === 401) {
        alert('Session expired. Please login again.');
        localStorage.removeItem('adminToken');
        window.location.href = '/login';
        return;
      }
      alert('Failed to load dashboard data. Please check your backend or token.');
    } finally {
      setLoading(false);
    }
  };

  const generateChartData = (users, orders, products) => {
    setChartsLoading(true);
    try {
      const monthlyRevenue = generateMonthlyRevenueData(orders);
      const productCategories = generateProductCategoriesData(products);
      const userRegistrations = generateUserRegistrationData(users);
      const orderStatus = generateOrderStatusData(orders);
      setChartData({ monthlyRevenue, productCategories, userRegistrations, orderStatus });
    } catch (err) {
      console.error('Failed to generate chart data:', err);
    } finally {
      setChartsLoading(false);
    }
  };

  const generateMonthlyRevenueData = (orders) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    return months.map((month, index) => {
      const monthOrders = orders.filter(order => {
        const orderDate = new Date(order.createdAt || order.orderDate);
        return orderDate.getMonth() === index && orderDate.getFullYear() === currentYear;
      });
      const revenue = monthOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
      const orderCount = monthOrders.length;
      return { month, revenue, orders: orderCount };
    });
  };

  const generateProductCategoriesData = (products) => {
    const categoryCount = {};
    products.forEach(product => {
      const category = product.category || 'Uncategorized';
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });
    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe', '#00C49F', '#FFBB28', '#FF8042'];
    return Object.entries(categoryCount).map(([name, value], index) => ({ name, value, color: colors[index % colors.length] }));
  };

  const generateUserRegistrationData = (users) => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const last7Days = getLast7Days();
    return days.map((day, index) => {
      const dayUsers = users.filter(user => {
        const userDate = new Date(user.createdAt);
        return userDate.toDateString() === last7Days[index].toDateString();
      });
      const customers = dayUsers.filter(user => user.role === 'customer').length;
      const artisans = dayUsers.filter(user => user.role === 'artisan').length;
      return { day, customers, artisans };
    });
  };

  const generateOrderStatusData = (orders) => {
    const statusCount = {};
    const statusColors = { 'pending': '#ffc107', 'processing': '#17a2b8', 'shipped': '#007bff', 'delivered': '#28a745', 'cancelled': '#dc3545' };
    orders.forEach(order => {
      const status = order.status || 'pending';
      statusCount[status] = (statusCount[status] || 0) + 1;
    });
    return Object.entries(statusCount).map(([status, count]) => ({
      status: status.charAt(0).toUpperCase() + status.slice(1), count, color: statusColors[status] || '#6c757d'
    }));
  };

  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push(date);
    }
    return days;
  };

  // === FETCH CUSTOMER ORDERS ===
  const fetchCustomerOrders = async () => {
    setOrdersLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${baseURL}/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        // Filter customer orders (orderType === "customer" or undefined for backward compatibility)
        const customerOrders = response.data.orders.filter(order => 
          !order.orderType || order.orderType === "customer"
        );
        setCustomerOrders(customerOrders);
        setActiveSection('customer-orders');
      } else {
        alert('Failed to fetch customer orders');
      }
    } catch (error) {
      console.error('Error fetching customer orders:', error);
      alert('Failed to load customer orders');
    } finally {
      setOrdersLoading(false);
    }
  };

  // === FETCH INVENTORY ORDERS ===
  const fetchInventoryOrders = async () => {
    setOrdersLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${baseURL}/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        // Filter inventory orders (orderType === "inventory")
        const inventoryOrders = response.data.orders.filter(order => 
          order.orderType === "inventory"
        );
        setInventoryOrders(inventoryOrders);
        setActiveSection('inventory-orders');
      } else {
        alert('Failed to fetch inventory orders');
      }
    } catch (error) {
      console.error('Error fetching inventory orders:', error);
      alert('Failed to load inventory orders');
    } finally {
      setOrdersLoading(false);
    }
  };

  // === FETCH PAYMENTS FROM ORDERS ===
  const fetchPayments = async () => {
    setPaymentsLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${baseURL}/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        const allOrders = response.data.orders;
        
        // Transform orders into payment records
        const payments = allOrders.map(order => ({
          _id: order._id,
          orderId: { _id: order._id, orderType: order.orderType || 'customer' },
          userId: order.userId,
          artisanId: order.artisanId,
          supplierId: order.supplierId,
          amount: order.totalPrice || order.totalAmount || 0,
          paymentMethod: order.paymentMethod || 'unknown',
          paymentStatus: order.paymentStatus || 'pending',
          transactionId: order.transactionId || `ORD-${order._id?.substring(0, 8)}`,
          createdAt: order.createdAt || new Date(),
          productId: order.productId,
          quantity: order.quantity,
          orderStatus: order.orderStatus
        }));
        
        setPaymentsList(payments);
        setActiveSection('payments');
      } else {
        alert('Failed to fetch orders for payments');
      }
    } catch (error) {
      console.error('Error fetching payments from orders:', error);
      alert('Failed to load payment records from orders');
    } finally {
      setPaymentsLoading(false);
    }
  };

  // === GENERATE RECEIPT ===
  const generateReceipt = (payment) => {
    const receiptWindow = window.open('', '_blank');
    const receiptContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Payment Receipt - ${payment.transactionId}</title>
          <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
              .receipt-container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
              .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
              .company-name { font-size: 28px; font-weight: bold; color: #333; margin: 0; }
              .tagline { color: #666; font-size: 14px; margin: 5px 0 0 0; }
              .receipt-title { text-align: center; font-size: 24px; margin: 20px 0; color: #333; }
              .receipt-details { margin: 30px 0; }
              .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #eee; }
              .detail-label { font-weight: bold; color: #555; }
              .detail-value { color: #333; }
              .amount { font-size: 24px; font-weight: bold; color: #28a745; text-align: center; margin: 30px 0; }
              .status-badge { 
                  display: inline-block; 
                  padding: 5px 15px; 
                  border-radius: 20px; 
                  font-weight: bold; 
                  text-transform: uppercase;
                  font-size: 12px;
              }
              .status-completed { background: #d4edda; color: #155724; }
              .status-pending { background: #fff3cd; color: #856404; }
              .status-paid { background: #d4edda; color: #155724; }
              .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
              .print-btn { 
                  background: #007bff; 
                  color: white; 
                  border: none; 
                  padding: 10px 20px; 
                  border-radius: 5px; 
                  cursor: pointer; 
                  margin: 20px auto; 
                  display: block; 
                  font-size: 16px;
              }
              @media print {
                  body { background: white; }
                  .print-btn { display: none; }
                  .receipt-container { box-shadow: none; }
              }
          </style>
      </head>
      <body>
          <div class="receipt-container">
              <div class="header">
                  <h1 class="company-name">FORGE REACTOR</h1>
                  <p class="tagline">Forging Digital Innovation</p>
              </div>
              
              <h2 class="receipt-title">PAYMENT RECEIPT</h2>
              
              <div class="receipt-details">
                  <div class="detail-row">
                      <span class="detail-label">Receipt Number:</span>
                      <span class="detail-value">${payment.transactionId}</span>
                  </div>
                  <div class="detail-row">
                      <span class="detail-label">Date:</span>
                      <span class="detail-value">${new Date(payment.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div class="detail-row">
                      <span class="detail-label">Time:</span>
                      <span class="detail-value">${new Date(payment.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <div class="detail-row">
                      <span class="detail-label">Order ID:</span>
                      <span class="detail-value">${payment.orderId?._id || 'N/A'}</span>
                  </div>
                  <div class="detail-row">
                      <span class="detail-label">Order Type:</span>
                      <span class="detail-value">${payment.orderId?.orderType || 'customer'}</span>
                  </div>
                  <div class="detail-row">
                      <span class="detail-label">Customer/Artisan:</span>
                      <span class="detail-value">${payment.userId?.fullName || payment.artisanId?.fullName || payment.supplierId?.fullName || 'N/A'}</span>
                  </div>
                  <div class="detail-row">
                      <span class="detail-label">Email:</span>
                      <span class="detail-value">${payment.userId?.email || payment.artisanId?.email || payment.supplierId?.email || 'N/A'}</span>
                  </div>
                  <div class="detail-row">
                      <span class="detail-label">Product:</span>
                      <span class="detail-value">${payment.productId?.name || 'N/A'}</span>
                  </div>
                  <div class="detail-row">
                      <span class="detail-label">Quantity:</span>
                      <span class="detail-value">${payment.quantity || 1}</span>
                  </div>
                  <div class="detail-row">
                      <span class="detail-label">Payment Method:</span>
                      <span class="detail-value" style="text-transform: uppercase;">${payment.paymentMethod}</span>
                  </div>
                  <div class="detail-row">
                      <span class="detail-label">Order Status:</span>
                      <span class="detail-value">${payment.orderStatus || 'N/A'}</span>
                  </div>
                  <div class="detail-row">
                      <span class="detail-label">Payment Status:</span>
                      <span class="detail-value">
                          <span class="status-badge ${payment.paymentStatus === 'completed' || payment.paymentStatus === 'paid' ? 'status-completed' : 'status-pending'}">
                              ${payment.paymentStatus}
                          </span>
                      </span>
                  </div>
              </div>
              
              <div class="amount">
                  ${formatCurrency(payment.amount)}
              </div>
              
              <div class="footer">
                  <p>Thank you for your business!</p>
                  <p>For any inquiries, contact: support@forgereactor.com</p>
                  <p>This is an computer-generated receipt. No signature required.</p>
              </div>
              
              <button class="print-btn" onclick="window.print()">Print Receipt</button>
          </div>
      </body>
      </html>
    `;
    
    receiptWindow.document.write(receiptContent);
    receiptWindow.document.close();
  };

  // === DOWNLOAD RECEIPT ===
  const downloadReceipt = (payment) => {
    const receiptContent = `
      Payment Receipt - ${payment.transactionId}
      
      FORGE REACTOR
      Forging Digital Innovation
      
      ===============================
              PAYMENT RECEIPT
      ===============================
      
      Receipt Number: ${payment.transactionId}
      Date: ${new Date(payment.createdAt).toLocaleDateString()}
      Time: ${new Date(payment.createdAt).toLocaleTimeString()}
      Order ID: ${payment.orderId?._id || 'N/A'}
      Order Type: ${payment.orderId?.orderType || 'customer'}
      Customer/Artisan: ${payment.userId?.fullName || payment.artisanId?.fullName || payment.supplierId?.fullName || 'N/A'}
      Email: ${payment.userId?.email || payment.artisanId?.email || payment.supplierId?.email || 'N/A'}
      Product: ${payment.productId?.name || 'N/A'}
      Quantity: ${payment.quantity || 1}
      Payment Method: ${payment.paymentMethod?.toUpperCase()}
      Order Status: ${payment.orderStatus || 'N/A'}
      Payment Status: ${payment.paymentStatus?.toUpperCase()}
      
      ===============================
      AMOUNT: ${formatCurrency(payment.amount)}
      ===============================
      
      Thank you for your business!
      For any inquiries, contact: support@forgereactor.com
      
      This is an computer-generated receipt. No signature required.
    `;
    
    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `receipt-${payment.transactionId}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  useEffect(() => { 
    if (activeSection === 'dashboard') fetchDashboardData(); 
  }, [activeSection]);

  const handleUserFormChange = (e) => setUserForm({ ...userForm, [e.target.name]: e.target.value });
  const handleUserFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.post(`${baseURL}/users/add`, userForm, { headers: { Authorization: `Bearer ${token}` } });
      alert(res.data.message || 'User added successfully');
      setUserForm({ fullName: '', email: '', phone: '', password: '', role: 'customer', status: 'pending' });
      fetchUsersByStatus('pending');
    } catch (err) { alert(err.response?.data?.error || 'Failed to add user'); }
  };

  const fetchUsersByStatus = async (status) => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.get(`${baseURL}/users/status/${status}`, { headers: { Authorization: `Bearer ${token}` } });
      setUsersList(res.data);
      setCurrentStatus(status);
      setActiveSection('user-list');
    } catch (err) { console.error(err); alert('Failed to load users'); }
  };

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.get(`${baseURL}/employees`, { headers: { Authorization: `Bearer ${token}` } });
      setEmployeesList(res.data);
      setActiveSection('employee-list');
    } catch (err) { alert('Failed to load employees'); console.error(err); }
  };

  useEffect(() => { if (activeSection === 'employee-list') fetchEmployees(); }, [activeSection]);

  const handleEmployeeFormChange = (e) => setEmployeeForm({ ...employeeForm, [e.target.name]: e.target.value });
  const handleEmployeeAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.post(`${baseURL}/employees/add`, employeeForm, { headers: { Authorization: `Bearer ${token}` } });
      alert(res.data.message || 'Employee added successfully');
      setEmployeeForm({ fullName: '', email: '', phone: '', password: '', role: 'employee' });
      fetchEmployees();
    } catch (err) { alert(err.response?.data?.error || 'Failed to add employee'); }
  };

  const handleEmployeeEditClick = (emp) => {
    setEmployeeEditingId(emp._id);
    setEmployeeEditForm({ fullName: emp.fullName, email: emp.email, phone: emp.phone || '', role: emp.role || 'employee' });
  };

  const handleEmployeeEditChange = (e) => setEmployeeEditForm({ ...employeeEditForm, [e.target.name]: e.target.value });
  const handleEmployeeEditCancel = () => { setEmployeeEditingId(null); setEmployeeEditForm({ fullName: '', email: '', phone: '', role: '' }); };

  const handleEmployeeEditSave = async (id) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(`${baseURL}/employees/update/${id}`, employeeEditForm, { headers: { Authorization: `Bearer ${token}` } });
      alert('Employee updated successfully');
      setEmployeeEditingId(null);
      fetchEmployees();
    } catch (err) { alert(err.response?.data?.error || 'Failed to update employee'); }
  };

  const handleEmployeeDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) return;
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`${baseURL}/employees/delete/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      alert('Employee deleted successfully');
      fetchEmployees();
    } catch (err) { alert('Failed to delete employee'); }
  };

  const filteredUsers = usersList.filter(user => user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || user.email?.toLowerCase().includes(searchTerm.toLowerCase()) || user.role?.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredEmployees = employeesList.filter(emp => emp.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) || emp.role?.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredCustomerOrders = customerOrders.filter(order => 
    order.productId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.userId?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.orderStatus?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredInventoryOrders = inventoryOrders.filter(order => 
    order.productId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.supplierId?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.artisanId?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.orderStatus?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredPayments = paymentsList.filter(payment => 
    payment.transactionId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.userId?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.artisanId?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.supplierId?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.paymentMethod?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.paymentStatus?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.productId?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status) => {
    const statusConfig = { active: 'success', pending: 'warning', suspended: 'danger', rejected: 'secondary' };
    return <span className={`badge bg-${statusConfig[status] || 'secondary'}`}>{status}</span>;
  };

  const getRoleBadge = (role) => {
    const roleConfig = { admin: 'danger', supervisor: 'info', employee: 'primary', finance: 'success', driver: 'warning', customer: 'secondary', artisan: 'dark', supplier: 'light text-dark' };
    return <span className={`badge bg-${roleConfig[role] || 'secondary'}`}>{role}</span>;
  };

  const getOrderStatusBadge = (status) => {
    const statusConfig = { 
      pending: 'warning', processing: 'info', shipped: 'primary', delivered: 'success', 
      completed: 'success', received: 'info', approved: 'success', rejected: 'danger',
      cancelled: 'secondary'
    };
    return <span className={`badge bg-${statusConfig[status?.toLowerCase()] || 'secondary'}`}>{status}</span>;
  };

  const getPaymentStatusBadge = (status) => {
    const statusConfig = { 
      pending: 'warning', paid: 'success', completed: 'success', approved: 'success', 
      failed: 'danger', cancelled: 'secondary'
    };
    return <span className={`badge bg-${statusConfig[status?.toLowerCase()] || 'secondary'}`}>{status}</span>;
  };

  const getPaymentMethodBadge = (method) => {
    const methodConfig = { 
      mpesa: 'success', card: 'primary', bank_transfer: 'info', cash: 'secondary', 
      paypal: 'primary', stripe: 'info', unknown: 'secondary'
    };
    return <span className={`badge bg-${methodConfig[method] || 'secondary'}`}>{method}</span>;
  };

  const formatCurrency = (amount) => new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(amount);

  const renderActionButtons = (user) => {
    switch (currentStatus) {
      case 'pending': return (<div className="btn-group btn-group-sm"><button className="btn btn-success" onClick={() => updateUserStatus(user._id, 'active')}>Activate</button><button className="btn btn-danger" onClick={() => updateUserStatus(user._id, 'rejected')}>Reject</button></div>);
      case 'active': return (<button className="btn btn-warning btn-sm" onClick={() => updateUserStatus(user._id, 'suspended')}>Suspend</button>);
      case 'suspended': return (<button className="btn btn-success btn-sm" onClick={() => updateUserStatus(user._id, 'active')}>Reactivate</button>);
      case 'rejected': return (<button className="btn btn-secondary btn-sm" onClick={() => updateUserStatus(user._id, 'pending')}>Reconsider</button>);
      default: return null;
    }
  };

  const RevenueChart = () => (
    <div className="card shadow-sm h-100">
      <div className="card-header bg-primary text-white"><h6 className="mb-0"><FaChartLine className="me-2" />Monthly Revenue & Orders</h6></div>
      <div className="card-body">
        {chartsLoading ? (<div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}><FaSpinner className="fa-spin me-2" />Loading chart data...</div>) : chartData.monthlyRevenue.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}><BarChart data={chartData.monthlyRevenue}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis yAxisId="left" /><YAxis yAxisId="right" orientation="right" />
            <Tooltip formatter={(value, name) => [name === 'revenue' ? formatCurrency(value) : value, name === 'revenue' ? 'Revenue' : 'Orders']} /><Legend /><Bar yAxisId="left" dataKey="revenue" name="revenue" fill="#8884d8" />
            <Line yAxisId="right" type="monotone" dataKey="orders" name="orders" stroke="#ff7300" strokeWidth={2} /></BarChart></ResponsiveContainer>
        ) : (<div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}><p className="text-muted">No revenue data available</p></div>)}
      </div>
    </div>
  );

  const ProductCategoryChart = () => (
    <div className="card shadow-sm h-100">
      <div className="card-header bg-success text-white"><h6 className="mb-0"><FaBox className="me-2" />Product Categories</h6></div>
      <div className="card-body">
        {chartsLoading ? (<div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}><FaSpinner className="fa-spin me-2" />Loading chart data...</div>) : chartData.productCategories.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}><PieChart><Pie data={chartData.productCategories} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={80} fill="#8884d8" dataKey="value">
            {chartData.productCategories.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}</Pie><Tooltip formatter={(value) => [`${value} items`, 'Count']} /></PieChart></ResponsiveContainer>
        ) : (<div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}><p className="text-muted">No product data available</p></div>)}
      </div>
    </div>
  );

  const UserRegistrationChart = () => (
    <div className="card shadow-sm h-100">
      <div className="card-header bg-info text-white"><h6 className="mb-0"><FaUsers className="me-2" />Weekly User Registrations</h6></div>
      <div className="card-body">
        {chartsLoading ? (<div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}><FaSpinner className="fa-spin me-2" />Loading chart data...</div>) : chartData.userRegistrations.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}><AreaChart data={chartData.userRegistrations}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="day" /><YAxis /><Tooltip /><Legend />
            <Area type="monotone" dataKey="customers" stackId="1" stroke="#8884d8" fill="#8884d8" name="Customers" /><Area type="monotone" dataKey="artisans" stackId="1" stroke="#82ca9d" fill="#82ca9d" name="Artisans" /></AreaChart></ResponsiveContainer>
        ) : (<div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}><p className="text-muted">No user registration data available</p></div>)}
      </div>
    </div>
  );

  const OrderStatusChart = () => (
    <div className="card shadow-sm h-100">
      <div className="card-header bg-warning text-white"><h6 className="mb-0"><FaShoppingCart className="me-2" />Order Status Distribution</h6></div>
      <div className="card-body">
        {chartsLoading ? (<div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}><FaSpinner className="fa-spin me-2" />Loading chart data...</div>) : chartData.orderStatus.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}><BarChart data={chartData.orderStatus} layout="vertical"><CartesianGrid strokeDasharray="3 3" /><XAxis type="number" /><YAxis dataKey="status" type="category" /><Tooltip />
            <Bar dataKey="count" name="Orders">{chartData.orderStatus.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}</Bar></BarChart></ResponsiveContainer>
        ) : (<div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}><p className="text-muted">No order data available</p></div>)}
      </div>
    </div>
  );

  // === RENDER CUSTOMER ORDERS ===
  const renderCustomerOrders = () => (
    <div className="card shadow-sm">
      <div className="card-header bg-info text-white d-flex justify-content-between align-items-center">
        <h4 className="mb-0"><FaUser className="me-2" />Customer Orders<span className="badge bg-light text-dark ms-2">{filteredCustomerOrders.length}</span></h4>
        <div className="d-flex align-items-center">
          <div className="input-group input-group-sm" style={{ width: '300px' }}>
            <span className="input-group-text"><FaSearch /></span>
            <input type="text" className="form-control" placeholder="Search customer orders..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>
      </div>
      <div className="card-body">
        {ordersLoading ? (
          <div className="text-center py-5"><FaSpinner className="fa-spin me-2" />Loading customer orders...</div>
        ) : filteredCustomerOrders.length > 0 ? (
          <div className="table-responsive">
            <table className="table table-hover table-striped">
              <thead className="table-dark">
                <tr>
                  <th>Order ID</th>
                  <th>Product</th>
                  <th>Customer</th>
                  <th>Quantity</th>
                  <th>Total Price</th>
                  <th>Order Status</th>
                  <th>Payment Status</th>
                  <th>Created Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomerOrders.map((order) => (
                  <tr key={order._id}>
                    <td><small className="text-muted">{order._id?.substring(0, 8)}...</small></td>
                    <td className="fw-bold">{order.productId?.name || 'N/A'}</td>
                    <td>{order.userId?.fullName || 'N/A'}</td>
                    <td>{order.quantity}</td>
                    <td>{formatCurrency(order.totalPrice || 0)}</td>
                    <td>{getOrderStatusBadge(order.orderStatus)}</td>
                    <td>{getPaymentStatusBadge(order.paymentStatus)}</td>
                    <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-5">
            <FaShoppingCart size={48} className="text-muted mb-3" />
            <h5 className="text-muted">No Customer Orders Found</h5>
            <p className="text-muted">No customer orders match your current filters</p>
          </div>
        )}
      </div>
    </div>
  );

  // === RENDER INVENTORY ORDERS ===
  const renderInventoryOrders = () => (
    <div className="card shadow-sm">
      <div className="card-header bg-warning text-white d-flex justify-content-between align-items-center">
        <h4 className="mb-0"><FaStore className="me-2" />Inventory Orders<span className="badge bg-light text-dark ms-2">{filteredInventoryOrders.length}</span></h4>
        <div className="d-flex align-items-center">
          <div className="input-group input-group-sm" style={{ width: '300px' }}>
            <span className="input-group-text"><FaSearch /></span>
            <input type="text" className="form-control" placeholder="Search inventory orders..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>
      </div>
      <div className="card-body">
        {ordersLoading ? (
          <div className="text-center py-5"><FaSpinner className="fa-spin me-2" />Loading inventory orders...</div>
        ) : filteredInventoryOrders.length > 0 ? (
          <div className="table-responsive">
            <table className="table table-hover table-striped">
              <thead className="table-dark">
                <tr>
                  <th>Order ID</th>
                  <th>Product</th>
                  <th>Artisan</th>
                  <th>Supplier</th>
                  <th>Quantity</th>
                  <th>Total Price</th>
                  <th>Order Status</th>
                  <th>Payment Status</th>
                  <th>Created Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventoryOrders.map((order) => (
                  <tr key={order._id}>
                    <td><small className="text-muted">{order._id?.substring(0, 8)}...</small></td>
                    <td className="fw-bold">{order.productId?.name || 'N/A'}</td>
                    <td>{order.artisanId?.fullName || 'N/A'}</td>
                    <td>{order.supplierId?.fullName || 'N/A'}</td>
                    <td>{order.quantity}</td>
                    <td>{formatCurrency(order.totalPrice || 0)}</td>
                    <td>{getOrderStatusBadge(order.orderStatus)}</td>
                    <td>{getPaymentStatusBadge(order.paymentStatus)}</td>
                    <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-5">
            <FaStore size={48} className="text-muted mb-3" />
            <h5 className="text-muted">No Inventory Orders Found</h5>
            <p className="text-muted">No inventory orders match your current filters</p>
          </div>
        )}
      </div>
    </div>
  );

  // === RENDER PAYMENTS ===
  const renderPayments = () => (
    <div className="card shadow-sm">
      <div className="card-header bg-success text-white d-flex justify-content-between align-items-center">
        <h4 className="mb-0"><FaCreditCard className="me-2" />Payment Records<span className="badge bg-light text-dark ms-2">{filteredPayments.length}</span></h4>
        <div className="d-flex align-items-center">
          <div className="input-group input-group-sm" style={{ width: '300px' }}>
            <span className="input-group-text"><FaSearch /></span>
            <input type="text" className="form-control" placeholder="Search payments..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>
      </div>
      <div className="card-body">
        {paymentsLoading ? (
          <div className="text-center py-5"><FaSpinner className="fa-spin me-2" />Loading payment records...</div>
        ) : filteredPayments.length > 0 ? (
          <div className="table-responsive">
            <table className="table table-hover table-striped">
              <thead className="table-dark">
                <tr>
                  <th>Transaction ID</th>
                  <th>Order ID</th>
                  <th>Product</th>
                  <th>Customer/Artisan/Supplier</th>
                  <th>Amount</th>
                  <th>Payment Method</th>
                  <th>Order Status</th>
                  <th>Payment Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment) => (
                  <tr key={payment._id}>
                    <td className="fw-bold">{payment.transactionId}</td>
                    <td><small className="text-muted">{payment.orderId?._id?.substring(0, 8) || 'N/A'}...</small></td>
                    <td>{payment.productId?.name || 'N/A'}</td>
                    <td>
                      {payment.userId?.fullName || 
                       payment.artisanId?.fullName || 
                       payment.supplierId?.fullName || 
                       'N/A'}
                    </td>
                    <td className="fw-bold">{formatCurrency(payment.amount)}</td>
                    <td>{getPaymentMethodBadge(payment.paymentMethod)}</td>
                    <td>{getOrderStatusBadge(payment.orderStatus)}</td>
                    <td>{getPaymentStatusBadge(payment.paymentStatus)}</td>
                    <td>{new Date(payment.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="btn-group btn-group-sm">
                        <button 
                          className="btn btn-outline-primary" 
                          onClick={() => generateReceipt(payment)}
                          title="View Receipt"
                        >
                          <FaReceipt />
                        </button>
                        <button 
                          className="btn btn-outline-success" 
                          onClick={() => downloadReceipt(payment)}
                          title="Download Receipt"
                        >
                          <FaDownload />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-5">
            <FaCreditCard size={48} className="text-muted mb-3" />
            <h5 className="text-muted">No Payment Records Found</h5>
            <p className="text-muted">No payments match your current filters</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderUsersContent = () => {
    if (!currentStatus) return null;
    return (
      <div className="card shadow-sm">
        <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
          <h4 className="mb-0 text-capitalize"><FaUsers className="me-2" />{currentStatus} Users<span className="badge bg-light text-dark ms-2">{filteredUsers.length}</span></h4>
          <div className="d-flex align-items-center">
            <div className="input-group input-group-sm" style={{ width: '300px' }}><span className="input-group-text"><FaSearch /></span><input type="text" className="form-control" placeholder="Search users..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
          </div>
        </div>
        <div className="card-body">
          {filteredUsers.length > 0 ? (<div className="table-responsive"><table className="table table-hover table-striped"><thead className="table-dark"><tr><th>Full Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Status</th><th>Created At</th><th>Actions</th></tr></thead>
            <tbody>{filteredUsers.map((user) => (<tr key={user._id}><td className="fw-bold">{user.fullName}</td><td>{user.email}</td><td>{user.phone || 'N/A'}</td><td>{getRoleBadge(user.role)}</td><td>{getStatusBadge(user.status)}</td>
              <td>{new Date(user.createdAt).toLocaleDateString()}</td><td>{renderActionButtons(user)}</td></tr>))}</tbody></table></div>) : (
            <div className="text-center py-5"><FaUsers size={48} className="text-muted mb-3" /><h5 className="text-muted">No {currentStatus} users found</h5><p className="text-muted">No users match your current filters</p></div>)}
        </div>
      </div>
    );
  };

  const renderEmployeeContent = () => {
    switch (activeSection) {
      case 'employee-list': return (
        <div className="card shadow-sm">
          <div className="card-header bg-success text-white d-flex justify-content-between align-items-center">
            <h4 className="mb-0"><FaUserShield className="me-2" />Employees<span className="badge bg-light text-dark ms-2">{filteredEmployees.length}</span></h4>
            <div className="d-flex align-items-center">
              <div className="input-group input-group-sm" style={{ width: '300px' }}><span className="input-group-text"><FaSearch /></span><input type="text" className="form-control" placeholder="Search employees..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
              <button className="btn btn-light btn-sm ms-2 d-flex align-items-center" onClick={() => setActiveSection('add-employee')}><FaUserPlus className="me-1" />Add Employee</button>
            </div>
          </div>
          <div className="card-body">
            {filteredEmployees.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-hover table-striped">
                  <thead className="table-dark">
                    <tr><th>Full Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {filteredEmployees.map((emp) => (
                      <tr key={emp._id}>
                        {employeeEditingId === emp._id ? (
                          <>
                            <td><input name="fullName" value={employeeEditForm.fullName} onChange={handleEmployeeEditChange} className="form-control form-control-sm" /></td>
                            <td><input name="email" value={employeeEditForm.email} onChange={handleEmployeeEditChange} className="form-control form-control-sm" /></td>
                            <td><input name="phone" value={employeeEditForm.phone} onChange={handleEmployeeEditChange} className="form-control form-control-sm" /></td>
                            <td>
                              <select name="role" value={employeeEditForm.role} onChange={handleEmployeeEditChange} className="form-select form-select-sm">
                                <option value="employee">Employee</option><option value="supervisor">Supervisor</option><option value="finance">Finance</option><option value="driver">Driver</option>
                              </select>
                            </td>
                            <td>
                              <div className="btn-group btn-group-sm">
                                <button className="btn btn-success" onClick={() => handleEmployeeEditSave(emp._id)}><FaSave /></button>
                                <button className="btn btn-secondary" onClick={handleEmployeeEditCancel}><FaTimes /></button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="fw-bold">{emp.fullName}</td>
                            <td>{emp.email}</td>
                            <td>{emp.phone || 'N/A'}</td>
                            <td>{getRoleBadge(emp.role)}</td>
                            <td>
                              <div className="btn-group btn-group-sm">
                                <button className="btn btn-outline-primary" onClick={() => handleEmployeeEditClick(emp)}><FaEdit /></button>
                                <button className="btn btn-outline-danger" onClick={() => handleEmployeeDelete(emp._id)}><FaTrash /></button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-5">
                <FaUserShield size={48} className="text-muted mb-3" />
                <h5 className="text-muted">No employees found</h5>
                <button className="btn btn-primary mt-2" onClick={() => setActiveSection('add-employee')}>
                  <FaUserPlus className="me-2" />Add First Employee
                </button>
              </div>
            )}
          </div>
        </div>
      );
      case 'add-employee': return (
        <div className="card shadow-sm">
          <div className="card-header bg-info text-white"><h4 className="mb-0"><FaUserPlus className="me-2" />Add New Employee</h4></div>
          <div className="card-body">
            <form onSubmit={handleEmployeeAddSubmit} style={{ maxWidth: '600px' }}>
              <div className="row"><div className="col-md-6 mb-3"><label className="form-label fw-bold">Full Name</label><input type="text" name="fullName" value={employeeForm.fullName} onChange={handleEmployeeFormChange} className="form-control" required /></div>
                <div className="col-md-6 mb-3"><label className="form-label fw-bold">Email</label><input type="email" name="email" value={employeeForm.email} onChange={handleEmployeeFormChange} className="form-control" required /></div></div>
              <div className="row"><div className="col-md-6 mb-3"><label className="form-label fw-bold">Phone</label><input type="text" name="phone" value={employeeForm.phone} onChange={handleEmployeeFormChange} className="form-control" /></div>
                <div className="col-md-6 mb-3"><label className="form-label fw-bold">Role</label><select name="role" value={employeeForm.role} onChange={handleEmployeeFormChange} className="form-select">
                  <option value="employee">Employee</option><option value="supervisor">Supervisor</option><option value="finance">Finance</option><option value="driver">Driver</option></select></div></div>
              <div className="mb-4"><label className="form-label fw-bold">Password</label><input type="password" name="password" value={employeeForm.password} onChange={handleEmployeeFormChange} className="form-control" required /></div>
              <div className="d-flex gap-2"><button type="submit" className="btn btn-primary"><FaUserPlus className="me-2" />Create Employee</button>
                <button type="button" className="btn btn-secondary" onClick={fetchEmployees}>Cancel</button></div>
            </form>
          </div>
        </div>
      );
      default: return null;
    }
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard': return (
        <div className="container-fluid">
          <div className="row mb-4">
            {['Total Users', 'Artisans', 'Total Orders', 'Revenue', 'Pending Orders', 'Low Stock'].map((title, idx) => {
              const colors = ['primary', 'success', 'info', 'warning', 'danger', 'secondary'];
              const icons = [FaUsers, FaUserShield, FaShoppingCart, FaMoneyBillWave, FaBox, FaChartLine];
              const values = [dashboardData.totalUsers, dashboardData.totalArtisans, dashboardData.totalOrders, formatCurrency(dashboardData.totalRevenue), dashboardData.pendingOrders, dashboardData.lowStockProducts];
              const descriptions = ['Registered customers & artisans', 'Active vendors', 'All-time orders', 'Total revenue', 'Awaiting processing', 'Products need restock'];
              const IconComponent = icons[idx];
              return (
                <div className="col-md-2 mb-3" key={idx}>
                  <div className={`card bg-${colors[idx]} text-white h-100`}><div className="card-body"><div className="d-flex justify-content-between"><div><h6 className="card-title">{title}</h6>
                    <h3 className="mb-0">{loading ? <FaSpinner className="fa-spin" /> : values[idx]}</h3></div><IconComponent size={24} className="opacity-50" /></div><small>{descriptions[idx]}</small></div></div>
                </div>
              );
            })}
          </div>
          <div className="row mb-4"><div className="col-12"><div className="card shadow-sm"><div className="card-header bg-light"><h5 className="mb-0">Quick Actions</h5></div>
            <div className="card-body"><div className="d-flex gap-3 flex-wrap">
              <button className="btn btn-outline-primary" onClick={() => setActiveSection('add-user')}><FaUserPlus className="me-2" />Add User</button>
              <button className="btn btn-outline-success" onClick={() => setActiveSection('add-employee')}><FaUserShield className="me-2" />Add Employee</button>
              <button className="btn btn-outline-warning" onClick={() => fetchUsersByStatus('pending')}><FaUsers className="me-2" />View Pending Users</button>
              <button className="btn btn-outline-info" onClick={fetchEmployees}><FaUserShield className="me-2" />Manage Employees</button>
              <button className="btn btn-outline-secondary" onClick={fetchDashboardData}><FaChartLine className="me-2" />Refresh Data</button>
              <button className="btn btn-outline-info" onClick={fetchCustomerOrders}><FaUser className="me-2" />Customer Orders</button>
              <button className="btn btn-outline-warning" onClick={fetchInventoryOrders}><FaStore className="me-2" />Inventory Orders</button>
              <button className="btn btn-outline-success" onClick={fetchPayments}><FaCreditCard className="me-2" />View Payments</button>
            </div></div></div></div></div>
          <div className="row"><div className="col-lg-6 mb-4"><RevenueChart /></div><div className="col-lg-6 mb-4"><ProductCategoryChart /></div>
            <div className="col-lg-6 mb-4"><UserRegistrationChart /></div><div className="col-lg-6 mb-4"><OrderStatusChart /></div></div>
        </div>
      );
      case 'add-user': return (
        <div className="card shadow-sm">
          <div className="card-header bg-warning text-white"><h4 className="mb-0"><FaUserPlus className="me-2" />Add New User</h4></div>
          <div className="card-body">
            <form onSubmit={handleUserFormSubmit} style={{ maxWidth: '600px' }}>
              <div className="row"><div className="col-md-6 mb-3"><label className="form-label fw-bold">Full Name</label><input type="text" name="fullName" value={userForm.fullName} onChange={handleUserFormChange} className="form-control" required /></div>
                <div className="col-md-6 mb-3"><label className="form-label fw-bold">Email</label><input type="email" name="email" value={userForm.email} onChange={handleUserFormChange} className="form-control" required /></div></div>
              <div className="row"><div className="col-md-6 mb-3"><label className="form-label fw-bold">Phone</label><input type="text" name="phone" value={userForm.phone} onChange={handleUserFormChange} className="form-control" /></div>
                <div className="col-md-6 mb-3"><label className="form-label fw-bold">Role</label><select name="role" value={userForm.role} onChange={handleUserFormChange} className="form-select">
                  <option value="customer">Customer</option><option value="artisan">Artisan</option><option value="admin">Admin</option><option value="finance">Finance</option>
                  <option value="supervisor">Supervisor</option><option value="driver">Driver</option><option value="supplier">Supplier</option></select></div></div>
              <div className="mb-4"><label className="form-label fw-bold">Password</label><input type="password" name="password" value={userForm.password} onChange={handleUserFormChange} className="form-control" required /></div>
              <div className="d-flex gap-2"><button type="submit" className="btn btn-warning"><FaUserPlus className="me-2" />Create User</button>
                <button type="button" className="btn btn-secondary" onClick={() => fetchUsersByStatus('pending')}>Cancel</button></div>
            </form>
          </div>
        </div>
      );
      case 'user-list': return renderUsersContent();
      case 'employee-list': case 'add-employee': return renderEmployeeContent();
      case 'customer-orders': return renderCustomerOrders();
      case 'inventory-orders': return renderInventoryOrders();
      case 'payments': return renderPayments();
      default: return (<div className="card shadow-sm"><div className="card-body text-center py-5"><h3 className="text-muted">Coming Soon</h3><p className="text-muted">This section is under development</p></div></div>);
    }
  };

  return (
    <div className="d-flex vh-100">
      <div className={`bg-dark text-white p-3 ${sidebarOpen ? 'd-block' : 'd-none d-md-block'}`} style={{ width: '280px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div className="text-center mb-4 border-bottom pb-3"><h4 className="mb-1 fw-bold">Admin Panel</h4><small className="text-muted">Spinners Web Kenya</small></div>
        <ul className="nav flex-column flex-grow-1">
          <li className="nav-item mb-2"><button className={`btn w-100 text-start text-white d-flex align-items-center ${activeSection === 'dashboard' ? 'bg-primary' : 'bg-dark'}`} onClick={() => setActiveSection('dashboard')}><FaHome className="me-2" />Dashboard</button></li>
          
          <li className="nav-item mb-2"><button className="btn w-100 text-start text-white d-flex align-items-center justify-content-between bg-dark" onClick={() => toggleDropdown('users')}><span><FaUsers className="me-2" />User Management</span><FaCaretDown /></button>
            {dropdownOpen === 'users' && (<ul className="nav flex-column ms-3 mt-2">
              <li className="nav-item mb-1"><button className="btn btn-sm w-100 text-start text-white bg-dark" onClick={() => fetchUsersByStatus('active')}>✅ Active Users</button></li>
              <li className="nav-item mb-1"><button className="btn btn-sm w-100 text-start text-white bg-dark" onClick={() => fetchUsersByStatus('pending')}>⏳ Pending Users</button></li>
              <li className="nav-item mb-1"><button className="btn btn-sm w-100 text-start text-white bg-dark" onClick={() => fetchUsersByStatus('suspended')}>⚠️ Suspended</button></li>
              <li className="nav-item mb-1"><button className="btn btn-sm w-100 text-start text-white bg-dark" onClick={() => fetchUsersByStatus('rejected')}>❌ Rejected</button></li>
              <li className="nav-item mb-1"><button className="btn btn-sm w-100 text-start text-white bg-success" onClick={() => setActiveSection('add-user')}><FaUserPlus className="me-1" />Add New User</button></li>
            </ul>)}
          </li>

          <li className="nav-item mb-2"><button className={`btn w-100 text-start text-white d-flex align-items-center ${activeSection === 'employee-list' ? 'bg-success' : 'bg-dark'}`} onClick={fetchEmployees}><FaUserShield className="me-2" />Employees</button></li>
          
          <li className="nav-item mb-2"><button className={`btn w-100 text-start text-white d-flex align-items-center ${activeSection === 'customer-orders' ? 'bg-info' : 'bg-dark'}`} onClick={fetchCustomerOrders}><FaUser className="me-2" />Customer Orders</button></li>
          
          <li className="nav-item mb-2"><button className={`btn w-100 text-start text-white d-flex align-items-center ${activeSection === 'inventory-orders' ? 'bg-warning' : 'bg-dark'}`} onClick={fetchInventoryOrders}><FaStore className="me-2" />Inventory Orders</button></li>
          
          <li className="nav-item mb-2"><button className={`btn w-100 text-start text-white d-flex align-items-center ${activeSection === 'payments' ? 'bg-success' : 'bg-dark'}`} onClick={fetchPayments}><FaCreditCard className="me-2" />Payments</button></li>
          
          <li className="nav-item mb-2"><button className={`btn w-100 text-start text-white d-flex align-items-center ${activeSection === 'add-employee' ? 'bg-info' : 'bg-dark'}`} onClick={() => setActiveSection('add-employee')}><FaUserPlus className="me-2" />Add Employee</button></li>
        </ul>
        <div className="border-top pt-3 mt-auto">
          <button className="btn btn-outline-light w-100 d-flex align-items-center justify-content-center" onClick={handleLogout}>
            <FaSignOutAlt className="me-2" /> Logout
          </button>
        </div>
      </div>

      <div className="flex-grow-1 p-3" style={{ overflowY: 'auto' }}>
        <button className="btn btn-dark d-md-none mb-3" onClick={toggleSidebar}><FaBars /></button>
        {renderContent()}
        <Footer />
      </div>
    </div>
  );
}

export default AdminHome;