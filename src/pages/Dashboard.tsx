import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  Users, 
  CheckCircle2, 
  XCircle, 
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Filter
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart, 
  Pie, 
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { supabase } from '../lib/supabase';
import { Proposta, KPIStats } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const COLORS = ['#FF7A29', '#10b981', '#ef4444', '#3b82f6'];

export default function Dashboard() {
  const [propostas, setPropostas] = useState<Proposta[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<KPIStats>({
    totalPropostas: 0,
    totalAprovado: 0,
    totalPerdido: 0,
    taxaConversao: 0,
    ticketMedio: 0
  });

  // Filters
  const [period, setPeriod] = useState('30');
  const [consultor, setConsultor] = useState('Todos');
  const [categoria, setCategoria] = useState('Todas');

  useEffect(() => {
    fetchData();
  }, [period, consultor, categoria]);

  async function fetchData() {
    setLoading(true);
    try {
      let query = supabase.from('propostas').select('*').order('data_fechamento', { ascending: false });

      if (consultor !== 'Todos') query = query.eq('consultor_nome', consultor);
      if (categoria !== 'Todas') query = query.eq('categoria', categoria);

      const { data, error } = await query;
      if (error) throw error;

      let filtered = data as Proposta[];

      // Filter by period (using data_fechamento)
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - parseInt(period));
      const cutoffStr = format(cutoff, 'yyyy-MM-dd');

      filtered = filtered.filter(p => p.data_fechamento >= cutoffStr);

      setPropostas(filtered);

      // Calculate Stats
      const aprovadas = filtered.filter(p => p.status === 'aprovado');
      const rejeitadas = filtered.filter(p => p.status === 'rejeitado');
      const totalAprovado = aprovadas.reduce((acc, p) => acc + p.valor_consorcio, 0);
      const totalPerdido = rejeitadas.reduce((acc, p) => acc + p.valor_consorcio, 0);
      
      setStats({
        totalPropostas: filtered.length,
        totalAprovado,
        totalPerdido,
        taxaConversao: filtered.length > 0 ? (aprovadas.length / filtered.length) * 100 : 0,
        ticketMedio: aprovadas.length > 0 ? totalAprovado / aprovadas.length : 0
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  const chartData = propostas.slice(0, 10).map(p => ({
    name: format(new Date(p.data_fechamento + 'T12:00:00'), 'dd/MM'),
    valor: p.valor_consorcio
  })).reverse();

  const pieData = [
    { name: 'Pendente', value: propostas.filter(p => p.status === 'pendente').length },
    { name: 'Aprovado', value: propostas.filter(p => p.status === 'aprovado').length },
    { name: 'Rejeitado', value: propostas.filter(p => p.status === 'rejeitado').length },
  ];

  // Consultant Performance Data
  const consultantData = Array.from(new Set(propostas.map(p => p.consultor_nome))).map(name => {
    const pConsultor = propostas.filter(p => p.consultor_nome === name);
    const aprovadas = pConsultor.filter(p => p.status === 'aprovado');
    const totalVendas = aprovadas.reduce((acc, p) => acc + p.valor_consorcio, 0);
    
    return {
      name,
      totalVendas,
      qtdVendas: aprovadas.length,
      taxaConversao: pConsultor.length > 0 ? (aprovadas.length / pConsultor.length) * 100 : 0,
      ticketMedio: aprovadas.length > 0 ? totalVendas / aprovadas.length : 0
    };
  }).sort((a, b) => b.totalVendas - a.totalVendas);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header & Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center justify-between w-full">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard Executivo</h1>
            <p className="text-zinc-400">Visão geral estratégica do seu negócio.</p>
          </div>
          <img 
            src="https://res.cloudinary.com/dvybpkimh/image/upload/v1774183289/Design_sem_nome_2_nhn64b.png" 
            alt="Logo" 
            className="h-16 w-auto object-contain hidden md:block"
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5">
            <Filter size={14} className="text-zinc-500" />
            <select 
              value={period} 
              onChange={(e) => setPeriod(e.target.value)}
              className="bg-transparent text-sm font-medium focus:outline-none"
            >
              <option value="7">Últimos 7 dias</option>
              <option value="30">Últimos 30 dias</option>
              <option value="90">Últimos 90 dias</option>
            </select>
          </div>

          <select 
            value={consultor} 
            onChange={(e) => setConsultor(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-sm font-medium focus:outline-none"
          >
            <option value="Todos">Todos Consultores</option>
            <option value="Kauã">Kauã</option>
            <option value="Luan">Luan</option>
            <option value="Osvaldo Pinheiro">Osvaldo Pinheiro</option>
            <option value="Anderson Fontes">Anderson Fontes</option>
          </select>

          <select 
            value={categoria} 
            onChange={(e) => setCategoria(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-sm font-medium focus:outline-none"
          >
            <option value="Todas">Todas Categorias</option>
            <option value="Automóvel">Automóvel</option>
            <option value="Imóvel">Imóvel</option>
            <option value="Serviços">Serviços</option>
            <option value="Caminhão">Caminhão</option>
            <option value="Moto">Moto</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard 
          title="Total Propostas" 
          value={stats.totalPropostas.toString()} 
          icon={Users} 
          trend="+12%" 
          trendUp={true} 
        />
        <KPICard 
          title="Total Aprovado" 
          value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalAprovado)} 
          icon={CheckCircle2} 
          trend="+5.4%" 
          trendUp={true} 
          color="text-emerald-500"
        />
        <KPICard 
          title="Total Perdido" 
          value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalPerdido)} 
          icon={XCircle} 
          trend="-2.1%" 
          trendUp={false} 
          color="text-red-500"
        />
        <KPICard 
          title="Taxa Conversão" 
          value={`${stats.taxaConversao.toFixed(1)}%`} 
          icon={TrendingUp} 
          trend="+0.8%" 
          trendUp={true} 
        />
        <KPICard 
          title="Ticket Médio" 
          value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.ticketMedio)} 
          icon={DollarSign} 
          trend="+R$ 1.2k" 
          trendUp={true} 
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line Chart */}
        <div className="lg:col-span-2 glass-card p-6">
          <h3 className="text-lg font-semibold mb-6">Volume de Vendas (R$)</h3>
          <div className="h-[300px]">
            {propostas.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `R$ ${v/1000}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                    itemStyle={{ color: '#FF7A29' }}
                  />
                  <Line type="monotone" dataKey="valor" stroke="#FF7A29" strokeWidth={3} dot={{ r: 4, fill: '#FF7A29' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-zinc-500">Nenhuma proposta cadastrada ainda</div>
            )}
          </div>
        </div>

        {/* Pie Chart */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-6">Distribuição por Status</h3>
          <div className="h-[300px]">
            {propostas.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                  />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-zinc-500">Nenhuma proposta cadastrada ainda</div>
            )}
          </div>
        </div>
      </div>

      {/* Top Consultores Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-6">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <TrendingUp size={18} className="text-primary" />
            Top Consultores por Valor Vendido
          </h3>
          <div className="h-[300px]">
            {consultantData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={consultantData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                  <XAxis type="number" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `R$ ${v/1000}k`} />
                  <YAxis dataKey="name" type="category" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} width={100} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                    itemStyle={{ color: '#FF7A29' }}
                    formatter={(value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
                  />
                  <Bar dataKey="totalVendas" fill="#FF7A29" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-zinc-500">Nenhuma proposta cadastrada ainda</div>
            )}
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-6">Performance Detalhada</h3>
          <div className="space-y-4">
            {consultantData.slice(0, 5).map((c, idx) => (
              <div key={c.name} className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-xl border border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-100">{c.name}</p>
                    <p className="text-[10px] text-zinc-500 uppercase font-bold">{c.qtdVendas} Vendas • {c.taxaConversao.toFixed(1)}% Conv.</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-primary">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(c.totalVendas)}</p>
                  <p className="text-[10px] text-zinc-500">TM: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(c.ticketMedio)}</p>
                </div>
              </div>
            ))}
            {consultantData.length === 0 && (
              <div className="text-center py-8 text-zinc-500 text-sm italic">Nenhum dado de consultor disponível</div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Table */}
      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Últimas Propostas</h3>
          <button className="text-sm text-primary hover:underline font-medium">Ver todas</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-zinc-900/50 text-zinc-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-medium">Cliente</th>
                <th className="px-6 py-4 font-medium">Categoria</th>
                <th className="px-6 py-4 font-medium">Valor</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {propostas.length > 0 ? (
                propostas.slice(0, 5).map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-900/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium">{p.cliente_nome}</div>
                      <div className="text-xs text-zinc-500">{p.cidade}</div>
                    </td>
                    <td className="px-6 py-4 text-sm">{p.categoria}</td>
                    <td className="px-6 py-4 text-sm font-semibold">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.valor_consorcio)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`badge-status ${
                        p.status === 'aprovado' ? 'bg-emerald-500/10 text-emerald-500' :
                        p.status === 'rejeitado' ? 'bg-red-500/10 text-red-500' :
                        'bg-amber-500/10 text-amber-500'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-500">
                      {p.data_fechamento ? format(new Date(p.data_fechamento + 'T12:00:00'), 'dd/MM/yyyy') : '-'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-500 italic">
                    Nenhuma proposta cadastrada ainda
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function KPICard({ title, value, icon: Icon, trend, trendUp, color = "text-zinc-100" }: any) {
  return (
    <div className="glass-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800">
          <Icon size={18} className="text-primary" />
        </div>
        <div className={`flex items-center gap-1 text-xs font-medium ${trendUp ? 'text-emerald-500' : 'text-red-500'}`}>
          {trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {trend}
        </div>
      </div>
      <div>
        <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">{title}</p>
        <h4 className={`text-xl font-bold mt-1 ${color}`}>{value}</h4>
      </div>
    </div>
  );
}
