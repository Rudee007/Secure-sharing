import './App.css';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import AuthNavbar from './components/AuthNavbar';
import LandingPage from './pages/LandingPage';

function App() {
  return (
    <BrowserRouter>
      <AuthNavbar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        {/* Add more routes as needed */}
        {/* You might want to add these routes later */}
        {/* <Route path="/flow-diagram" element={<FlowDiagram />} /> */}
        {/* <Route path="/login" element={<Login />} /> */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;