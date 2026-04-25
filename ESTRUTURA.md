# 💰 CoupleFinances - Documentação do Projeto

## 📁 Estrutura do Projeto

```
src/
├── App.tsx                 # ⭐ PRINCIPAL - Gerencia navegação e theme global
├── main.tsx               # Entry point da aplicação
├── index.css              # Estilos globais básicos
├── App.css                # Todos os estilos (mobile-first)
│
├── types/
│   └── index.ts           # Tipos TypeScript (Transaction, CategoryType, etc)
│
├── constants/
│   └── categories.ts      # Constantes de categorias, cores e labels
│
├── utils/
│   └── formatters.ts      # Funções utilitárias (formatCurrency, formatDate, etc)
│
├── services/
│   ├── storage.ts         # Persistência em localStorage
│   └── calculations.ts    # Lógica de cálculos financeiros
│
├── context/
│   └── FinancesContext.tsx # Context global + Hooks (useFinances)
│
├── components/            # Componentes reutilizáveis
│   ├── Header.tsx         # Cabeçalho com logo
│   ├── Navigation.tsx      # Barra de navegação mobile (bottom nav)
│   ├── BalanceCard.tsx     # Exibe saldos
│   ├── MonthSelector.tsx   # Seletor de mês
│   ├── TransactionItem.tsx # Item de transação na lista
│   ├── CategoryChart.tsx   # Gráfico pizza (despesas por categoria)
│   ├── TrendChart.tsx      # Gráfico de tendência (linhas/barras)
│   └── index.ts           # Exporta todos os componentes
│
└── pages/                 # Páginas/Telas da aplicação
    ├── Dashboard.tsx      # Resumo financeiro + gráficos
    ├── AddTransaction.tsx # Formulário para adicionar transação
    ├── Transactions.tsx   # Lista de transações com filtros
    ├── Analytics.tsx      # Análises detalhadas
    └── index.ts           # Exporta todas as páginas
```

## 🎯 Fluxo da Aplicação

### App.tsx → Renderiza página ativa
```
App (com FinancesProvider)
 ├─ Dashboard (padrão)
 ├─ AddTransaction
 ├─ Transactions
 ├─ Analytics
 └─ Navigation (muda entre páginas)
```

### FinancesContext → Gerencia estado global
- `transactions[]` - Lista de todas as transações
- `addTransaction()` - Adiciona nova
- `deleteTransaction()` - Deleta
- `editTransaction()` - Edita existente
- `getTransactionsByMonth()` - Filtra por período
- `getMonthlyBalance()` - Calcula balanço
- `getTotalsByCategory()` - Agrupa por categoria

## 💾 Persistência

- **localStorage**: Salva automaticamente em `coupleFinances_transactions`
- Carrega ao iniciar a app
- Sincroniza em tempo real

## 📊 Páginas

### 1. **Dashboard** 📈
- Saldo mensal (receitas, despesas, total)
- Comparação entre pessoas (você vs parceiro)
- Gráfico de despesas por categoria
- Tendência dos últimos 6 meses

### 2. **Adicionar Transação** ➕
- Formulário completo
- Tipo: Receita/Despesa
- Categoria dinâmica por tipo
- Data selecionável
- Pessoa (Eu/Parceiro)
- Notas opcionais
- Mensagem de sucesso

### 3. **Transações** 📋
- Lista com todas as transações
- Filtros: Todas, Receitas, Despesas
- Ordenação por data (recente primeiro)
- Botão de deletar por item
- Indicador visual por tipo/categoria

### 4. **Análises** 📊
- Estatísticas rápidas (cards)
- Comparação detalhada por pessoa
- Gráfico de tendência (linha/barra)
- Gráfico pizza de categorias
- Tabela de detalhamento por categoria

## 🎨 Design

### Mobile-First ✅
- Responsivo para mobile, tablet e desktop
- Bottom navigation (4 abas principais)
- Touch-friendly buttons (min 44x44px)
- Overflow handling otimizado

### Cores
- **Primária**: #3b82f6 (Azul)
- **Sucesso**: #10b981 (Verde - Receitas)
- **Perigo**: #ef4444 (Vermelho - Despesas)
- **Gray Scale**: #6b7280 (Cinza) até #f9fafb (Quase branco)

### Acessibilidade
- ✅ `title` attributes em botões
- ✅ `aria-label` para leitores de tela
- ✅ Contraste WCAG AA
- ✅ Labels associadas em formulários

## 🔄 Fluxo de Dados

```
AddTransaction
    ↓
addTransaction() → Context
    ↓
StorageService.saveTransactions()
    ↓
localStorage
    ↓
Dashboard/Analytics detectam mudança
    ↓
CalculationService calcula novos valores
    ↓
Re-renderização com dados atualizados
```

## 📦 Dependências Principais

- **react**: 19.2.5
- **react-dom**: 19.2.5
- **recharts**: 2.10.3 (Gráficos)
- **lucide-react**: 0.344.0 (Ícones)
- **typescript**: ~6.0.2
- **vite**: 8.0.9

## 🚀 Scripts Disponíveis

```bash
npm run dev       # Inicia servidor dev (http://localhost:5173)
npm run build     # Build para produção
npm run preview   # Preview do build
npm run lint      # Linter (ESLint)
```

## 💡 Boas Práticas Implementadas

✅ **Clean Code**
- Componentes pequenos e focados
- Funções puras
- Nomes descritivos

✅ **TypeScript**
- Tipagem forte em toda a app
- Type-only imports
- Interfaces bem definidas

✅ **Separação de Responsabilidades**
- Services: lógica de negócio
- Components: UI
- Context: estado global
- Utils: funções auxiliares

✅ **Performance**
- Memo em listas (potencial)
- useCallback para callbacks (potencial)
- Gráficos otimizados com Recharts

✅ **Manutenibilidade**
- Estrutura escalável
- Fácil adicionar novas categorias
- Fácil adicionar novos tipos de transação

## 🔮 Funcionalidades Futuras

- [ ] Autenticação e multi-usuário
- [ ] Sincronização com backend
- [ ] Importação/Exportação CSV
- [ ] Relatórios PDF
- [ ] Metas financeiras
- [ ] Notificações
- [ ] Dark mode
- [ ] Suporte offline com PWA

---

**Desenvolvido com ❤️ usando React + TypeScript + Vite**
**Mobile-First | Acessível | Clean Code**
