import React, { useState, useEffect } from 'react';
import LinkShared from '../LinkShared';
import axios from 'axios';
import { 
  Container, 
  Row, 
  Col, 
  Form, 
  InputGroup, 
  Button, 
  Badge, 
  Dropdown,
  DropdownButton,
  Toast,
  ToastContainer
} from 'react-bootstrap';
import { 
  Search, 
  Funnel, 
  ArrowDownUp, 
  Download, 
  Share, 
  ThreeDotsVertical, 
  FileEarmark, 
  FileEarmarkPdf, 
  FileEarmarkPpt, 
  FileEarmarkWord, 
  FileEarmarkExcel,
  Trash
} from 'react-bootstrap-icons';

function FileList({ files, setFiles, onFileDeleted }) {
  const [showShareModal, setShowShareModal] = useState(false);
  const [fileToShare, setFileToShare] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [deletingFileId, setDeletingFileId] = useState(null);
  const [localFiles, setLocalFiles] = useState(files);

  useEffect(() => {
    setLocalFiles(files);
  }, [files]);

  const searchedFiles = localFiles.filter(file =>
    file.filename.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredFiles = searchedFiles.filter(file => {
    if (filterType === 'all') return true;
    const ext = file.filename.split('.').pop().toLowerCase();
    if (filterType === 'documents') return ['pdf', 'doc', 'docx', 'txt'].includes(ext);
    if (filterType === 'presentations') return ['ppt', 'pptx'].includes(ext);
    if (filterType === 'spreadsheets') return ['xls', 'xlsx', 'csv'].includes(ext);
    return false;
  });

  const sortedFiles = [...filteredFiles].sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
    if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
    if (sortBy === 'name') return a.filename.localeCompare(b.filename);
    if (sortBy === 'size') return b.size - a.size;
    return 0;
  });

  const getFileIcon = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    if (['pdf'].includes(ext)) return <FileEarmarkPdf size={20} className="text-danger" />;
    if (['ppt', 'pptx'].includes(ext)) return <FileEarmarkPpt size={20} className="text-warning" />;
    if (['doc', 'docx'].includes(ext)) return <FileEarmarkWord size={20} className="text-primary" />;
    if (['xls', 'xlsx', 'csv'].includes(ext)) return <FileEarmarkExcel size={20} className="text-success" />;
    return <FileEarmark size={20} className="text-secondary" />;
  };

  const formatFileSize = (sizeInBytes) => {
    if (sizeInBytes < 1024 * 1024) return `${(sizeInBytes / 1024).toFixed(2)} KB`;
    if (sizeInBytes < 1024 * 1024 * 1024) return `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(sizeInBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const getFileIdDisplay = (id) => {
    return `File-${id.substring(0, 3)}...`;
  };

  const handleDelete = async (fileId) => {
    try {
      setDeletingFileId(fileId);
      const token = localStorage.getItem('token');
      const response = await axios.delete(`http://localhost:3001/api/files/delete/${fileId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 200) {
        const updatedFiles = localFiles.filter(file => file.fileId !== fileId);
        setLocalFiles(updatedFiles);
        setToastMessage("File deleted successfully");
        setShowToast(true);
        if (typeof setFiles === 'function') {
          setFiles(updatedFiles);
        }
        if (typeof onFileDeleted === 'function') {
          onFileDeleted(fileId);
        }
      }
    } catch (error) {
      console.error('Delete error:', error);
      setToastMessage("Error deleting file. Please try again.");
      setShowToast(true);
    } finally {
      setDeletingFileId(null);
    }
  };

  const handleShareClick = (file) => {
    setFileToShare({
      fileId: file.fileId,
      filename: file.filename,
    });
    setShowShareModal(true);
  };

  return (
    <Container className="p-0 py-4">

      <ToastContainer position="top-end" className="p-3">
        <Toast onClose={() => setShowToast(false)} show={showToast} delay={3000} autohide>
          <Toast.Header>
            <strong className="me-auto">Notification</strong>
          </Toast.Header>
          <Toast.Body>{toastMessage}</Toast.Body>
        </Toast>
      </ToastContainer>
      
      <Row className="align-items-center mb-4">
        <Col>
          <h4 className="fw-bold mb-1">Your Files</h4>
          <p className="text-muted small mb-0">Manage and share your secure files</p>
        </Col>
        <Col xs="auto" className="d-flex gap-3">
          <DropdownButton
            variant="outline-secondary"
            title={<><Funnel size={14} className="me-2" /> {filterType === 'all' ? 'All Types' : filterType.charAt(0).toUpperCase() + filterType.slice(1)}</>}
            size="sm"
            className="rounded-pill px-3 py-2"
          >
            <Dropdown.Item onClick={() => setFilterType('all')}>All Types</Dropdown.Item>
            <Dropdown.Item onClick={() => setFilterType('documents')}>Documents</Dropdown.Item>
            <Dropdown.Item onClick={() => setFilterType('presentations')}>Presentations</Dropdown.Item>
            <Dropdown.Item onClick={() => setFilterType('spreadsheets')}>Spreadsheets</Dropdown.Item>
          </DropdownButton>

          <DropdownButton
            variant="outline-secondary"
            title={<><ArrowDownUp size={14} className="me-2" /> {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}</>}
            size="sm"
            className="rounded-pill px-3 py-2"
          >
            <Dropdown.Item onClick={() => setSortBy('newest')}>Newest</Dropdown.Item>
            <Dropdown.Item onClick={() => setSortBy('oldest')}>Oldest</Dropdown.Item>
            <Dropdown.Item onClick={() => setSortBy('name')}>Name</Dropdown.Item>
            <Dropdown.Item onClick={() => setSortBy('size')}>Size</Dropdown.Item>
          </DropdownButton>
        </Col>
      </Row>

      <InputGroup className="mb-5">
        <InputGroup.Text className="bg-white border-end-0">
          <Search size={16} />
        </InputGroup.Text>
        <Form.Control
          type="text"
          placeholder="Search files..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="border-start-0 ps-0 py-2"
          aria-label="Search files"
        />
      </InputGroup>

      <Row className="mb-3 px-3">
        <Col>
          <span className="text-muted small">File</span>
        </Col>
        <Col xs={2} className="text-end">
          <span className="text-muted small">Size</span>
        </Col>
        <Col xs={2} className="text-end">
          <span className="text-muted small">Date</span>
        </Col>
     
        <Col xs={2} className="text-end">
          <span className="text-muted small">Actions</span>
        </Col>
      </Row>

      {sortedFiles.length > 0 ? (
        sortedFiles.map((file, index) => (
          <Row 
            key={file.fileId} 
            className={`py-4 px-3 align-items-center ${index !== sortedFiles.length - 1 ? 'border-bottom' : ''}`}
            style={{ 
              transition: 'all 0.3s ease',
              opacity: deletingFileId === file.fileId ? 0.5 : 1,
              backgroundColor: deletingFileId === file.fileId ? '#f8f9fa' : 'inherit'
            }}
          >
            <Col className="d-flex align-items-center">
              <div className="me-4">
                {getFileIcon(file.filename)}
              </div>
              <div>
                <div className="mb-1 fw-medium">{file.filename}</div>
                <div className="text-muted small">{getFileIdDisplay(file.fileId)}</div>
              </div>
            </Col>
            <Col xs={2} className="text-end">
              {formatFileSize(file.size)}
            </Col>
            <Col xs={2} className="text-end">
              <span className="text-muted small">
                {new Date(file.createdAt).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: '2-digit', 
                  year: 'numeric' 
                })}
              </span>
            </Col>
          
            <Col xs={2} className="text-end">
              <div className="d-flex justify-content-end gap-3">
                <Button 
                  variant="link" 
                  className="p-0 text-body" 
                  title="Share"
                  onClick={() => handleShareClick(file)} // Use the handleShareClick function
                >
                  <Share size={18} />
                </Button>
                <Button 
                  variant="link" 
                  className="p-0 text-danger" 
                  title="Delete"
                  onClick={() => handleDelete(file.fileId)}
                  disabled={deletingFileId === file.fileId}
                >
                  <Trash size={18} />
                </Button>
              </div>
            </Col>
          </Row>
        ))
      ) : (
        <Row className="py-5">
          <Col className="text-center text-muted">
            <p>No files found. Try changing your search or filter criteria.</p>
          </Col>
        </Row>
      )}

      <LinkShared 
        show={showShareModal} 
        onHide={() => setShowShareModal(false)} 
        file={fileToShare}
      />
    </Container>
  );
}

export default FileList;