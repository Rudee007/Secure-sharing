import React from 'react';
import { Card } from 'react-bootstrap';
import { ClockFill } from 'react-bootstrap-icons';

function RecentActivity({ days }) {
  return (
    <Card className="h-100">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <Card.Title className="text-secondary fs-6 mb-3">Recent Activity</Card.Title>
            <Card.Text className="fs-3 fw-bold">{days} days</Card.Text>
          </div>
          <ClockFill size={24} className="text-primary" />
        </div>
      </Card.Body>
    </Card>
  );
}

export default RecentActivity;