import { useState, useEffect } from 'react';
import { 
  Wallet, TrendingUp, TrendingDown, PlusCircle, Trash2, X, Save, 
  AlertTriangle, Filter, CheckCircle2, Clock, Building2, PieChart, CreditCard, Settings, Tag
} from 'lucide-react';

interface Transaction {
  id: string;
  description: string;
  category: string;
  account: string;
  date: string;
  amount: number;
  type: 'income' | 'expense';
  status: 'paid' | 'pending';
}

export default function App() {
  // Lançamentos
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('@controle_financeiro_transactions');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [
      {
        id: '1',
        description: 'Salário Mensal',
        category: 'Trabalho',
        account: 'Banco do Brasil',
        date: '2026-06-01',
        amount: 4500.00,
        type: 'income',
        status: 'paid'
      },
      {
        id: '2',
        description: 'Supermercado Mensal',
        category: 'Alimentação',
        account: 'Cartão Nubank',
        date: '2026-06-03',
        amount: 850.00,
        type: 'expense',
        status: 'paid'
      }
    ];
  });

  // Categorias personalizáveis cadastradas pelo usuário
  const [categories, setCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem('@controle_financeiro_categories');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return ['Alimentação', 'Habitação', 'Transporte', 'Saúde', 'Lazer', 'Trabalho', 'Serviços', 'Outros'];
  });

  // Contas / Cartões personalizados cadastrados pelo usuário
  const [accounts, setAccounts] = useState<string[]>(() => {
    const saved = localStorage.getItem('@controle_financeiro_accounts');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return ['Banco do Brasil', 'Bradesco', 'Cartão Nubank', 'Cartão Master', 'Carteira'];
  });

  // Estados dos Modais
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false); // Modal para gerenciar Contas e Categorias
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);

  // Estados do Formulário de Transação
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(categories[0] || 'Outros');
  const [account, setAccount] = useState(accounts[0] || 'Carteira');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [status, setStatus] = useState<'paid' | 'pending'>('paid');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Estados para Inputs de Novo Cadastro (Conta e Categoria)
  const [newAccountInput, setNewAccountInput] = useState('');
  const [newCategoryInput, setNewCategoryInput] = useState('');

  // Filtros
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  // Persistência
  useEffect(() => {
    localStorage.setItem('@controle_financeiro_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('@controle_financeiro_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('@controle_financeiro_accounts', JSON.stringify(accounts));
  }, [accounts]);

  // Cálculos de Totais
  const incomeRealized = transactions
    .filter(t => t.type === 'income' && t.status === 'paid')
    .reduce((acc, t) => acc + t.amount, 0);

  const expenseRealized = transactions
    .filter(t => t.type === 'expense' && t.status === 'paid')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalRealized = incomeRealized - expenseRealized;

  const totalPendingExpense = transactions
    .filter(t => t.type === 'expense' && t.status === 'pending')
    .reduce((acc, t) => acc + t.amount, 0);

  // Gastos por Categoria (para o gráfico)
  const expensesByCategory = categories.map(cat => {
    const totalCat = transactions
      .filter(t => t.category === cat && t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0);
    return { category: cat, total: totalCat };
  }).filter(item => item.total > 0);

  const maxCategoryExpense = Math.max(...expensesByCategory.map(i => i.total), 1);

  // Filtragem
  const filteredTransactions = transactions.filter(t => {
    const matchesType = selectedTypeFilter === 'all' || t.type === selectedTypeFilter;
    const matchesCategory = selectedCategoryFilter === 'all' || t.category === selectedCategoryFilter;
    return matchesType && matchesCategory;
  });

  // Ações de Transação
  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;

    const newTransaction: Transaction = {
      id: crypto.randomUUID(),
      description,
      category: category || categories[0],
      account: account || accounts[0],
      date,
      amount: parseFloat(amount),
      type,
      status
    };

    setTransactions([newTransaction, ...transactions]);
    setDescription('');
    setAmount('');
    setIsModalOpen(false);
  };

  const toggleStatus = (id: string) => {
    setTransactions(transactions.map(t => {
      if (t.id === id) {
        return { ...t, status: t.status === 'paid' ? 'pending' : 'paid' };
      }
      return t;
    }));
  };

  const confirmDelete = (id: string) => {
    setTransactionToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteTransaction = () => {
    if (transactionToDelete) {
      setTransactions(transactions.filter(t => t.id !== transactionToDelete));
      setIsDeleteModalOpen(false);
      setTransactionToDelete(null);
    }
  };

  // Funções de Cadastro Personalizado
  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccountInput.trim() || accounts.includes(newAccountInput.trim())) return;
    setAccounts([...accounts, newAccountInput.trim()]);
    setNewAccountInput('');
  };

  const handleDeleteAccount = (accToDelete: string) => {
    if (accounts.length <= 1) {
      alert('Você precisa ter pelo menos uma conta/cartão cadastrada.');
      return;
    }
    setAccounts(accounts.filter(a => a !== accToDelete));
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryInput.trim() || categories.includes(newCategoryInput.trim())) return;
    setCategories([...categories, newCategoryInput.trim()]);
    setNewCategoryInput('');
  };

  const handleDeleteCategory = (catToDelete: string) => {
    if (categories.length <= 1) {
      alert('Você precisa ter pelo menos uma categoria cadastrada.');
      return;
    }
    setCategories(categories.filter(c => c !== catToDelete));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Cabeçalho */}
        <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b pb-4 border-slate-200">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Controle & Gestão Financeira</h1>
            <p className="text-sm text-slate-500">Painel Completo — Gestão de Contas, Cartões e Categorias</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsManageModalOpen(true)}
              className="flex items-center gap-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2.5 rounded-lg font-medium transition cursor-pointer text-sm"
            >
              <Settings className="w-4 h-4" />
              <span>Cadastros</span>
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg font-medium transition shadow-sm cursor-pointer text-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Novo Lançamento</span>
            </button>
          </div>
        </header>

        {/* Cards de Resumo */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center text-slate-500 text-xs font-semibold uppercase">
              <span>Saldo Realizado</span>
              <Wallet className="w-4 h-4 text-slate-600" />
            </div>
            <h2 className={`text-2xl font-bold mt-2 ${totalRealized >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
              R$ {totalRealized.toFixed(2)}
            </h2>
            <p className="text-xs text-slate-400 mt-1">Dinheiro em caixa atual</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center text-slate-500 text-xs font-semibold uppercase">
              <span>Receitas Pagas</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-emerald-600 mt-2">
              R$ {incomeRealized.toFixed(2)}
            </h2>
            <p className="text-xs text-slate-400 mt-1">Entradas validadas</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center text-slate-500 text-xs font-semibold uppercase">
              <span>Despesas Pagas</span>
              <TrendingDown className="w-4 h-4 text-rose-600" />
            </div>
            <h2 className="text-2xl font-bold text-rose-600 mt-2">
              R$ {expenseRealized.toFixed(2)}
            </h2>
            <p className="text-xs text-slate-400 mt-1">Saídas liquidadas</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center text-slate-500 text-xs font-semibold uppercase">
              <span>A Pagar (Pendente)</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <h2 className="text-2xl font-bold text-amber-600 mt-2">
              R$ {totalPendingExpense.toFixed(2)}
            </h2>
            <p className="text-xs text-slate-400 mt-1">Compromissos agendados</p>
          </div>
        </section>

        {/* Gráficos por Categoria */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-indigo-600" />
              Despesas por Categoria
            </h3>
            <span className="text-xs text-slate-400 font-medium">Distribuição de Gastos</span>
          </div>

          {expensesByCategory.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">
              Nenhuma despesa registada para exibir no gráfico.
            </p>
          ) : (
            <div className="space-y-3 pt-2">
              {expensesByCategory.map((item) => {
                const percentage = (item.total / maxCategoryExpense) * 100;
                return (
                  <div key={item.category} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>{item.category}</span>
                      <span>R$ {item.total.toFixed(2)}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Tabela e Filtros */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
          <div className="p-4 md:p-6 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-slate-500" />
              <h3 className="text-lg font-bold text-slate-900">Extrato de Lançamentos</h3>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={selectedTypeFilter}
                onChange={(e) => setSelectedTypeFilter(e.target.value as any)}
                className="border border-slate-300 rounded-lg text-xs p-2 bg-slate-50 font-medium"
              >
                <option value="all">Todos os Tipos</option>
                <option value="income">Apenas Receitas</option>
                <option value="expense">Apenas Despesas</option>
              </select>

              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="border border-slate-300 rounded-lg text-xs p-2 bg-slate-50 font-medium"
              >
                <option value="all">Todas as Categorias</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-200">
                  <th className="p-4">Status</th>
                  <th className="p-4">Descrição</th>
                  <th className="p-4">Conta / Cartão</th>
                  <th className="p-4">Categoria</th>
                  <th className="p-4">Data</th>
                  <th className="p-4">Valor</th>
                  <th className="p-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      Nenhum lançamento encontrado para os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-4">
                        <button
                          onClick={() => toggleStatus(t.id)}
                          className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full cursor-pointer transition ${
                            t.status === 'paid'
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                          }`}
                        >
                          {t.status === 'paid' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                          <span>{t.status === 'paid' ? 'Pago' : 'Pendente'}</span>
                        </button>
                      </td>
                      <td className="p-4 font-medium text-slate-800">{t.description}</td>
                      <td className="p-4 text-slate-600 text-xs font-medium flex items-center gap-1.5">
                        {t.account.toLowerCase().includes('cartão') ? (
                          <CreditCard className="w-3.5 h-3.5 text-indigo-500" />
                        ) : (
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        )}
                        {t.account}
                      </td>
                      <td className="p-4">
                        <span className="bg-slate-100 text-slate-600 text-xs px-2.5 py-1 rounded-md font-medium">
                          {t.category}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500">{t.date}</td>
                      <td className={`p-4 font-semibold ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {t.type === 'income' ? '+' : '-'} R$ {t.amount.toFixed(2)}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => confirmDelete(t.id)}
                          className="text-slate-400 hover:text-rose-600 transition p-1.5 rounded-lg hover:bg-rose-50 cursor-pointer inline-flex items-center gap-1 text-xs font-medium"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Excluir</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

      </div>

      {/* Modal de Gestão de Contas e Categorias (Cadastros) */}
      {isManageModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 space-y-6 relative border border-slate-200">
            <div className="flex justify-between items-center border-b pb-3 border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-600" />
                Gerenciar Cadastros (Contas e Categorias)
              </h3>
              <button
                onClick={() => setIsManageModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Gerir Contas / Cartões */}
              <div className="space-y-4 border border-slate-200 p-4 rounded-xl">
                <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-indigo-600" />
                  Contas / Cartões
                </h4>
                
                <form onSubmit={handleAddAccount} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nova conta ou cartão..."
                    value={newAccountInput}
                    onChange={(e) => setNewAccountInput(e.target.value)}
                    className="flex-1 border border-slate-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition cursor-pointer"
                  >
                    Adicionar
                  </button>
                </form>

                <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                  {accounts.map(acc => (
                    <div key={acc} className="flex justify-between items-center bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 text-sm">
                      <span className="font-medium text-slate-700">{acc}</span>
                      <button
                        onClick={() => handleDeleteAccount(acc)}
                        className="text-slate-400 hover:text-rose-600 p-1 transition cursor-pointer"
                        title="Excluir Conta"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Gerir Categorias */}
              <div className="space-y-4 border border-slate-200 p-4 rounded-xl">
                <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-emerald-600" />
                  Categorias
                </h4>
                
                <form onSubmit={handleAddCategory} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nova categoria..."
                    value={newCategoryInput}
                    onChange={(e) => setNewCategoryInput(e.target.value)}
                    className="flex-1 border border-slate-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition cursor-pointer"
                  >
                    Adicionar
                  </button>
                </form>

                <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                  {categories.map(cat => (
                    <div key={cat} className="flex justify-between items-center bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 text-sm">
                      <span className="font-medium text-slate-700">{cat}</span>
                      <button
                        onClick={() => handleDeleteCategory(cat)}
                        className="text-slate-400 hover:text-rose-600 p-1 transition cursor-pointer"
                        title="Excluir Categoria"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsManageModalOpen(false)}
                className="px-5 py-2 text-sm font-medium bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition cursor-pointer"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Novo Lançamento */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-5 relative border border-slate-200">
            <div className="flex justify-between items-center border-b pb-3 border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-emerald-600" />
                Novo Lançamento
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddTransaction} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  Descrição
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Fatura Cartão, Consultoria..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                    Valor (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                    Tipo
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="expense">Despesa (Saída)</option>
                    <option value="income">Receita (Entrada)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                    Conta / Cartão
                  </label>
                  <select
                    value={account}
                    onChange={(e) => setAccount(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    {accounts.map(acc => (
                      <option key={acc} value={acc}>{acc}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                    Categoria
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                    Data
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="paid">Realizado (Pago)</option>
                    <option value="pending">Pendente (A Pagar)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition shadow-sm cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar Lançamento</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 space-y-6 relative border border-slate-200 text-center">
            <div className="mx-auto w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900">Confirmar Exclusão</h3>
              <p className="text-sm text-slate-500">
                Tem certeza que deseja remover este lançamento?
              </p>
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer border border-slate-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteTransaction}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition shadow-sm cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sim, Excluir</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}