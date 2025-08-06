import './App.css';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import 'bootstrap/dist/css/bootstrap.min.css';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import AuthSite from './pages/AuthSite';
import UploadFile from './pages/UploadPage';
import AccessFile from './pages/AccessFile';
import SharedFile from './pages/SharedFile';
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthSite />} />
        <Route path="/" element={<Layout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/" element={<LandingPage />} />
          <Route path="/upload" element={<UploadFile />} />
          <Route path="/share/:token" element={<AccessFile />} />
          <Route path="/sharedFile" element={<SharedFile />} />

        </Route>
        <Route path="*" element={<div>404 - Page Not Found</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;