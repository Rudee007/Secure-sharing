import React from 'react';
import { Card } from 'react-bootstrap';
import { FileEarmark } from 'react-bootstrap-icons';

function TotalFiles({ count }) {
  return (
    <Card className="h-100">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <Card.Title className="text-secondary fs-6 mb-3">Total Files</Card.Title>
            <Card.Text className="fs-3 fw-bold">{count}</Card.Text>
          </div>
          <FileEarmark size={24} className="text-primary" />
        </div>
      </Card.Body>
    </Card>
  );
}

export default TotalFiles;