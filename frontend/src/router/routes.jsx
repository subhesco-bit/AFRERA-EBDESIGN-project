import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layout
import Layout from '../components/Layout';
import MobileLayout from '../components/MobileOptimizedLayout';

// Auth pages
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';

// Farmer pages
import FarmerHomePage from '../pages/FarmerHomePage';
import FarmerDashboardPage from '../pages/DashboardPage';
import FarmerProfilePage from '../pages/FarmerProfilePage';
import FarmerKycPage from '../pages/FarmerKycPage';

// Marketplace pages
import MarketplacePage from '../pages/MarketplacePage';
import CartPage from '../pages/CartPage';
import CheckoutPage from '../pages/CheckoutPage';

// AI pages
import AIDashboard from '../pages/AIDashboard';
import AIChatPage from '../pages/AIChatPage';
import AICollaborationPage from '../pages/AICollaborationPage';

// Security pages
import MFASetupPage from '../pages/MFASetupPage';
import GDPRConsentPage from '../pages/GDPRConsentPage';

// Shared pages
import HomePage from '../pages/HomePage';
import NotFoundPage from '../pages/PlaceholderPage';

/**
 * Route Configuration
 * Maps all 96 business functions to pages
 */
export default function Router() {
  return (
    <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<HomePage />} />

        {/* Protected farmer routes */}
        <Route path="/farmer/*" element={<Layout />}>
          <Route path="home" element={<FarmerHomePage />} />
          <Route path="dashboard" element={<FarmerDashboardPage />} />
          <Route path="profile" element={<FarmerProfilePage />} />
          <Route path="kyc" element={<FarmerKycPage />} />
        </Route>

        {/* Marketplace routes */}
        <Route path="/marketplace/*" element={<Layout />}>
          <Route path="browse" element={<MarketplacePage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
        </Route>

        {/* AI routes */}
        <Route path="/ai/*" element={<Layout />}>
          <Route path="dashboard" element={<AIDashboard />} />
          <Route path="chat" element={<AIChatPage />} />
          <Route path="collaboration" element={<AICollaborationPage />} />
        </Route>

        {/* Security routes */}
        <Route path="/security/*" element={<Layout />}>
          <Route path="mfa" element={<MFASetupPage />} />
          <Route path="gdpr" element={<GDPRConsentPage />} />
        </Route>

        {/* Mobile routes */}
        <Route path="/mobile/*" element={<MobileLayout />}>
          {/* Mobile-specific routes */}
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
  );
}