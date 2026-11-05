import { useState, useEffect } from 'react';
import { 
  Wallet, TrendingUp, TrendingDown, PlusCircle, Trash2, X, Save, 
  AlertTriangle, Filter, CheckCircle2, Clock, Building2, PieChart, CreditCard, Settings, Repeat, Layers, Calendar
} from 'lucide-react';

interface CreditCardAccount {
  id: string;
  name: string;
  bank: string;
  totalLimit: number;
  closingDay: number;
  dueDay: number;
  includeOnClosingDayRule: 'current' | 'next';
}

interface Transaction {
  id: string;
  description: string;
  category: string;
  account: string;
  creditCardId?: string;
  date: string;
  dueDate: string;
  amount: number;
  type: 'income' | 'expense';
  status: 'paid' | 'pending';
  installmentInfo?: string;
  installmentGroup?: string;
}

export default function App() {
  const [creditCards, setCreditCards] = useState<CreditCardAccount[]>(() => {
    const saved = localStorage.getItem('@controle_financeiro_credit_cards');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [
      {
        id: 'card-1',
        name: 'Cartão Nubank',
        bank: 'Nubank',
        totalLimit: 5000.00,
        closingDay: 10,
        dueDay: 17,
        includeOnClosingDayRule: 'next'
      }
    ];
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('@controle_financeiro_transactions');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [];
  });

  const [categories, setCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem('@controle_financeiro_categories');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return ['Alimentação', 'Habitação', 'Transporte', 'Saúde', 'Lazer', 'Trabalho', 'Serviços', 'Outros'];
  });

  const [accounts, setAccounts] = useState<string[]>(() => {
    const saved = localStorage.getItem('@controle_financeiro_accounts');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return ['Banco do Brasil', 'Bradesco', 'Carteira'];
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);

  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(categories[0] || 'Outros');
  const [paymentSource, setPaymentSource] = useState<string>('acc-Banco do Brasil');
  const [amount, setAmount] = useState('');
  const [type] = useState<'income' | 'expense'>('expense');
  const [status] = useState<'paid' | 'pending'>('pending');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);

  const [isRecurring] = useState(false);
  const [isInstallment, setIsInstallment] = useState(false);
  const [installmentsCount, setInstallmentsCount] = useState('6');

  const [newAccountInput, setNewAccountInput] = useState('');
  const [newCategoryInput, setNewCategoryInput] = useState('');

  const [newCardName, setNewCardName] = useState('');
  const [newCardBank, setNewCardBank] = useState('');
  const [newCardLimit, setNewCardLimit] = useState('');
  const [newCardClosingDay, setNewCardClosingDay] = useState('10');
  const [newCardDueDay, setNewCardDueDay] = useState('17');
  const [newCardRule, setNewCardRule] = useState<'current' | 'next'>('next');

  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedCardView, setSelectedCardView] = useState<string>(creditCards[0]?.id || '');

  useEffect(() => {
    localStorage.setItem('@controle_financeiro_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('@controle_financeiro_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('@controle_financeiro_accounts', JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem('@controle_financeiro_credit_cards', JSON.stringify(creditCards));
  }, [creditCards]);

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

  const getCardLimitDetails = (cardId: string) => {
    const card = creditCards.find(c => c.id === cardId);
    if (!card) return { total: 0, used: 0, available: 0 };
    
    const used = transactions
      .filter(t => t.creditCardId === cardId && t.status === 'pending')
      .reduce((acc, t) => acc + t.amount, 0);

    return {
      total: card.totalLimit,
      used,
      available: card.totalLimit - used
    };
  };

  const calculateInvoiceDueDate = (purchaseDateStr: string, card: CreditCardAccount, monthOffset: number = 0) => {
    const dateObj = new Date(purchaseDateStr + 'T00:00:00');
    const day = dateObj.getDate();
    let year = dateObj.getFullYear();
    let month = dateObj.getMonth();

    let isNextInvoice = false;
    if (day > card.closingDay) {
      isNextInvoice = true;
    } else if (day === card.closingDay && card.includeOnClosingDayRule === 'next') {
      isNextInvoice = true;
    }

    if (isNextInvoice) {
      month += 1;
    }
    month += monthOffset;

    const targetDueDate = new Date(year, month, card.dueDay);
    return targetDueDate.toISOString().split('T')[0];
  };

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;

    const baseAmount = parseFloat(amount);
    let newTransactionsList = [...transactions];
    const groupId = crypto.randomUUID();

    const isCreditCard = paymentSource.startsWith('card-');
    const selectedCardId = isCreditCard ? paymentSource.replace('card-', '') : undefined;
    const selectedCard = creditCards.find(c => c.id === selectedCardId);
    const accountName = isCreditCard ? selectedCard?.name || 'Cartão' : paymentSource.replace('acc-', '');

    if (isInstallment && parseInt(installmentsCount) > 1) {
      const totalParts = parseInt(installmentsCount);
      const installmentValue = baseAmount / totalParts;

      for (let i = 1; i <= totalParts; i++) {
        let dueDate = purchaseDate;
        
        if (selectedCard) {
          dueDate = calculateInvoiceDueDate(purchaseDate, selectedCard, i - 1);
        } else {
          const d = new Date(purchaseDate + 'T00:00:00');
          d.setMonth(d.getMonth() + (i - 1));
          dueDate = d.toISOString().split('T')[0];
        }

        const installmentTransaction: Transaction = {
          id: crypto.randomUUID(),
          description: `${description} (${i}/${totalParts})`,
          category: category || categories[0],
          account: accountName,
          creditCardId: selectedCardId,
          date: purchaseDate,
          dueDate: dueDate,
          amount: parseFloat(installmentValue.toFixed(2)),
          type,
          status: 'pending',
          installmentInfo: `Parcela ${i}/${totalParts}`,
          installmentGroup: groupId
        };
        newTransactionsList.unshift(installmentTransaction);
      }
    } else {
      let dueDate = purchaseDate;
      if (selectedCard) {
        dueDate = calculateInvoiceDueDate(purchaseDate, selectedCard, 0);
      }

      const singleTransaction: Transaction = {
        id: crypto.randomUUID(),
        description,
        category: category || categories[0],
        account: accountName,
        creditCardId: selectedCardId,
        date: purchaseDate,
        dueDate: dueDate,
        amount: baseAmount,
        type,
        status,
        installmentInfo: isRecurring ? 'Recorrente Mensal' : undefined,
        installmentGroup: groupId
      };
      newTransactionsList.unshift(singleTransaction);
    }

    setTransactions(newTransactionsList);
    setDescription('');
    setAmount('');
    setIsModalOpen(false);
  };

  const handleAddCreditCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardName || !newCardLimit) return;

    const newCard: CreditCardAccount = {
      id: `card-${crypto.randomUUID()}`,
      name: newCardName,
      bank: newCardBank || newCardName,
      totalLimit: parseFloat(newCardLimit),
      closingDay: parseInt(newCardClosingDay),
      dueDay: parseInt(newCardDueDay),
      includeOnClosingDayRule: newCardRule
    };

    setCreditCards([...creditCards, newCard]);
    setNewCardName('');
    setNewCardBank('');
    setNewCardLimit('');
  };

  const handleDeleteCard = (id: string) => {
    setCreditCards(creditCards.filter(c => c.id !== id));
  };

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccountInput.trim() || accounts.includes(newAccountInput.trim())) return;
    setAccounts([...accounts, newAccountInput.trim()]);
    setNewAccountInput('');
  };

  const handleDeleteAccount = (accToDelete: string) => {
    if (accounts.length <= 1) {
      alert('Você precisa ter pelo menos uma conta cadastrada.');
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

  const expensesByCategory = categories.map(cat => {
    const totalCat = transactions
      .filter(t => t.category === cat && t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0);
    return { category: cat, total: totalCat };
  }).filter(item => item.total > 0);

  const maxCategoryExpense = Math.max(...expensesByCategory.map(i => i.total), 1);

  const filteredTransactions = transactions.filter(t => {
    const matchesType = selectedTypeFilter === 'all' || t.type === selectedTypeFilter;
    const matchesCategory = selectedCategoryFilter === 'all' || t.category === selectedCategoryFilter;
    return matchesType && matchesCategory;
  });

  const activeCard = creditCards.find(c => c.id === selectedCardView) || creditCards[0];
  const activeCardLimit = activeCard ? getCardLimitDetails(activeCard.id) : null;
  const activeCardTransactions = activeCard 
    ? transactions.filter(t => t.creditCardId === activeCard.id) 
    : [];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b pb-4 border-slate-200">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Controle & Gestão Financeira</h1>
            <p className="text-sm text-slate-500">Módulo de Cartões de Crédito com Fechamento & Parcelamento Inteligente</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsManageModalOpen(true)}
              className="flex items-center gap-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2.5 rounded-lg font-medium transition cursor-pointer text-sm"
            >
              <Settings className="w-4 h-4" />
              <span>Cadastros & Cartões</span>
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg font-medium transition shadow-sm cursor-pointer text-sm"
            >
              <PlusCircle className="w-5 h-5" />
              <span>Novo Lançamento</span>
            </button>
          </div>
        </header>

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

        {creditCards.length > 0 && activeCard && activeCardLimit && (
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <CreditCard className="w-6 h-6 text-indigo-600" />
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Gestão de Faturas de Cartão</h3>
                  <p className="text-xs text-slate-500">Ciclo de fechamento automático e controle de limite</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 uppercase">Selecionar Cartão:</span>
                <select
                  value={selectedCardView}
                  onChange={(e) => setSelectedCardView(e.target.value)}
                  className="border border-slate-300 rounded-lg text-sm p-2 bg-slate-50 font-semibold text-indigo-900"
                >
                  {creditCards.map(card => (
                    <option key={card.id} value={card.id}>{card.name} ({card.bank})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="text-xs font-semibold uppercase text-slate-500">Limite Total</span>
                <h4 className="text-xl font-bold text-slate-900 mt-1">R$ {activeCardLimit.total.toFixed(2)}</h4>
                <p className="text-[11px] text-slate-400 mt-1">Fechamento: dia {activeCard.closingDay} | Vencimento: dia {activeCard.dueDay}</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="text-xs font-semibold uppercase text-slate-500">Limite Utilizado</span>
                <h4 className="text-xl font-bold text-rose-600 mt-1">R$ {activeCardLimit.used.toFixed(2)}</h4>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-2">
                  <div 
                    className="bg-rose-500 h-2 rounded-full" 
                    style={{ width: `${Math.min((activeCardLimit.used / activeCardLimit.total) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="text-xs font-semibold uppercase text-slate-500">Limite Disponível</span>
                <h4 className="text-xl font-bold text-emerald-600 mt-1">R$ {activeCardLimit.available.toFixed(2)}</h4>
                <p className="text-[11px] text-slate-400 mt-1">Restituído automaticamente ao pagar faturas</p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                Lançamentos por Fatura de Vencimento
              </h4>

              {activeCardTransactions.length === 0 ? (
                <p className="text-sm text-slate-400 py-4 text-center border border-dashed rounded-lg">
                  Nenhuma compra ou parcela vinculada a este cartão.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-600 uppercase font-semibold border-b">
                        <th className="p-3">Data Compra</th>
                        <th className="p-3">Descrição</th>
                        <th className="p-3">Parcela</th>
                        <th className="p-3">Vencimento Fatura</th>
                        <th className="p-3">Valor</th>
                        <th className="p-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeCardTransactions.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50">
                          <td className="p-3 text-slate-500">{t.date}</td>
                          <td className="p-3 font-medium text-slate-800">{t.description}</td>
                          <td className="p-3 font-semibold text-indigo-600">{t.installmentInfo || 'À vista'}</td>
                          <td className="p-3 font-bold text-slate-700">{t.dueDate}</td>
                          <td className="p-3 font-bold text-rose-600">R$ {t.amount.toFixed(2)}</td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => toggleStatus(t.id)}
                              className={`px-2 py-1 rounded-full font-semibold cursor-pointer text-[10px] ${
                                t.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {t.status === 'paid' ? 'Pago' : 'Pendente'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}

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

        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
          <div className="p-4 md:p-6 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-slate-500" />
              <h3 className="text-lg font-bold text-slate-900">Extrato de Fluxo de Caixa (Competência)</h3>
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
                  <th className="p-4">Descrição / Detalhes</th>
                  <th className="p-4">Origem / Cartão</th>
                  <th className="p-4">Categoria</th>
                  <th className="p-4">Vencimento</th>
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
                      <td className="p-4">
                        <div className="font-medium text-slate-800">{t.description}</div>
                        {t.installmentInfo && (
                          <span className="inline-flex items-center gap-1 text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-semibold mt-0.5">
                            {t.installmentInfo.includes('Parcela') ? <Layers className="w-3 h-3" /> : <Repeat className="w-3 h-3" />}
                            {t.installmentInfo}
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-slate-600 text-xs font-medium flex items-center gap-1.5">
                        {t.creditCardId ? (
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
                      <td className="p-4 text-slate-500 font-medium">{t.dueDate || t.date}</td>
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

      {isManageModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full p-6 space-y-6 relative border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3 border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-600" />
                Gerenciar Cartões e Cadastros
              </h3>
              <button
                onClick={() => setIsManageModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="border border-indigo-100 bg-indigo-50/40 p-4 rounded-xl space-y-4">
              <h4 className="font-bold text-sm text-indigo-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-indigo-600" />
                Cadastrar Novo Cartão de Crédito
              </h4>

              <form onSubmit={handleAddCreditCard} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Nome do Cartão (Ex: Nubank)"
                    value={newCardName}
                    onChange={(e) => setNewCardName(e.target.value)}
                    className="border border-slate-300 rounded-lg p-2 text-xs bg-white"
                  />
                  <input
                    type="text"
                    placeholder="Instituição / Banco"
                    value={newCardBank}
                    onChange={(e) => setNewCardBank(e.target.value)}
                    className="border border-slate-300 rounded-lg p-2 text-xs bg-white"
                  />
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="Limite Total (R$)"
                    value={newCardLimit}
                    onChange={(e) => setNewCardLimit(e.target.value)}
                    className="border border-slate-300 rounded-lg p-2 text-xs bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Dia de Fechamento</label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      required
                      value={newCardClosingDay}
                      onChange={(e) => setNewCardClosingDay(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Dia de Vencimento</label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      required
                      value={newCardDueDay}
                      onChange={(e) => setNewCardDueDay(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Compra no Fechamento</label>
                    <select
                      value={newCardRule}
                      onChange={(e) => setNewCardRule(e.target.value as any)}
                      className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white font-medium"
                    >
                      <option value="next">Próxima Fatura</option>
                      <option value="current">Fatura Atual</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer"
                  >
                    Salvar Cartão
                  </button>
                </div>
              </form>

              <div className="space-y-2 pt-2 border-t border-indigo-100">
                <span className="text-xs font-bold text-slate-600">Cartões Ativos:</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {creditCards.map(card => (
                    <div key={card.id} className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-200 text-xs">
                      <div>
                        <div className="font-bold text-slate-800">{card.name} ({card.bank})</div>
                        <div className="text-slate-400 text-[10px]">
                          Fecha dia {card.closingDay} | Vence dia {card.dueDay} | R$ {card.totalLimit.toFixed(2)}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteCard(card.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Gerir Contas e Categorias */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-slate-200 p-4 rounded-xl space-y-3">
                <h4 className="font-bold text-sm text-slate-800">Contas / Bancos</h4>
                <form onSubmit={handleAddAccount} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nova conta..."
                    value={newAccountInput}
                    onChange={(e) => setNewAccountInput(e.target.value)}
                    className="flex-1 border border-slate-300 rounded-lg p-2 text-xs"
                  />
                  <button type="submit" className="bg-slate-800 text-white px-3 py-2 rounded-lg text-xs font-medium">Add</button>
                </form>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {accounts.map(acc => (
                    <div key={acc} className="flex justify-between items-center bg-slate-50 p-2 rounded text-xs">
                      <span>{acc}</span>
                      <button onClick={() => handleDeleteAccount(acc)} className="text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border border-slate-200 p-4 rounded-xl space-y-3">
                <h4 className="font-bold text-sm text-slate-800">Categorias</h4>
                <form onSubmit={handleAddCategory} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nova categoria..."
                    value={newCategoryInput}
                    onChange={(e) => setNewCategoryInput(e.target.value)}
                    className="flex-1 border border-slate-300 rounded-lg p-2 text-xs"
                  />
                  <button type="submit" className="bg-slate-800 text-white px-3 py-2 rounded-lg text-xs font-medium">Add</button>
                </form>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {categories.map(cat => (
                    <div key={cat} className="flex justify-between items-center bg-slate-50 p-2 rounded text-xs">
                      <span>{cat}</span>
                      <button onClick={() => handleDeleteCategory(cat)} className="text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
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

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-5 relative border border-slate-200 max-h-[90vh] overflow-y-auto">
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
                  Descrição da Compra
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Supermercado, Eletrônicos..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                    Valor Total (R$)
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
                    Forma / Cartão
                  </label>
                  <select
                    value={paymentSource}
                    onChange={(e) => setPaymentSource(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-medium"
                  >
                    <optgroup label="Cartões de Crédito">
                      {creditCards.map(c => (
                        <option key={c.id} value={`card-${c.id}`}>
                          {c.name} (Fecha dia {c.closingDay})
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Contas / Carteira">
                      {accounts.map(acc => (
                        <option key={acc} value={`acc-${acc}`}>{acc}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                    Data da Compra
                  </label>
                  <input
                    type="date"
                    required
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isInstallment}
                      onChange={(e) => setIsInstallment(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                    <span>Parcelar Compra</span>
                  </label>
                  <Layers className="w-4 h-4 text-slate-400" />
                </div>

                {isInstallment && (
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                      Quantidade de Parcelas
                    </label>
                    <select
                      value={installmentsCount}
                      onChange={(e) => setInstallmentsCount(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {Array.from({ length: 359 }, (_, i) => i + 2).map(num => (
                        <option key={num} value={num}>{num}x vezes</option>
                      ))}
                    </select>
                  </div>
                )}
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