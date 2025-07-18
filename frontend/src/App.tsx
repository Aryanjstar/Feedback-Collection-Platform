import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateForm from './pages/CreateForm';
import EditForm from './pages/EditForm';
import FormResponses from './pages/FormResponses';
import PublicForm from './pages/PublicForm';

import './App.css';

const AppRoutes: React.FC = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Home />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <Register />} />
      
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />
      
      <Route
        path="/forms/new"
        element={
          <PrivateRoute>
            <CreateForm />
          </PrivateRoute>
        }
      />
      
      <Route
        path="/forms/:formId/edit"
        element={
          <PrivateRoute>
            <EditForm />
          </PrivateRoute>
        }
      />
      
      <Route
        path="/forms/:formId/responses"
        element={
          <PrivateRoute>
            <FormResponses />
          </PrivateRoute>
        }
      />
      
      {/* Public form submission route */}
      <Route path="/form/:publicUrl" element={<PublicForm />} />
      
      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <AppRoutes />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
