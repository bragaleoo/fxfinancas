import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calculator, 
  FileText, 
  Download, 
  CheckCircle2, 
  Info, 
  DollarSign,
  User,
  Briefcase,
  Gift,
  Plus,
  Trash2,
  TrendingUp,
  PieChart,
  Target,
  ChevronRight
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';

const COMISSAO_MAP: Record<'Sênior' | 'Elite' | 'Sellect', number> = {
  'Sênior': 0.7,
  'Elite': 0.9,
  'Sellect': 1.2,
};

const META_MAP: Record<'Sênior' | 'Elite' | 'Sellect', number> = {
  'Sênior': 200000,
  'Elite': 350000,
  'Sellect': 500000,
};

interface PropostaCalculo {
  id: string;
  categoria: 'Imóvel' | 'Automóvel' | 'Serviços' | 'Outros';
  valor_credito: number;
  status: 'pendente' | 'aprovado';
  contemplado: boolean;
  valor_contemplacao: number;
  tipo_parcela: 'linear' | 'reduzida';
  campanha: boolean;
}

export default function Calculadora() {
  const [propostas, setPropostas] = useState<PropostaCalculo[]>([
    {
      id: Math.random().toString(36).substr(2, 9),
      categoria: 'Imóvel',
      valor_credito: 0,
      status: 'pendente',
      contemplado: false,
      valor_contemplacao: 0,
      tipo_parcela: 'linear',
      campanha: false
    }
  ]);
  const [categoriaConsultor, setCategoriaConsultor] = useState<'Sênior' | 'Elite' | 'Sellect'>('Sênior');
  const [consultor, setConsultor] = useState('Kauã');
  const [cliente, setCliente] = useState('');
  const [metaMensal, setMetaMensal] = useState(200000);
  const [bonificacaoSemanal, setBonificacaoSemanal] = useState(0);

  useEffect(() => {
    setMetaMensal(META_MAP[categoriaConsultor]);
  }, [categoriaConsultor]);

  const addProposta = () => {
    setPropostas([
      ...propostas,
      {
        id: Math.random().toString(36).substr(2, 9),
        categoria: 'Imóvel',
        valor_credito: 0,
        status: 'pendente',
        contemplado: false,
        valor_contemplacao: 0,
        tipo_parcela: 'linear',
        campanha: false
      }
    ]);
    toast.success('Nova proposta adicionada');
  };

  const removeProposta = (id: string) => {
    if (propostas.length === 1) {
      toast.error('É necessário ter pelo menos uma proposta');
      return;
    }
    setPropostas(propostas.filter(p => p.id !== id));
    toast.info('Proposta removida');
  };

  const updateProposta = (id: string, field: keyof PropostaCalculo, value: any) => {
    setPropostas(propostas.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const resumo = useMemo(() => {
    let totalComissao = 0;
    let totalBonus = 0;
    let totalCredito = 0;
    let aprovados = 0;
    const categorias: Record<string, number> = {};
    const parcelasMap: Record<number, number> = { 1: 0, 4: 0, 6: 0 };

    // Taxa definida pela categoria do consultor
    const basePercent = COMISSAO_MAP[categoriaConsultor];

    propostas.forEach(p => {
      let comissaoIndividual = (p.valor_credito * basePercent) / 100;

      if (p.tipo_parcela === 'reduzida') {
        comissaoIndividual *= 0.65;
      }

      if (p.campanha) {
        comissaoIndividual *= 0.5;
      }

      totalComissao += comissaoIndividual;
      totalCredito += p.valor_credito;

      if (p.status === 'aprovado') aprovados++;
      categorias[p.categoria] = (categorias[p.categoria] || 0) + 1;

      // Bônus: +0,3% sobre o valor contemplado
      if (p.contemplado && p.valor_contemplacao > 0) {
        const bonus = p.valor_contemplacao * 0.003;
        totalBonus += bonus;
      }

      // Split: 4/7 na 1ª parcela + 3/7 na 2ª parcela
      const totalIndividual = comissaoIndividual + (p.contemplado ? p.valor_contemplacao * 0.003 : 0);
      const p1 = totalIndividual * (4 / 7);
      const p2 = totalIndividual * (3 / 7);

      parcelasMap[1] += p1;
      if (p.categoria === 'Imóvel') {
        parcelasMap[6] += p2;
      } else {
        parcelasMap[4] += p2;
      }
    });

    // Comissão só é paga se atingir a meta da categoria
    const metaCategoria = META_MAP[categoriaConsultor];
    const comissaoFinal = totalCredito >= metaCategoria ? totalComissao : 0;

    return {
      totalComissao: comissaoFinal,
      totalBonus,
      totalGeral: comissaoFinal + totalBonus + bonificacaoSemanal,
      totalCredito,
      aprovados,
      totalPropostas: propostas.length,
      ticketMedio: propostas.length > 0 ? totalCredito / propostas.length : 0,
      categorias,
      parcelas: Object.entries(parcelasMap)
        .filter(([_, val]) => val > 0)
        .map(([num, val]) => ({ numero: parseInt(num), valor: val }))
        .sort((a, b) => a.numero - b.numero)
    };
  }, [propostas, bonificacaoSemanal, categoriaConsultor]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const parseCurrency = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    return numericValue ? parseFloat(numericValue) / 100 : 0;
  };

  const generatePDF = async () => {
    try {
      const doc = new jsPDF();
      const primaryColor: [number, number, number] = [255, 122, 41]; // #FF7A29

      // Header
      doc.setFillColor(9, 9, 11);
      doc.rect(0, 0, 210, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.text('FX FINANÇAS', 20, 25);
      doc.setFontSize(10);
      doc.text('SIMULAÇÃO DE REMUNERAÇÃO VARIÁVEL V2 PRO', 20, 32);

      // Add Logo to Header (Right Side)
      try {
        const logoUrl = "https://res.cloudinary.com/dvybpkimh/image/upload/v1774183289/Design_sem_nome_2_nhn64b.png";
        doc.addImage(logoUrl, 'PNG', 150, 5, 40, 30);
      } catch (e) {
        console.warn("Could not add logo to PDF", e);
      }

      // Consultant Info
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('RESUMO DO CONSULTOR', 20, 55);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Consultor: ${consultor}`, 20, 65);
      doc.text(`Cliente: ${cliente || 'Não informado'}`, 20, 72);
      doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 20, 79);

      // Summary Table
      autoTable(doc, {
        startY: 85,
        head: [['Métrica', 'Valor']],
        body: [
          ['Total de Propostas', resumo.totalPropostas.toString()],
          ['Total Aprovado', resumo.aprovados.toString()],
          ['Total em Crédito', new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(resumo.totalCredito)],
          ['Comissão Base', new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(resumo.totalComissao)],
          ['Bônus Contemplação', new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(resumo.totalBonus)],
          ['Bonificação Semanal', new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(bonificacaoSemanal)],
          ['REMUNERAÇÃO TOTAL', new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(resumo.totalGeral)],
        ],
        headStyles: { fillColor: primaryColor },
        theme: 'striped',
      });

      // Proposals List
      const proposalsY = (doc as any).lastAutoTable.finalY + 15;
      doc.setFont('helvetica', 'bold');
      doc.text('DETALHAMENTO DAS PROPOSTAS', 20, proposalsY);

      autoTable(doc, {
        startY: proposalsY + 5,
        head: [['Categoria', 'Crédito', 'Status', 'Contemplado', 'Comissão + Bônus']],
        body: propostas.map(p => {
          const basePercent = COMISSAO_MAP[categoriaConsultor];
          let com = (p.valor_credito * basePercent) / 100;

          if (p.tipo_parcela === 'reduzida') com *= 0.65;
          if (p.campanha) com *= 0.5;

          const bon = p.contemplado ? p.valor_contemplacao * 0.003 : 0;
          return [
            p.categoria,
            new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.valor_credito),
            p.status.toUpperCase(),
            p.contemplado ? 'SIM' : 'NÃO',
            new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(com + bon)
          ];
        }),
        headStyles: { fillColor: [40, 40, 40] },
      });

      // Payment Schedule
      const scheduleY = (doc as any).lastAutoTable.finalY + 15;
      doc.setFont('helvetica', 'bold');
      doc.text('CRONOGRAMA AGREGADO DE RECEBIMENTO', 20, scheduleY);

      autoTable(doc, {
        startY: scheduleY + 5,
        head: [['Parcela', 'Valor Total']],
        body: resumo.parcelas.map(p => [
          `Parcela ${p.numero}`,
          new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.valor)
        ]),
        headStyles: { fillColor: [60, 60, 60] },
      });

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text('Este documento é uma simulação profissional gerada pelo sistema FX Finanças.', 20, 280);

      doc.save(`simulacao_v2_pro_${consultor}_${Date.now()}.pdf`);
      toast.success('PDF V2 Pro gerado com sucesso!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao gerar PDF');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <Target size={16} />
            <span className="text-xs font-bold uppercase tracking-widest">Simulador Profissional V2 Pro</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white">Calculadora de Remuneração Variável</h1>
          <p className="text-zinc-400">Gestão de múltiplas propostas e projeção de ganhos reais.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={generatePDF}
            className="btn-primary flex items-center gap-2 px-6 py-3"
          >
            <Download size={18} />
            Exportar PDF Pro
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Left Column: Proposals List */}
        <div className="xl:col-span-8 space-y-6">
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="text-primary" size={20} />
                <h3 className="text-xl font-bold text-white">Lista de Propostas</h3>
              </div>
              <button 
                onClick={addProposta}
                className="flex items-center gap-2 text-sm font-bold text-primary hover:text-primary/80 transition-colors"
              >
                <Plus size={18} />
                Adicionar Proposta
              </button>
            </div>

            <div className="space-y-4">
              {propostas.map((p, index) => (
                <div key={p.id} className="glass-card p-6 relative group animate-in zoom-in-95 duration-300">
                  <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-12 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="flex flex-col lg:flex-row gap-6">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-zinc-500">Categoria</label>
                        <select 
                          value={p.categoria} 
                          onChange={(e) => updateProposta(p.id, 'categoria', e.target.value)}
                          className="input-field py-2 text-sm"
                        >
                          <option value="Imóvel">Imóvel</option>
                          <option value="Automóvel">Automóvel</option>
                          <option value="Serviços">Serviços</option>
                          <option value="Outros">Outros</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-zinc-500">Valor do Crédito</label>
                        <div className="relative">
                          <input 
                            type="text" 
                            value={formatCurrency(p.valor_credito)} 
                            onChange={(e) => updateProposta(p.id, 'valor_credito', parseCurrency(e.target.value))}
                            className="input-field py-2 px-4 text-sm font-mono" 
                            placeholder="R$ 0,00"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-zinc-500">Tipo de Parcela</label>
                        <select 
                          value={p.tipo_parcela} 
                          onChange={(e) => updateProposta(p.id, 'tipo_parcela', e.target.value)}
                          className="input-field py-2 text-sm"
                        >
                          <option value="linear">Linear</option>
                          <option value="reduzida">Reduzida (-35% comissão)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-zinc-500">Campanha</label>
                        <div className="flex items-center h-10">
                          <label className="flex items-center gap-2 cursor-pointer group/check">
                            <input 
                              type="checkbox" 
                              checked={p.campanha} 
                              onChange={(e) => updateProposta(p.id, 'campanha', e.target.checked)}
                              className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-primary focus:ring-primary focus:ring-offset-zinc-900"
                            />
                            <span className="text-xs font-medium text-zinc-400 group-hover/check:text-zinc-200 transition-colors">
                              Proposta de Campanha (-50%)
                            </span>
                          </label>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-zinc-500">Status</label>
                        <select 
                          value={p.status} 
                          onChange={(e) => updateProposta(p.id, 'status', e.target.value)}
                          className="input-field py-2 text-sm"
                        >
                          <option value="pendente">Pendente</option>
                          <option value="aprovado">Aprovado</option>
                        </select>
                      </div>

                      <div className="lg:col-span-2 flex items-center gap-6 pt-2">
                        <label className="flex items-center gap-2 cursor-pointer group/check">
                          <input 
                            type="checkbox" 
                            checked={p.contemplado} 
                            onChange={(e) => updateProposta(p.id, 'contemplado', e.target.checked)}
                            className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-primary focus:ring-primary focus:ring-offset-zinc-900"
                          />
                          <span className="text-xs font-medium text-zinc-400 group-hover/check:text-zinc-200 transition-colors flex items-center gap-1">
                            <Gift size={12} className={p.contemplado ? "text-primary" : "text-zinc-600"} />
                            Contemplado?
                          </span>
                        </label>

                        {p.contemplado && (
                          <div className="flex-1 animate-in slide-in-from-left-2 duration-300">
                            <div className="relative">
                              <input 
                                type="text" 
                                value={formatCurrency(p.valor_contemplacao)} 
                                onChange={(e) => updateProposta(p.id, 'valor_contemplacao', parseCurrency(e.target.value))}
                                className="w-full bg-primary/5 border border-primary/20 rounded-lg py-1.5 px-4 text-xs text-primary placeholder:text-primary/30 focus:outline-none focus:border-primary/40" 
                                placeholder="Valor contemplado"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-end border-t lg:border-t-0 lg:border-l border-zinc-800 pt-4 lg:pt-0 lg:pl-6">
                      <button 
                        onClick={() => removeProposta(p.id)}
                        className="p-2 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                        title="Remover proposta"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Consultant Settings */}
          <section className="glass-card p-6">
            <div className="flex items-center gap-2 text-zinc-400 mb-6">
              <User size={18} />
              <h3 className="text-lg font-bold text-white">Dados da Simulação</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-1">
                <label className="label-text">Categoria do Consultor</label>
                <select
                  value={categoriaConsultor}
                  onChange={(e) => setCategoriaConsultor(e.target.value as 'Sênior' | 'Elite' | 'Sellect')}
                  className="input-field"
                >
                  <option value="Sênior">FX Sênior — 0,7% | Meta 200k</option>
                  <option value="Elite">FX Elite — 0,9% | Meta 350k</option>
                  <option value="Sellect">FX Sellect — 1,2% | Meta 500k</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="label-text">Consultor Responsável</label>
                <select 
                  value={consultor} 
                  onChange={(e) => setConsultor(e.target.value)}
                  className="input-field"
                >
                  <option value="Kauã">Kauã</option>
                  <option value="Luan">Luan</option>
                  <option value="Osvaldo Pinheiro">Osvaldo Pinheiro</option>
                  <option value="Keise Pereira">Keise Pereira</option>
                  <option value="Manasses Hezrom">Manasses Hezrom</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="label-text">Nome do Cliente</label>
                <input 
                  type="text" 
                  value={cliente} 
                  onChange={(e) => setCliente(e.target.value)}
                  className="input-field" 
                  placeholder="Opcional"
                />
              </div>
              <div className="space-y-1">
                <label className="label-text">Meta de Comissão (R$)</label>
                <input 
                  type="number" 
                  value={metaMensal} 
                  onChange={(e) => setMetaMensal(parseFloat(e.target.value))}
                  className="input-field font-mono" 
                />
              </div>
              <div className="space-y-1">
                <label className="label-text">Bonificação Semanal (R$)</label>
                <input 
                  type="text" 
                  value={formatCurrency(bonificacaoSemanal)} 
                  onChange={(e) => setBonificacaoSemanal(parseCurrency(e.target.value))}
                  className="input-field font-mono" 
                />
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Summary & Results */}
        <div className="xl:col-span-4 space-y-6">
          {/* Main Result Card */}
          <section className="glass-card p-6 space-y-6 border-primary/30 bg-primary/5">
            <div className="text-center space-y-2">
              <p className="text-[10px] text-zinc-500 uppercase font-black tracking-[0.2em]">Remuneração Total Estimada</p>
              <h2 className="text-5xl font-black text-primary">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(resumo.totalGeral)}
              </h2>
              <div className="flex items-center justify-center gap-2">
                <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-bold">
                  {(resumo.totalBonus + bonificacaoSemanal) > 0 ? `Inclui ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(resumo.totalBonus + bonificacaoSemanal)} de bônus` : 'Sem bônus ativos'}
                </div>
              </div>
            </div>

            {/* Meta Progress */}
            <div className="space-y-2 pt-4 border-t border-primary/10">
              <div className="flex justify-between text-[10px] font-bold uppercase">
                <span className="text-zinc-500">Progresso da Meta de Vendas</span>
                <span className="text-primary">{Math.min(100, (resumo.totalCredito / metaMensal) * 100).toFixed(1)}%</span>
              </div>
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-1000" 
                  style={{ width: `${Math.min(100, (resumo.totalCredito / metaMensal) * 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-zinc-500 text-center">
                Faltam {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.max(0, metaMensal - resumo.totalCredito))} para a meta de vendas
              </p>
            </div>
          </section>

          {/* Smart Summary */}
          <section className="glass-card p-6 space-y-6">
            <div className="flex items-center gap-2 text-zinc-400">
              <PieChart size={18} />
              <h3 className="text-lg font-bold text-white">Resumo do Consultor</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-zinc-900/50 rounded-xl border border-zinc-800">
                <p className="text-[10px] font-bold text-zinc-500 uppercase">Propostas</p>
                <p className="text-xl font-black text-white">{resumo.totalPropostas}</p>
              </div>
              <div className="p-3 bg-zinc-900/50 rounded-xl border border-zinc-800">
                <p className="text-[10px] font-bold text-zinc-500 uppercase">Aprovadas</p>
                <p className="text-xl font-black text-emerald-500">{resumo.aprovados}</p>
              </div>
              <div className="p-3 bg-zinc-900/50 rounded-xl border border-zinc-800">
                <p className="text-[10px] font-bold text-zinc-500 uppercase">Ticket Médio</p>
                <p className="text-sm font-bold text-white">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(resumo.ticketMedio)}
                </p>
              </div>
              <div className="p-3 bg-zinc-900/50 rounded-xl border border-zinc-800">
                <p className="text-[10px] font-bold text-zinc-500 uppercase">Total Crédito</p>
                <p className="text-sm font-bold text-white">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(resumo.totalCredito)}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-bold text-zinc-500 uppercase">Mix de Categorias</p>
              <div className="space-y-2">
                {Object.entries(resumo.categorias).map(([cat, count]) => (
                  <div key={cat} className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">{cat}</span>
                    <span className="font-bold text-white">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Aggregated Payment Schedule */}
          <section className="glass-card p-6 space-y-4">
            <div className="flex items-center gap-2 text-zinc-400">
              <TrendingUp size={18} />
              <h3 className="text-lg font-bold text-white">Fluxo de Recebimento</h3>
            </div>
            
            <div className="space-y-3">
              {resumo.parcelas.map((p) => (
                <div key={p.numero} className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-xl border border-zinc-800">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center text-xs font-bold text-zinc-400">
                      {p.numero}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-zinc-200">Parcela {p.numero}</p>
                      <p className="text-[10px] text-zinc-500">
                        {p.numero === 1 ? 'Imediato' : p.numero === 4 ? '4º Mês' : '6º Mês'}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-emerald-500">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.valor)}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Rules Info */}
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl flex gap-4">
            <Info className="text-primary shrink-0" size={20} />
            <div className="text-[10px] text-zinc-400 space-y-1">
              <p className="font-bold text-primary uppercase tracking-wider">Regras V2 Pro:</p>
              <p>• Sênior: 200k (0,7%) | Elite: 350k (0,9%) | Sellect: 500k (1,2%)</p>
              <p>• Bônus contemplação: +0,3% sobre o valor contemplado.</p>
              <p>• Prazos: Imóvel (1ª/6ª) | Outros (1ª/4ª).</p>
              <p>• Split: 4/7 na 1ª parcela + 3/7 na 2ª parcela.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
