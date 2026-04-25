# 💰 CoupleFinances - App de Gestão Financeira para Casais

Um aplicativo moderno e responsivo para gerenciar finanças compartilhadas entre casais. Desenvolvido com **React 19**, **TypeScript**, **Vite** e boas práticas de **Clean Code**.

## ✨ Características Principais

- 📊 **Dashboard Inteligente** - Resumo visual de receitas, despesas e saldos
- ➕ **Adicionar Transações** - Formulário completo com categorias dinâmicas
- 📋 **Listar Transações** - Histórico com filtros por tipo
- 📈 **Análises Avançadas** - Gráficos de tendência e categorias
- 👥 **Rastreamento por Pessoa** - Diferenciar gastos "meu" vs "do parceiro"
- 💾 **Persistência Local** - Salva automaticamente no localStorage
- 📱 **Mobile-First** - Design otimizado para celular, tablet e desktop
- ♿ **Acessível** - WCAG 2.1 AA compliant

## 🚀 Início Rápido

### Instalação
```bash
cd CoupleFinances
npm install --legacy-peer-deps
```

### Desenvolvimento
```bash
npm run dev
# Abrir http://localhost:5173
```

### Build para Produção
```bash
npm run build
npm run preview
```

## 📱 Navegação

A aplicação possui 4 seções principais (bottom navigation):

| Ícone | Página | Descrição |
|-------|--------|-----------|
| 📊 | Dashboard | Resumo mensal com gráficos |
| ➕ | Adicionar | Formulário para nova transação |
| 📋 | Transações | Lista com filtros |
| 📈 | Análises | Gráficos e estatísticas |

## 💡 Como Usar

### 1. Adicionar uma Transação
1. Clique no ícone **"+"** na barra inferior
2. Selecione o tipo: **Receita** ou **Despesa**
3. Preencha os dados:
   - Descrição (ex: "Compras no supermercado")
   - Valor em R$
   - Categoria (muda conforme o tipo)
   - Data
   - Quem fez: **Eu** ou **Parceiro(a)**
   - Notas (opcional)
4. Clique **"Adicionar Transação"**

### 2. Ver Dashboard
1. Clique em **"Dashboard"** (ícone 📊)
2. Use os botões **< >** para navegar entre meses
3. Visualize:
   - Saldo total do mês
   - Comparação Você vs Parceiro
   - Gráfico de despesas por categoria
   - Tendência dos últimos 6 meses

### 3. Listar e Filtrar
1. Clique em **"Transações"** (ícone 📋)
2. Navegue entre meses
3. Use os filtros:
   - **Todas** - Mostra tudo
   - **Receitas** - Apenas entradas
   - **Despesas** - Apenas saídas
4. Clique no **🗑️** para deletar uma transação

### 4. Analisar Dados
1. Clique em **"Análises"** (ícone 📈)
2. Visualize:
   - Cards com estatísticas rápidas
   - Comparação detalhada por pessoa
   - Escolha entre gráfico de linhas ou barras
   - Gráfico pizza com distribuição por categoria
   - Tabela com detalhamento

## 📊 Categorias Suportadas

### Receitas 💚
- Salário
- Freelance
- Bônus

### Despesas ❤️
- Alimentação
- Transporte
- Contas e Utilidades
- Entretenimento
- Saúde
- Compras
- Outros

## 🎨 Design Responsivo

- ✅ **Mobile**: Otimizado para smartphones
- ✅ **Tablet**: Layout adaptativo
- ✅ **Desktop**: Aproveitamento de tela maior

## 🔐 Armazenamento de Dados

- Dados salvos em **localStorage** do navegador
- Nenhum servidor externo necessário
- Sincronização automática
- Dados persistem entre sessões

⚠️ **Nota**: Limpar dados do navegador apagará o histórico

## 🛠️ Arquitetura

### Estrutura de Pastas
```
src/
├── components/     # Componentes reutilizáveis
├── pages/          # Páginas principais
├── services/       # Lógica de negócio
├── context/        # Estado global
├── types/          # Definições TypeScript
├── utils/          # Funções auxiliares
└── constants/      # Configurações
```

**Veja [ESTRUTURA.md](ESTRUTURA.md) para documentação completa da arquitetura.**

## ♿ Acessibilidade

- ✅ Todos os botões possuem descrições
- ✅ Suporte a leitores de tela
- ✅ Contraste adequado (WCAG AA)
- ✅ Labels associadas em formulários
- ✅ Navegação por teclado

**Veja [ACESSIBILIDADE.md](ACESSIBILIDADE.md) para detalhes.**

## 🧪 Testes Recomendados

### Teste Manual
1. Adicionar várias transações em diferentes meses
2. Alternar entre filtros
3. Verificar cálculos de saldo
4. Deletar e adicionar novamente
5. Recarregar a página (dados devem persistir)

### Teste de Acessibilidade
1. Navegar usando apenas teclado (TAB)
2. Usar leitor de tela (NVDA, JAWS, VoiceOver)
3. Verificar contraste de cores (WAVE, Axe)

## 📊 Estatísticas Calculadas

- **Saldo Mensal** = Receitas - Despesas
- **Totais por Categoria** = Soma de despesas por categoria
- **Percentual por Categoria** = (Despesa / Total Despesas) × 100
- **Tendência** = Comparação dos últimos 6 meses
- **Por Pessoa** = Receitas, despesas e saldo individual

## 🔄 Fluxo de Dados

```
Usuário adiciona transação
        ↓
FinancesContext recebe
        ↓
localStorage.setItem()
        ↓
Dashboard/Analytics atualizam
        ↓
Gráficos se recomputam
        ↓
UI re-renderiza
```

## 💻 Tecnologias

- **React 19** - UI Framework
- **TypeScript** - Type Safety
- **Vite** - Build Tool
- **Recharts** - Visualização de dados
- **Lucide React** - Ícones
- **Context API** - State Management

## 🎯 Boas Práticas Implementadas

✅ **Clean Code**
- Componentes pequenos e focados
- Funções puras e reutilizáveis
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
- Gráficos otimizados
- localStorage sincronizado
- Renderização eficiente

✅ **Manutenibilidade**
- Estrutura escalável
- Fácil adicionar novas categorias
- Documentação completa

## 🔮 Próximas Melhorias

- [ ] Exportar dados para CSV/PDF
- [ ] Categorias customizáveis
- [ ] Metas e orçamentos
- [ ] Notificações
- [ ] Sincronizar com backend
- [ ] Modo escuro
- [ ] PWA (offline)
- [ ] Autenticação multi-usuário

## 📝 Licença

Projeto pessoal - use como desejar!

## 🤝 Contribuições

Encontrou um bug ou tem sugestão? Sinta-se livre para contribuir!

---

**Feito com ❤️ para ajudar casais a controlar suas finanças compartilhadas**

🔗 **Links Úteis**
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Vite Guide](https://vite.dev)
- [Recharts Docs](https://recharts.org)
