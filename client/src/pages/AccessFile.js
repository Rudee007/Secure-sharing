import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useLocation } from 'react-router-dom';
import { Alert, Button, Form, Spinner, Container, Row, Col, Card } from 'react-bootstrap';
import { FaDownload, FaEye, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import styles from '../styles/AccessFile.module.css';
import { Document, Page, pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

function AccessFile() {
  const { token } = useParams();
  const location = useLocation();
  const [fileUrl, setFileUrl] = useState(null);
  const [displayFileUrl, setDisplayFileUrl] = useState(null);
  const [fileInfo, setFileInfo] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [password, setPassword] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [passwordPrompt, setPasswordPrompt] = useState(false);
  const [privateKeyPrompt, setPrivateKeyPrompt] = useState(false);

  useEffect(() => {
    if (token) {
      console.log('Token:', token);
      accessFile();
    } else {
      setError('No token provided in URL');
    }
  }, [token]);

  const accessFile = async (providedPassword = null) => {
    try {
      setLoading(true);
      setError('');
      const config = { headers: { 'Content-Type': 'application/json' } };
      const endpoint = `http://localhost:3001/api/links/share/${token}`;
      const response = providedPassword
        ? await axios.post(endpoint, { password: providedPassword }, config)
        : await axios.get(endpoint, config);
      setFileUrl(response.data.downloadUrl);
      setFileInfo(response.data);
      setPasswordPrompt(false);
      if (response.data.encryption) {
        setPrivateKeyPrompt(true);
      }
    } catch (err) {
      if (err.response?.status === 401 && err.response?.data?.error === 'Password required') {
        setPasswordPrompt(true);
      } else {
        setError(err.response?.data?.error || 'Failed to access file. Please check the link.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    accessFile(password);
  };

  // Helper: Convert PEM string (with headers) to an ArrayBuffer
  const pemToArrayBuffer = (pem) => {
    const pemHeader = pem.includes('BEGIN PRIVATE KEY')
      ? "-----BEGIN PRIVATE KEY-----"
      : "-----BEGIN RSA PRIVATE KEY-----";
    const pemFooter = pem.includes('END PRIVATE KEY')
      ? "-----END PRIVATE KEY-----"
      : "-----END RSA PRIVATE KEY-----";
    const pemContents = pem
      .replace(pemHeader, "")
      .replace(pemFooter, "")
      .replace(/\s+/g, "");
    if (!pemContents) {
      throw new Error('No PEM content found between headers');
    }
    const binaryString = atob(pemContents);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  };

  const decryptAESKeyWithPrivateKey = async (encryptedAESKey, privateKeyPem) => {
    try {
      console.log('Decrypting AES key; encryptedAESKey length:', encryptedAESKey.length);
      const keyBuffer = pemToArrayBuffer(privateKeyPem);
      const privateKeyImported = await crypto.subtle.importKey(
        "pkcs8",
        keyBuffer,
        { name: "RSA-OAEP", hash: "SHA-256" },
        false,
        ["decrypt"]
      );
      // Decode the URL-encoded Base64 encrypted AES key
      const encryptedKeyBinary = atob(decodeURIComponent(encryptedAESKey));
      const encryptedKeyBuffer = new Uint8Array(encryptedKeyBinary.length);
      for (let i = 0; i < encryptedKeyBinary.length; i++) {
        encryptedKeyBuffer[i] = encryptedKeyBinary.charCodeAt(i);
      }
      const decryptedAESKeyBuffer = await crypto.subtle.decrypt(
        { name: "RSA-OAEP" },
        privateKeyImported,
        encryptedKeyBuffer.buffer
      );
      const aesKey = new Uint8Array(decryptedAESKeyBuffer);
      if (aesKey.length !== 32) {
        throw new Error(`Invalid AES key length: expected 32 bytes, got ${aesKey.length}`);
      }
      console.log('AES key decrypted successfully, length:', aesKey.length);
      return aesKey;
    } catch (err) {
      console.error('AES key decryption error:', err);
      throw new Error('Failed to decrypt AES key: ' + err.message);
    }
  };

  const decryptFile = async (fileUrl, aesKey, ivBase64) => {
    try {
      console.log('Starting file decryption with:', { fileUrl, aesKeyLength: aesKey.length, ivBase64 });
      const symmetricKey = await crypto.subtle.importKey(
        'raw',
        aesKey,
        { name: 'AES-GCM', length: 256 },
        true,
        ['decrypt']
      );
      console.log('AES key imported successfully');

      const fileResponse = await fetch(fileUrl);
      if (!fileResponse.ok) {
        throw new Error(`Failed to fetch file: ${fileResponse.status} - ${fileResponse.statusText}`);
      }
      const encryptedFileBuffer = await fileResponse.arrayBuffer();
      if (encryptedFileBuffer.byteLength === 0) {
        throw new Error('Encrypted file buffer is empty');
      }
      console.log('Fetched encrypted file, size:', encryptedFileBuffer.byteLength);

      const ivBinary = atob(decodeURIComponent(ivBase64));
      if (ivBinary.length !== 12) {
        throw new Error(`Invalid IV length: expected 12 bytes, got ${ivBinary.length}`);
      }
      const ivBuffer = new Uint8Array(ivBinary.length);
      for (let i = 0; i < ivBinary.length; i++) {
        ivBuffer[i] = ivBinary.charCodeAt(i);
      }
      console.log('IV prepared:', ivBuffer);

      // When using AES-GCM with WebCrypto, the ciphertext must include the tag.
      // If your encrypted file already has the tag appended, then pass the full buffer.
      const decryptedFileBuffer = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: ivBuffer,
          additionalData: new Uint8Array(0),
          tagLength: 128
        },
        symmetricKey,
        encryptedFileBuffer
      );
      console.log('File decryption successful, size:', decryptedFileBuffer.byteLength);
      const mimeType = fileInfo?.mimeType || 'application/octet-stream';
      return new Blob([decryptedFileBuffer], { type: mimeType });
    } catch (err) {
      console.error('File decryption error:', err);
      throw new Error('Decryption failed: ' + err.message);
    }
  };

  const handlePrivateKeySubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      const searchParams = new URLSearchParams(location.search);
      const ivBase64 = searchParams.get('iv');
      const encryptedAESKey = searchParams.get('key');
      if (!ivBase64 || !encryptedAESKey) {
        throw new Error('IV or encrypted key missing from URL');
      }
      const aesKey = await decryptAESKeyWithPrivateKey(encryptedAESKey, privateKey);
      const decryptedBlob = await decryptFile(fileUrl, aesKey, ivBase64);
      const blobUrl = window.URL.createObjectURL(decryptedBlob);
      setDisplayFileUrl(blobUrl);
      setPrivateKeyPrompt(false);
    } catch (err) {
      setError(err.message || 'Failed to decrypt file');
    } finally {
      setLoading(false);
    }
  };

  const handleView = async () => {
    if (!fileInfo) {
      setError('File not loaded yet.');
      return;
    }
    if (fileInfo.encryption) {
      setPrivateKeyPrompt(true);
    } else {
      setDisplayFileUrl(fileInfo.viewUrl);
    }
  };
  const handleDownload = async () => {
    try {
      if (!fileInfo || !fileInfo.downloadUrl) {
        setError('File not available for download.');
        return;
      }
      
      let downloadBlob;
      if (fileInfo.encryption) {
        const searchParams = new URLSearchParams(location.search);
        const ivBase64 = searchParams.get('iv');
        const encryptedAESKey = searchParams.get('key');
        if (!ivBase64 || !encryptedAESKey) {
          throw new Error('IV or encrypted key missing from URL');
        }
        const aesKey = await decryptAESKeyWithPrivateKey(encryptedAESKey, privateKey);
        downloadBlob = await decryptFile(fileInfo.downloadUrl, aesKey, ivBase64);
      } else {
        const response = await fetch(fileInfo.downloadUrl);
        if (!response.ok) throw new Error('Failed to fetch file');
        downloadBlob = await response.blob();
      }
  
      const downloadUrl = window.URL.createObjectURL(downloadBlob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = fileInfo.filename || 'downloaded_file';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
  
      if (fileInfo.isOneTimeDownload) {
        await axios.post(`http://localhost:3001/api/links/confirm-download/${token}`);
        setFileInfo(prev => ({
          ...prev,
          downloadUrl: null,
          permissions: 'View Only'
        }));
        setDisplayFileUrl(null);
        setError('This was a one-time download link. Download is now disabled.');
      }
    } catch (err) {
      setError(err.message || 'Failed to download file');
    }
  };
  
  const formatFileSize = (sizeInBytes) => {
    if (sizeInBytes < 1024 * 1024) return `${(sizeInBytes / 1024).toFixed(2)} KB`;
    if (sizeInBytes < 1024 * 1024 * 1024) return `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(sizeInBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleZoomIn = () => {
    setZoomLevel(zoomLevel + 0.1);
  };

  const handleZoomOut = () => {
    if (zoomLevel > 0.5) setZoomLevel(zoomLevel - 0.1);
  };

  const renderFilePreview = () => {
    if (!displayFileUrl) {
      return (
        <div className={styles.placeholder}>
          {fileInfo.encryption
            ? 'Provide your private key to decrypt and view the file.'
            : 'Click "View" to display the file.'}
        </div>
      );
    }
    if (fileInfo.mimeType === 'application/pdf') {
      return (
        <Document
          file={displayFileUrl}
          onLoadSuccess={({ numPages }) => setTotalPages(numPages)}
          onLoadError={(error) => setError('Failed to load PDF: ' + error.message)}
          loading={<Spinner animation="border" />}
        >
          <Page pageNumber={currentPage} scale={zoomLevel} renderTextLayer={false} renderAnnotationLayer={false} />
        </Document>
      );
    }
    if (fileInfo.mimeType.startsWith('image/')) {
      return (
        <img src={displayFileUrl} alt="Decrypted file" style={{ width: '100%' }} />
      );
    }
    return (
      <div>
        <p>Preview not available for this file type. Please download to view the file.</p>
        <Button onClick={handleDownload}>Download File</Button>
      </div>
    );
  };

  return (
    <Container className={styles.container}>
      {error && <Alert variant="danger" className={styles.alert}>{error}</Alert>}
      {loading ? (
        <div className={styles.spinnerContainer}>
          <Spinner animation="border" />
        </div>
      ) : passwordPrompt ? (
        <div className={styles.passwordForm}>
          <Card className={styles.formCard}>
            <Card.Body>
              <h3 className={styles.formTitle}>Enter Link Password</h3>
              <Form onSubmit={handlePasswordSubmit}>
                <Form.Group>
                  <Form.Control
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </Form.Group>
                <Button type="submit" variant="primary" className="mt-3">Submit</Button>
              </Form>
            </Card.Body>
          </Card>
        </div>
      ) : privateKeyPrompt ? (
        <div className={styles.passwordForm}>
          <Card className={styles.formCard}>
            <Card.Body>
              <h3 className={styles.formTitle}>Enter Private Key</h3>
              <Form onSubmit={handlePrivateKeySubmit}>
                <Form.Group>
                  <Form.Control
                    as="textarea"
                    rows={5}
                    placeholder="Paste your private key here (PEM format)"
                    value={privateKey}
                    onChange={(e) => setPrivateKey(e.target.value)}
                    required
                  />
                </Form.Group>
                <Button type="submit" variant="primary" className="mt-3">Decrypt File</Button>
              </Form>
            </Card.Body>
          </Card>
        </div>
      ) : fileInfo ? (
        <>
          <div className={styles.fileHeader}>
            <h2 className={styles.fileName}>{fileInfo.filename}</h2>
            <div className={styles.headerActions}>
              {fileInfo.permissions !== 'Download' && (
                <Button variant="outline-primary" className={styles.viewBtn} onClick={handleView} disabled={!!displayFileUrl}>
                  <FaEye /> View
                </Button>
              )}
              {fileInfo.permissions !== 'View Only' && fileInfo.downloadUrl && (
                <Button variant="outline-primary" className={styles.downloadBtn} onClick={handleDownload}>
                  <FaDownload /> Download
                </Button>
              )}
            </div>
          </div>
          <Row className={styles.mainContent}>
            <Col md={3}>
              <Card className={styles.sidebarCard}>
                <Card.Body>
                  <div className={styles.detailsSection}>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Security</span>
                      <span className={styles.detailValue}>
                        {fileInfo.encryption ? 'End-to-end Encrypted' : 'Not Encrypted'}
                      </span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Permissions</span>
                      <span className={styles.detailValue}>{fileInfo.permissions}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Size</span>
                      <span className={styles.detailValue}>{formatFileSize(fileInfo.size)}</span>
                    </div>
                    {fileInfo.expiresAt && (
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Expires At</span>
                        <span className={styles.detailValue}>{new Date(fileInfo.expiresAt).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={9}>
              <div className={styles.docViewer}>
                <div className={styles.viewerControls}>
                  <div className={styles.zoomControls}>
                    <Button variant="light" className={styles.controlBtn} onClick={handleZoomIn}>
                      <i className="fa fa-plus"></i>
                    </Button>
                    <Button variant="light" className={styles.controlBtn} onClick={handleZoomOut}>
                      <i className="fa fa-minus"></i>
                    </Button>
                  </div>
                  {displayFileUrl && fileInfo.mimeType === 'application/pdf' && (
                    <div className={styles.paginationControls}>
                      <Button variant="light" className={styles.controlBtn} onClick={handlePrevPage} disabled={currentPage === 1}>
                        <FaChevronLeft />
                      </Button>
                      <span className={styles.pageInfo}>Page {currentPage} of {totalPages}</span>
                      <Button variant="light" className={styles.controlBtn} onClick={handleNextPage} disabled={currentPage === totalPages}>
                        <FaChevronRight />
                      </Button>
                    </div>
                  )}
                </div>
                <div className={styles.documentContent}>
                  {displayFileUrl ? (
                    fileInfo.mimeType === 'application/pdf' ? (
                      <Document
                        file={displayFileUrl}
                        onLoadSuccess={({ numPages }) => setTotalPages(numPages)}
                        onLoadError={(error) => setError('Failed to load PDF: ' + error.message)}
                        loading={<Spinner animation="border" />}
                      >
                        <Page pageNumber={currentPage} scale={zoomLevel} renderTextLayer={false} renderAnnotationLayer={false} />
                      </Document>
                    ) : fileInfo.mimeType.startsWith('image/') ? (
                      <img src={displayFileUrl} alt="Decrypted file" style={{ width: '100%' }} />
                    ) : (
                      <div>
                        <p>Preview not available for this file type. Please download to view.</p>
                        <Button onClick={handleDownload}>Download File</Button>
                      </div>
                    )
                  ) : (
                    <div className={styles.placeholder}>
                      {fileInfo.encryption
                        ? 'Provide your private key to decrypt and view the file.'
                        : 'Click "View" to display the file.'}
                    </div>
                  )}
                </div>
              </div>
            </Col>
          </Row>
        </>
      ) : (
        <div className={styles.passwordForm}>
          <Card className={styles.formCard}>
            <Card.Body>
              <h3 className={styles.formTitle}>Access File</h3>
              <p>Waiting for file metadata...</p>
            </Card.Body>
          </Card>
        </div>
      )}
    </Container>
  );
}

export default AccessFile;
