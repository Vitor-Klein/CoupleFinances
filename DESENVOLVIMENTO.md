# 🛠️ Guia de Desenvolvimento - CoupleFinances

## 📚 Como Navegar no Código

### Entrypoint
- `src/main.tsx` - Monta a aplicação no DOM
- `src/App.tsx` - **IMPORTANTE**: Componente raiz que gerencia navegação

### Fluxo Principal
```
App.tsx
  ├─ FinancesProvider (Context)
  ├─ Navigation (Bottom Nav)
  └─ Renderiza página ativa
      ├─ Dashboard
      ├─ AddTransaction
      ├─ Transactions
      └─ Analytics
```

## 🔧 Adicionando Nova Funcionalidade

### 1. Adicionar Nova Categoria de Transação

**Editar**: `src/constants/categories.ts`

```typescript
// Adicionar à EXPENSE_CATEGORIES
export const EXPENSE_CATEGORIES: Record<string, string> = {
  food: 'Alimentação',
  transport: 'Transporte',
  utilities: 'Contas e Utilidades',
  entertainment: 'Entretenimento',
  health: 'Saúde',
  shopping: 'Compras',
  other: 'Outros',
  // Nova categoria aqui ⬇️
  education: 'Educação', // ← Adicionar
};

// Adicionar cor em CATEGORY_COLORS
export const CATEGORY_COLORS: Record<CategoryType, string> = {
  // ... outros
  education: '#8b5cf6', // Cor roxa para educação
};
```

**Editar**: `src/types/index.ts`

```typescript
export type CategoryType = 'salary' | 'freelance' | 'bonus' | 'food' | 
  'transport' | 'utilities' | 'entertainment' | 'health' | 'shopping' | 
  'other' | 'education'; // ← Adicionar tipo
```

### 2. Adicionar Novo Campo em Transação

**Editar**: `src/types/index.ts`

```typescript
export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: CategoryType;
  date: string;
  person: 'me' | 'partner';
  notes?: string;
  tags?: string[]; // ← Novo campo exemplo
}
```

**Editar**: `src/context/FinancesContext.tsx` - Adaptar hooks se necessário

### 3. Adicionar Nova Página

1. **Criar arquivo**: `src/pages/NovaPage.tsx`

```typescript
import React from 'react';
import { Header } from '../components';

export const NovaPage: React.FC = () => {
  return (
    <div className="page nova-page">
      <Header title="Minha Nova Página" />
      <div className="page-content">
        {/* Seu conteúdo aqui */}
      </div>
    </div>
  );
};
```

2. **Exportar**: `src/pages/index.ts`

```typescript
export { Dashboard } from './Dashboard';
export { AddTransaction } from './AddTransaction';
export { Transactions } from './Transactions';
export { Analytics } from './Analytics';
export { NovaPage } from './NovaPage'; // ← Adicionar
```

3. **Adicionar ao App.tsx**

```typescript
type PageType = 'dashboard' | 'add' | 'transactions' | 'analytics' | 'nova'; // ← Adicionar

const renderPage = () => {
  switch (currentPage) {
    case 'dashboard':
      return <Dashboard />;
    case 'add':
      return <AddTransaction />;
    case 'transactions':
      return <Transactions />;
    case 'analytics':
      return <Analytics />;
    case 'nova': // ← Adicionar
      return <NovaPage />;
    default:
      return <Dashboard />;
  }
};
```

4. **Adicionar Botão de Navegação** (opcional)

### 4. Adicionar Novo Componente

1. **Criar**: `src/components/MeuComponente.tsx`

```typescript
import React from 'react';

interface MeuComponenteProps {
  title: string;
  onAction?: () => void;
}

export const MeuComponente: React.FC<MeuComponenteProps> = ({ 
  title, 
  onAction 
}) => {
  return (
    <div className="meu-componente">
      <h3>{title}</h3>
      {onAction && <button onClick={onAction}>Ação</button>}
    </div>
  );
};
```

2. **Exportar**: `src/components/index.ts`

```typescript
export { MeuComponente } from './MeuComponente';
```

3. **Usar em qualquer página**

```typescript
import { MeuComponente } from '../components';

// Em uma página
<MeuComponente title="Teste" onAction={() => console.log('Clicado!')} />
```

### 5. Adicionar Nova Função Utilitária

**Editar**: `src/utils/formatters.ts`

```typescript
/**
 * Formata para percentual
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};
```

## 🎨 Adicionando Estilos

Todos os estilos estão em `src/App.css` seguindo **variáveis CSS**:

```css
/* Use as variáveis de cor */
background-color: var(--primary);      /* Azul principal */
color: var(--dark);                    /* Texto escuro */
padding: var(--spacing-md);            /* Espaçamento */
border-radius: var(--radius-lg);       /* Bordas arredondadas */
box-shadow: var(--shadow-md);          /* Sombra */
```

**Exemplo de novo componente**:

```css
.novo-componente {
  background: white;
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-md);
  margin-bottom: var(--spacing-lg);
}

.novo-componente h3 {
  font-size: var(--font-size-lg);
  color: var(--dark);
  margin-bottom: var(--spacing-md);
}
```

## 🧮 Entendendo os Services

### StorageService

```typescript
// Ler transações
const transactions = StorageService.getTransactions();

// Salvar (automático via Context)
StorageService.saveTransactions(transactions);

// Limpar
StorageService.clearTransactions();
```

### CalculationService

```typescript
// Saldo do mês
const balance = CalculationService.getMonthlyBalance(transactions, 2026, 4);
// { month: '2026-04', income: 5000, expenses: 3000, balance: 2000 }

// Totais por categoria
const categories = CalculationService.getTotalsByCategory(transactions, 2026, 4);
// [ { category: 'food', total: 500, percentage: 25 }, ... ]

// Estatísticas por pessoa
const stats = CalculationService.getPersonStatistics(transactions, 2026, 4, 'me');
// { income: 3000, expenses: 1500, balance: 1500, count: 10 }

// Tendência dos últimos 6 meses
const trend = CalculationService.getMonthlyTrend(transactions, 6);
// [ { month: '01/2026', income: 5000, expenses: 3000, balance: 2000 }, ... ]
```

## 📝 Dicas de Desenvolvimento

### 1. TypeScript
```typescript
// ✅ BOM - Type explícito
const transactions: Transaction[] = [];

// ❌ RUIM - Type any
const transactions: any[] = [];
```

### 2. Components
```typescript
// ✅ BOM - Props bem definidas
interface CardProps {
  title: string;
  value: number;
}

export const Card: React.FC<CardProps> = ({ title, value }) => { ... }

// ❌ RUIM - Props implícitas
export const Card: React.FC<any> = (props) => { ... }
```

### 3. React Hooks
```typescript
// ✅ BOM - useFinances dentro de componente que tem FinancesProvider
const MyComponent = () => {
  const { transactions } = useFinances();
  return <div>{transactions.length}</div>;
};

// ❌ RUIM - useFinances sem provider vai dar erro
```

### 4. Formatação de Datas
```typescript
// ✅ Use formatDate para exibição
<span>{formatDate(transaction.date)}</span>

// ✅ Use toISODate para enviar/salvar
const isoDate = toISODate(new Date());

// ❌ Não misture formatos
```

## 🚀 Build e Deploy

### Local
```bash
npm run dev       # Desenvolvimento
npm run build     # Build de produção
npm run preview   # Preview do build
```

### Produção
1. Fazer build: `npm run build`
2. Output em pasta `dist/`
3. Deploy para:
   - Vercel
   - Netlify
   - GitHub Pages
   - Seu servidor

## 🐛 Debug

### Browser DevTools
```javascript
// No console do navegador
const ctx = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;

// Ver localStorage
localStorage.getItem('coupleFinances_transactions')

// Limpar dados
localStorage.removeItem('coupleFinances_transactions')
```

### React DevTools
- Instale extension no Chrome/Firefox
- Inspecione componentes
- Veja state e props em tempo real

## 📊 Performance

### Medir Renderizações
```typescript
export const MyComponent = () => {
  console.log('Renderizando MyComponent');
  return <div>...</div>;
};
```

### Otimizar Listas
```typescript
// Se lista ficar grande, usar React.memo
const TransactionItem = React.memo(({ transaction }) => {
  return <div>{transaction.description}</div>;
});
```

## ✅ Checklist para Nova Feature

- [ ] Adicionar tipos em `src/types/index.ts`
- [ ] Implementar lógica em services se necessário
- [ ] Criar componente ou página
- [ ] Adicionar estilos em `src/App.css`
- [ ] Exportar em `src/components/index.ts` ou `src/pages/index.ts`
- [ ] Adicionar ao App.tsx se for página
- [ ] Testar no navegador (dev)
- [ ] Compilar sem erros: `npm run build`
- [ ] Testar acessibilidade
- [ ] Documentar em README se necessário

## 🆘 Troubleshooting

### "useFinances deve ser usado dentro de FinancesProvider"
**Solução**: Use o hook apenas dentro de componentes que estão dentro de `<FinancesProvider>`

### Componentes não atualizam ao adicionar transação
**Solução**: Certifique-se que você está usando `useFinances()` hook

### localStorage vazio após recarregar
**Solução**: localStorage foi limpo, adicione uma nova transação

### Build falha com erro de tipo
**Solução**: `npm run build` vai mostrar o erro - leia a mensagem de erro do TypeScript

---

**Happy Coding! 🚀**
