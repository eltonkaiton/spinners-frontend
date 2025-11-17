import { useState, useEffect } from 'react';
import { FaBars, FaCaretDown, FaEdit, FaTrash, FaSave, FaTimes, FaSignOutAlt, FaSearch, FaUserPlus, FaUserShield, FaHome, FaUsers, FaShoppingCart, FaMoneyBillWave, FaBox, FaChartLine, FaSpinner } from 'react-icons/fa';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';

// Footer Component
const Footer = () => {
  return (
    <footer style={{
      backgroundColor: '#1A1F2E',
      padding: '12px 0',
      textAlign: 'center',
      borderTop: '2px solid #FF6B35',
      boxShadow: '0 -2px 10px rgba(0,0,0,0.3)',
      marginTop: 'auto'
    }}>
      <p style={{
        color: '#E2E8F0',
        fontSize: '14px',
        fontWeight: '600',
        letterSpacing: '0.5px',
        margin: 0
      }}>
        2025 © <span style={{
          color: '#FF6B35',
          fontWeight: '800',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>Forge Reactor</span> | Forging Digital Innovation
      </p>
    </footer>
  );
};

function AdminHome() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [activeSection, setActiveSection] = useState('dashboard');

  const [currentStatus, setCurrentStatus] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [dashboardData, setDashboardData] = useState({
    totalUsers: 0,
    totalArtisans: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    lowStockProducts: 0
  });

  const [chartData, setChartData] = useState({
    monthlyRevenue: [],
    productCategories: [],
    userRegistrations: [],
    orderStatus: []
  });

  const [employeesList, setEmployeesList] = useState([]);
  const [employeeForm, setEmployeeForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    role: 'employee',
  });

  const [employeeEditingId, setEmployeeEditingId] = useState(null);
  const [employeeEditForm, setEmployeeEditForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: '',
  });

  const [userForm, setUserForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    role: 'customer',
    status: 'pending',
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [chartsLoading, setChartsLoading] = useState(false);

  const baseURL = 'https://spinners-backend-1.onrender.com/api';

  // === TOGGLES ===
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleDropdown = (key) => setDropdownOpen((prev) => (prev === key ? null : key));

  // === FETCH REAL DASHBOARD DATA ===
  const fetchDashboardData = async () => {
  setLoading(true);
  try {
    const token = localStorage.getItem('adminToken');

    const [usersResponse, ordersResponse, inventoryResponse] = await Promise.all([
      axios.get(`${baseURL}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      }),
      axios.get(`${baseURL}/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      }),
      axios.get(`${baseURL}/inventory`, {
        headers: { Authorization: `Bearer ${token}` }
      })
    ]);

    // ✅ Make sure data is arrays
    const users = Array.isArray(usersResponse.data) ? usersResponse.data : [];
    const orders = Array.isArray(ordersResponse.data) ? ordersResponse.data : [];
    const inventory = Array.isArray(inventoryResponse.data) ? inventoryResponse.data : [];

    // ✅ Calculate metrics
    const totalUsers = users.length;
    const totalArtisans = users.filter(u => u.role === "artisan").length;
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const pendingOrders = orders.filter(order =>
      ["pending", "processing"].includes(order.status)
    ).length;
    const lowStockProducts = inventory.filter(item => (item.stockQuantity || 0) < 10).length;

    setDashboardData({
      totalUsers,
      totalArtisans,
      totalOrders,
      totalRevenue,
      pendingOrders,
      lowStockProducts
    });

    generateChartData(users, orders, inventory);

  } catch (err) {
    console.error('Failed to fetch dashboard data:', err);

    // Handle token expiration or 401 errors
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


  // === GENERATE CHART DATA FROM REAL DATA ===
  const generateChartData = (users, orders, products) => {
    setChartsLoading(true);
    try {
      // Monthly Revenue Data
      const monthlyRevenue = generateMonthlyRevenueData(orders);
      
      // Product Categories Data
      const productCategories = generateProductCategoriesData(products);
      
      // User Registration Data
      const userRegistrations = generateUserRegistrationData(users);
      
      // Order Status Data
      const orderStatus = generateOrderStatusData(orders);

      setChartData({
        monthlyRevenue,
        productCategories,
        userRegistrations,
        orderStatus
      });
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
      
      return {
        month,
        revenue,
        orders: orderCount
      };
    });
  };

  const generateProductCategoriesData = (products) => {
    const categoryCount = {};
    
    products.forEach(product => {
      const category = product.category || 'Uncategorized';
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });

    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe', '#00C49F', '#FFBB28', '#FF8042'];
    
    return Object.entries(categoryCount).map(([name, value], index) => ({
      name,
      value,
      color: colors[index % colors.length]
    }));
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
      
      return {
        day,
        customers,
        artisans
      };
    });
  };

  const generateOrderStatusData = (orders) => {
    const statusCount = {};
    const statusColors = {
      'pending': '#ffc107',
      'processing': '#17a2b8',
      'shipped': '#007bff',
      'delivered': '#28a745',
      'cancelled': '#dc3545'
    };
    
    orders.forEach(order => {
      const status = order.status || 'pending';
      statusCount[status] = (statusCount[status] || 0) + 1;
    });

    return Object.entries(statusCount).map(([status, count]) => ({
      status: status.charAt(0).toUpperCase() + status.slice(1),
      count,
      color: statusColors[status] || '#6c757d'
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

  useEffect(() => {
    if (activeSection === 'dashboard') {
      fetchDashboardData();
    }
  }, [activeSection]);

  // === LOGOUT ===
  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      sessionStorage.clear();
      window.location.href = '/login';
    }
  };

  // === USERS ===
  const handleUserFormChange = (e) => setUserForm({ ...userForm, [e.target.name]: e.target.value });

  const handleUserFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.post(`${baseURL}/users/add`, userForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(res.data.message || 'User added successfully');
      setUserForm({ fullName: '', email: '', phone: '', password: '', role: 'customer', status: 'pending' });
      fetchUsersByStatus('pending');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add user');
    }
  };

  const fetchUsersByStatus = async (status) => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.get(`${baseURL}/users/status/${status}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsersList(res.data);
      setCurrentStatus(status);
      setActiveSection('user-list');
    } catch (err) {
      console.error(err);
      alert('Failed to load users');
    }
  };

  const updateUserStatus = async (user_id, newStatus) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.patch(`${baseURL}/users/update-status/${user_id}`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(`Status updated to ${newStatus}`);
      fetchUsersByStatus(currentStatus);
    } catch (err) {
      console.error(err);
      alert('Failed to update user status');
    }
  };

  // === EMPLOYEES ===
  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.get(`${baseURL}/employees`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmployeesList(res.data);
      setActiveSection('employee-list');
    } catch (err) {
      alert('Failed to load employees');
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeSection === 'employee-list') {
      fetchEmployees();
    }
  }, [activeSection]);

  const handleEmployeeFormChange = (e) => setEmployeeForm({ ...employeeForm, [e.target.name]: e.target.value });

  const handleEmployeeAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.post(`${baseURL}/employees/add`, employeeForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(res.data.message || 'Employee added successfully');
      setEmployeeForm({ fullName: '', email: '', phone: '', password: '', role: 'employee' });
      fetchEmployees();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add employee');
    }
  };

  const handleEmployeeEditClick = (emp) => {
    setEmployeeEditingId(emp._id);
    setEmployeeEditForm({
      fullName: emp.fullName,
      email: emp.email,
      phone: emp.phone || '',
      role: emp.role || 'employee',
    });
  };

  const handleEmployeeEditChange = (e) => setEmployeeEditForm({ ...employeeEditForm, [e.target.name]: e.target.value });

  const handleEmployeeEditCancel = () => {
    setEmployeeEditingId(null);
    setEmployeeEditForm({ fullName: '', email: '', phone: '', role: '' });
  };

  const handleEmployeeEditSave = async (id) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(`${baseURL}/employees/update/${id}`, employeeEditForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Employee updated successfully');
      setEmployeeEditingId(null);
      fetchEmployees();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update employee');
    }
  };

  const handleEmployeeDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) return;
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`${baseURL}/employees/delete/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Employee deleted successfully');
      fetchEmployees();
    } catch (err) {
      alert('Failed to delete employee');
    }
  };

  // === FILTERED DATA ===
  const filteredUsers = usersList.filter(user =>
    user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredEmployees = employeesList.filter(emp =>
    emp.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // === UI HELPERS ===
  const getStatusBadge = (status) => {
    const statusConfig = {
      active: 'success',
      pending: 'warning',
      suspended: 'danger',
      rejected: 'secondary'
    };
    return <span className={`badge bg-${statusConfig[status] || 'secondary'}`}>{status}</span>;
  };

  const getRoleBadge = (role) => {
    const roleConfig = {
      admin: 'danger',
      supervisor: 'info',
      employee: 'primary',
      finance: 'success',
      driver: 'warning',
      customer: 'secondary',
      artisan: 'dark',
      supplier: 'light text-dark'
    };
    return <span className={`badge bg-${roleConfig[role] || 'secondary'}`}>{role}</span>;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount);
  };

  const renderActionButtons = (user) => {
    switch (currentStatus) {
      case 'pending':
        return (
          <div className="btn-group btn-group-sm">
            <button className="btn btn-success" onClick={() => updateUserStatus(user._id, 'active')}>
              Activate
            </button>
            <button className="btn btn-danger" onClick={() => updateUserStatus(user._id, 'rejected')}>
              Reject
            </button>
          </div>
        );
      case 'active':
        return (
          <button className="btn btn-warning btn-sm" onClick={() => updateUserStatus(user._id, 'suspended')}>
            Suspend
          </button>
        );
      case 'suspended':
        return (
          <button className="btn btn-success btn-sm" onClick={() => updateUserStatus(user._id, 'active')}>
            Reactivate
          </button>
        );
      case 'rejected':
        return (
          <button className="btn btn-secondary btn-sm" onClick={() => updateUserStatus(user._id, 'pending')}>
            Reconsider
          </button>
        );
      default:
        return null;
    }
  };

  // === CHARTS COMPONENTS ===
  const RevenueChart = () => (
    <div className="card shadow-sm h-100">
      <div className="card-header bg-primary text-white">
        <h6 className="mb-0">
          <FaChartLine className="me-2" />
          Monthly Revenue & Orders
        </h6>
      </div>
      <div className="card-body">
        {chartsLoading ? (
          <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
            <FaSpinner className="fa-spin me-2" />
            Loading chart data...
          </div>
        ) : chartData.monthlyRevenue.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'revenue' ? formatCurrency(value) : value,
                  name === 'revenue' ? 'Revenue' : 'Orders'
                ]}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="revenue" name="revenue" fill="#8884d8" />
              <Line yAxisId="right" type="monotone" dataKey="orders" name="orders" stroke="#ff7300" strokeWidth={2} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
            <p className="text-muted">No revenue data available</p>
          </div>
        )}
      </div>
    </div>
  );

  const ProductCategoryChart = () => (
    <div className="card shadow-sm h-100">
      <div className="card-header bg-success text-white">
        <h6 className="mb-0">
          <FaBox className="me-2" />
          Product Categories
        </h6>
      </div>
      <div className="card-body">
        {chartsLoading ? (
          <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
            <FaSpinner className="fa-spin me-2" />
            Loading chart data...
          </div>
        ) : chartData.productCategories.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData.productCategories}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.productCategories.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} items`, 'Count']} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
            <p className="text-muted">No product data available</p>
          </div>
        )}
      </div>
    </div>
  );

  const UserRegistrationChart = () => (
    <div className="card shadow-sm h-100">
      <div className="card-header bg-info text-white">
        <h6 className="mb-0">
          <FaUsers className="me-2" />
          Weekly User Registrations
        </h6>
      </div>
      <div className="card-body">
        {chartsLoading ? (
          <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
            <FaSpinner className="fa-spin me-2" />
            Loading chart data...
          </div>
        ) : chartData.userRegistrations.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData.userRegistrations}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="customers" stackId="1" stroke="#8884d8" fill="#8884d8" name="Customers" />
              <Area type="monotone" dataKey="artisans" stackId="1" stroke="#82ca9d" fill="#82ca9d" name="Artisans" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
            <p className="text-muted">No user registration data available</p>
          </div>
        )}
      </div>
    </div>
  );

  const OrderStatusChart = () => (
    <div className="card shadow-sm h-100">
      <div className="card-header bg-warning text-white">
        <h6 className="mb-0">
          <FaShoppingCart className="me-2" />
          Order Status Distribution
        </h6>
      </div>
      <div className="card-body">
        {chartsLoading ? (
          <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
            <FaSpinner className="fa-spin me-2" />
            Loading chart data...
          </div>
        ) : chartData.orderStatus.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.orderStatus} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="status" type="category" />
              <Tooltip />
              <Bar dataKey="count" name="Orders">
                {chartData.orderStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
            <p className="text-muted">No order data available</p>
          </div>
        )}
      </div>
    </div>
  );

  // ... (rest of the component remains the same for users, employees, etc.)

  const renderUsersContent = () => {
    if (!currentStatus) return null;
    return (
      <div className="card shadow-sm">
        <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
          <h4 className="mb-0 text-capitalize">
            <FaUsers className="me-2" />
            {currentStatus} Users
            <span className="badge bg-light text-dark ms-2">{filteredUsers.length}</span>
          </h4>
          <div className="d-flex align-items-center">
            <div className="input-group input-group-sm" style={{ width: '300px' }}>
              <span className="input-group-text">
                <FaSearch />
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="card-body">
          {filteredUsers.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover table-striped">
                <thead className="table-dark">
                  <tr>
                    <th>Full Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Created At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user._id}>
                      <td className="fw-bold">{user.fullName}</td>
                      <td>{user.email}</td>
                      <td>{user.phone || 'N/A'}</td>
                      <td>{getRoleBadge(user.role)}</td>
                      <td>{getStatusBadge(user.status)}</td>
                      <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td>{renderActionButtons(user)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-5">
              <FaUsers size={48} className="text-muted mb-3" />
              <h5 className="text-muted">No {currentStatus} users found</h5>
              <p className="text-muted">No users match your current filters</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderEmployeeContent = () => {
    switch (activeSection) {
      case 'employee-list':
        return (
          <div className="card shadow-sm">
            <div className="card-header bg-success text-white d-flex justify-content-between align-items-center">
              <h4 className="mb-0">
                <FaUserShield className="me-2" />
                Employees
                <span className="badge bg-light text-dark ms-2">{filteredEmployees.length}</span>
              </h4>
              <div className="d-flex align-items-center">
                <div className="input-group input-group-sm" style={{ width: '300px' }}>
                  <span className="input-group-text">
                    <FaSearch />
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search employees..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <button 
                  className="btn btn-light btn-sm ms-2 d-flex align-items-center"
                  onClick={() => setActiveSection('add-employee')}
                >
                  <FaUserPlus className="me-1" />
                  Add Employee
                </button>
              </div>
            </div>
            <div className="card-body">
              {filteredEmployees.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover table-striped">
                    <thead className="table-dark">
                      <tr>
                        <th>Full Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Role</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEmployees.map((emp) => (
                        <tr key={emp._id}>
                          {employeeEditingId === emp._id ? (
                            <>
                              <td>
                                <input
                                  name="fullName"
                                  value={employeeEditForm.fullName}
                                  onChange={handleEmployeeEditChange}
                                  className="form-control form-control-sm"
                                />
                              </td>
                              <td>
                                <input
                                  name="email"
                                  value={employeeEditForm.email}
                                  onChange={handleEmployeeEditChange}
                                  className="form-control form-control-sm"
                                />
                              </td>
                              <td>
                                <input
                                  name="phone"
                                  value={employeeEditForm.phone}
                                  onChange={handleEmployeeEditChange}
                                  className="form-control form-control-sm"
                                />
                              </td>
                              <td>
                                <select
                                  name="role"
                                  value={employeeEditForm.role}
                                  onChange={handleEmployeeEditChange}
                                  className="form-select form-select-sm"
                                >
                                  <option value="employee">Employee</option>
                                  <option value="supervisor">Supervisor</option>
                                  <option value="finance">Finance</option>
                                  <option value="driver">Driver</option>
                                </select>
                              </td>
                              <td>
                                <div className="btn-group btn-group-sm">
                                  <button
                                    className="btn btn-success"
                                    onClick={() => handleEmployeeEditSave(emp._id)}
                                  >
                                    <FaSave />
                                  </button>
                                  <button className="btn btn-secondary" onClick={handleEmployeeEditCancel}>
                                    <FaTimes />
                                  </button>
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
                                  <button
                                    className="btn btn-outline-primary"
                                    onClick={() => handleEmployeeEditClick(emp)}
                                  >
                                    <FaEdit />
                                  </button>
                                  <button
                                    className="btn btn-outline-danger"
                                    onClick={() => handleEmployeeDelete(emp._id)}
                                  >
                                    <FaTrash />
                                  </button>
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
                  <button 
                    className="btn btn-primary mt-2"
                    onClick={() => setActiveSection('add-employee')}
                  >
                    <FaUserPlus className="me-2" />
                    Add First Employee
                  </button>
                </div>
              )}
            </div>
          </div>
        );

      case 'add-employee':
        return (
          <div className="card shadow-sm">
            <div className="card-header bg-info text-white">
              <h4 className="mb-0">
                <FaUserPlus className="me-2" />
                Add New Employee
              </h4>
            </div>
            <div className="card-body">
              <form onSubmit={handleEmployeeAddSubmit} style={{ maxWidth: '600px' }}>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-bold">Full Name</label>
                    <input
                      type="text"
                      name="fullName"
                      value={employeeForm.fullName}
                      onChange={handleEmployeeFormChange}
                      className="form-control"
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-bold">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={employeeForm.email}
                      onChange={handleEmployeeFormChange}
                      className="form-control"
                      required
                    />
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-bold">Phone</label>
                    <input
                      type="text"
                      name="phone"
                      value={employeeForm.phone}
                      onChange={handleEmployeeFormChange}
                      className="form-control"
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-bold">Role</label>
                    <select
                      name="role"
                      value={employeeForm.role}
                      onChange={handleEmployeeFormChange}
                      className="form-select"
                    >
                      <option value="employee">Employee</option>
                      <option value="supervisor">Supervisor</option>
                      <option value="finance">Finance</option>
                      <option value="driver">Driver</option>
                    </select>
                  </div>
                </div>
                <div className="mb-4">
                  <label className="form-label fw-bold">Password</label>
                  <input
                    type="password"
                    name="password"
                    value={employeeForm.password}
                    onChange={handleEmployeeFormChange}
                    className="form-control"
                    required
                  />
                </div>
                <div className="d-flex gap-2">
                  <button type="submit" className="btn btn-primary">
                    <FaUserPlus className="me-2" />
                    Create Employee
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={fetchEmployees}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // === CONTENT RENDER ===
  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <div className="container-fluid">
            {/* Statistics Cards */}
            <div className="row mb-4">
              <div className="col-md-2 mb-3">
                <div className="card bg-primary text-white h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between">
                      <div>
                        <h6 className="card-title">Total Users</h6>
                        <h3 className="mb-0">{loading ? <FaSpinner className="fa-spin" /> : dashboardData.totalUsers}</h3>
                      </div>
                      <FaUsers size={24} className="opacity-50" />
                    </div>
                    <small>Registered customers & artisans</small>
                  </div>
                </div>
              </div>
              <div className="col-md-2 mb-3">
                <div className="card bg-success text-white h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between">
                      <div>
                        <h6 className="card-title">Artisans</h6>
                        <h3 className="mb-0">{loading ? <FaSpinner className="fa-spin" /> : dashboardData.totalArtisans}</h3>
                      </div>
                      <FaUserShield size={24} className="opacity-50" />
                    </div>
                    <small>Active vendors</small>
                  </div>
                </div>
              </div>
              <div className="col-md-2 mb-3">
                <div className="card bg-info text-white h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between">
                      <div>
                        <h6 className="card-title">Total Orders</h6>
                        <h3 className="mb-0">{loading ? <FaSpinner className="fa-spin" /> : dashboardData.totalOrders}</h3>
                      </div>
                      <FaShoppingCart size={24} className="opacity-50" />
                    </div>
                    <small>All-time orders</small>
                  </div>
                </div>
              </div>
              <div className="col-md-2 mb-3">
                <div className="card bg-warning text-white h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between">
                      <div>
                        <h6 className="card-title">Revenue</h6>
                        <h3 className="mb-0">{loading ? <FaSpinner className="fa-spin" /> : formatCurrency(dashboardData.totalRevenue)}</h3>
                      </div>
                      <FaMoneyBillWave size={24} className="opacity-50" />
                    </div>
                    <small>Total revenue</small>
                  </div>
                </div>
              </div>
              <div className="col-md-2 mb-3">
                <div className="card bg-danger text-white h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between">
                      <div>
                        <h6 className="card-title">Pending Orders</h6>
                        <h3 className="mb-0">{loading ? <FaSpinner className="fa-spin" /> : dashboardData.pendingOrders}</h3>
                      </div>
                      <FaBox size={24} className="opacity-50" />
                    </div>
                    <small>Awaiting processing</small>
                  </div>
                </div>
              </div>
              <div className="col-md-2 mb-3">
                <div className="card bg-secondary text-white h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between">
                      <div>
                        <h6 className="card-title">Low Stock</h6>
                        <h3 className="mb-0">{loading ? <FaSpinner className="fa-spin" /> : dashboardData.lowStockProducts}</h3>
                      </div>
                      <FaChartLine size={24} className="opacity-50" />
                    </div>
                    <small>Products need restock</small>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="row mb-4">
              <div className="col-12">
                <div className="card shadow-sm">
                  <div className="card-header bg-light">
                    <h5 className="mb-0">Quick Actions</h5>
                  </div>
                  <div className="card-body">
                    <div className="d-flex gap-3 flex-wrap">
                      <button className="btn btn-outline-primary" onClick={() => setActiveSection('add-user')}>
                        <FaUserPlus className="me-2" />
                        Add User
                      </button>
                      <button className="btn btn-outline-success" onClick={() => setActiveSection('add-employee')}>
                        <FaUserShield className="me-2" />
                        Add Employee
                      </button>
                      <button className="btn btn-outline-warning" onClick={() => fetchUsersByStatus('pending')}>
                        <FaUsers className="me-2" />
                        View Pending Users
                      </button>
                      <button className="btn btn-outline-info" onClick={fetchEmployees}>
                        <FaUserShield className="me-2" />
                        Manage Employees
                      </button>
                      <button className="btn btn-outline-secondary" onClick={fetchDashboardData}>
                        <FaChartLine className="me-2" />
                        Refresh Data
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="row">
              <div className="col-lg-6 mb-4">
                <RevenueChart />
              </div>
              <div className="col-lg-6 mb-4">
                <ProductCategoryChart />
              </div>
              <div className="col-lg-6 mb-4">
                <UserRegistrationChart />
              </div>
              <div className="col-lg-6 mb-4">
                <OrderStatusChart />
              </div>
            </div>
          </div>
        );

      case 'add-user':
        return (
          <div className="card shadow-sm">
            <div className="card-header bg-warning text-white">
              <h4 className="mb-0">
                <FaUserPlus className="me-2" />
                Add New User
              </h4>
            </div>
            <div className="card-body">
              <form onSubmit={handleUserFormSubmit} style={{ maxWidth: '600px' }}>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-bold">Full Name</label>
                    <input
                      type="text"
                      name="fullName"
                      value={userForm.fullName}
                      onChange={handleUserFormChange}
                      className="form-control"
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-bold">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={userForm.email}
                      onChange={handleUserFormChange}
                      className="form-control"
                      required
                    />
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-bold">Phone</label>
                    <input
                      type="text"
                      name="phone"
                      value={userForm.phone}
                      onChange={handleUserFormChange}
                      className="form-control"
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-bold">Role</label>
                    <select
                      name="role"
                      value={userForm.role}
                      onChange={handleUserFormChange}
                      className="form-select"
                    >
                      <option value="customer">Customer</option>
                      <option value="artisan">Artisan</option>
                      <option value="admin">Admin</option>
                      <option value="finance">Finance</option>
                      <option value="supervisor">Supervisor</option>
                      <option value="driver">Driver</option>
                      <option value="supplier">Supplier</option>
                    </select>
                  </div>
                </div>
                <div className="mb-4">
                  <label className="form-label fw-bold">Password</label>
                  <input
                    type="password"
                    name="password"
                    value={userForm.password}
                    onChange={handleUserFormChange}
                    className="form-control"
                    required
                  />
                </div>
                <div className="d-flex gap-2">
                  <button type="submit" className="btn btn-warning">
                    <FaUserPlus className="me-2" />
                    Create User
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => fetchUsersByStatus('pending')}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      case 'user-list':
        return renderUsersContent();
      case 'employee-list':
      case 'add-employee':
        return renderEmployeeContent();
      default:
        return (
          <div className="card shadow-sm">
            <div className="card-body text-center py-5">
              <h3 className="text-muted">Coming Soon</h3>
              <p className="text-muted">This section is under development</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="d-flex vh-100">
      {/* Sidebar */}
      <div
        className={`bg-dark text-white p-3 ${sidebarOpen ? 'd-block' : 'd-none d-md-block'}`}
        style={{ width: '280px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}
      >
        <div className="text-center mb-4 border-bottom pb-3">
          <h4 className="mb-1 fw-bold">Admin Panel</h4>
          <small className="text-muted">Spinners Web Kenya</small>
        </div>
        
        <ul className="nav flex-column flex-grow-1">
          <li className="nav-item mb-2">
            <button 
              className={`btn w-100 text-start text-white d-flex align-items-center ${activeSection === 'dashboard' ? 'bg-primary' : 'bg-dark'}`}
              onClick={() => setActiveSection('dashboard')}
            >
              <FaHome className="me-2" />
              Dashboard
            </button>
          </li>
          
          <li className="nav-item mb-2">
            <button 
              className="btn w-100 text-start text-white d-flex align-items-center justify-content-between bg-dark"
              onClick={() => toggleDropdown('users')}
            >
              <span>
                <FaUsers className="me-2" />
                User Management
              </span>
              <FaCaretDown />
            </button>
            {dropdownOpen === 'users' && (
              <ul className="nav flex-column ms-3 mt-2">
                <li className="nav-item mb-1">
                  <button className="btn btn-sm w-100 text-start text-white bg-dark" onClick={() => fetchUsersByStatus('active')}>
                    ✅ Active Users
                  </button>
                </li>
                <li className="nav-item mb-1">
                  <button className="btn btn-sm w-100 text-start text-white bg-dark" onClick={() => fetchUsersByStatus('pending')}>
                    ⏳ Pending Users
                  </button>
                </li>
                <li className="nav-item mb-1">
                  <button className="btn btn-sm w-100 text-start text-white bg-dark" onClick={() => fetchUsersByStatus('suspended')}>
                    ⚠️ Suspended
                  </button>
                </li>
                <li className="nav-item mb-1">
                  <button className="btn btn-sm w-100 text-start text-white bg-dark" onClick={() => fetchUsersByStatus('rejected')}>
                    ❌ Rejected
                  </button>
                </li>
                <li className="nav-item mb-1">
                  <button className="btn btn-sm w-100 text-start text-white bg-success" onClick={() => setActiveSection('add-user')}>
                    <FaUserPlus className="me-1" />
                    Add New User
                  </button>
                </li>
              </ul>
            )}
          </li>
          
          <li className="nav-item mb-2">
            <button 
              className={`btn w-100 text-start text-white d-flex align-items-center ${activeSection === 'employee-list' ? 'bg-success' : 'bg-dark'}`}
              onClick={fetchEmployees}
            >
              <FaUserShield className="me-2" />
              Employees
            </button>
          </li>
          
          <li className="nav-item mb-2">
            <button 
              className={`btn w-100 text-start text-white d-flex align-items-center ${activeSection === 'add-employee' ? 'bg-info' : 'bg-dark'}`}
              onClick={() => setActiveSection('add-employee')}
            >
              <FaUserPlus className="me-2" />
              Add Employee
            </button>
          </li>
        </ul>
        
        {/* Logout Button */}
        <div className="border-top pt-3 mt-auto">
          <button 
            className="btn btn-outline-light w-100 d-flex align-items-center justify-content-center"
            onClick={handleLogout}
          >
            <FaSignOutAlt className="me-2" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-grow-1 d-flex flex-column" style={{ backgroundColor: '#f8f9fa' }}>
        <nav className="navbar navbar-light bg-white shadow-sm justify-content-between px-3 py-2">
          <div className="d-flex align-items-center">
            <button className="btn btn-outline-secondary me-3 d-md-none" onClick={toggleSidebar}>
              <FaBars />
            </button>
            <h5 className="mb-0 text-primary fw-bold">
              {activeSection === 'dashboard' && 'Dashboard'}
              {activeSection === 'add-user' && 'Add New User'}
              {activeSection === 'user-list' && `${currentStatus} Users`}
              {activeSection === 'employee-list' && 'Employee Management'}
              {activeSection === 'add-employee' && 'Add New Employee'}
            </h5>
          </div>
          <div className="d-flex align-items-center">
            <div className="input-group input-group-sm" style={{ width: '300px' }}>
              <span className="input-group-text bg-white">
                <FaSearch className="text-muted" />
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </nav>
        
        <div className="flex-grow-1 p-4" style={{ overflowY: 'auto' }}>
          {renderContent()}
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}

export default AdminHome;