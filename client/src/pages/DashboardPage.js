import React, { useState, useEffect } from 'react';
import { Row, Col } from 'react-bootstrap';
import axios from 'axios';
import StorageUsed from '../components/Dashboard/StorageUsed';
import WeeklyActivity from '../components/Dashboard/WeeklyActivity'; 
import FileList from '../components/Dashboard/FileList'; 

function DashboardPage() {
  const [files, setFiles] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [storageData, setStorageData] = useState({ totalSizeMB: 0, fileCount: 0, totalStorageLimit: 1000 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Please log in to view dashboard');

        const [filesResponse, weeklyResponse, storageResponse] = await Promise.all([
          axios.get('http://localhost:3001/api/files/user-file', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get('http://localhost:3001/api/files/weekly-activity', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get('http://localhost:3001/api/files/storage-usage', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setFiles(filesResponse.data);
        setWeeklyData(weeklyResponse.data);
        setStorageData({
          totalSizeMB: parseFloat(storageResponse.data.totalSizeMB || 0),
          fileCount: storageResponse.data.fileCount || 0,
          totalStorageLimit: storageResponse.data.totalStorageLimit || 1000, 
        });
        setLoading(false);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
        setError(err.message || 'Failed to load dashboard data');
        setLoading(false);
      }
    };

    fetchData();
  }, []); 
  if (loading) return <div className="text-center my-5">Loading dashboard...</div>;
  if (error) return <div className="text-center text-danger my-5">Error: {error}</div>;

  return (
    <div className="dashboard container my-4">
      <h1 className="mb-4">Dashboard</h1>
      <Row className="g-4 mb-4">
        <Col md={12}>
          <StorageUsed
            totalSizeMB={storageData.totalSizeMB}
            fileCount={storageData.fileCount}
            totalStorageLimit={storageData.totalStorageLimit}
          />
        </Col>
      </Row>
      <Row className="g-4 mb-4">
        <Col md={12}>
          <WeeklyActivity data={weeklyData} />
        </Col>
      </Row>
      <Row className="g-4">
        <Col md={12}>
          <FileList files={files} />
        </Col>
      </Row>
    </div>
  );
}

export default DashboardPage;