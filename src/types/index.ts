export type Categoria = 'Automóvel' | 'Imóvel' | 'Serviços' | 'Caminhão' | 'Moto';
export type TipoParcela = 'Cheia' | 'Linear' | 'Reduzida';
export type StatusProposta = 'pendente' | 'aprovado' | 'rejeitado';

export interface Proposta {
  id: string;
  cliente_nome: string;
  cliente_cpf: string;
  cliente_telefone: string;
  categoria: Categoria;
  tipo_parcela: TipoParcela;
  grupo: string;
  proposta: string;
  cota: string;
  valor_consorcio: number;
  prazo_contratado: number;
  tem_campanha: boolean;
  data_fechamento: string;
  cidade: string;
  consultor_nome: string;
  status: StatusProposta;
  valor_parcela: number;
  motivo?: string;
  created_at: string;
  comprovantes_parcelas?: Comprovante[];
}

export type StatusParcela = 'paga' | 'pendente' | 'inadimplente';

export interface Comprovante {
  id: string;
  proposta_id: string;
  numero_parcela: number;
  url_arquivo: string;
  status: StatusParcela;
  data_upload: string;
}

export interface KPIStats {
  totalPropostas: number;
  totalAprovado: number;
  totalPerdido: number;
  taxaConversao: number;
  ticketMedio: number;
}
