import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/propostas" element={<Propostas />} />
          <Route path="/propostas/nova" element={<NovaProposta />} />
          <Route path="/propostas/editar/:id" element={<EditarProposta />} />
          <Route path="/propostas/:id" element={<DetalheProposta />} />
          <Route path="/relatorios" element={<Relatorios />} />
          <Route path="/calculadora" element={<Calculadora />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}
