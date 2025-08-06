import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Navbar, Container, InputGroup, Form } from "react-bootstrap";
import { IoSettingsOutline } from "react-icons/io5";
import { FaLock, FaSearch } from "react-icons/fa";
import { HiBars4 } from "react-icons/hi2";
import { BsSun } from "react-icons/bs";
import { MdKeyboardArrowRight } from "react-icons/md";

import styles from '../styles/UserNav.module.css';

const UserNav = ({ toggleSidebar }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState({ username: '', email: '' });

  const toggleDarkMode = () => setDarkMode(!darkMode);
  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  // Axios request to fetch user details
  const fetchUserDetails = async () => {
    try {
      const token = localStorage.getItem('token');  // Assuming token is stored in localStorage
      const response = await axios.get('http://localhost:3001/api/auth/user-info', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const { name, email } = response.data.user;
      setUser({ username: name, email });

    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };

  useEffect(() => {
    fetchUserDetails();
  }, []);

  return (
    <div className={darkMode ? styles.darkMode : ''}>
      <Navbar className={styles.customNavbar}>
        <Container fluid className={styles.navContainer}>
          <button 
            className={styles.sidebarToggle} 
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
          >
            <MdKeyboardArrowRight />
          </button>

          <Navbar.Brand className={styles.brand} href="/">
            <FaLock className={styles.lock} /> 
            <span>SecureShare</span>
          </Navbar.Brand>

        

          <div className={styles.actionButtons}>
          

           

            <button className={`${styles.userAvatar} ${styles.desktopOnly}`} aria-label="User profile">
              <span>{user.username ? user.username[0].toUpperCase() : 'U'}</span>
            </button>
          </div>

          <button 
            className={styles.mobileMenuToggle} 
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile menu"
          >
            <HiBars4 />
          </button>
        </Container>
      </Navbar>

      {mobileMenuOpen && (
        <div className={`${styles.mobileMenu} ${mobileMenuOpen ? styles.mobileMenuOpen : ''}`}>
          <div className={styles.mobileSearchContainer}>
    
          </div>

          <div className={styles.mobileUserInfo}>
            <div className={styles.mobileUsername}>{user.username}</div>
            <div className={styles.mobileEmail}>{user.email}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserNav;
