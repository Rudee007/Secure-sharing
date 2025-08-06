import React from 'react';
import { Card, ProgressBar } from 'react-bootstrap';
import { Database } from 'react-bootstrap-icons';

function StorageUsed({ totalSizeMB, fileCount, totalStorageLimit }) {

  const percentage = Math.min((totalSizeMB / totalStorageLimit) * 100, 100);

  return (
    <Card className="h-100">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <Card.Title className="text-secondary fs-6 mb-3">Storage Used</Card.Title>
            <Card.Text className="fs-3 fw-bold">{totalSizeMB.toFixed(2)} MB</Card.Text>
          </div>
          <Database size={24} className="text-primary" />
        </div>
        <ProgressBar className="mt-3" now={percentage} variant="primary" />
        <Card.Text className="text-secondary small mt-2">
          {totalSizeMB.toFixed(2)} MB of {totalStorageLimit} MB used ({fileCount} files)
        </Card.Text>
      </Card.Body>
    </Card>
  );
}

export default StorageUsed;