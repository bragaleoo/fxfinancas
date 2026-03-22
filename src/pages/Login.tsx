import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, LogIn } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulated delay for better UX
    setTimeout(() => {
      if (username === 'kauafx' && password === 'kauafx_mock_password') {
        localStorage.setItem('fx_auth', 'true');
        toast.success('Bem-vindo de volta, Kauã!');
        navigate('/dashboard');
        window.location.reload(); // Force reload to update App state
      } else {
        toast.error('Usuário ou senha incorretos');
        setLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <img 
              src="https://res.cloudinary.com/dvybpkimh/image/upload/v1774183289/Design_sem_nome_2_nhn64b.png" 
              alt="FX Finanças Logo" 
              className="h-24 w-auto drop-shadow-2xl"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-black tracking-tight text-white">Acesso Restrito</h1>
            <p className="text-zinc-500 text-sm">Entre com suas credenciais para acessar o sistema.</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="glass-card p-8 space-y-6 border-white/5">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-zinc-500 tracking-widest">Usuário</label>
              <div className="relative group">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-primary transition-colors" size={18} />
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input-field pl-10 py-3 bg-zinc-900/50 border-zinc-800 focus:border-primary/50" 
                  placeholder="Seu usuário"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-zinc-500 tracking-widest">Senha</label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-primary transition-colors" size={18} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-10 py-3 bg-zinc-900/50 border-zinc-800 focus:border-primary/50" 
                  placeholder="••••••••••••"
                  required
                />
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary w-full py-4 flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-widest group"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <LogIn size={18} className="group-hover:translate-x-1 transition-transform" />
                Entrar no Sistema
              </>
            )}
          </button>
        </form>

        <p className="text-center text-[10px] text-zinc-600 uppercase font-bold tracking-widest">
          © 2026 FX Finanças • Todos os direitos reservados
        </p>
      </div>
    </div>
  );
}
