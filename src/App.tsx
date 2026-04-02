import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Sidebar } from './components/Sidebar';

// Lazy load pages
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Propostas = React.lazy(() => import('./pages/Propostas'));
const NovaProposta = React.lazy(() => import('./pages/NovaProposta'));
const EditarProposta = React.lazy(() => import('./pages/EditarProposta'));
const DetalheProposta = React.lazy(() => import('./pages/DetalheProposta'));
const Relatorios = React.lazy(() => import('./pages/Relatorios'));
const Calculadora = React.lazy(() => import('./pages/Calculadora'));
const ControlePagamentos = React.lazy(() => import('./pages/ControlePagamentos'));
const Login = React.lazy(() => import('./pages/Login'));

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const auth = localStorage.getItem('auth') === 'true';
  
  if (!auth) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-zinc-950 text-white">
      <Sidebar />
      <main className="flex-1 lg:ml-64 p-4 lg:p-8 overflow-x-hidden">
        <React.Suspense fallback={
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        }>
          {children}
        </React.Suspense>
      </main>
      <Toaster position="top-right" theme="dark" richColors />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={
          <React.Suspense fallback={
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          }>
            <Login />
          </React.Suspense>
        } />
        
        <Route path="/" element={<ProtectedRoute><Navigate to="/dashboard" replace /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/propostas" element={<ProtectedRoute><Propostas /></ProtectedRoute>} />
        <Route path="/propostas/nova" element={<ProtectedRoute><NovaProposta /></ProtectedRoute>} />
        <Route path="/propostas/editar/:id" element={<ProtectedRoute><EditarProposta /></ProtectedRoute>} />
        <Route path="/propostas/:id" element={<ProtectedRoute><DetalheProposta /></ProtectedRoute>} />
        <Route path="/relatorios" element={<ProtectedRoute><Relatorios /></ProtectedRoute>} />
        <Route path="/calculadora" element={<ProtectedRoute><Calculadora /></ProtectedRoute>} />
        <Route path="/pagamentos" element={<ProtectedRoute><ControlePagamentos /></ProtectedRoute>} />
        
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}
