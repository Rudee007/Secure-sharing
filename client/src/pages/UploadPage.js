import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Form } from 'react-bootstrap';
import { FaCloudUploadAlt } from 'react-icons/fa';
import { RxCross2 } from 'react-icons/rx';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import styles from '../styles/uploadFile.module.css';

const UploadPage = () => {
  const [file, setFile] = useState(null);
  const [encrypt, setEncrypt] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const [uploadError, setUploadError] = useState(null);

  useEffect(() => {
    const initializeKeys = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No authentication token found');
          return;
        }

        const userId = getUserId();
        if (!userId) {
          console.error('No user ID found in token');
          return;
        }

        let privateKey = localStorage.getItem('privateKey');
        let publicKey = localStorage.getItem('publicKey');

        if (!privateKey || !publicKey) {
          const keyPair = await generateKeyPair();
          privateKey = await exportKey(keyPair.privateKey);
          publicKey = await exportKey(keyPair.publicKey);
          localStorage.setItem('privateKey', privateKey);
          localStorage.setItem('publicKey', publicKey);
          console.log('Generated new key pair for user', userId);

          await axios.post(
            'http://localhost:3001/api/auth/public-key',
            { userId, publicKey },
            { headers: { 'Authorization': `Bearer ${token}` } }
          );
          console.log('Public key saved successfully');
        }
      } catch (error) {
        console.error('Error initializing keys:', error);
      }
    };
    initializeKeys();
  }, []);

  const generateKeyPair = async () => {
    return crypto.subtle.generateKey(
      { name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
      true,
      ['encrypt', 'decrypt']
    );
  };

  const exportKey = async (key) => {
    try {
      const keyType = key.type === 'public' ? 'spki' : 'pkcs8';
      const exported = await crypto.subtle.exportKey(keyType, key);
      const exportedBuffer = new Uint8Array(exported);
      const binaryString = Array.from(exportedBuffer).map(byte => String.fromCharCode(byte)).join('');
      return `-----BEGIN ${key.type === 'public' ? 'PUBLIC' : 'PRIVATE'} KEY-----\n` +
             btoa(binaryString).match(/.{1,64}/g).join('\n') +
             `\n-----END ${key.type === 'public' ? 'PUBLIC' : 'PRIVATE'} KEY-----\n`;
    } catch (error) {
      console.error('Key export error:', error);
      throw error;
    }
  };
  

  const encryptFile = async (file) => {
    try {
      const symmetricKey = await crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );
      const iv = crypto.getRandomValues(new Uint8Array(12));
  
      const fileBuffer = await file.arrayBuffer();
      const encryptedResult = await crypto.subtle.encrypt(
        { 
          name: 'AES-GCM',
          iv,
          tagLength: 128
        },
        symmetricKey,
        fileBuffer
      );
  
      const tagLength = 16;
      const encryptedData = new Uint8Array(encryptedResult);
      const ciphertext = encryptedData.slice(0, encryptedData.length - tagLength);
      const tag = encryptedData.slice(encryptedData.length - tagLength);
  
      const combinedData = new Uint8Array(ciphertext.length + tag.length);
      combinedData.set(ciphertext);
      combinedData.set(tag, ciphertext.length);
  
      const publicKeyBase64 = localStorage.getItem('publicKey');
      if (!publicKeyBase64) throw new Error('Public key not found in localStorage');
      const publicKey = await importKey(publicKeyBase64, 'public');
  
      const exportedSymmetricKey = await crypto.subtle.exportKey('raw', symmetricKey);
      const encryptedSymmetricKey = await crypto.subtle.encrypt(
        { name: 'RSA-OAEP' },
        publicKey,
        exportedSymmetricKey
      );
  
      return {
        encryptedFileBase64: arrayBufferToBase64(combinedData.buffer),
        symmetricKeyBase64: arrayBufferToBase64(exportedSymmetricKey),
        encryptedKeyBase64: arrayBufferToBase64(encryptedSymmetricKey),
        ivBase64: arrayBufferToBase64(iv.buffer)
      };
    } catch (error) {
      console.error('Encryption error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      throw new Error('Encryption failed: ' + error.message);
    }
  };

  const arrayBufferToBase64 = (buffer) => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0, len = bytes.byteLength; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };
  
  const importKey = async (base64, type) => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return crypto.subtle.importKey(
      type === 'public' ? 'spki' : 'pkcs8',
      bytes,
      { name: 'RSA-OAEP', hash: 'SHA-256' },
      true,
      [type === 'public' ? 'encrypt' : 'decrypt']
    );
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    const allowedTypes = {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'application/zip': ['.zip'],
      'application/x-rar-compressed': ['.rar']
    };

    const fileType = selectedFile.type;
    const fileExtension = '.' + selectedFile.name.split('.').pop().toLowerCase();

    if (!allowedTypes[fileType] || !allowedTypes[fileType].includes(fileExtension)) {
      setUploadError('Only PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, JPG, PNG, ZIP, and RAR files are allowed.');
      return;
    }

    setFile(selectedFile);
    setUploadSuccess(null);
    setUploadError(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (!droppedFile) return;

    const allowedTypes = {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'application/zip': ['.zip'],
      'application/x-rar-compressed': ['.rar']
    };

    const fileType = droppedFile.type;
    const fileExtension = '.' + droppedFile.name.split('.').pop().toLowerCase();

    if (!allowedTypes[fileType] || !allowedTypes[fileType].includes(fileExtension)) {
      setUploadError('Only PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, JPG, PNG, ZIP, and RAR files are allowed.');
      return;
    }

    setFile(droppedFile);
    setUploadSuccess(null);
    setUploadError(null);
  };

  const handleDragOver = (e) => e.preventDefault();

  const clearFile = () => {
    setFile(null);
    setEncrypt(false);
    setUploadSuccess(null);
    setUploadError(null);
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getUserId = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
      const decoded = jwtDecode(token);
      return decoded.id;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  };
  const handleUpload = async () => {
    if (!file) {
      setUploadError('Please select a file to upload.');
      return;
    }
  
    setUploading(true);
    setUploadError(null);
  
    const token = localStorage.getItem('token');
    if (!token) {
      setUploadError('Authentication required. Please log in.');
      setUploading(false);
      return;
    }
  
    try {
      const formData = new FormData();
      let symmetricKeyBase64 = null;
  
      if (encrypt) {
        const { encryptedFileBase64, symmetricKeyBase64: key, encryptedKeyBase64, ivBase64 } = await encryptFile(file);
        symmetricKeyBase64 = key;
        
        const encryptedData = Uint8Array.from(atob(encryptedFileBase64), c => c.charCodeAt(0));
        const encryptedBlob = new Blob([encryptedData], { type: 'application/octet-stream' });
        
        formData.append('file', encryptedBlob, file.name);
        formData.append('encrypt', 'true');
        formData.append('encryptedKey', encryptedKeyBase64);
        formData.append('iv', ivBase64);
      } else {
        formData.append('file', file);
        formData.append('encrypt', 'false');
        formData.append('filename', file.name);
      }
  
      const response = await axios.post(
        'http://localhost:3001/api/files/upload',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
          timeout: 3000000000
        }
      );
  
      setUploadSuccess({
        message: 'File uploaded successfully!',
        encrypted: encrypt,
        fileId: response.data.fileId,
        ...(encrypt && { symmetricKeyBase64 })
      });
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to upload file.';
      setUploadError(errorMessage);
      console.error('Upload error details:', {
        error: error.response || error,
        config: error.config
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={styles.uploadContainer}>
      <Container fluid className="p-0">
        <Row className="m-0 p-0">
          <Col className="p-0">
            <div className={styles.uploadWrapper}>
              <h3 className={styles.title}>Upload Files</h3>
              <p className={styles.subtitle}>Securely upload your files (PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, JPG, PNG, ZIP, RAR)</p>
              {!file ? (
                <div className={styles.uploadArea} onDrop={handleDrop} onDragOver={handleDragOver}>
                  <FaCloudUploadAlt className={styles.uploadIcon} />
                  <p className={styles.uploadText}>Drag and drop your file here, or click to browse</p>
                  <Button variant="outline-primary" onClick={() => document.getElementById('fileInput').click()}>
                    Select File
                  </Button>
                  <input
                    type="file"
                    id="fileInput"
                    className={styles.fileInput}
                    onChange={handleFileChange}
                    accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,image/jpeg,image/png,application/zip,application/x-rar-compressed"
                  />
                  <p className={styles.encryptText}>Enable encryption for maximum security.</p>
                </div>
              ) : (
                <div className={styles.fileSelectedArea}>
                  <div className={styles.fileInfo}>
                    <span className={styles.fileName}>
                      {file.name} ({formatFileSize(file.size)})
                    </span>
                    <Button variant="link" className={styles.clearButton} onClick={clearFile}>
                      <RxCross2 />
                    </Button>
                  </div>
                  <Form.Group className={styles.encryptCheckbox}>
                    <Form.Check
                      type="checkbox"
                      label="Enable End-to-End Encryption"
                      checked={encrypt}
                      onChange={(e) => setEncrypt(e.target.checked)}
                    />
                  </Form.Group>
                  {uploadSuccess ? (
                    <div>
                      <div className={styles.successMessage}>
                        {uploadSuccess.message} {uploadSuccess.encrypted ? '(Encrypted)' : '(Not Encrypted)'}
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="primary"
                      className={styles.uploadButton}
                      onClick={handleUpload}
                      disabled={uploading}
                    >
                      {uploading ? 'Uploading...' : 'Upload Securely'}
                    </Button>
                  )}
                  {uploadError && <div className={styles.errorMessage}>{uploadError}</div>}
                </div>
              )}
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default UploadPage;