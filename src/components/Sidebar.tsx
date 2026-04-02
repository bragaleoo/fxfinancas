import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  BarChart3, 
  Calculator, 
  DollarSign,
  Settings, 
  PlusCircle,
  Menu,
  X,
  LogOut
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: FileText, label: 'Controle de Propostas', path: '/propostas' },
  { icon: BarChart3, label: 'Relatórios', path: '/relatorios' },
  { icon: Calculator, label: 'Calculadora de Remuneração Variável', path: '/calculadora' },
  { icon: DollarSign, label: 'Controle de Pagamentos', path: '/pagamentos' },
];

export function Sidebar() {
  const [isOpen, setIsOpen] = React.useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('auth');
    localStorage.removeItem('user');
    localStorage.removeItem('isAdmin');
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Toggle */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-zinc-900 border border-zinc-800 rounded-lg"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-zinc-950 border-r border-zinc-800 transition-transform lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full p-6">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <img 
              src="https://res.cloudinary.com/dvybpkimh/image/upload/v1774183289/Design_sem_nome_2_nhn64b.png" 
              alt="Logo" 
              className="h-14 w-14 object-contain"
              referrerPolicy="no-referrer"
            />
            <h1 className="text-2xl font-bold tracking-tight text-white">FX Finanças</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) => cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
                )}
              >
                <item.icon size={18} className={cn(
                  "transition-colors",
                  "group-hover:text-primary"
                )} />
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Bottom Actions */}
          <div className="pt-6 border-t border-zinc-800 space-y-2">
            <NavLink
              to="/propostas/nova"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium bg-primary text-white hover:bg-primary/90 transition-all"
            >
              <PlusCircle size={18} />
              Nova Proposta
            </NavLink>
            <NavLink
              to="/configuracoes"
              onClick={() => setIsOpen(false)}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                isActive 
                  ? "bg-zinc-900 text-white" 
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
              )}
            >
              <Settings size={18} />
              Configurações
            </NavLink>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-400/10 transition-all"
            >
              <LogOut size={18} />
              Sair
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
        />
      )}
    </>
  );
}
