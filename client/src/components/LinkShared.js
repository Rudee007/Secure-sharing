import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, InputGroup, Alert } from 'react-bootstrap';
import { FiDownload } from "react-icons/fi";
import { XLg, Clipboard, LockFill, ClockHistory, Person } from 'react-bootstrap-icons';
import axios from 'axios';
import styles from '../styles/LinkShared.module.css';

function LinkShared({ show, onHide, file }) {
  const [passwordProtection, setPasswordProtection] = useState(false);
  const [password, setPassword] = useState('');
  const [oneTimeDownload, setOneTimeDownload] = useState(false);
  const [linkExpiration, setLinkExpiration] = useState('Never');
  const [permissions, setPermissions] = useState('Full Access');
  const [shareLink, setShareLink] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [fileInfo, setFileInfo] = useState(null);

  useEffect(() => {
    if (show && file?.fileId) {
      const fetchFileDetails = async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await axios.get(`http://localhost:3001/api/files/${file.fileId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const fileData = response.data;
          setFileInfo({
            fileId: fileData.fileId,
            name: fileData.filename,
            size: formatFileSize(fileData.size),
            encryption: fileData.encryption || false,
          });
        } catch (err) {
          console.error('Failed to fetch file details:', err);
          setError('Failed to fetch file details');
          setFileInfo({
            fileId: file.fileId,
            name: file.filename || "Unknown File",
            size: "Unknown Size",
          });
        }
      };
      fetchFileDetails();
    }
  }, [show, file]);

  

  const formatFileSize = (sizeInBytes) => {
    if (!sizeInBytes) return "Unknown Size";
    if (sizeInBytes < 1024 * 1024) return `${(sizeInBytes / 1024).toFixed(1)} KB`;
    return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getExpirationDate = () => {
    const now = new Date();
    switch (linkExpiration) {
      case '1 hour':
        return new Date(now.setHours(now.getHours() + 1));
      case '1 day':
        return new Date(now.setDate(now.getDate() + 1));
      case '7 days':
        return new Date(now.setDate(now.getDate() + 7));
      case 'Never':
      default:
        return null;
    }
  };

  const generateShareLink = async () => {
    try {
      setError('');
      setSuccess('');

      const token = localStorage.getItem('token');
      const expiresAt = getExpirationDate();

      const linkData = {
        fileId: file.fileId,
        expiresAt,
        isOneTimeDownload: oneTimeDownload,
        password: passwordProtection ? password : null,
        permissions,
        isE2EE: fileInfo?.encryption,

      };

      const response = await axios.post('http://localhost:3001/api/link/generate', linkData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (fileInfo?.encryption) {
        const storedKey = localStorage.getItem(`privateKey`);
        if (storedKey) {
          setPrivateKey(storedKey);
        } else {
          setPrivateKey('No private key found in local storage!');
        }
      }
      
      setShareLink(response.data.link);
      setSuccess('Link generated successfully!');
    } catch (err) {
      console.error('Failed to generate link:', err);
      setError(err.response?.data?.error || 'Failed to generate link');
    }
  };

  const copyToClipboard = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink)
        .then(() => setSuccess('Link copied to clipboard!'))
        .catch(err => {
          console.error('Failed to copy link:', err);
          setError('Failed to copy link');
        });
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered className={styles.fileShareModal} size="md">
      <Modal.Header className="border-0">
        <Modal.Title>Share File</Modal.Title>
        <Button variant="link" className={styles.closeButton} onClick={onHide}>
          <XLg />
        </Button>
      </Modal.Header>

      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        {/* File Preview */}
        <div className={`${styles.fileInfoContainer} mb-4`}>
          <div className="d-flex align-items-center">
            <div className={`${styles.fileIcon} me-3`}>
              <div className={styles.pdfIcon}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="#E53935">
                  <path d="M7,3H17A2,2 0 0,1 19,5V19A2,2 0 0,1 17,21H7A2,2 0 0,1 5,19V5A2,2 0 0,1 7,3M8.5,15V16.5H10V15H8.5M8.5,11V12.5H10V11H8.5M8.5,7.5V9H10V7.5H8.5M13.5,15V16.5H15V15H13.5M13.5,11V12.5H15V11H13.5M13.5,7.5V9H15V7.5H13.5Z" />
                </svg>
              </div>
            </div>
            <div className={styles.fileDetails}>
              <div className={styles.fileName}>{fileInfo?.name || "Loading..."}</div>
              <div className={styles.fileSize}>{fileInfo?.size || "Loading..."}</div>
            </div>
          </div>
        </div>

        {/* Secure Link */}
        <div className={`${styles.secureLinkSection} mb-3`}>
          <div className={styles.sectionLabel}>Secure Link</div>
          <InputGroup>
            <Form.Control
              type="text"
              value={shareLink}
              readOnly
              className={styles.linkInput}
              placeholder="Generate a link to share..."
            />
            <Button variant="outline-secondary" onClick={copyToClipboard} className={styles.copyButton}>
              <Clipboard />
            </Button>
          </InputGroup>
        </div>

        {/* Options */}
        <div className={styles.securityOptions}>
          <div className={`${styles.optionItem} d-flex justify-content-between align-items-center mb-2`}>
            <div className="d-flex align-items-center">
              <LockFill className={`${styles.optionIcon} me-2`} />
              <span>Password Protection</span>
            </div>
            <Form.Check
              type="switch"
              id="password-protection-switch"
              checked={passwordProtection}
              onChange={() => setPasswordProtection(!passwordProtection)}
              className={styles.optionSwitch}
            />
          </div>
          {passwordProtection && (
            <div className={`${styles.passwordInputContainer} mb-3 ps-4`}>
              <InputGroup>
                <Form.Control
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={styles.passwordInput}
                />
              </InputGroup>
            </div>
          )}

          <div className={`${styles.optionItem} d-flex justify-content-between align-items-center mb-2`}>
            <div className="d-flex align-items-center">
              <ClockHistory className={`${styles.optionIcon} me-2`} />
              <span>Link Expiration</span>
            </div>
            <Form.Select
              value={linkExpiration}
              onChange={(e) => setLinkExpiration(e.target.value)}
              className={styles.optionSelect}
            >
              <option>Never</option>
              <option>1 hour</option>
              <option>1 day</option>
              <option>7 days</option>
            </Form.Select>
          </div>

          <div className={`${styles.optionItem} d-flex justify-content-between align-items-center mb-2`}>
            <div className="d-flex align-items-center">
              <Person className={`${styles.optionIcon} me-2`} />
              <span>Permissions</span>
            </div>
            <Form.Select
              value={permissions}
              onChange={(e) => setPermissions(e.target.value)}
              className={styles.optionSelect}
            >
              <option>Full Access</option>
              <option>View Only</option>
            </Form.Select>
          </div>

          <div className={`${styles.optionItem} d-flex justify-content-between align-items-center mb-2`}>
            <div className="d-flex align-items-center">
              <FiDownload className={`${styles.optionIcon} me-2`} />
              <span>One-time Download</span>
            </div>
            <Form.Check
              type="switch"
              id="one-time-download-switch"
              checked={oneTimeDownload}
              onChange={() => setOneTimeDownload(!oneTimeDownload)}
              className={styles.optionSwitch}
            />
          </div>

          {fileInfo?.encryption && shareLink && (
  <div className={`${styles.optionItem} mt-3`}>
    <div className="d-flex align-items-center">
      <LockFill className={`${styles.optionIcon} me-2`} />
      <strong>Private Key (E2EE)</strong>
    </div>
    <Form.Control
      as="textarea"
      readOnly
      className="mt-2"
      value={privateKey}
      rows={3}
    />
    <Button
      variant="outline-secondary"
      className="mt-2"
      onClick={() => {
        navigator.clipboard.writeText(privateKey);
        setSuccess("Private key copied to clipboard!");
      }}
    >
      Copy Private Key
    </Button>
  </div>
)}

        </div>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Cancel</Button>
        <Button variant="primary" onClick={generateShareLink}>Generate</Button>
      </Modal.Footer>
    </Modal>
  );
}

export default LinkShared;