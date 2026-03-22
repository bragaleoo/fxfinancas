import React, { useState, useEffect } from 'react';
import { LayoutDashboard, PlusCircle, Calculator, LogOut, Menu, X } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
}

export default function Layout({ children, currentPage, onPageChange }: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'nova-proposta', label: 'Nova Proposta', icon: PlusCircle },
    { id: 'calculadora', label: 'Calculadora', icon: Calculator },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-black/40 border-r border-white/10 p-6">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-8 h-8 bg-[#FF7A29] rounded-lg flex items-center justify-center font-bold text-white">FX</div>
          <h1 className="text-xl font-bold tracking-tight">Finanças</h1>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                currentPage === item.id 
                  ? 'bg-[#FF7A29] text-white shadow-lg shadow-[#FF7A29]/20' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="pt-6 border-t border-white/10">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-red-500/10 hover:text-red-500 transition-all">
            <LogOut size={20} />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 bg-black/40 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#FF7A29] rounded-lg flex items-center justify-center font-bold text-white text-xs">FX</div>
          <h1 className="text-lg font-bold">Finanças</h1>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2">
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/90 p-6 flex flex-col">
          <div className="flex justify-end mb-8">
            <button onClick={() => setIsMobileMenuOpen(false)}><X size={32} /></button>
          </div>
          <nav className="space-y-4">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onPageChange(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-xl ${
                  currentPage === item.id ? 'bg-[#FF7A29] text-white' : 'text-gray-400'
                }`}
              >
                <item.icon size={24} />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-10 overflow-y-auto max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
