import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem('auth') === 'true') {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const credentials = [
      { user: 'kauafx', pass: 'kauafx_mock_password', admin: false },
      { user: 'impulse.work', pass: 'impulse_mock_password', admin: true }
    ];

    const found = credentials.find(c => c.user === login && c.pass === password);

    if (found) {
      localStorage.setItem('auth', 'true');
      localStorage.setItem('user', login);
      if (found.admin) {
        localStorage.setItem('isAdmin', 'true');
      } else {
        localStorage.removeItem('isAdmin');
      }
      toast.success('Acesso autorizado!');
      navigate('/dashboard');
    } else {
      setError('Usuário ou senha inválidos');
      toast.error('Usuário ou senha inválidos');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-[#FF7A29] rounded-2xl flex items-center justify-center font-bold text-white text-3xl shadow-lg shadow-[#FF7A29]/20 mb-4">
            FX
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Acesso ao Sistema</h1>
          <p className="text-zinc-500 text-sm">Entre com suas credenciais para continuar</p>
        </div>

        <div className="glass-card p-8 border-zinc-800/50">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Login</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input
                  type="text"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  className="input-field pl-10"
                  placeholder="Seu usuário"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-10"
                  placeholder="Sua senha"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-500 text-sm bg-red-500/10 p-3 rounded-xl border border-red-500/20 animate-in slide-in-from-top-2">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-base"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span>Autenticando...</span>
                </>
              ) : (
                <span>Entrar</span>
              )}
            </button>
          </form>
        </div>

        <p className="mt-8 text-center text-zinc-600 text-xs">
          &copy; {new Date().getFullYear()} FX Finanças. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
