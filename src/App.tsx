import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { WalletProvider, useWalletContext } from './context/WalletContext'
import { AuthRoute } from './components/auth/AuthRoute'
import { Toaster } from 'react-hot-toast'
import Home from './pages/Home'
import Login from './pages/Login'
import CreateBounty from './pages/CreateBounty'
import BountyDetails from './pages/BountyDetails'

// Wrapper component that provides authentication state to routes
const AppRoutes = () => {
  const { account } = useWalletContext();
  const isAuthenticated = !!account;
  
  return (
    <Routes>
      {/* Public routes - no authentication required */}
      <Route path="/login" element={<Login />} />
      <Route path="/bounty/:id" element={<BountyDetails />} />
      
      {/* Protected routes - authentication required */}
      <Route 
        path="/" 
        element={
          <AuthRoute isAuthenticated={isAuthenticated}>
            <Home />
          </AuthRoute>
        } 
      />
      <Route 
        path="/create" 
        element={
          <AuthRoute isAuthenticated={isAuthenticated}>
            <CreateBounty />
          </AuthRoute>
        } 
      />
      
      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  console.log("App - Rendering");
  
  return (
    <WalletProvider>
      <Router>
        <AppRoutes />
        <Toaster position="top-right" />
      </Router>
    </WalletProvider>
  )
}

export default App 