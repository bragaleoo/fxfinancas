# FX Finanças: Gestão Financeira & Calculadora de Propostas

Sistema web corporativo voltado para o mercado financeiro e consórcios, otimizando o pipeline comercial desde a submissão de propostas até o acompanhamento de pagamentos.

## 🚀 Funcionalidades Principais

* **Pipeline Comercial**: Controle e acompanhamento visual do status de propostas comerciais de consórcio.
* **Calculadora de Remuneração Variável**: Simulações financeiras internas para taxas de ganho, descontos e comissionamento.
* **Dashboard de Metas**: Gráficos e indicadores de metas da equipe comercial com filtros por período e consultor.
* **Segurança**: Fluxo de autenticação local com níveis de permissão (Administrador / Acesso Padrão).

## 🛠️ Stack Tecnológica

* **Front-end**: React, TypeScript, Vite, TailwindCSS, Lucide Icons, Sonner (Toasts).
* **Roteamento**: React Router DOM.
* **Integração**: Supabase (PostgreSQL).

## ⚙️ Configuração Local

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Configure as variáveis de ambiente baseando-se no arquivo `.env.example`:
   ```bash
   cp .env.example .env
   ```

3. Execute o projeto em desenvolvimento:
   ```bash
   npm run dev
   ```
