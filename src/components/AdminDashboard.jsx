import { useState } from 'react';
import { FaBars } from 'react-icons/fa';

function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="d-flex">
      {/* Sidebar */}
      <div className={`bg-dark text-white p-3 ${sidebarOpen ? 'd-block' : 'd-none d-md-block'}`} style={{ width: '250px', minHeight: '100vh' }}>
        <h4 className="text-center">Admin Panel</h4>
        <input type="text" placeholder="Search..." className="form-control my-3" />

        <ul className="nav flex-column">
          <li className="nav-item"><a className="nav-link text-white" href="#">Dashboard</a></li>
          <li className="nav-item">
            <a className="nav-link text-white" href="#">Users</a>
            <ul className="nav flex-column ms-3">
              <li><a className="nav-link text-white" href="#">Active</a></li>
              <li><a className="nav-link text-white" href="#">Pending</a></li>
              <li><a className="nav-link text-white" href="#">Rejected</a></li>
              <li><a className="nav-link text-white" href="#">Suspended</a></li>
            </ul>
          </li>
          <li className="nav-item"><a className="nav-link text-white" href="#">Employees</a></li>
          <li className="nav-item"><a className="nav-link text-white" href="#">Bookings</a></li>
          <li className="nav-item"><a className="nav-link text-white" href="#">Reports</a></li>
          <li className="nav-item"><a className="nav-link text-white" href="#">Logout</a></li>
        </ul>
      </div>

      {/* Content */}
      <div className="flex-grow-1">
        <nav className="navbar navbar-light bg-light">
          <button className="btn btn-outline-secondary d-md-none" onClick={toggleSidebar}>
            <FaBars />
          </button>
          <span className="navbar-brand ms-3">Spinners Admin</span>
        </nav>
        <div className="p-4">
          <h2>Welcome, Admin 👋</h2>
          <p>Select a section from the sidebar to manage the system.</p>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
