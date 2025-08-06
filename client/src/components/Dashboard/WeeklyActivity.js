import React from 'react';
import { Card } from 'react-bootstrap';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function WeeklyActivity({ data }) {

  return (
    <Card className="mb-4">
      <Card.Body>
        <Card.Title>Weekly Activity</Card.Title>
        <Card.Subtitle className="mb-3 text-muted small">
          File uploads over the past week
        </Card.Subtitle>
        <div style={{ height: '240px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="uploads" fill="#4F7FFF" radius={[3, 3, 0, 0]} barSize={60} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card.Body>
    </Card>
  );
}

export default WeeklyActivity;