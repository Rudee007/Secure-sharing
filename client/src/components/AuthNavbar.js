import { Navbar, Container, Nav, Button } from "react-bootstrap";
import { FaLock } from "react-icons/fa";
import styles from '../styles/Nav.module.css';

const AuthNavbar = () => {
  return (
    <Navbar className={styles.customNavbar} bg="light" expand="lg">
      <Container>
        <Navbar.Brand className={styles.brand}>
          <FaLock className={styles.lock} /> SecureShare
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className={styles.navLinks} activeKey="/home">
            <Nav.Link href="/home">Home</Nav.Link>
            <Nav.Link eventKey="link-2">Login</Nav.Link>
            <Button className={styles.btnCustom} variant="primary">Get Started</Button>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default AuthNavbar;