import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  MapPin, 
  DollarSign, 
  Clock, 
  History, 
  FileText, 
  MessageSquare,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Proposta, Comprovante } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

export default function DetalheProposta() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [proposta, setProposta] = useState<Proposta | null>(null);
  const [comprovantes, setComprovantes] = useState<Comprovante[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dados' | 'historico' | 'observacoes'>('dados');

  useEffect(() => {
    if (id) fetchDetails();
  }, [id]);

  async function fetchDetails() {
    setLoading(true);
    try {
      const { data: pData, error: pError } = await supabase
        .from('propostas')
        .select('*, comprovantes_parcelas(*)')
        .eq('id', id)
        .single();

      if (pError) throw pError;
      setProposta(pData as Proposta);
      setComprovantes(pData.comprovantes_parcelas || []);
    } catch (error) {
      toast.error('Erro ao carregar detalhes da proposta');
      navigate('/propostas');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  if (!proposta) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/propostas')}
            className="p-2 hover:bg-zinc-900 rounded-xl text-zinc-400 hover:text-white transition-all border border-transparent hover:border-zinc-800"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{proposta.cliente_nome}</h1>
              <span className={`badge-status ${
                proposta.status === 'aprovado' ? 'bg-emerald-500/10 text-emerald-500' :
                proposta.status === 'rejeitado' ? 'bg-red-500/10 text-red-500' :
                'bg-amber-500/10 text-amber-500'
              }`}>
                {proposta.status}
              </span>
            </div>
            <p className="text-zinc-400">Proposta Nº {proposta.proposta} • Criada em {format(new Date(proposta.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-800">
        {[
          { id: 'dados', label: 'Dados da Proposta', icon: FileText },
          { id: 'historico', label: 'Histórico', icon: History },
          { id: 'observacoes', label: 'Observações', icon: MessageSquare },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all border-b-2 ${
              activeTab === tab.id 
                ? 'border-primary text-primary bg-primary/5' 
                : 'border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {activeTab === 'dados' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
              {/* Motivo de Rejeição */}
              {proposta.status === 'rejeitado' && proposta.motivo && (
                <div className="p-6 bg-red-500/5 border border-red-500/20 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-red-500">
                    <AlertCircle size={20} />
                    <h3 className="font-bold">Motivo da Rejeição</h3>
                  </div>
                  <p className="text-zinc-300 text-sm italic leading-relaxed">
                    "{proposta.motivo}"
                  </p>
                </div>
              )}

              {/* Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoCard icon={DollarSign} label="Valor do Crédito" value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(proposta.valor_consorcio)} />
                <InfoCard icon={Clock} label="Prazo" value={`${proposta.prazo_contratado} Meses`} />
                <InfoCard icon={MapPin} label="Cidade" value={proposta.cidade} />
                <InfoCard icon={Calendar} label="Data da Venda" value={format(new Date(proposta.data_fechamento), 'dd/MM/yyyy')} />
                <InfoCard icon={User} label="Consultor" value={proposta.consultor_nome} />
                <InfoCard icon={AlertCircle} label="Categoria" value={proposta.categoria} />
              </div>

              {/* Comprovantes Section */}
              <div className="glass-card p-6 space-y-6">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <ExternalLink size={18} className="text-primary" />
                  Comprovantes de Parcelas
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map(num => {
                    const comp = comprovantes.find(c => c.numero_parcela === num);
                    return (
                      <div key={num} className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${comp ? 'bg-primary/10 text-primary' : 'bg-zinc-800 text-zinc-500'} ${comp?.status === 'paga' ? 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-zinc-950' : comp?.status === 'inadimplente' ? 'ring-2 ring-red-500 ring-offset-2 ring-offset-zinc-950' : ''}`}>
                            {num}
                          </div>
                          <div>
                            <p className="text-sm font-medium flex items-center gap-2">
                              Parcela {num}
                              {comp?.status === 'paga' && (
                                <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded-full font-bold uppercase">Paga</span>
                              )}
                              {comp?.status === 'inadimplente' && (
                                <span className="text-[10px] bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded-full font-bold uppercase">Inadimplente</span>
                              )}
                              {(!comp || comp?.status === 'pendente') && (
                                <span className="text-[10px] bg-zinc-500/10 text-zinc-500 px-1.5 py-0.5 rounded-full font-bold uppercase">Pendente</span>
                              )}
                            </p>
                            <p className="text-xs text-zinc-500">{comp ? 'Arquivo disponível' : 'Aguardando upload'}</p>
                          </div>
                        </div>
                        {comp && (
                          <a 
                            href={comp.url_arquivo} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-all"
                          >
                            <ExternalLink size={16} />
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'historico' && (
            <div className="glass-card p-8 space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
              <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:h-full before:w-0.5 before:bg-zinc-800">
                <TimelineItem 
                  icon={CheckCircle2} 
                  color="text-emerald-500" 
                  title="Proposta Criada" 
                  date={format(new Date(proposta.created_at), "dd/MM/yyyy 'às' HH:mm")} 
                  description="A proposta foi registrada no sistema com status pendente."
                />
                <TimelineItem 
                  icon={Clock} 
                  color="text-amber-500" 
                  title="Aguardando Análise" 
                  date={format(new Date(proposta.created_at), "dd/MM/yyyy 'às' HH:mm")} 
                  description="A proposta foi enviada para a fila de análise de crédito."
                />
              </div>
            </div>
          )}

          {activeTab === 'observacoes' && (
            <div className="glass-card p-6 space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
              <textarea 
                className="input-field min-h-[200px] resize-none" 
                placeholder="Adicione observações internas sobre esta proposta..."
              />
              <div className="flex justify-end">
                <button className="btn-primary">Salvar Observações</button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="glass-card p-6 space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Dados do Cliente</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-zinc-500 uppercase font-medium">CPF</p>
                <p className="text-sm font-mono text-zinc-200">{proposta.cliente_cpf}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase font-medium">Telefone</p>
                <p className="text-sm text-zinc-200">{proposta.cliente_telefone}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase font-medium">Cidade</p>
                <p className="text-sm text-zinc-200">{proposta.cidade}</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Resumo Financeiro</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-400">Valor Total</span>
                <span className="text-sm font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(proposta.valor_consorcio)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-400">Parcelas</span>
                <span className="text-sm font-bold">{proposta.prazo_contratado}x</span>
              </div>
              <div className="pt-4 border-t border-zinc-800 flex justify-between items-center">
                <span className="text-sm text-zinc-400">Tipo</span>
                <span className="text-xs font-bold uppercase bg-zinc-800 px-2 py-1 rounded">{proposta.tipo_parcela}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ icon: Icon, label, value }: any) {
  return (
    <div className="glass-card p-4 flex items-center gap-4">
      <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800 text-primary">
        <Icon size={18} />
      </div>
      <div>
        <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">{label}</p>
        <p className="text-sm font-semibold text-zinc-100">{value}</p>
      </div>
    </div>
  );
}

function TimelineItem({ icon: Icon, color, title, date, description }: any) {
  return (
    <div className="relative pl-12">
      <div className={`absolute left-0 p-2 bg-zinc-950 border border-zinc-800 rounded-full z-10 ${color}`}>
        <Icon size={16} />
      </div>
      <div>
        <div className="flex items-center gap-3">
          <h4 className="text-sm font-bold text-zinc-100">{title}</h4>
          <span className="text-[10px] text-zinc-500 font-medium">{date}</span>
        </div>
        <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
