import React from 'react';
import { Nav } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { HiOutlineHome } from "react-icons/hi";
import { FiUpload } from "react-icons/fi";
import { IoShareSocialOutline,IoSettingsOutline } from "react-icons/io5";
import { PiSignOutLight } from "react-icons/pi";
import styles from '../styles/Sidebar.module.css';

const Sidebar = ({ collapsed }) => {
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
      <div className={styles.sidebarHeader}>
        <h3 className={styles.brandText}>
          {!collapsed && 'SecureShare'}
        </h3>
      </div>

      
      <Nav className={styles.navMenu} as="ul">
        <Nav.Item as="li">
          <Link to="/dashboard" className={`${styles.navLink} ${isActive('/dashboard') ? styles.active : ''}`}>
            <HiOutlineHome className={styles.navIcon} />
            {!collapsed && <span>Dashboard</span>}
          </Link>
        </Nav.Item>
        
        <Nav.Item as="li">
          <Link to="/upload" className={`${styles.navLink} ${isActive('/upload') ? styles.active : ''}`}>
            <FiUpload className={styles.navIcon} />
            {!collapsed && <span>Upload Files</span>}
          </Link>
        </Nav.Item>
        
        <Nav.Item as="li">
          <Link to="/SharedFile" className={`${styles.navLink} ${isActive('/SharedFile') ? styles.active : ''}`}>
            <IoShareSocialOutline className={styles.navIcon} />
            {!collapsed && <span>Shared Files</span>}
          </Link>
        </Nav.Item>
    
      </Nav>

      <div className={styles.logoutContainer}>
        <button className={styles.logoutButton} onClick={handleLogout}>
          <PiSignOutLight className={styles.navIcon} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;