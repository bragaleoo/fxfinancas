import React, { useEffect, useState } from 'react';
import { 
  Download, 
  Filter, 
  FileSpreadsheet, 
  FileText, 
  Loader2,
  Calendar,
  TrendingUp,
  PieChart as PieChartIcon,
  BarChart3
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart, 
  Pie, 
  Cell,
  Legend
} from 'recharts';
import { supabase } from '../lib/supabase';
import { Proposta, StatusProposta } from '../types';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

const COLORS = ['#FF7A29', '#10b981', '#ef4444', '#3b82f6', '#8b5cf6'];

export default function Relatorios() {
  const [propostas, setPropostas] = useState<Proposta[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Advanced Filters
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [status, setStatus] = useState<StatusProposta | 'Todos'>('Todos');
  const [consultor, setConsultor] = useState('Todos');
  const [categoria, setCategoria] = useState('Todas');
  const [minValor, setMinValor] = useState('');
  const [maxValor, setMaxValor] = useState('');

  useEffect(() => {
    fetchData();
  }, [startDate, endDate, status, consultor, categoria, minValor, maxValor]);

  async function fetchData() {
    setLoading(true);
    try {
      let query = supabase
        .from('propostas')
        .select('*')
        .gte('data_fechamento', startDate)
        .lte('data_fechamento', endDate)
        .order('created_at', { ascending: false });

      if (status !== 'Todos') query = query.eq('status', status);
      if (consultor !== 'Todos') query = query.eq('consultor_nome', consultor);
      if (categoria !== 'Todas') query = query.eq('categoria', categoria);
      if (minValor) query = query.gte('valor_consorcio', parseFloat(minValor));
      if (maxValor) query = query.lte('valor_consorcio', parseFloat(maxValor));

      const { data, error } = await query;
      if (error) throw error;

      setPropostas(data as Proposta[]);
    } catch (error) {
      toast.error('Erro ao carregar relatórios');
    } finally {
      setLoading(false);
    }
  }

  const exportCSV = () => {
    const headers = ['ID', 'Cliente', 'CPF', 'Categoria', 'Valor', 'Status', 'Data Fechamento', 'Criado em', 'Consultor'];
    const rows = propostas.map(p => [
      p.id,
      p.cliente_nome,
      p.cliente_cpf,
      p.categoria,
      p.valor_consorcio,
      p.status,
      p.data_fechamento ? format(new Date(p.data_fechamento + 'T12:00:00'), 'dd/MM/yyyy') : '-',
      format(new Date(p.created_at), 'dd/MM/yyyy'),
      p.consultor_nome
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_propostas_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Relatório CSV exportado com sucesso!');
  };

  const statusData = [
    { name: 'Pendente', value: propostas.filter(p => p.status === 'pendente').length },
    { name: 'Aprovado', value: propostas.filter(p => p.status === 'aprovado').length },
    { name: 'Rejeitado', value: propostas.filter(p => p.status === 'rejeitado').length },
  ];

  const categoriaData = ['Automóvel', 'Imóvel', 'Serviços', 'Caminhão', 'Moto'].map(cat => ({
    name: cat,
    valor: propostas.filter(p => p.categoria === cat).reduce((acc, p) => acc + p.valor_consorcio, 0)
  }));

  const consultantPerformance = Array.from(new Set(propostas.map(p => p.consultor_nome))).map(name => {
    const pConsultor = propostas.filter(p => p.consultor_nome === name);
    const aprovadas = pConsultor.filter(p => p.status === 'aprovado');
    const totalVendas = aprovadas.reduce((acc, p) => acc + p.valor_consorcio, 0);
    
    return {
      name,
      totalVendas,
      qtdVendas: aprovadas.length,
      ticketMedio: aprovadas.length > 0 ? totalVendas / aprovadas.length : 0
    };
  }).sort((a, b) => b.totalVendas - a.totalVendas);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center justify-between w-full">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Relatórios Avançados</h1>
            <p className="text-zinc-400">Análise profunda e exportação de dados estratégicos.</p>
          </div>
          <img 
            src="https://res.cloudinary.com/dvybpkimh/image/upload/v1774183289/Design_sem_nome_2_nhn64b.png" 
            alt="Logo" 
            className="h-16 w-auto object-contain hidden md:block"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={exportCSV}
            className="btn-secondary flex items-center gap-2"
          >
            <FileSpreadsheet size={18} />
            Exportar CSV
          </button>
          <button className="btn-primary flex items-center gap-2">
            <Download size={18} />
            Exportar Excel
          </button>
        </div>
      </div>

      {/* Advanced Filters Section */}
      <div className="glass-card p-6 space-y-6">
        <div className="flex items-center gap-2 text-primary">
          <Filter size={18} />
          <h3 className="text-lg font-semibold text-white">Filtros Avançados</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-1">
            <label className="label-text">Data Inicial</label>
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)}
              className="input-field" 
            />
          </div>
          <div className="space-y-1">
            <label className="label-text">Data Final</label>
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)}
              className="input-field" 
            />
          </div>
          <div className="space-y-1">
            <label className="label-text">Status</label>
            <select 
              value={status} 
              onChange={(e) => setStatus(e.target.value as any)}
              className="input-field"
            >
              <option value="Todos">Todos Status</option>
              <option value="pendente">Pendente</option>
              <option value="aprovado">Aprovado</option>
              <option value="rejeitado">Rejeitado</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="label-text">Consultor</label>
            <select 
              value={consultor} 
              onChange={(e) => setConsultor(e.target.value)}
              className="input-field"
            >
              <option value="Todos">Todos Consultores</option>
              <option value="Kauã">Kauã</option>
              <option value="Luan">Luan</option>
              <option value="Osvaldo Pinheiro">Osvaldo Pinheiro</option>
              <option value="Anderson Fontes">Anderson Fontes</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="label-text">Categoria</label>
            <select 
              value={categoria} 
              onChange={(e) => setCategoria(e.target.value)}
              className="input-field"
            >
              <option value="Todas">Todas Categorias</option>
              <option value="Automóvel">Automóvel</option>
              <option value="Imóvel">Imóvel</option>
              <option value="Serviços">Serviços</option>
              <option value="Caminhão">Caminhão</option>
              <option value="Moto">Moto</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="label-text">Valor Mínimo</label>
            <input 
              type="number" 
              value={minValor} 
              onChange={(e) => setMinValor(e.target.value)}
              className="input-field" 
              placeholder="R$ 0,00"
            />
          </div>
          <div className="space-y-1">
            <label className="label-text">Valor Máximo</label>
            <input 
              type="number" 
              value={maxValor} 
              onChange={(e) => setMaxValor(e.target.value)}
              className="input-field" 
              placeholder="R$ 1.000.000,00"
            />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <PieChartIcon size={18} className="text-primary" />
            Distribuição por Status
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <BarChart3 size={18} className="text-primary" />
            Receita por Categoria (R$)
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoriaData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `R$ ${v/1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                  itemStyle={{ color: '#FF7A29' }}
                />
                <Bar dataKey="valor" fill="#FF7A29" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Consultores Chart Section */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <TrendingUp size={18} className="text-primary" />
          Top Consultores por Receita (R$)
        </h3>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={consultantPerformance} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
              <XAxis type="number" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `R$ ${v/1000}k`} />
              <YAxis dataKey="name" type="category" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} width={120} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                itemStyle={{ color: '#FF7A29' }}
                formatter={(value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
              />
              <Bar dataKey="totalVendas" fill="#FF7A29" radius={[0, 4, 4, 0]} barSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Consultant Performance Table */}
      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-zinc-800">
          <h3 className="text-lg font-semibold">Performance por Consultor</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-zinc-900/50 text-zinc-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-medium">Consultor</th>
                <th className="px-6 py-4 font-medium text-right">Total Vendas (R$)</th>
                <th className="px-6 py-4 font-medium text-center">Qtd Vendas</th>
                <th className="px-6 py-4 font-medium text-right">Ticket Médio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {consultantPerformance.map((c) => (
                <tr key={c.name} className="hover:bg-zinc-900/30 transition-colors">
                  <td className="px-6 py-4 font-bold text-zinc-100">{c.name}</td>
                  <td className="px-6 py-4 text-right font-mono text-emerald-500">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(c.totalVendas)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="bg-zinc-800 px-2 py-1 rounded text-xs font-bold">{c.qtdVendas}</span>
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-primary">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(c.ticketMedio)}
                  </td>
                </tr>
              ))}
              {consultantPerformance.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-zinc-500 italic">
                    Nenhum dado de performance disponível para os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Full Table Section */}
      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-zinc-800">
          <h3 className="text-lg font-semibold">Relatório Detalhado</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-zinc-900/50 text-zinc-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-medium">Cliente</th>
                <th className="px-6 py-4 font-medium">Categoria</th>
                <th className="px-6 py-4 font-medium">Valor</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Consultor</th>
                <th className="px-6 py-4 font-medium">Data Fechamento</th>
                <th className="px-6 py-4 font-medium">Criado em</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Loader2 className="animate-spin mx-auto text-primary" size={32} />
                  </td>
                </tr>
              ) : propostas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">
                    Nenhum dado encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : propostas.map((p) => (
                <tr key={p.id} className="hover:bg-zinc-900/30 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium">{p.cliente_nome}</td>
                  <td className="px-6 py-4 text-sm text-zinc-400">{p.categoria}</td>
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
                  <td className="px-6 py-4 text-sm text-zinc-400">{p.consultor_nome}</td>
                  <td className="px-6 py-4 text-sm text-zinc-500">
                    {p.data_fechamento ? format(new Date(p.data_fechamento + 'T12:00:00'), 'dd/MM/yyyy') : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-500">
                    {format(new Date(p.created_at), 'dd/MM/yyyy')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
