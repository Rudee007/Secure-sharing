import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { BsArrowRight, BsLock, BsKey, BsClock, BsShield } from 'react-icons/bs';
import styles from '../styles/Landing.module.css';
import { FaLock } from 'react-icons/fa';
import { NavLink } from 'react-router-dom';
const LandingPage = () => {
  const [activeSlide, setActiveSlide] = useState(0);
  
  const carouselItems = [
    {
      id: 1,
      title: "Secure File Sharing",
      description: "End-to-end encryption keeps your files safe",
      color: "#e3f2fd"
    },
    {
      id: 2,
      title: "Set Expiration Times",
      description: "Links automatically expire after your set time",
      color: "#e8f5e9"
    },
    {
      id: 3,
      title: "One-Time Downloads",
      description: "Files disappear after being accessed once",
      color: "#fff8e1"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prevSlide) => (prevSlide + 1) % carouselItems.length);
    }, 3000);
    
    return () => clearInterval(interval);
  }, [carouselItems.length]);

  return (
    <>
      
      <div className={styles.heroSection}>
        <Container>
          <Row className={styles.heroRow}>
            <Col lg={6} className={styles.heroContent}>
              <h1 className={styles.heroTitle}>
                Share Files <span className={styles.highlight}>Securely</span>,<br />
                Instantly, and Privately
              </h1>
              <p className={styles.heroSubtitle}>
                SecureShare provides end-to-end encrypted file sharing with expiring links,
                one-time downloads, and complete privacy.
              </p>
              <div className={styles.ctaButtons}>
                <Button className={styles.primaryBtn} href="/auth">
                  Get Started <BsArrowRight className={styles.btnIcon} />
                </Button>
                <Button variant="light" className={styles.secondaryBtn} as={NavLink} to="/auth?tab=signin">
                  Log In
                </Button>
              </div>
              <div className={styles.securityFeature}>

              </div>
            </Col>
            
            <Col lg={6} className={styles.carouselContainer}>
              <div className={styles.browserMockup}>
                <div className={styles.browserHeader}>
                  <div className={styles.browserDots}>
                    <span className={styles.dot}></span>
                    <span className={styles.dot}></span>
                    <span className={styles.dot}></span>
                  </div>
                  <div className={styles.browserAddress}>secure-share web-app</div>
                </div>
                <div className={styles.browserContent}>
                  <div className={styles.carousel}>
                    {carouselItems.map((item, index) => (
                      <div
                        key={item.id}
                        className={`${styles.carouselItem} ${index === activeSlide ? styles.active : ''}`}
                        style={{ backgroundColor: item.color }}
                      >
                        <h3>{item.title}</h3>
                        <p>{item.description}</p>
                        <div className={styles.carouselIllustration}>
                          <div className={styles.secureFileIcon}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className={styles.carouselIndicators}>
                    {carouselItems.map((_, index) => (
                      <span
                        key={index}
                        className={`${styles.indicator} ${index === activeSlide ? styles.active : ''}`}
                        onClick={() => setActiveSlide(index)}
                      ></span>
                    ))}
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </div>
  
      <div className={styles.featureSection}>
        <Container>
          <div className={styles.sectionTitle}>
            <h2>Powerful Security Features</h2>
            <p>SecureShare combines simplicity with powerful security features to give you complete control over your shared files.</p>
          </div>
          <Row>
            <Col md={6}>
              <div className={styles.featureCard}>
                <div className={styles.iconWrapper}>
                  <BsLock className={styles.featureIcon} />
                </div>
                <h3>End-to-End Encryption</h3>
                <p>ALL files encrypted before leaving your device, ensuring only intended recipients can access your content.</p>
              </div>
            </Col>
            <Col md={6}>
              <div className={styles.featureCard}>
                <div className={styles.iconWrapper}>
                  <BsKey className={styles.featureIcon} />
                </div>
                <h3>Password Protection</h3>
                <p>Add an extra layer of security with optional password protection for your shared links.</p>
              </div>
            </Col>
            <Col md={6}>
              <div className={styles.featureCard}>
                <div className={styles.iconWrapper}>
                  <BsClock className={styles.featureIcon} />
                </div>
                <h3>Expiring Links</h3>
                <p>Set links to expire after a specific time period, ensuring your files aren't accessible indefinitely.</p>
              </div>
            </Col>
            <Col md={6}>
              <div className={styles.featureCard}>
                <div className={styles.iconWrapper}>
                  <BsShield className={styles.featureIcon} />
                </div>
                <h3>Access Controls</h3>
                <p>Limit access with one-time downloads and view-only permissions. The OneTime feature ensures files are accessed only once for added security.</p>
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      <div className={styles.ctaSection}>
      <Container>
        <div className={styles.ctaContainer}>
          <h2 className={styles.ctaTitle}>Ready to Share Securely?</h2>
          <p className={styles.ctaSubtitle}>
          Your files, your rules—SecureShare makes privacy effortless. Get started today with a free account.
          </p>
          <div className={styles.ctaButtons}>
            <Button className={styles.primaryBtn} href="/auth">
              Create Free Account <BsArrowRight className={styles.btnIcon} />
            </Button>
          
          </div>
        </div>
      </Container>
      
      <footer className={styles.footer}>
        <Container>
          <div className={styles.footerContent}>
            <div className={styles.footerBrand}>
                    
                    <FaLock className={styles.lockIcon} />
                    SecureShare
            </div>
            <div className={styles.footerCopyright}>
              © 2025 SecureShare. All rights reserved.
            </div>
            <div className={styles.footerLinks}>
              <a href="/privacy">Privacy</a>
              <a href="/terms">Terms</a>
              <a href="/contact">Contact</a>
            </div>
          </div>
        </Container>
      </footer>
    </div>
        
        
            
    </>
  );
};

export default LandingPage;