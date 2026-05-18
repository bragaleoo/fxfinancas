import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '../lib/supabase';
import { Categoria, TipoParcela } from '../types';
import { 
  Save, 
  Upload, 
  Loader2, 
  CheckCircle2, 
  ArrowLeft,
  FileText,
  User,
  MapPin,
  Calendar,
  Briefcase,
  DollarSign
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const currencyToNumber = (val: any) => {
  if (typeof val === 'number') return val;
  if (typeof val !== 'string') return 0;
  const digits = val.replace(/\D/g, '');
  if (!digits) return 0;
  return parseInt(digits) / 100;
};

const propostaSchema = z.object({
  categoria: z.enum(['Automóvel', 'Imóvel', 'Serviços', 'Caminhão', 'Moto']),
  tipo_parcela: z.enum(['Cheia', 'Linear', 'Reduzida']),
  grupo: z.string().min(1, 'Obrigatório'),
  proposta: z.string().min(1, 'Obrigatório'),
  cota: z.string().min(1, 'Obrigatório'),
  valor_consorcio: z.preprocess(currencyToNumber, z.number().min(0.01, 'Valor inválido')),
  prazo_contratado: z.number().min(1, 'Prazo inválido'),
  tem_campanha: z.boolean(),
  data_fechamento: z.string().min(1, 'Obrigatório'),
  cidade: z.string().min(1, 'Obrigatório'),
  consultor_nome: z.string().min(1, 'Obrigatório'),
  valor_parcela: z.preprocess(currencyToNumber, z.number().min(0.01, 'Valor inválido')),
  cliente_nome: z.string().min(3, 'Nome muito curto'),
  cliente_cpf: z.string().min(11, 'CPF inválido'),
  cliente_telefone: z.string().min(10, 'Telefone inválido'),
});

type PropostaFormData = z.infer<typeof propostaSchema>;

const formatCPF = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

const formatPhone = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{4})\d+?$/, '$1');
};

const formatCurrency = (value: string) => {
  const digits = value.replace(/\D/g, '');
  const number = parseInt(digits) / 100;
  if (isNaN(number)) return '';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(number);
};

export default function NovaProposta() {
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<{ [key: number]: File | null }>({
    1: null, 2: null, 3: null, 4: null
  });
  const [installmentStatus, setInstallmentStatus] = useState<{ [key: number]: 'pendente' | 'paga' | 'inadimplente' }>({
    1: 'pendente', 2: 'pendente', 3: 'pendente', 4: 'pendente'
  });
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<PropostaFormData>({
    resolver: zodResolver(propostaSchema),
    defaultValues: {
      categoria: 'Automóvel',
      tipo_parcela: 'Cheia',
      consultor_nome: 'Kauã',
      tem_campanha: false,
      data_fechamento: new Date().toISOString().split('T')[0]
    }
  });

  const handleFileChange = (num: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFiles(prev => ({ ...prev, [num]: e.target.files![0] }));
    }
  };

  const onSubmit: SubmitHandler<PropostaFormData> = async (data) => {
    setLoading(true);
    try {
      // 1. Insert Proposta
      const { data: propostaData, error: propostaError } = await supabase
        .from('propostas')
        .insert([{ ...data, status: 'pendente' }])
        .select()
        .single();

      if (propostaError) {
        throw new Error('Erro ao criar proposta: ' + propostaError.message);
      }

      // 2. Upload Files and Insert Comprovantes
      try {
        const installmentNums = [1, 2, 3, 4];
        const uploadPromises = installmentNums.map(async (num) => {
          const file = files[num];
          const status = installmentStatus[num];
          
          if (!file && status === 'pendente') return null;

          let publicUrl = '';
          if (file) {
            const typedFile = file as File;
            const fileExt = typedFile.name.split('.').pop();
            const fileName = `${propostaData.id}_parcela_${num}_${Math.random()}.${fileExt}`;
            const filePath = `parcelas/${fileName}`;

            const { error: uploadError } = await supabase.storage
              .from('comprovantes')
              .upload(filePath, typedFile);

            if (uploadError) {
              console.error('Erro no upload do arquivo:', uploadError);
            } else {
              const { data: { publicUrl: url } } = supabase.storage
                .from('comprovantes')
                .getPublicUrl(filePath);
              publicUrl = url;
            }
          }

          return supabase
            .from('comprovantes_parcelas')
            .insert([{
              proposta_id: propostaData.id,
              numero_parcela: num,
              url_arquivo: publicUrl,
              status: status
            }]);
        });

        await Promise.all(uploadPromises);
      } catch (fileError) {
        console.error('Erro ao processar arquivos:', fileError);
        toast.warning('Proposta salva, mas houve um problema com os comprovantes.');
      }

      toast.success('Proposta cadastrada com sucesso!');
      navigate('/propostas');
    } catch (error: any) {
      toast.error(error.message || 'Erro inesperado ao salvar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/propostas')}
            className="p-2 hover:bg-zinc-900 rounded-xl text-zinc-400 hover:text-white transition-all border border-transparent hover:border-zinc-800"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Nova Proposta</h1>
            <p className="text-zinc-400">Preencha os dados para cadastrar uma nova venda.</p>
          </div>
        </div>
        <img 
          src="https://res.cloudinary.com/dvybpkimh/image/upload/v1774183289/Design_sem_nome_2_nhn64b.png" 
          alt="Logo" 
          className="h-16 w-auto object-contain hidden md:block"
          referrerPolicy="no-referrer"
        />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Form Sections */}
          <div className="lg:col-span-2 space-y-8">
            {/* Informações da Venda */}
            <section className="glass-card p-6 space-y-6">
              <div className="flex items-center gap-2 text-primary">
                <Briefcase size={18} />
                <h3 className="text-lg font-semibold text-white">Informações da Venda</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="label-text">Categoria</label>
                  <select {...register('categoria')} className="input-field">
                    <option value="Automóvel">Automóvel</option>
                    <option value="Imóvel">Imóvel</option>
                    <option value="Serviços">Serviços</option>
                    <option value="Caminhão">Caminhão</option>
                    <option value="Moto">Moto</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="label-text">Tipo Parcela</label>
                  <select {...register('tipo_parcela')} className="input-field">
                    <option value="Cheia">Cheia</option>
                    <option value="Linear">Linear</option>
                    <option value="Reduzida">Reduzida</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="label-text">Consultor</label>
                  <select {...register('consultor_nome')} className="input-field">
                    <option value="Kauã">Kauã</option>
                    <option value="Luan">Luan</option>
                    <option value="Osvaldo Pinheiro">Osvaldo Pinheiro</option>
                    <option value="Keise Pereira">Keise Pereira</option>
                    <option value="Manasses Hezrom">Manasses Hezrom</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="label-text">Grupo</label>
                  <input {...register('grupo')} className="input-field" placeholder="Ex: 1020" />
                  {errors.grupo && <span className="text-xs text-red-500 mt-1">{errors.grupo.message}</span>}
                </div>

                <div className="space-y-1">
                  <label className="label-text">Proposta (Nº Único)</label>
                  <input {...register('proposta')} className="input-field" placeholder="Nº da Proposta" />
                  {errors.proposta && <span className="text-xs text-red-500 mt-1">{errors.proposta.message}</span>}
                </div>

                <div className="space-y-1">
                  <label className="label-text">Cota</label>
                  <input {...register('cota')} className="input-field" placeholder="Nº da Cota" />
                  {errors.cota && <span className="text-xs text-red-500 mt-1">{errors.cota.message}</span>}
                </div>

                <div className="space-y-1">
                  <label className="label-text">Valor do Crédito (R$)</label>
                  <div className="relative group">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-primary transition-colors" size={18} />
                    <input 
                      type="text" 
                      className="input-field pl-10 font-mono" 
                      placeholder="R$ 0,00" 
                      {...register('valor_consorcio', { 
                        required: 'Obrigatório',
                        onChange: (e) => {
                          const formatted = formatCurrency(e.target.value);
                          setValue('valor_consorcio', formatted as any);
                        }
                      })} 
                    />
                  </div>
                  {errors.valor_consorcio && <span className="text-xs text-red-500 mt-1">{errors.valor_consorcio.message}</span>}
                </div>

                <div className="space-y-1">
                  <label className="label-text">Valor da Parcela (R$)</label>
                  <div className="relative group">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-primary transition-colors" size={18} />
                    <input 
                      type="text" 
                      className="input-field pl-10 font-mono" 
                      placeholder="R$ 0,00" 
                      {...register('valor_parcela', { 
                        required: 'Obrigatório',
                        onChange: (e) => {
                          const formatted = formatCurrency(e.target.value);
                          setValue('valor_parcela', formatted as any);
                        }
                      })} 
                    />
                  </div>
                  {errors.valor_parcela && <span className="text-xs text-red-500 mt-1">{errors.valor_parcela.message}</span>}
                </div>

                <div className="space-y-1">
                  <label className="label-text">Prazo (Meses)</label>
                  <input 
                    type="number" 
                    {...register('prazo_contratado', { valueAsNumber: true })} 
                    className="input-field" 
                    placeholder="Ex: 180" 
                  />
                  {errors.prazo_contratado && <span className="text-xs text-red-500 mt-1">{errors.prazo_contratado.message}</span>}
                </div>

                <div className="space-y-1">
                  <label className="label-text">Data</label>
                  <input type="date" {...register('data_fechamento')} className="input-field" />
                </div>

                <div className="space-y-1">
                  <label className="label-text">Cidade</label>
                  <input {...register('cidade')} className="input-field" placeholder="Ex: São Paulo" />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" {...register('tem_campanha')} className="sr-only peer" />
                  <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  <span className="ms-3 text-sm font-medium text-zinc-400">Campanha Ativa</span>
                </label>
              </div>
            </section>

            {/* Dados do Cliente */}
            <section className="glass-card p-6 space-y-6">
              <div className="flex items-center gap-2 text-primary">
                <User size={18} />
                <h3 className="text-lg font-semibold text-white">Dados do Cliente</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 space-y-1">
                  <label className="label-text">Nome Completo</label>
                  <input {...register('cliente_nome')} className="input-field" placeholder="Nome do cliente" />
                  {errors.cliente_nome && <span className="text-xs text-red-500 mt-1">{errors.cliente_nome.message}</span>}
                </div>

                <div className="space-y-1">
                  <label className="label-text">CPF</label>
                  <input
                    className="input-field"
                    placeholder="000.000.000-00"
                    {...register('cliente_cpf', {
                      onChange: (e) => {
                        const formatted = formatCPF(e.target.value);
                        setValue('cliente_cpf', formatted);
                      }
                    })}
                  />
                  {errors.cliente_cpf && <span className="text-xs text-red-500 mt-1">{errors.cliente_cpf.message}</span>}
                </div>

                <div className="space-y-1">
                  <label className="label-text">Telefone</label>
                  <input
                    className="input-field"
                    placeholder="(00) 00000-0000"
                    {...register('cliente_telefone', {
                      onChange: (e) => {
                        const formatted = formatPhone(e.target.value);
                        setValue('cliente_telefone', formatted);
                      }
                    })}
                  />
                  {errors.cliente_telefone && <span className="text-xs text-red-500 mt-1">{errors.cliente_telefone.message}</span>}
                </div>
              </div>
            </section>
          </div>

          {/* Right Column: Upload Section */}
          <div className="space-y-8">
            <section className="glass-card p-6 space-y-6 sticky top-8">
              <div className="flex items-center gap-2 text-primary">
                <Upload size={18} />
                <h3 className="text-lg font-semibold text-white">Comprovantes</h3>
              </div>
              
              <p className="text-xs text-zinc-500">Faça o upload dos comprovantes das parcelas 1 a 4.</p>

              <div className="space-y-4">
                {[1, 2, 3, 4].map((num) => (
                  <div key={num} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="label-text">Parcela {num}</label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setInstallmentStatus(prev => ({ 
                            ...prev, 
                            [num]: prev[num] === 'pendente' ? 'paga' : prev[num] === 'paga' ? 'inadimplente' : 'pendente' 
                          }))}
                          className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all border ${
                            installmentStatus[num] === 'paga' 
                              ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' 
                              : installmentStatus[num] === 'inadimplente'
                              ? 'bg-red-500/10 border-red-500 text-red-500'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                          }`}
                        >
                          {installmentStatus[num] === 'paga' ? 'Paga' : installmentStatus[num] === 'inadimplente' ? 'Inadimplente' : 'Pendente'}
                        </button>
                      </div>
                    </div>
                    <div className="relative group">
                      <div className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center transition-all ${files[num] ? 'border-primary bg-primary/5' : 'border-zinc-800 hover:border-zinc-700'}`}>
                        <input 
                          type="file" 
                          onChange={(e) => handleFileChange(num, e)}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          accept="image/*,application/pdf"
                        />
                        {files[num] ? (
                          <div className="text-center">
                            <CheckCircle2 className="mx-auto mb-1 text-primary" size={20} />
                            <span className="text-[10px] text-zinc-300 truncate max-w-[150px] block">{files[num]?.name}</span>
                          </div>
                        ) : (
                          <div className="text-center">
                            <Upload className="mx-auto mb-1 text-zinc-500 group-hover:text-zinc-400" size={20} />
                            <span className="text-[10px] text-zinc-500 uppercase font-bold">Upload Comprovante</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-4"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                  {loading ? 'Salvando...' : 'Cadastrar Proposta'}
                </button>
              </div>
            </section>
          </div>
        </div>
      </form>
    </div>
  );
}
