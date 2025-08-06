import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Alert } from 'react-bootstrap';
import { FaShareAlt, FaEye } from 'react-icons/fa';
import styles from '../styles/FileSharing.module.css';
import Spinner from 'react-bootstrap/Spinner';

function SharedFiles() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (token) {
      fetchSharedFiles();
    } else {
      setError('User not authenticated. Please log in.');
      setLoading(false);
    }
  }, [token]);

  const fetchSharedFiles = async () => {
    try {
      setLoading(true);
      setError('');
      const config = { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` } };
      const response = await axios.get('http://localhost:3001/api/links/user', config);

      setFiles(response.data.map(file => ({ ...file, fileUrl: file.downloadUrl })));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch shared files. Please try again.');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleShareAgain = (token) => {
    navigate(`/share/${token}`);
  };

  const handleManageAccess = (token) => {
    console.log(`Manage access for token: ${token}`);
  };

  const formatDate = (date) => {
    const now = new Date();
    const diffTime = Math.abs(now - new Date(date));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 0 ? 'Today' : `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  return (
    <Container className={styles.container}>
      <h2 className={styles.title}>Shared Files</h2>
      <p className={styles.subtitle}>Manage your shared files and links</p>
      <div className={styles.searchContainer}>
        <Button variant="primary" className={styles.shareButton} onClick={() => navigate('/upload')}>
          <FaShareAlt /> Share a File
        </Button>
      </div>
      {error && <Alert variant="danger" className={styles.alert}>{error}</Alert>}
      {loading ? (
        <div className={styles.spinnerContainer}>
          <Spinner animation="border" />
        </div>
      ) : files.length === 0 ? (
        <p className={styles.noFiles}>No shared files found.</p>
      ) : (
        <Row className={styles.fileGrid}>
          {files.map((file) => (
            <Col key={file.token} md={4} className={styles.fileCardCol}>
              <Card className={styles.fileCard}>
                <Card.Body>
                  <div className={styles.fileIcon}>{file.filename.split('.').pop()}</div>
                  <Card.Title className={styles.fileTitle}>{file.filename}</Card.Title>
                  <Card.Text className={styles.fileMeta}>
                    <div>
                      <span className={styles.metaLabel}>Shared:</span>{' '}
                      <span className={styles.metaValue}>{formatDate(file.createdAt)}</span>
                    </div>
                    <div>
                      <span className={styles.metaLabel}>Expiration:</span>{' '}
                      <span className={styles.metaValue}>
                        {file.expiresAt ? `Expires in ${Math.ceil((new Date(file.expiresAt) - new Date()) / (1000 * 60 * 60 * 24))} days` : 'No expiration'}
                      </span>
                    </div>
                    <div>
                      <span className={styles.metaLabel}>Permissions:</span>{' '}
                      <span className={styles.metaValue}>{file.permissions}</span>
                    </div>
                    <div>
                      <span className={styles.metaLabel}>Encryption:</span>{' '}
                      <span className={styles.metaValue}>{file.encryption ? 'Encrypted' : 'Standard'}</span>
                    </div>
                  </Card.Text>
                  <div className={styles.buttonGroup}>
                    <Button variant="primary" className={styles.actionButton} onClick={() => handleShareAgain(file.token)}>
                      <FaEye /> View File
                    </Button>
          
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
}

export default SharedFiles;