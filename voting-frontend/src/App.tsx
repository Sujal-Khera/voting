import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Web3Provider } from './contexts/Web3Context';
import Navigation from './components/Navigation';
import Landing from './pages/Landing';
import Admin from './pages/Admin';
import Voter from './pages/Voter';
import Results from './pages/Results';
import './App.css';

function App() {
  return (
    <Web3Provider>
      <Router>
        <div className="App">
          <Navigation />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/voter" element={<Voter />} />
            <Route path="/results" element={<Results />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1F2937',
                color: '#fff',
                border: '1px solid #374151',
              },
            }}
          />
        </div>
      </Router>
    </Web3Provider>
  );
}

export default App;