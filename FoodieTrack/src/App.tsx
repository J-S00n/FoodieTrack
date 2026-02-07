import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import React from 'react';
import Profile from '../components/Profile';
import Dashboard from '../components/Dashboard';
import Home from '../components/Home';

// 1. Move ProtectedRoute outside the main App function
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth0();

  if (isLoading) return <div className="flex h-screen items-center justify-center">Loading...</div>;

  return isAuthenticated ? <>{children}</> : <Navigate to="/" />;
}

function App() {
  const [count, setCount] = useState(0);
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;