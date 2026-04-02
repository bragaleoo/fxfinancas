import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { DollarSign, Calendar, User, FileText, Plus, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';

interface Pagamento {
  id: string;
  consultor: string;
  valor: number;
  data_pagamento: string;
  parcela: string;
  comprovante_url: string | null;
  created_at: string;
}

export default function ControlePagamentos() {
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [consultor, setConsultor] = useState('');
  const [valor, setValor] = useState('');
  const [dataPagamento, setDataPagamento] = useState('');
  const [parcela, setParcela] = useState('');
  const [comprovante, setComprovante] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [pagamentoEditando, setPagamentoEditando] = useState<Pagamento | null>(null);
  const [filtroConsultor, setFiltroConsultor] = useState('');
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');

  const fetchPagamentos = async () => {
    const { data, error } = await supabase
      .from('pagamentos')
      .select('*')
      .order('data_pagamento', { ascending: false });
    
    if (error) {
      toast.error('Erro ao carregar pagamentos');
    } else {
      setPagamentos(data || []);
    }
  };

  useEffect(() => {
    fetchPagamentos();
  }, []);

  const pagamentosFiltrados = pagamentos.filter(p => {
    const matchConsultor = p.consultor.toLowerCase().includes(filtroConsultor.toLowerCase());
    const dataPagamento = new Date(p.data_pagamento);
    const matchData = (!filtroDataInicio || dataPagamento >= new Date(filtroDataInicio)) &&
                      (!filtroDataFim || dataPagamento <= new Date(filtroDataFim));
    return matchConsultor && matchData;
  });

  const deletePagamento = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este registro?')) return;
    const { error } = await supabase.from('pagamentos').delete().eq('id', id);
    if (error) toast.error('Erro ao excluir');
    else {
      toast.success('Registro excluído');
      fetchPagamentos();
    }
  };

  const registrarPagamento = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let comprovante_url = pagamentoEditando?.comprovante_url || null;

    if (comprovante) {
      const fileExt = comprovante.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { data, error: uploadError } = await supabase.storage
        .from('comprovantes')
        .upload(fileName, comprovante);

      if (uploadError) {
        toast.error('Erro ao fazer upload do comprovante');
        setLoading(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from('comprovantes')
        .getPublicUrl(fileName);
      
      comprovante_url = publicUrlData.publicUrl;
    }

    if (pagamentoEditando) {
      const { error } = await supabase
        .from('pagamentos')
        .update({ 
          consultor, 
          valor: parseFloat(valor.replace(',', '.')), 
          data_pagamento: dataPagamento,
          parcela,
          comprovante_url
        })
        .eq('id', pagamentoEditando.id);
      
      if (error) {
        console.error('Erro Supabase:', error);
        toast.error(`Erro ao editar pagamento: ${error.message}`);
      } else {
        toast.success('Pagamento editado com sucesso!');
        setPagamentoEditando(null);
      }
    } else {
      const { error } = await supabase
        .from('pagamentos')
        .insert([
          { 
            consultor, 
            valor: parseFloat(valor.replace(',', '.')), 
            data_pagamento: dataPagamento,
            parcela,
            comprovante_url
          }
        ]);

      if (error) {
        console.error('Erro Supabase:', error);
        toast.error(`Erro ao registrar pagamento: ${error.message}`);
      } else {
        toast.success('Pagamento registrado com sucesso!');
      }
    }

    setConsultor('');
    setValor('');
    setDataPagamento('');
    setParcela('');
    setComprovante(null);
    fetchPagamentos();
    setLoading(false);
  };

  const iniciarEdicao = (pagamento: Pagamento) => {
    setPagamentoEditando(pagamento);
    setConsultor(pagamento.consultor);
    setValor(pagamento.valor.toString().replace('.', ','));
    setDataPagamento(pagamento.data_pagamento);
    setParcela(pagamento.parcela);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black text-white">Controle de Pagamentos</h1>
        <p className="text-zinc-400">Registre e acompanhe os pagamentos aos consultores.</p>
      </div>

      <form onSubmit={registrarPagamento} className="glass-card p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="label-text">Consultor</label>
            <input 
              type="text" 
              value={consultor}
              onChange={(e) => setConsultor(e.target.value)}
              className="input-field"
              placeholder="Nome do consultor"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="label-text">Valor (R$)</label>
            <input 
              type="text" 
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              className="input-field"
              placeholder="0,00"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="label-text">Data do Pagamento</label>
            <input 
              type="date" 
              value={dataPagamento}
              onChange={(e) => setDataPagamento(e.target.value)}
              className="input-field"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="label-text">Parcela</label>
            <input 
              type="text" 
              value={parcela}
              onChange={(e) => setParcela(e.target.value)}
              className="input-field"
              placeholder="Ex: 1/6"
              required
            />
          </div>
        </div>
        <div className="space-y-1">
          <label className="label-text">Comprovante</label>
          <div className="flex items-center gap-2">
            <input 
              type="file" 
              onChange={(e) => setComprovante(e.target.files?.[0] || null)}
              className="input-field file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90"
            />
          </div>
        </div>
        <button 
          type="submit" 
          disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2 py-3"
        >
          {loading ? 'Processando...' : <><Plus size={18} /> {pagamentoEditando ? 'Salvar Alterações' : 'Registrar Pagamento'}</>}
        </button>
        {pagamentoEditando && (
          <button 
            type="button"
            onClick={() => {
              setPagamentoEditando(null);
              setConsultor('');
              setValor('');
              setDataPagamento('');
              setParcela('');
            }}
            className="w-full text-zinc-500 hover:text-white py-2 text-sm"
          >
            Cancelar edição
          </button>
        )}
      </form>

      <div className="glass-card p-6">
        <h2 className="text-xl font-bold text-white mb-4">Histórico de Pagamentos</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-zinc-500">Consultor</label>
            <input 
              type="text" 
              placeholder="Buscar..."
              value={filtroConsultor}
              onChange={(e) => setFiltroConsultor(e.target.value)}
              className="input-field"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-zinc-500">Data Início</label>
            <input 
              type="date" 
              value={filtroDataInicio}
              onChange={(e) => setFiltroDataInicio(e.target.value)}
              className="input-field"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-zinc-500">Data Fim</label>
            <input 
              type="date" 
              value={filtroDataFim}
              onChange={(e) => setFiltroDataFim(e.target.value)}
              className="input-field"
            />
          </div>
        </div>

        <div className="space-y-2">
          {pagamentosFiltrados.map((p) => (
            <div key={p.id} className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-primary/10 text-primary rounded-lg">
                  <DollarSign size={20} />
                </div>
                <div>
                  <p className="font-bold text-white">{p.consultor}</p>
                  <p className="text-xs text-zinc-500">
                    Data Pagamento: {new Date(p.data_pagamento).toLocaleDateString('pt-BR')} • Parcela: {p.parcela}
                  </p>
                  <p className="text-[10px] text-zinc-600">
                    Registrado em: {new Date(p.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <p className="font-bold text-emerald-500 mr-4">{formatCurrency(p.valor)}</p>
                {p.comprovante_url ? (
                  <a href={p.comprovante_url} target="_blank" rel="noopener noreferrer" className="p-2 bg-zinc-800 rounded-lg text-primary hover:text-white transition-colors">
                    <FileText size={18} />
                  </a>
                ) : (
                  <div className="p-2 bg-zinc-800 rounded-lg text-zinc-600 cursor-not-allowed">
                    <FileText size={18} />
                  </div>
                )}
                <button 
                  onClick={() => iniciarEdicao(p)}
                  className="p-2 text-zinc-600 hover:text-white transition-colors"
                >
                  <User size={18} />
                </button>
                <button 
                  onClick={() => deletePagamento(p.id)}
                  className="p-2 text-zinc-600 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
