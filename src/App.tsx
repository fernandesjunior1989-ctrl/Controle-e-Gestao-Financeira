import { useState, useEffect } from 'react';
import { 
  PlusCircle, Trash2, X, CreditCard, LogOut, Lock, User, Eye, EyeOff, KeyRound, ArrowRightLeft, BarChart3, ArrowDownRight
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
  recurringInfo?: string;
  installmentGroup?: string;
  deletedAt?: string;
  auditHistory?: string[];
}

interface InvoicePayment {
  id: string;
  cardId: string;
  monthKey: string;
  amountPaid: number;
  paymentDate: string;
  account: string;
  interestAndFees: number;
}

interface CategoryBudget {
  [categoryName: string]: number;
}

interface SystemUser {
  id: string;
  username: string;
  name: string;
  role: 'admin' | 'user';
  active: boolean;
  passwordHash: string;
}

export default function App() {
  const [users] = useState<SystemUser[]>(() => {
    const saved = localStorage.getItem('@controle_financeiro_users');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [
      {
        id: 'user-admin',
        username: 'admin',
        name: 'Administrador Master',
        role: 'admin',
        active: true,
        passwordHash: 'admin123'
      }
    ];
  });

  const [currentUser, setCurrentUser] = useState<SystemUser | null>(() => {
    const saved = localStorage.getItem('@controle_financeiro_current_session');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return null;
  });

  const [loginInput, setLoginInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const [currentModule, setCurrentModule] = useState<'transactions' | 'accounts' | 'cards' | 'payables' | 'receivables' | 'cashflow' | 'budget' | 'reports' | 'settings'>('transactions');

  // ESTADOS DO FILTRO DE PERÍODO (DATA INICIAL E FINAL)
  const [startDateFilter, setStartDateFilter] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  });
  const [endDateFilter, setEndDateFilter] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  });

  const [creditCards] = useState<CreditCardAccount[]>(() => {
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

  const [invoicePayments] = useState<InvoicePayment[]>(() => {
    const saved = localStorage.getItem('@controle_financeiro_invoice_payments');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [];
  });

  const [categories] = useState<string[]>(() => {
    const saved = localStorage.getItem('@controle_financeiro_categories');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return ['Alimentação', 'Habitação', 'Transporte', 'Saúde', 'Lazer', 'Trabalho', 'Serviços', 'Outros'];
  });

  const [budgets] = useState<CategoryBudget>(() => {
    const saved = localStorage.getItem('@controle_financeiro_budgets');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return { 'Alimentação': 1000, 'Habitação': 2000, 'Transporte': 600 };
  });

  const [accounts] = useState<string[]>(() => {
    const saved = localStorage.getItem('@controle_financeiro_accounts');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return ['Banco do Brasil', 'Bradesco', 'Carteira'];
  });

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(categories[0] || 'Outros');
  const [paymentSource] = useState<string>('acc-Banco do Brasil');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);

  const [launchMode] = useState<'single' | 'installment' | 'recurring'>('single');
  const [installmentModeType] = useState<'divide' | 'repeat'>('divide');
  const [installmentsCount] = useState('12');
  const [recurrencePeriod] = useState<string>('Mensal');

  const formatCurrency = (val: number): string => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const parseFormattedNumber = (valStr: string): number => {
    if (!valStr) return 0;
    const cleanStr = valStr.toString().replace(/\./g, '').replace(',', '.');
    return parseFloat(cleanStr) || 0;
  };

  useEffect(() => {
    localStorage.setItem('@controle_financeiro_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('@controle_financeiro_invoice_payments', JSON.stringify(invoicePayments));
  }, [invoicePayments]);

  useEffect(() => {
    localStorage.setItem('@controle_financeiro_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('@controle_financeiro_accounts', JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem('@controle_financeiro_credit_cards', JSON.stringify(creditCards));
  }, [creditCards]);

  useEffect(() => {
    localStorage.setItem('@controle_financeiro_budgets', JSON.stringify(budgets));
  }, [budgets]);

  useEffect(() => {
    localStorage.setItem('@controle_financeiro_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('@controle_financeiro_current_session', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('@controle_financeiro_current_session');
    }
  }, [currentUser]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const foundUser = users.find(u => u.username.toLowerCase() === loginInput.toLowerCase() && u.passwordHash === passwordInput);
    if (!foundUser) {
      setLoginError('Usuário ou senha inválidos.');
      return;
    }
    if (!foundUser.active) {
      setLoginError('Este usuário está desativado. Contate o administrador.');
      return;
    }

    setCurrentUser(foundUser);
    setCurrentModule('transactions');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setLoginInput('');
    setPasswordInput('');
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotSuccess(true);
    setTimeout(() => {
      setForgotSuccess(false);
      setIsForgotModalOpen(false);
      setForgotEmail('');
    }, 2500);
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 space-y-6 relative border border-slate-800">
          <div className="text-center space-y-2">
            <div className="mx-auto w-14 h-14 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center shadow-inner">
              <Lock className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Controle & Gestão Financeira</h1>
            <p className="text-xs text-slate-500">Entre com suas credenciais para acessar o sistema</p>
          </div>

          {loginError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl flex items-center gap-2">
              <span className="text-rose-600 font-bold">!</span>
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">Usuário ou E-mail</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  placeholder="Ex: admin"
                  value={loginInput}
                  onChange={(e) => setLoginInput(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">Senha de Acesso</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-400">Dica padrão: <strong>admin</strong> / <strong>admin123</strong></span>
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(true)}
                className="text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer transition"
              >
                Esqueci minha senha
              </button>
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition shadow-md cursor-pointer text-sm"
            >
              Entrar no Sistema
            </button>
          </form>
        </div>

        {isForgotModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-5 relative border border-slate-200">
              <div className="flex justify-between items-center border-b pb-3 border-slate-100">
                <h3 className="text-base font-bold text-slate-900">Recuperação de Senha</h3>
                <button onClick={() => setIsForgotModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {forgotSuccess ? (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-center text-xs space-y-1">
                  <strong>Instruções enviadas!</strong>
                  <p>Verifique seu e-mail cadastrado para redefinir sua senha.</p>
                </div>
              ) : (
                <form onSubmit={handleForgotSubmit} className="space-y-4 text-xs">
                  <p className="text-slate-500">Informe seu e-mail ou nome de usuário para receber as instruções de recuperação.</p>
                  <div>
                    <input
                      type="text"
                      required
                      placeholder="E-mail ou usuário"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl p-2.5 text-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl transition cursor-pointer"
                  >
                    Enviar Instruções
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  const activeTransactions = transactions.filter(t => !t.deletedAt);

  const getExpandedTransactions = () => {
    const result: Transaction[] = [];
    const startDateObj = startDateFilter ? new Date(startDateFilter + 'T00:00:00') : new Date();
    const viewedYear = startDateObj.getFullYear();
    const viewedMonth = startDateObj.getMonth();

    activeTransactions.forEach(t => {
      if (t.recurringInfo && t.recurringInfo.toLowerCase().includes('mensal') && !t.installmentGroup) {
        const origDateStr = t.dueDate || t.date;
        if (!origDateStr) {
          result.push(t);
          return;
        }

        const origDate = new Date(origDateStr + 'T00:00:00');
        const origYear = origDate.getFullYear();
        const origMonth = origDate.getMonth();
        const origDay = origDate.getDate();

        const diffMonths = (viewedYear - origYear) * 12 + (viewedMonth - origMonth);
        if (diffMonths >= 0) {
          const targetDay = Math.min(origDay, 28);
          const targetDateObj = new Date(viewedYear, viewedMonth, targetDay);
          const targetDateStr = targetDateObj.toISOString().split('T')[0];

          const existsReal = activeTransactions.some(sub => 
            sub.description.trim().toLowerCase() === t.description.trim().toLowerCase() &&
            sub.amount === t.amount &&
            sub.dueDate?.startsWith(`${viewedYear}-${String(viewedMonth + 1).padStart(2, '0')}`)
          );

          if (diffMonths === 0 || !existsReal) {
            result.push({
              ...t,
              id: diffMonths === 0 ? t.id : `${t.id}-rec-${viewedYear}-${viewedMonth}`,
              dueDate: targetDateStr,
              date: targetDateStr
            });
            return;
          }
        }
      }
      result.push(t);
    });

    return result;
  };

  const expandedActiveTransactions = getExpandedTransactions();

  const periodTransactions = expandedActiveTransactions.filter(t => {
    const itemDate = t.dueDate || t.date;
    if (startDateFilter && itemDate < startDateFilter) return false;
    if (endDateFilter && itemDate > endDateFilter) return false;
    return true;
  });

  const totalEntradasMes = periodTransactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalSaidasMes = periodTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const saldoMes = totalEntradasMes - totalSaidasMes;

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
    const baseAmount = parseFormattedNumber(amount);
    if (!description || baseAmount <= 0) return;

    let newTransactionsList = [...transactions];
    const groupId = crypto.randomUUID();

    const isCreditCard = paymentSource.startsWith('card-');
    const selectedCardId = isCreditCard ? paymentSource.replace('card-', '') : undefined;
    const selectedCard = creditCards.find(c => c.id === selectedCardId);
    const accountName = isCreditCard ? selectedCard?.name || 'Cartão' : paymentSource.replace('acc-', '');

    if (launchMode === 'installment') {
      const totalParts = parseInt(installmentsCount);

      if (installmentModeType === 'divide') {
        const exactPartVal = baseAmount / totalParts;
        let accumulated = 0;

        for (let i = 1; i <= totalParts; i++) {
          let dueDate = purchaseDate;
          if (selectedCard) {
            dueDate = calculateInvoiceDueDate(purchaseDate, selectedCard, i - 1);
          } else {
            const d = new Date(purchaseDate + 'T00:00:00');
            d.setMonth(d.getMonth() + (i - 1));
            dueDate = d.toISOString().split('T')[0];
          }

          let currentPartVal = parseFloat(exactPartVal.toFixed(2));
          if (i === totalParts) {
            currentPartVal = parseFloat((baseAmount - accumulated).toFixed(2));
          } else {
            accumulated += currentPartVal;
          }

          newTransactionsList.push({
            id: crypto.randomUUID(),
            description: `${description} (${i}/${totalParts})`,
            category: category || categories[0],
            account: accountName,
            creditCardId: selectedCardId,
            date: purchaseDate,
            dueDate: dueDate,
            amount: currentPartVal,
            type,
            status: 'pending',
            installmentInfo: `Parcela ${i}/${totalParts}`,
            installmentGroup: groupId,
            auditHistory: [`Criado por ${currentUser.username} em ${new Date().toLocaleString('pt-BR')}`]
          });
        }
      } else {
        for (let i = 1; i <= totalParts; i++) {
          let dueDate = purchaseDate;
          if (selectedCard) {
            dueDate = calculateInvoiceDueDate(purchaseDate, selectedCard, i - 1);
          } else {
            const d = new Date(purchaseDate + 'T00:00:00');
            d.setMonth(d.getMonth() + (i - 1));
            dueDate = d.toISOString().split('T')[0];
          }

          newTransactionsList.push({
            id: crypto.randomUUID(),
            description: `${description} (${i}/${totalParts})`,
            category: category || categories[0],
            account: accountName,
            creditCardId: selectedCardId,
            date: purchaseDate,
            dueDate: dueDate,
            amount: baseAmount,
            type,
            status: 'pending',
            installmentInfo: `Parcela ${i}/${totalParts}`,
            installmentGroup: groupId,
            auditHistory: [`Criado por ${currentUser.username} em ${new Date().toLocaleString('pt-BR')}`]
          });
        }
      }
    } else {
      let dueDate = purchaseDate;
      if (selectedCard) {
        dueDate = calculateInvoiceDueDate(purchaseDate, selectedCard, 0);
      }

      newTransactionsList.push({
        id: crypto.randomUUID(),
        description,
        category: category || categories[0],
        account: accountName,
        creditCardId: selectedCardId,
        date: purchaseDate,
        dueDate: dueDate,
        amount: baseAmount,
        type,
        status: 'pending',
        recurringInfo: launchMode === 'recurring' ? recurrencePeriod : undefined,
        installmentGroup: launchMode === 'recurring' ? groupId : undefined,
        auditHistory: [`Criado por ${currentUser.username} em ${new Date().toLocaleString('pt-BR')}`]
      });
    }

    setTransactions(newTransactionsList);
    setIsModalOpen(false);
    setDescription('');
    setAmount('');
  };

  const toggleTransactionStatus = (id: string) => {
    setTransactions(prev =>
      prev.map(t => {
        if (t.id === id) {
          const newStatus = t.status === 'paid' ? 'pending' : 'paid';
          const history = t.auditHistory || [];
          return {
            ...t,
            status: newStatus,
            auditHistory: [
              ...history,
              `Status alterado para ${newStatus === 'paid' ? 'Pago' : 'Pendente'} por ${currentUser?.username} em ${new Date().toLocaleString('pt-BR')}`
            ]
          };
        }
        return t;
      })
    );
  };

  const moveToTrash = (id: string) => {
    const timestamp = new Date().toISOString();
    setTransactions(prev =>
      prev.map(t => (t.id === id ? { ...t, deletedAt: timestamp } : t))
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md">
            CF
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900">Controle Financeiro</h1>
            <p className="text-xs text-slate-500">Logado como: <strong>{currentUser.name}</strong></p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs">
            <span className="font-semibold text-slate-600">Período:</span>
            <input
              type="date"
              value={startDateFilter}
              onChange={(e) => setStartDateFilter(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs"
            />
            <span className="text-slate-400">até</span>
            <input
              type="date"
              value={endDateFilter}
              onChange={(e) => setEndDateFilter(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs"
            />
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-700 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col p-4 space-y-2">
          <button
            onClick={() => setCurrentModule('transactions')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition cursor-pointer ${currentModule === 'transactions' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <ArrowRightLeft className="w-5 h-5" />
            Transações
          </button>
          <button
            onClick={() => setCurrentModule('cards')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition cursor-pointer ${currentModule === 'cards' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <CreditCard className="w-5 h-5" />
            Cartões de Crédito
          </button>
          <button
            onClick={() => setCurrentModule('cashflow')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition cursor-pointer ${currentModule === 'cashflow' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <BarChart3 className="w-5 h-5" />
            Fluxo de Caixa
          </button>
        </aside>

        <main className="flex-1 p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase">Total Entradas</p>
                <h3 className="text-xl font-bold text-emerald-600 mt-1">{formatCurrency(totalEntradasMes)}</h3>
              </div>
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                <ArrowRightLeft className="w-6 h-6 rotate-45" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase">Total Saídas</p>
                <h3 className="text-xl font-bold text-rose-600 mt-1">{formatCurrency(totalSaidasMes)}</h3>
              </div>
              <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
                <ArrowDownRight className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase">Saldo do Período</p>
                <h3 className={`text-xl font-bold mt-1 ${saldoMes >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>{formatCurrency(saldoMes)}</h3>
              </div>
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900">Extrato de Transações no Período</h3>
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition cursor-pointer shadow-md"
              >
                <PlusCircle className="w-4 h-4" />
                Nova Transação
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase border-b border-slate-200">
                  <tr>
                    <th className="p-3">Status</th>
                    <th className="p-3">Descrição</th>
                    <th className="p-3">Categoria</th>
                    <th className="p-3">Conta / Cartão</th>
                    <th className="p-3">Vencimento</th>
                    <th className="p-3">Valor</th>
                    <th className="p-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {periodTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-400">
                        Nenhuma transação encontrada no período selecionado.
                      </td>
                    </tr>
                  ) : (
                    periodTransactions.map(t => (
                      <tr key={t.id} className="hover:bg-slate-50 transition">
                        <td className="p-3">
                          <button
                            onClick={() => toggleTransactionStatus(t.id)}
                            className={`px-2.5 py-1 rounded-full font-semibold cursor-pointer transition ${t.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}
                          >
                            {t.status === 'paid' ? 'Pago' : 'Pendente'}
                          </button>
                        </td>
                        <td className="p-3 font-medium text-slate-900">{t.description}</td>
                        <td className="p-3 text-slate-600">{t.category}</td>
                        <td className="p-3 text-slate-600">{t.account}</td>
                        <td className="p-3 text-slate-600">{t.dueDate?.split('-').reverse().join('/')}</td>
                        <td className={`p-3 font-bold ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {t.type === 'income' ? '+ ' : '- '}{formatCurrency(t.amount)}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => moveToTrash(t.id)}
                            className="text-slate-400 hover:text-rose-600 cursor-pointer p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-5 relative border border-slate-200">
            <div className="flex justify-between items-center border-b pb-3 border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Nova Transação</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddTransaction} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Descrição</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Supermercado"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Valor (R$)</label>
                  <input
                    type="text"
                    required
                    placeholder="0,00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Tipo</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as 'income' | 'expense')}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-sm bg-white"
                  >
                    <option value="expense">Despesa</option>
                    <option value="income">Receita</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Categoria</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-sm bg-white"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Data</label>
                  <input
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition shadow-md cursor-pointer"
                >
                  Salvar Transação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}