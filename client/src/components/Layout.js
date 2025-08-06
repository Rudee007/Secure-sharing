import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import AuthNavbar from './AuthNavbar';
import UserNav from './UserNav';
import styles from '../styles/Layout.module.css';

const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

const Layout = () => {
  const isLoggedIn = isAuthenticated();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setSidebarCollapsed(true);
      } else {
        setSidebarCollapsed(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className={styles.layout}>
      {isLoggedIn && <Sidebar collapsed={sidebarCollapsed} />}
      <div
        className={`${styles.content} ${
          isLoggedIn
            ? sidebarCollapsed
              ? styles.sidebarCollapsed
              : styles.sidebarExpanded
            : ''
        }`}
      >
        {isLoggedIn ? <UserNav toggleSidebar={toggleSidebar} /> : <AuthNavbar />}
        <div className={styles.pageContent}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;