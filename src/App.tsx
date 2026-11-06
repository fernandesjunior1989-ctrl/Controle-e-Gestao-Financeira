import { useState, useEffect } from 'react';
import { 
  PlusCircle, Trash2, X, Save, 
  AlertTriangle, CheckCircle2, Clock, Building2, CreditCard, Settings, ChevronLeft, ChevronRight, Target, TrendingUp as TrendUp, Download, Trash, RotateCcw, CheckSquare, Square, Edit3, DollarSign, ArrowRightLeft, BarChart3, Lock, User, Eye, EyeOff, LogOut, KeyRound, Menu, ArrowDownRight, Tag, PanelLeftClose, PanelLeftOpen, Calendar, Sparkles, Filter
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // ESTADOS DO FILTRO DE PERÍODO (DIA, MÊS, ANO)
  const [periodFilterMode, setPeriodFilterMode] = useState<'month' | 'day' | 'year' | 'custom'>('month');
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  });

  // ESTADOS PARA FILTRO CUSTOMIZADO POR DATA NOS LANÇAMENTOS
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // ANOS DINÂMICOS AUTOMÁTICOS
  const currentSystemYear = new Date().getFullYear();
  const availableYears = Array.from({ length: 18 }, (_, i) => (currentSystemYear - 2) + i);

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

  const [invoicePayments] = useState<InvoicePayment[]>(() => {
    const saved = localStorage.getItem('@controle_financeiro_invoice_payments');
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

  const [budgets] = useState<CategoryBudget>(() => {
    const saved = localStorage.getItem('@controle_financeiro_budgets');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return { 'Alimentação': 1000, 'Habitação': 2000, 'Transporte': 600 };
  });

  const [accounts, setAccounts] = useState<string[]>(() => {
    const saved = localStorage.getItem('@controle_financeiro_accounts');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return ['Banco do Brasil', 'Bradesco', 'Carteira'];
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTrashModalOpen, setIsTrashModalOpen] = useState(false);
  const [duplicateMessage, setDuplicateMessage] = useState<string | null>(null);

  // ESTADOS DE EDIÇÃO
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editScope, setEditScope] = useState<'single' | 'forward' | 'all'>('single');
  const [editDescription, setEditDescription] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editType, setEditType] = useState<'income' | 'expense'>('expense');
  
  const [editLaunchMode, setEditLaunchMode] = useState<'single' | 'installment' | 'recurring'>('single');
  const [editInstallmentModeType, setEditInstallmentModeType] = useState<'divide' | 'repeat'>('divide');
  const [editInstallmentsCount, setEditInstallmentsCount] = useState('12');
  const [editRecurrencePeriod, setEditRecurrencePeriod] = useState<string>('Mensal');
  const [editRecurrenceEndType, setEditRecurrenceEndType] = useState<'indeterminate' | 'date'>('indeterminate');
  const [editRecurrenceEndDate, setEditRecurrenceEndDate] = useState('');

  const [isNatureChangeConfirmOpen, setIsNatureChangeConfirmOpen] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [deleteOption, setDeleteOption] = useState<'single' | 'forward' | 'all'>('single');

  const [isBatchDeleteModalOpen, setIsBatchDeleteModalOpen] = useState(false);
  const [selectedTransactionIds, setSelectedTransactionIds] = useState<string[]>([]);

  // ESTADOS DA LIXEIRA
  const [selectedTrashIds, setSelectedTrashIds] = useState<string[]>([]);
  const [isPermanentDeleteModalOpen, setIsPermanentDeleteModalOpen] = useState(false);
  const [permanentIdToDelete, setPermanentIdToDelete] = useState<string | null>(null);
  const [isBatchPermanentModalOpen, setIsBatchPermanentModalOpen] = useState(false);

  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(categories[0] || 'Outros');
  const [paymentSource, setPaymentSource] = useState<string>('acc-Banco do Brasil');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [status] = useState<'paid' | 'pending'>('pending');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);

  const [launchMode, setLaunchMode] = useState<'single' | 'installment' | 'recurring'>('single');
  const [installmentModeType, setInstallmentModeType] = useState<'divide' | 'repeat'>('divide');
  const [installmentsCount, setInstallmentsCount] = useState('12');

  const [recurrencePeriod, setRecurrencePeriod] = useState<string>('Mensal');
  const [recurrenceEndType, setRecurrenceEndType] = useState<'indeterminate' | 'date'>('indeterminate');
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');

  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCardView, setSelectedCardView] = useState<string>(creditCards[0]?.id || '');

  // FUNÇÃO AUXILIAR PARA FORMATAR MOEDA NO PADRÃO BRASILEIRO (R$ X.XXX,XX)
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
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
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
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
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

  // NAVEGAÇÃO TEMPORAL
  const handlePrevPeriod = () => {
    const d = new Date(currentDate);
    if (periodFilterMode === 'day') {
      d.setDate(d.getDate() - 1);
    } else if (periodFilterMode === 'month') {
      d.setMonth(d.getMonth() - 1);
    } else {
      d.setFullYear(d.getFullYear() - 1);
    }
    setCurrentDate(d);
  };

  const handleNextPeriod = () => {
    const d = new Date(currentDate);
    if (periodFilterMode === 'day') {
      d.setDate(d.getDate() + 1);
    } else if (periodFilterMode === 'month') {
      d.setMonth(d.getMonth() + 1);
    } else {
      d.setFullYear(d.getFullYear() + 1);
    }
    setCurrentDate(d);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newYear = parseInt(e.target.value);
    const d = new Date(currentDate);
    d.setFullYear(newYear);
    setCurrentDate(d);
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMonth = parseInt(e.target.value);
    const d = new Date(currentDate);
    d.setMonth(newMonth);
    setCurrentDate(d);
  };

  const handleDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value) return;
    const [y, m, d] = e.target.value.split('-').map(Number);
    setCurrentDate(new Date(y, m - 1, d));
  };

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const currentDay = currentDate.getDate();
  const monthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  const dayStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(currentDay).padStart(2, '0')}`;

  const monthName = currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
  const dayFormattedName = currentDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const activeTransactions = transactions.filter(t => !t.deletedAt);
  const trashedTransactions = transactions.filter(t => t.deletedAt);

  const handleRemoveDuplicates = () => {
    const seen = new Set<string>();
    let removedCount = 0;

    const cleanedTransactions = transactions.filter(t => {
      const key = `${t.description.trim().toLowerCase()}_${t.amount}_${t.dueDate || t.date}_${t.type}_${t.account}`;
      if (seen.has(key)) {
        removedCount++;
        return false;
      }
      seen.add(key);
      return true;
    });

    setTransactions(cleanedTransactions);
    setDuplicateMessage(`Limpeza concluída! ${removedCount} lançamento(s) duplicado(s) removido(s).`);
    setTimeout(() => setDuplicateMessage(null), 4000);
  };

  const getExpandedTransactions = () => {
    const result: Transaction[] = [];
    const viewedYear = currentYear;
    const viewedMonth = currentMonth;

    activeTransactions.forEach(t => {
      if (t.recurringInfo && t.recurringInfo.includes('Mensal') && !t.installmentGroup) {
        const origDate = new Date((t.dueDate || t.date) + 'T00:00:00');
        const origYear = origDate.getFullYear();
        const origMonth = origDate.getMonth();
        const origDay = origDate.getDate();

        const diffMonths = (viewedYear - origYear) * 12 + (viewedMonth - origMonth);
        if (diffMonths >= 0) {
          const targetDateObj = new Date(viewedYear, viewedMonth, Math.min(origDay, 28));
          const targetDateStr = targetDateObj.toISOString().split('T')[0];

          const existsReal = activeTransactions.some(sub => 
            sub.installmentGroup === t.installmentGroup && 
            sub.dueDate?.startsWith(`${viewedYear}-${String(viewedMonth + 1).padStart(2, '0')}`)
          );

          if (!existsReal || diffMonths === 0) {
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
    if (periodFilterMode === 'custom') {
      if (customStartDate && itemDate < customStartDate) return false;
      if (customEndDate && itemDate > customEndDate) return false;
      return true;
    }

    const targetDate = new Date(itemDate + 'T00:00:00');
    if (periodFilterMode === 'day') {
      return (
        targetDate.getFullYear() === currentYear &&
        targetDate.getMonth() === currentMonth &&
        targetDate.getDate() === currentDay
      );
    } else if (periodFilterMode === 'month') {
      return (
        targetDate.getFullYear() === currentYear &&
        targetDate.getMonth() === currentMonth
      );
    } else {
      return targetDate.getFullYear() === currentYear;
    }
  });

  const totalEntradasMes = periodTransactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalSaidasMes = periodTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const saldoMes = totalEntradasMes - totalSaidasMes;

  const cashFlowProjections = Array.from({ length: 6 }, (_, index) => {
    const projDate = new Date(currentYear, currentMonth + index, 1);
    const pYear = projDate.getFullYear();
    const pMonth = projDate.getMonth();
    const pName = projDate.toLocaleString('pt-BR', { month: 'short', year: '2-digit' });

    const pTxs = expandedActiveTransactions.filter(t => {
      const targetDate = new Date((t.dueDate || t.date) + 'T00:00:00');
      return targetDate.getFullYear() === pYear && targetDate.getMonth() === pMonth;
    });

    const pIncome = pTxs.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const pExpense = pTxs.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const pBalance = pIncome - pExpense;

    return { name: pName, income: pIncome, expense: pExpense, balance: pBalance };
  });

  const getBroughtForwardBalance = (cardId: string, targetYear: number, targetMonth: number) => {
    let prevYear = targetYear;
    let prevMonth = targetMonth - 1;
    if (prevMonth < 0) {
      prevMonth = 11;
      prevYear -= 1;
    }
    const prevMonthKey = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}`;

    const prevTxs = expandedActiveTransactions.filter(t => {
      if (t.creditCardId !== cardId) return false;
      const d = new Date((t.dueDate || t.date) + 'T00:00:00');
      return d.getFullYear() === prevYear && d.getMonth() === prevMonth;
    });
    const prevTotal = prevTxs.reduce((acc, t) => acc + t.amount, 0);
    const prevPayments = invoicePayments
      .filter(p => p.cardId === cardId && p.monthKey === prevMonthKey)
      .reduce((acc, p) => acc + p.amountPaid, 0);

    const diff = prevTotal - prevPayments;
    return diff > 0 ? diff : 0;
  };

  const activeCard = creditCards.find(c => c.id === selectedCardView) || creditCards[0];
  const broughtForward = activeCard ? getBroughtForwardBalance(activeCard.id, currentYear, currentMonth) : 0;

  const getCardLimitDetails = (cardId: string) => {
    const card = creditCards.find(c => c.id === cardId);
    if (!card) return { total: 0, used: 0, available: 0 };
    
    const used = expandedActiveTransactions
      .filter(t => t.creditCardId === cardId && t.status === 'pending')
      .reduce((acc, t) => acc + t.amount, 0);

    return {
      total: card.totalLimit,
      used: used + broughtForward,
      available: card.totalLimit - (used + broughtForward)
    };
  };

  const activeCardLimit = activeCard ? getCardLimitDetails(activeCard.id) : null;
  const activeCardMonthTransactions = activeCard 
    ? periodTransactions.filter(t => t.creditCardId === activeCard.id) 
    : [];

  const invoiceMonthTotal = activeCardMonthTransactions.reduce((acc, t) => acc + t.amount, 0) + broughtForward;
  const cardPaymentsThisMonth = activeCard ? invoicePayments.filter(p => p.cardId === activeCard.id && p.monthKey === monthKey) : [];
  const totalPaidThisMonth = cardPaymentsThisMonth.reduce((acc, p) => acc + p.amountPaid, 0);
  const totalFeesThisMonth = cardPaymentsThisMonth.reduce((acc, p) => acc + p.interestAndFees, 0);
  const pendingInvoiceMonthTotal = Math.max(0, (invoiceMonthTotal + totalFeesThisMonth) - totalPaidThisMonth);

  const invoiceStatus = pendingInvoiceMonthTotal === 0 
    ? 'Paga' 
    : totalPaidThisMonth > 0 
    ? 'Parcialmente Paga' 
    : 'Aberta';

  const exportToCSV = () => {
    const headers = ["Status", "Descricao", "Conta/Cartao", "Categoria", "Vencimento", "Tipo", "Valor"];
    const rows = periodTransactions.map(t => [
      t.status === 'paid' ? 'Pago' : 'Pendente',
      `"${t.description}"`,
      `"${t.account}"`,
      `"${t.category}"`,
      t.dueDate || t.date,
      t.type === 'income' ? 'Receita' : 'Despesa',
      t.amount.toFixed(2).replace('.', ',')
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(";"), ...rows.map(e => e.join(";"))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `extrato_filtrado.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

          const installmentTransaction: Transaction = {
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
            auditHistory: [`Criado por ${currentUser.username} em ${new Date().toLocaleString()}`]
          };
          newTransactionsList.unshift(installmentTransaction);
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

          const installmentTransaction: Transaction = {
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
            auditHistory: [`Criado por ${currentUser.username} em ${new Date().toLocaleString()}`]
          };
          newTransactionsList.unshift(installmentTransaction);
        }
      }
    } else if (launchMode === 'recurring') {
      const baseDateObj = new Date(purchaseDate + 'T00:00:00');
      let iterations = recurrenceEndType === 'indeterminate' ? 1 : 12;
      
      let stepDays = 30;
      if (recurrencePeriod === 'Diária') stepDays = 1;
      else if (recurrencePeriod === 'Semanal') stepDays = 7;
      else if (recurrencePeriod === 'Quinzenal') stepDays = 15;
      else if (recurrencePeriod === 'Mensal') stepDays = 30;
      else if (recurrencePeriod === 'Bimestral') stepDays = 60;
      else if (recurrencePeriod === 'Trimestral') stepDays = 90;
      else if (recurrencePeriod === 'Semestral') stepDays = 180;
      else if (recurrencePeriod === 'Anual') stepDays = 365;

      if (recurrenceEndType === 'date' && recurrenceEndDate) {
        const endObj = new Date(recurrenceEndDate + 'T00:00:00');
        const diffTime = Math.abs(endObj.getTime() - baseDateObj.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        iterations = Math.max(1, Math.floor(diffDays / (stepDays || 30)));
      }

      for (let i = 0; i < iterations; i++) {
        const currentD = new Date(baseDateObj);
        if (recurrencePeriod === 'Anual') {
          currentD.setFullYear(baseDateObj.getFullYear() + i);
        } else if (recurrencePeriod === 'Mensal' || recurrencePeriod === 'Bimestral' || recurrencePeriod === 'Trimestral' || recurrencePeriod === 'Semestral') {
          const monthsAdd = recurrencePeriod === 'Mensal' ? i : recurrencePeriod === 'Bimestral' ? i * 2 : recurrencePeriod === 'Trimestral' ? i * 3 : i * 6;
          currentD.setMonth(baseDateObj.getMonth() + monthsAdd);
        } else {
          currentD.setDate(baseDateObj.getDate() + (i * stepDays));
        }

        const formattedDate = currentD.toISOString().split('T')[0];

        const recurringTransaction: Transaction = {
          id: crypto.randomUUID(),
          description,
          category: category || categories[0],
          account: accountName,
          creditCardId: selectedCardId,
          date: formattedDate,
          dueDate: formattedDate,
          amount: baseAmount,
          type,
          status: i === 0 ? status : 'pending',
          recurringInfo: `Recorrente (${recurrencePeriod})`,
          installmentGroup: groupId,
          auditHistory: [`Criado por ${currentUser.username} em ${new Date().toLocaleString()}`]
        };
        newTransactionsList.unshift(recurringTransaction);
      }
    } else {
      const singleTransaction: Transaction = {
        id: crypto.randomUUID(),
        description,
        category: category || categories[0],
        account: accountName,
        creditCardId: selectedCardId,
        date: purchaseDate,
        dueDate: purchaseDate,
        amount: baseAmount,
        type,
        status,
        installmentGroup: groupId,
        auditHistory: [`Criado por ${currentUser.username} em ${new Date().toLocaleString()}`]
      };
      newTransactionsList.unshift(singleTransaction);
    }

    setTransactions(newTransactionsList);
    setDescription('');
    setAmount('');
    setLaunchMode('single');
    setIsModalOpen(false);
  };

  const openEditAccountModal = (accName: string) => {
    setAccounts(accounts.map(a => a === accName ? accName : a));
  };

  const openEditCategoryModal = (catName: string) => {
    setCategories(categories.map(c => c === catName ? catName : c));
  };

  const openEditCardModal = (card: CreditCardAccount) => {
    setCreditCards(creditCards.map(c => c.id === card.id ? card : c));
  };

  const toggleStatus = (id: string) => {
    setTransactions(transactions.map(t => {
      if (t.id === id) {
        return { ...t, status: t.status === 'paid' ? 'pending' : 'paid' };
      }
      return t;
    }));
  };

  const openEditModal = (t: Transaction) => {
    setEditingTransaction(t);
    const cleanDesc = t.description.replace(/\s\(\d+\/\d+\)$/, '');
    setEditDescription(cleanDesc);
    setEditAmount(t.amount.toString());
    setEditCategory(t.category);
    setEditDueDate(t.dueDate || t.date);
    setEditType(t.type);
    setEditScope('single');

    if (t.installmentInfo) {
      setEditLaunchMode('installment');
    } else if (t.recurringInfo) {
      setEditLaunchMode('recurring');
    } else {
      setEditLaunchMode('single');
    }

    setIsEditModalOpen(true);
  };

  const handleAttemptSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransaction) return;

    if (editingTransaction.type !== editType) {
      setIsNatureChangeConfirmOpen(true);
      return;
    }

    executeFinalEdit();
  };

  const executeFinalEdit = () => {
    if (!editingTransaction) return;
    const newAmt = parseFormattedNumber(editAmount);
    if (newAmt <= 0) return;

    const targetGroup = editingTransaction.installmentGroup;

    if (editLaunchMode === 'installment' || editLaunchMode === 'recurring') {
      const filteredList = transactions.filter(t => t.id !== editingTransaction.id);
      
      let newTransactionsList = [...filteredList];
      const newGroupId = crypto.randomUUID();
      const baseDate = editDueDate;

      if (editLaunchMode === 'installment') {
        const totalParts = parseInt(editInstallmentsCount);
        if (editInstallmentModeType === 'divide') {
          const exactPartVal = newAmt / totalParts;
          let accumulated = 0;
          for (let i = 1; i <= totalParts; i++) {
            const d = new Date(baseDate + 'T00:00:00');
            d.setMonth(d.getMonth() + (i - 1));
            const dueDateStr = d.toISOString().split('T')[0];

            let currentPartVal = parseFloat(exactPartVal.toFixed(2));
            if (i === totalParts) {
              currentPartVal = parseFloat((newAmt - accumulated).toFixed(2));
            } else {
              accumulated += currentPartVal;
            }

            const item: Transaction = {
              id: crypto.randomUUID(),
              description: `${editDescription} (${i}/${totalParts})`,
              category: editCategory,
              account: editingTransaction.account,
              creditCardId: editingTransaction.creditCardId,
              date: baseDate,
              dueDate: dueDateStr,
              amount: currentPartVal,
              type: editType,
              status: 'pending',
              installmentInfo: `Parcela ${i}/${totalParts}`,
              installmentGroup: newGroupId,
              auditHistory: [...(editingTransaction.auditHistory || []), `Convertido para parcelado por ${currentUser.username} em ${new Date().toLocaleString()}`]
            };
            newTransactionsList.unshift(item);
          }
        } else {
          for (let i = 1; i <= totalParts; i++) {
            const d = new Date(baseDate + 'T00:00:00');
            d.setMonth(d.getMonth() + (i - 1));
            const dueDateStr = d.toISOString().split('T')[0];

            const item: Transaction = {
              id: crypto.randomUUID(),
              description: `${editDescription} (${i}/${totalParts})`,
              category: editCategory,
              account: editingTransaction.account,
              creditCardId: editingTransaction.creditCardId,
              date: baseDate,
              dueDate: dueDateStr,
              amount: newAmt,
              type: editType,
              status: 'pending',
              installmentInfo: `Parcela ${i}/${totalParts}`,
              installmentGroup: newGroupId,
              auditHistory: [...(editingTransaction.auditHistory || []), `Convertido para parcelado por ${currentUser.username} em ${new Date().toLocaleString()}`]
            };
            newTransactionsList.unshift(item);
          }
        }
      } else if (editLaunchMode === 'recurring') {
        const baseDateObj = new Date(baseDate + 'T00:00:00');
        let iterations = editRecurrenceEndType === 'indeterminate' ? 1 : 12;
        let stepDays = 30;
        if (editRecurrencePeriod === 'Diária') stepDays = 1;
        else if (editRecurrencePeriod === 'Semanal') stepDays = 7;
        else if (editRecurrencePeriod === 'Quinzenal') stepDays = 15;
        else if (editRecurrencePeriod === 'Mensal') stepDays = 30;
        else if (editRecurrencePeriod === 'Bimestral') stepDays = 60;
        else if (editRecurrencePeriod === 'Trimestral') stepDays = 90;
        else if (editRecurrencePeriod === 'Semestral') stepDays = 180;
        else if (editRecurrencePeriod === 'Anual') stepDays = 365;

        if (editRecurrenceEndType === 'date' && editRecurrenceEndDate) {
          const endObj = new Date(editRecurrenceEndDate + 'T00:00:00');
          const diffTime = Math.abs(endObj.getTime() - baseDateObj.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          iterations = Math.max(1, Math.floor(diffDays / (stepDays || 30)));
        }

        for (let i = 0; i < iterations; i++) {
          const currentD = new Date(baseDateObj);
          if (editRecurrencePeriod === 'Anual') {
            currentD.setFullYear(baseDateObj.getFullYear() + i);
          } else if (editRecurrencePeriod === 'Mensal' || editRecurrencePeriod === 'Bimestral' || editRecurrencePeriod === 'Trimestral' || editRecurrencePeriod === 'Semestral') {
            const monthsAdd = editRecurrencePeriod === 'Mensal' ? i : editRecurrencePeriod === 'Bimestral' ? i * 2 : editRecurrencePeriod === 'Trimestral' ? i * 3 : i * 6;
            currentD.setMonth(baseDateObj.getMonth() + monthsAdd);
          } else {
            currentD.setDate(baseDateObj.getDate() + (i * stepDays));
          }
          const formattedDate = currentD.toISOString().split('T')[0];

          const item: Transaction = {
            id: crypto.randomUUID(),
            description: editDescription,
            category: editCategory,
            account: editingTransaction.account,
            creditCardId: editingTransaction.creditCardId,
            date: formattedDate,
            dueDate: formattedDate,
            amount: newAmt,
            type: editType,
            status: i === 0 ? editingTransaction.status : 'pending',
            recurringInfo: `Recorrente (${editRecurrencePeriod})`,
            installmentGroup: newGroupId,
            auditHistory: [...(editingTransaction.auditHistory || []), `Convertido para recorrente por ${currentUser.username} em ${new Date().toLocaleString()}`]
          };
          newTransactionsList.unshift(item);
        }
      }

      setTransactions(newTransactionsList);
    } else {
      const auditMsg = `Editado por ${currentUser.username} em ${new Date().toLocaleString()}: alterado para R$ ${newAmt}`;

      setTransactions(transactions.map(t => {
        if (t.id === editingTransaction.id) {
          const formattedDesc = t.installmentInfo 
            ? `${editDescription} (${t.installmentInfo.replace('Parcela ', '')})` 
            : editDescription;

          return {
            ...t,
            description: formattedDesc,
            amount: newAmt,
            category: editCategory,
            dueDate: editDueDate,
            type: editType,
            auditHistory: [...(t.auditHistory || []), auditMsg]
          };
        }

        if (targetGroup && t.installmentGroup === targetGroup) {
          if (editScope === 'forward' && t.dueDate > editingTransaction.dueDate) {
            const formattedDesc = t.installmentInfo 
              ? `${editDescription} (${t.installmentInfo.replace('Parcela ', '')})` 
              : editDescription;

            return {
              ...t,
              description: formattedDesc,
              amount: newAmt,
              category: editCategory,
              type: editType
            };
          }
          if (editScope === 'all') {
            const formattedDesc = t.installmentInfo 
              ? `${editDescription} (${t.installmentInfo.replace('Parcela ', '')})` 
              : editDescription;

            return {
              ...t,
              description: formattedDesc,
              amount: newAmt,
              category: editCategory,
              type: editType
            };
          }
        }

        return t;
      }));
    }

    setIsNatureChangeConfirmOpen(false);
    setIsEditModalOpen(false);
    setEditingTransaction(null);
  };

  const confirmDelete = (transaction: Transaction) => {
    setTransactionToDelete(transaction);
    setDeleteOption('single');
    setIsDeleteModalOpen(true);
  };

  const executeSoftDelete = () => {
    if (!transactionToDelete) return;
    const nowIso = new Date().toISOString();
    const targetGroup = transactionToDelete.installmentGroup;

    setTransactions(transactions.map(t => {
      if (t.id === transactionToDelete.id) {
        return { ...t, deletedAt: nowIso };
      }
      if (targetGroup && t.installmentGroup === targetGroup) {
        if (deleteOption === 'all') {
          return { ...t, deletedAt: nowIso };
        }
        if (deleteOption === 'forward' && t.dueDate >= transactionToDelete.dueDate) {
          return { ...t, deletedAt: nowIso };
        }
      }
      return t;
    }));

    setIsDeleteModalOpen(false);
    setTransactionToDelete(null);
  };

  const toggleSelectAll = (type: 'income' | 'expense') => {
    const list = type === 'income' ? filteredIncomes : filteredExpenses;
    const listIds = list.map(t => t.id);
    const allSelected = listIds.every(id => selectedTransactionIds.includes(id));

    if (allSelected) {
      setSelectedTransactionIds(selectedTransactionIds.filter(id => !listIds.includes(id)));
    } else {
      const combined = Array.from(new Set([...selectedTransactionIds, ...listIds]));
      setSelectedTransactionIds(combined);
    }
  };

  const toggleSelectOne = (id: string) => {
    if (selectedTransactionIds.includes(id)) {
      setSelectedTransactionIds(selectedTransactionIds.filter(itemId => itemId !== id));
    } else {
      setSelectedTransactionIds([...selectedTransactionIds, id]);
    }
  };

  const executeBatchDelete = () => {
    const nowIso = new Date().toISOString();
    setTransactions(transactions.map(t => {
      if (selectedTransactionIds.includes(t.id)) {
        return { ...t, deletedAt: nowIso };
      }
      return t;
    }));
    setSelectedTransactionIds([]);
    setIsBatchDeleteModalOpen(false);
  };

  const restoreFromTrash = (id: string) => {
    setTransactions(transactions.map(t => {
      if (t.id === id) {
        const { deletedAt, ...rest } = t;
        return rest;
      }
      return t;
    }));
  };

  const restoreBatchFromTrash = () => {
    setTransactions(transactions.map(t => {
      if (selectedTrashIds.includes(t.id)) {
        const { deletedAt, ...rest } = t;
        return rest;
      }
      return t;
    }));
    setSelectedTrashIds([]);
  };

  const toggleSelectAllTrash = () => {
    const allIds = trashedTransactions.map(t => t.id);
    const allSelected = allIds.every(id => selectedTrashIds.includes(id));
    if (allSelected) {
      setSelectedTrashIds([]);
    } else {
      setSelectedTrashIds(allIds);
    }
  };

  const toggleSelectTrashOne = (id: string) => {
    if (selectedTrashIds.includes(id)) {
      setSelectedTrashIds(selectedTrashIds.filter(itemId => itemId !== id));
    } else {
      setSelectedTrashIds([...selectedTrashIds, id]);
    }
  };

  const confirmPermanentDelete = (id: string) => {
    setPermanentIdToDelete(id);
    setIsPermanentDeleteModalOpen(true);
  };

  const executePermanentDelete = () => {
    if (!permanentIdToDelete) return;
    setTransactions(transactions.filter(t => t.id !== permanentIdToDelete));
    setIsPermanentDeleteModalOpen(false);
    setPermanentIdToDelete(null);
  };

  const executeBatchPermanentDelete = () => {
    setTransactions(transactions.filter(t => !selectedTrashIds.includes(t.id)));
    setSelectedTrashIds([]);
    setIsBatchPermanentModalOpen(false);
  };

  const baseFiltered = periodTransactions.filter(t => {
    const matchesCategory = selectedCategoryFilter === 'all' || t.category === selectedCategoryFilter;
    const matchesSearch = searchQuery === '' || 
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
      t.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const filteredIncomes = baseFiltered.filter(t => t.type === 'income');
  const filteredExpenses = baseFiltered.filter(t => t.type === 'expense');

  const batchTotalAmount = transactions
    .filter(t => selectedTransactionIds.includes(t.id))
    .reduce((acc, t) => acc + t.amount, 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col md:flex-row">
      
      {/* MENU LATERAL DE NAVEGAÇÃO */}
      <aside className={`fixed inset-y-0 left-0 z-40 bg-slate-900 text-slate-300 transform transition-all duration-300 ease-in-out md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'} ${isSidebarCollapsed ? 'md:w-20' : 'md:w-64'} w-64 flex flex-col justify-between border-r border-slate-800 shadow-xl`}>
        <div className="p-4 md:p-5 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            {!isSidebarCollapsed && (
              <div className="overflow-hidden">
                <h2 className="font-bold text-white text-sm md:text-base tracking-wide truncate">Gestão Financeira</h2>
                <p className="text-[10px] text-slate-400">Painel Operacional</p>
              </div>
            )}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="hidden md:flex p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
                title={isSidebarCollapsed ? "Expandir menu" : "Recolher menu"}
              >
                {isSidebarCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
              </button>
              <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <nav className="space-y-1.5 overflow-y-auto max-h-[calc(100vh-200px)]">
            {[
              { id: 'transactions', label: 'Lançamentos', icon: DollarSign },
              { id: 'accounts', label: 'Contas Bancárias', icon: Building2 },
              { id: 'cards', label: 'Cartões de Crédito', icon: CreditCard },
              { id: 'payables', label: 'Contas a Pagar', icon: Clock },
              { id: 'receivables', label: 'Contas a Receber', icon: ArrowDownRight },
              { id: 'cashflow', label: 'Fluxo de Caixa', icon: TrendUp },
              { id: 'budget', label: 'Orçamento', icon: Target },
              { id: 'reports', label: 'Relatórios', icon: BarChart3 },
              { id: 'settings', label: 'Configurações', icon: Settings },
            ].map((item) => {
              const IconComp = item.icon;
              const isActive = currentModule === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { setCurrentModule(item.id as any); setIsMobileMenuOpen(false); }}
                  title={isSidebarCollapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${isActive ? 'bg-emerald-600 text-white shadow-md' : 'hover:bg-slate-800 text-slate-300'} ${isSidebarCollapsed ? 'justify-center' : ''}`}
                >
                  <IconComp className="w-4 h-4 shrink-0" />
                  {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-3.5 border-t border-slate-800 bg-slate-950/50">
          <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'} text-xs`}>
            {!isSidebarCollapsed && (
              <div className="overflow-hidden pr-2">
                <div className="font-bold text-white truncate text-xs">{currentUser.name}</div>
                <div className="text-[10px] text-slate-400 capitalize">{currentUser.role === 'admin' ? 'Administrador' : 'Usuário'}</div>
              </div>
            )}
            <button
              onClick={handleLogout}
              title="Sair do Sistema"
              className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg transition cursor-pointer shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
        
        <header className="bg-white border-b border-slate-200 px-4 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-base md:text-lg font-bold text-slate-900 capitalize">
              {currentModule === 'transactions' && 'Lançamentos — Receitas e Despesas'}
              {currentModule === 'accounts' && 'Contas Bancárias'}
              {currentModule === 'cards' && 'Cartões de Crédito e Faturas'}
              {currentModule === 'payables' && 'Contas a Pagar'}
              {currentModule === 'receivables' && 'Contas a Receber'}
              {currentModule === 'cashflow' && 'Fluxo de Caixa'}
              {currentModule === 'budget' && 'Planejamento Orçamentário'}
              {currentModule === 'reports' && 'Relatórios e Demonstrativos'}
              {currentModule === 'settings' && 'Configurações e Usuários'}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsTrashModalOpen(true)}
              className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 px-3 py-2 rounded-lg font-medium transition cursor-pointer text-xs"
            >
              <Trash className="w-3.5 h-3.5 text-rose-600" />
              <span className="hidden sm:inline">Lixeira</span> ({trashedTransactions.length})
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition shadow-sm cursor-pointer text-xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Novo Lançamento</span>
            </button>
          </div>
        </header>

        <main className="p-4 md:p-8 space-y-6 max-w-6xl w-full mx-auto">
          
          {/* MÓDULO 1: LANÇAMENTOS */}
          {currentModule === 'transactions' && (
            <div className="space-y-6">
              
              {duplicateMessage && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-xl text-xs flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{duplicateMessage}</span>
                  </div>
                  <button onClick={() => setDuplicateMessage(null)} className="text-emerald-600 hover:text-emerald-800 font-bold">×</button>
                </div>
              )}

              <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs space-y-1">
                  <span className="text-[11px] font-bold uppercase text-emerald-700 tracking-wider">Total de Entradas</span>
                  <div className="text-xl font-bold text-emerald-600">{formatCurrency(totalEntradasMes)}</div>
                  <p className="text-[11px] text-slate-400">Soma das receitas no período selecionado</p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-xs space-y-1">
                  <span className="text-[11px] font-bold uppercase text-rose-700 tracking-wider">Total de Saídas</span>
                  <div className="text-xl font-bold text-rose-600">{formatCurrency(totalSaidasMes)}</div>
                  <p className="text-[11px] text-slate-400">Soma das despesas no período selecionado</p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
                  <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Saldo (Entradas - Saídas)</span>
                  <div className={`text-xl font-bold ${saldoMes >= 0 ? 'text-indigo-900' : 'text-rose-600'}`}>
                    {formatCurrency(saldoMes)}
                  </div>
                  <p className="text-[11px] text-slate-400">Resultado financeiro do período</p>
                </div>
              </section>

              {/* FILTRO DE PERÍODO & AÇÕES DE DUPLICADOS */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-700 uppercase">Filtrar Período Por:</span>
                    <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs flex-wrap">
                      <button
                        onClick={() => setPeriodFilterMode('day')}
                        className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${periodFilterMode === 'day' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                      >
                        Dia
                      </button>
                      <button
                        onClick={() => setPeriodFilterMode('month')}
                        className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${periodFilterMode === 'month' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                      >
                        Mês
                      </button>
                      <button
                        onClick={() => setPeriodFilterMode('year')}
                        className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${periodFilterMode === 'year' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                      >
                        Ano
                      </button>
                      <button
                        onClick={() => setPeriodFilterMode('custom')}
                        className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${periodFilterMode === 'custom' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                      >
                        Personalizado (Data)
                      </button>
                    </div>
                  </div>

                  {periodFilterMode !== 'custom' && (
                    <div className="flex items-center gap-2 justify-center">
                      <button onClick={handlePrevPeriod} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer" title="Período anterior">
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      {periodFilterMode === 'day' && (
                        <input
                          type="date"
                          value={dayStr}
                          onChange={handleDayChange}
                          className="border border-slate-300 rounded-lg text-xs p-2 bg-slate-50 font-bold text-indigo-900 cursor-pointer"
                        />
                      )}

                      {periodFilterMode === 'month' && (
                        <>
                          <select
                            value={currentMonth}
                            onChange={handleMonthChange}
                            className="border border-slate-300 rounded-lg text-xs p-2 bg-slate-50 font-bold text-indigo-900 capitalize cursor-pointer"
                          >
                            {Array.from({ length: 12 }, (_, i) => {
                              const d = new Date(2026, i, 1);
                              const name = d.toLocaleString('pt-BR', { month: 'long' });
                              return <option key={i} value={i}>{name}</option>;
                            })}
                          </select>
                          <select
                            value={currentYear}
                            onChange={handleYearChange}
                            className="border border-slate-300 rounded-lg text-xs p-2 bg-slate-50 font-bold text-indigo-900 cursor-pointer"
                          >
                            {availableYears.map(y => (
                              <option key={y} value={y}>{y}</option>
                            ))}
                          </select>
                        </>
                      )}

                      {periodFilterMode === 'year' && (
                        <select
                          value={currentYear}
                          onChange={handleYearChange}
                          className="border border-slate-300 rounded-lg text-xs p-2 bg-slate-50 font-bold text-indigo-900 cursor-pointer"
                        >
                          {availableYears.map(y => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                      )}

                      <button onClick={handleNextPeriod} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer" title="Próximo período">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* SELETOR DE DATAS PERSONALIZADAS SE O MODO FOR 'custom' */}
                {periodFilterMode === 'custom' && (
                  <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                    <span className="font-bold text-slate-700 flex items-center gap-1.5">
                      <Filter className="w-4 h-4 text-emerald-600" />
                      <span>Intervalo de Datas:</span>
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-slate-500">De:</span>
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="border border-slate-300 rounded-lg p-1.5 bg-white text-xs font-semibold"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-slate-500">Até:</span>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="border border-slate-300 rounded-lg p-1.5 bg-white text-xs font-semibold"
                      />
                    </div>
                    {(customStartDate || customEndDate) && (
                      <button
                        onClick={() => { setCustomStartDate(''); setCustomEndDate(''); }}
                        className="text-emerald-600 hover:text-emerald-800 font-bold underline px-1"
                      >
                        Limpar Datas
                      </button>
                    )}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <input
                    type="text"
                    placeholder="Pesquisar descrição ou categoria..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="border border-slate-300 rounded-lg text-xs p-2 bg-slate-50 w-full sm:w-64"
                  />

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      onClick={handleRemoveDuplicates}
                      className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer shadow-xs"
                      title="Remove automaticamente lançamentos repetidos com mesma descrição, valor e data"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>Limpar Duplicados</span>
                    </button>

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

                    <button
                      onClick={exportToCSV}
                      className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>CSV</span>
                    </button>
                  </div>
                </div>
              </div>

              {selectedTransactionIds.length > 0 && (
                <div className="flex justify-end">
                  <button
                    onClick={() => setIsBatchDeleteModalOpen(true)}
                    className="flex items-center gap-1 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg text-xs font-semibold transition shadow-xs cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Excluir Selecionados ({selectedTransactionIds.length})</span>
                  </button>
                </div>
              )}

              {/* TABELA DE ENTRADAS */}
              <div className="bg-white rounded-xl border border-emerald-200 shadow-xs overflow-hidden space-y-2">
                <div className="p-4 bg-emerald-50/70 border-b border-emerald-100 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-emerald-900 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                    ENTRADAS (RECEITAS) — {periodFilterMode === 'day' ? dayFormattedName : periodFilterMode === 'month' ? monthName : periodFilterMode === 'year' ? `Ano de ${currentYear}` : 'Período Personalizado'}
                  </h3>
                  <span className="text-xs font-bold text-emerald-700">Total: {formatCurrency(totalEntradasMes)}</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase font-semibold border-b border-slate-200">
                        <th className="p-3.5 w-10 text-center">
                          <button onClick={() => toggleSelectAll('income')} className="cursor-pointer text-slate-500">
                            {filteredIncomes.length > 0 && filteredIncomes.every(t => selectedTransactionIds.includes(t.id)) ? (
                              <CheckSquare className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </th>
                        <th className="p-3.5">Situação</th>
                        <th className="p-3.5">Descrição</th>
                        <th className="p-3.5">Categoria</th>
                        <th className="p-3.5">Data</th>
                        <th className="p-3.5">Valor</th>
                        <th className="p-3.5 text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {filteredIncomes.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-6 text-center text-slate-400">
                            Nenhuma entrada (receita) registrada para este período.
                          </td>
                        </tr>
                      ) : (
                        filteredIncomes.map((t) => {
                          const isSelected = selectedTransactionIds.includes(t.id);
                          return (
                            <tr key={t.id} className={`hover:bg-slate-50/80 transition ${isSelected ? 'bg-indigo-50/40' : ''}`}>
                              <td className="p-3.5 text-center">
                                <button onClick={() => toggleSelectOne(t.id)} className="cursor-pointer text-slate-500">
                                  {isSelected ? <CheckSquare className="w-4 h-4 text-emerald-600" /> : <Square className="w-4 h-4" />}
                                </button>
                              </td>
                              <td className="p-3.5">
                                <button
                                  onClick={() => toggleStatus(t.id)}
                                  className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full cursor-pointer transition ${
                                    t.status === 'paid'
                                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                      : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                  }`}
                                >
                                  {t.status === 'paid' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                  <span>{t.status === 'paid' ? 'Recebido' : 'Pendente'}</span>
                                </button>
                              </td>
                              <td className="p-3.5 font-medium text-slate-800">
                                {t.description}
                                {t.installmentInfo && <div className="text-[10px] text-emerald-600 font-semibold">{t.installmentInfo}</div>}
                              </td>
                              <td className="p-3.5 text-slate-600">{t.category}</td>
                              <td className="p-3.5 text-slate-500">{t.dueDate || t.date}</td>
                              <td className="p-3.5 font-semibold text-emerald-600">
                                + {formatCurrency(t.amount)}
                              </td>
                              <td className="p-3.5 text-center space-x-2">
                                <button
                                  onClick={() => openEditModal(t)}
                                  className="text-indigo-500 hover:text-indigo-700 transition p-1 rounded-md hover:bg-indigo-50 cursor-pointer inline-flex items-center gap-1 font-medium"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                  <span>Editar</span>
                                </button>
                                <button
                                  onClick={() => confirmDelete(t)}
                                  className="text-slate-400 hover:text-rose-600 transition p-1 rounded-md hover:bg-rose-50 cursor-pointer inline-flex items-center gap-1 font-medium"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Excluir</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* TABELA DE SAÍDAS */}
              <div className="bg-white rounded-xl border border-rose-200 shadow-xs overflow-hidden space-y-2">
                <div className="p-4 bg-rose-50/70 border-b border-rose-100 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-rose-900 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
                    SAÍDAS (DESPESAS) — {periodFilterMode === 'day' ? dayFormattedName : periodFilterMode === 'month' ? monthName : periodFilterMode === 'year' ? `Ano de ${currentYear}` : 'Período Personalizado'}
                  </h3>
                  <span className="text-xs font-bold text-rose-700">Total: {formatCurrency(totalSaidasMes)}</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase font-semibold border-b border-slate-200">
                        <th className="p-3.5 w-10 text-center">
                          <button onClick={() => toggleSelectAll('expense')} className="cursor-pointer text-slate-500">
                            {filteredExpenses.length > 0 && filteredExpenses.every(t => selectedTransactionIds.includes(t.id)) ? (
                              <CheckSquare className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </th>
                        <th className="p-3.5">Situação</th>
                        <th className="p-3.5">Descrição</th>
                        <th className="p-3.5">Categoria</th>
                        <th className="p-3.5">Data</th>
                        <th className="p-3.5">Valor</th>
                        <th className="p-3.5 text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {filteredExpenses.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-6 text-center text-slate-400">
                            Nenhuma saída (despesa) registrada para este período.
                          </td>
                        </tr>
                      ) : (
                        filteredExpenses.map((t) => {
                          const isSelected = selectedTransactionIds.includes(t.id);
                          return (
                            <tr key={t.id} className={`hover:bg-slate-50/80 transition ${isSelected ? 'bg-indigo-50/40' : ''}`}>
                              <td className="p-3.5 text-center">
                                <button onClick={() => toggleSelectOne(t.id)} className="cursor-pointer text-slate-500">
                                  {isSelected ? <CheckSquare className="w-4 h-4 text-emerald-600" /> : <Square className="w-4 h-4" />}
                                </button>
                              </td>
                              <td className="p-3.5">
                                <button
                                  onClick={() => toggleStatus(t.id)}
                                  className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full cursor-pointer transition ${
                                    t.status === 'paid'
                                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                      : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                  }`}
                                >
                                  {t.status === 'paid' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                  <span>{t.status === 'paid' ? 'Pago' : 'Pendente'}</span>
                                </button>
                              </td>
                              <td className="p-3.5 font-medium text-slate-800">
                                {t.description}
                                {t.installmentInfo && <div className="text-[10px] text-rose-600 font-semibold">{t.installmentInfo}</div>}
                              </td>
                              <td className="p-3.5 text-slate-600">{t.category}</td>
                              <td className="p-3.5 text-slate-500">{t.dueDate || t.date}</td>
                              <td className="p-3.5 font-semibold text-rose-600">
                                - {formatCurrency(t.amount)}
                              </td>
                              <td className="p-3.5 text-center space-x-2">
                                <button
                                  onClick={() => openEditModal(t)}
                                  className="text-indigo-500 hover:text-indigo-700 transition p-1 rounded-md hover:bg-indigo-50 cursor-pointer inline-flex items-center gap-1 font-medium"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                  <span>Editar</span>
                                </button>
                                <button
                                  onClick={() => confirmDelete(t)}
                                  className="text-slate-400 hover:text-rose-600 transition p-1 rounded-md hover:bg-rose-50 cursor-pointer inline-flex items-center gap-1 font-medium"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Excluir</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* DEMAIS MÓDULOS */}
          {currentModule === 'accounts' && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900">Contas Bancárias e Carteiras Cadastradas</h3>
              <p className="text-xs text-slate-500">Acompanhe e gerencie as contas utilizadas para movimentação financeira e liquidação de pagamentos.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                {accounts.map(acc => (
                  <div key={acc} className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-800">{acc}</span>
                      <p className="text-[10px] text-slate-400 mt-0.5">Conta ativa no sistema</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditAccountModal(acc)}
                        className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                        title="Editar Conta"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <Building2 className="w-5 h-5 text-indigo-600" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentModule === 'cards' && creditCards.length > 0 && activeCard && activeCardLimit && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Gerenciamento de Cartões de Crédito — {monthName}</h3>
                  <p className="text-xs text-slate-500">Situação da fatura: <strong className="text-indigo-700">{invoiceStatus}</strong> | Saldo anterior transportado: {formatCurrency(broughtForward)}</p>
                </div>

                <div className="flex items-center gap-3">
                  <select
                    value={selectedCardView}
                    onChange={(e) => setSelectedCardView(e.target.value)}
                    className="border border-slate-300 rounded-lg text-xs p-2 bg-slate-50 font-semibold text-indigo-900"
                  >
                    {creditCards.map(card => (
                      <option key={card.id} value={card.id}>{card.name} ({card.bank})</option>
                    ))}
                  </select>

                  <button
                    onClick={() => openEditCardModal(activeCard)}
                    className="flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3.5 py-2 rounded-lg font-medium text-xs transition cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Editar Cartão</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-semibold uppercase text-slate-500">Total da Fatura</span>
                  <h4 className="text-xl font-bold text-slate-900 mt-1">{formatCurrency(invoiceMonthTotal + totalFeesThisMonth)}</h4>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-semibold uppercase text-slate-500">Total Pago</span>
                  <h4 className="text-xl font-bold text-emerald-600 mt-1">{formatCurrency(totalPaidThisMonth)}</h4>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-semibold uppercase text-slate-500">Saldo Pendente</span>
                  <h4 className="text-xl font-bold text-rose-600 mt-1">{formatCurrency(pendingInvoiceMonthTotal)}</h4>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-semibold uppercase text-slate-500">Limite Disponível</span>
                  <h4 className="text-xl font-bold text-emerald-600 mt-1">{formatCurrency(activeCardLimit.available)}</h4>
                </div>
              </div>
            </div>
          )}

          {currentModule === 'payables' && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900">Contas a Pagar (Obrigações Financeiras Pendentes)</h3>
              <div className="space-y-2">
                {expandedActiveTransactions.filter(t => t.type === 'expense' && t.status === 'pending').length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">Nenhuma conta a pagar pendente no momento.</p>
                ) : (
                  expandedActiveTransactions.filter(t => t.type === 'expense' && t.status === 'pending').map(t => (
                    <div key={t.id} className="flex justify-between items-center bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                      <div>
                        <div className="font-bold text-slate-800">{t.description}</div>
                        <div className="text-slate-400 text-[11px]">Vencimento: {t.dueDate || t.date} | Categoria: {t.category}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-rose-600">{formatCurrency(t.amount)}</span>
                        <button
                          onClick={() => openEditModal(t)}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                          title="Editar"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleStatus(t.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer"
                        >
                          Marcar como Pago
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {currentModule === 'receivables' && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900">Contas a Receber (Valores Pendentes)</h3>
              <div className="space-y-2">
                {expandedActiveTransactions.filter(t => t.type === 'income' && t.status === 'pending').length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">Nenhuma conta a receber pendente no momento.</p>
                ) : (
                  expandedActiveTransactions.filter(t => t.type === 'income' && t.status === 'pending').map(t => (
                    <div key={t.id} className="flex justify-between items-center bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                      <div>
                        <div className="font-bold text-slate-800">{t.description}</div>
                        <div className="text-slate-400 text-[11px]">Previsão: {t.dueDate || t.date} | Categoria: {t.category}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-emerald-600">{formatCurrency(t.amount)}</span>
                        <button
                          onClick={() => openEditModal(t)}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                          title="Editar"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleStatus(t.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer"
                        >
                          Marcar como Recebido
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {currentModule === 'cashflow' && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900">Projeção de Fluxo de Caixa (Próximos 6 Meses)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
                {cashFlowProjections.map((p, idx) => (
                  <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-indigo-900 uppercase">{p.name}</span>
                      <span className={`text-xs font-bold ${p.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{formatCurrency(p.balance)}</span>
                    </div>
                    <div className="text-xs text-slate-500 flex justify-between">
                      <span>Entradas: <strong className="text-emerald-600">+{formatCurrency(p.income)}</strong></span>
                      <span>Saídas: <strong className="text-rose-600">-{formatCurrency(p.expense)}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentModule === 'budget' && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900">Planejamento e Metas de Gastos por Categoria — {monthName}</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
                {categories.map(cat => {
                  const spent = periodTransactions
                    .filter(t => t.category === cat && t.type === 'expense')
                    .reduce((acc, t) => acc + t.amount, 0);
                  const budgetLimit = budgets[cat] || 0;
                  const pct = budgetLimit > 0 ? (spent / budgetLimit) * 100 : 0;
                  const isOver = budgetLimit > 0 && spent > budgetLimit;

                  return (
                    <div key={cat} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                        <span>{cat}</span>
                        <span className={isOver ? 'text-rose-600 font-extrabold' : 'text-slate-500'}>
                          {formatCurrency(spent)} / {budgetLimit > 0 ? formatCurrency(budgetLimit) : 'Sem meta'}
                        </span>
                      </div>
                      {budgetLimit > 0 && (
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div 
                            className={`h-2 rounded-full transition-all duration-500 ${isOver ? 'bg-rose-600' : pct > 80 ? 'bg-amber-500' : 'bg-emerald-600'}`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          ></div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {currentModule === 'reports' && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900">Relatórios e Demonstrativos Financeiros</h3>
              <p className="text-xs text-slate-500">Exporte demonstrativos completos e analise o desempenho por competência no período.</p>
              <div className="pt-2">
                <button
                  onClick={exportToCSV}
                  className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2.5 rounded-lg text-xs font-semibold transition cursor-pointer inline-flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Baixar Extrato Completo (CSV / Excel)</span>
                </button>
              </div>
            </div>
          )}

          {currentModule === 'settings' && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
              <h3 className="text-base font-bold text-slate-900">Configurações do Sistema e Usuários</h3>
              
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-indigo-600" />
                  Gerenciar e Editar Categorias Financeiras
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                  {categories.map(cat => (
                    <div key={cat} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                      <span className="font-semibold text-slate-800">{cat}</span>
                      <button
                        onClick={() => openEditCategoryModal(cat)}
                        className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                        title="Editar Categoria"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* MODAL DE EDIÇÃO DE LANÇAMENTO E MODALIDADE */}
      {isEditModalOpen && editingTransaction && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-5 relative border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3 border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-indigo-600" />
                Editar Lançamento
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAttemptSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Descrição</label>
                <input
                  type="text"
                  required
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                    {editLaunchMode === 'installment' && editInstallmentModeType === 'divide' ? 'Valor Total (R$)' : 'Valor (R$)'}
                  </label>
                  <input
                    type="text"
                    required
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Tipo / Natureza</label>
                  <select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value as any)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-white font-bold"
                  >
                    <option value="expense">Despesa (Saída)</option>
                    <option value="income">Receita (Entrada)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Vencimento</label>
                  <input
                    type="date"
                    required
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Categoria</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-white"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Modalidade</label>
                <select
                  value={editLaunchMode}
                  onChange={(e) => setEditLaunchMode(e.target.value as any)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-white font-semibold text-indigo-900"
                >
                  <option value="single">Lançamento Único / Padrão</option>
                  <option value="installment">Parcelado (Finito)</option>
                  <option value="recurring">Recorrente (Contínuo)</option>
                </select>
              </div>

              {editingTransaction.installmentGroup && editLaunchMode === 'single' && (
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2 text-xs">
                  <span className="font-bold text-slate-700 block uppercase">Aplicar Alterações Em:</span>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="editScopeOpt" checked={editScope === 'single'} onChange={() => setEditScope('single')} />
                    <span>Somente neste lançamento</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="editScopeOpt" checked={editScope === 'forward'} onChange={() => setEditScope('forward')} />
                    <span>Neste e nos próximos lançamentos do grupo</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="editScopeOpt" checked={editScope === 'all'} onChange={() => setEditScope('all')} />
                    <span>Em todos os lançamentos deste grupo</span>
                  </label>
                </div>
              )}

              {editLaunchMode === 'installment' && (
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2 text-xs">
                  <div>
                    <label className="block font-semibold uppercase text-slate-500 mb-1">Tipo de Parcelamento</label>
                    <select
                      value={editInstallmentModeType}
                      onChange={(e) => setEditInstallmentModeType(e.target.value as any)}
                      className="w-full border border-slate-300 rounded-lg p-2 bg-white font-medium"
                    >
                      <option value="divide">Dividir valor total pelas parcelas</option>
                      <option value="repeat">Repetir valor informado em cada parcela</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold uppercase text-slate-500 mb-1">Quantidade de Parcelas</label>
                    <select
                      value={editInstallmentsCount}
                      onChange={(e) => setEditInstallmentsCount(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                    >
                      {Array.from({ length: 359 }, (_, i) => i + 2).map(num => (
                        <option key={num} value={num}>{num}x vezes</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {editLaunchMode === 'recurring' && (
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-semibold uppercase text-slate-500 mb-1">Periodicidade</label>
                      <select
                        value={editRecurrencePeriod}
                        onChange={(e) => setEditRecurrencePeriod(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                      >
                        <option value="Diária">Diária</option>
                        <option value="Semanal">Semanal</option>
                        <option value="Quinzenal">Quinzenal</option>
                        <option value="Mensal">Mensal</option>
                        <option value="Bimestral">Bimestral</option>
                        <option value="Trimestral">Trimestral</option>
                        <option value="Semestral">Semestral</option>
                        <option value="Anual">Anual</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold uppercase text-slate-500 mb-1">Prazo</label>
                      <select
                        value={editRecurrenceEndType}
                        onChange={(e) => setEditRecurrenceEndType(e.target.value as any)}
                        className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                      >
                        <option value="indeterminate">Prazo Indeterminado</option>
                        <option value="date">Até Data Final</option>
                      </select>
                    </div>
                  </div>
                  {editRecurrenceEndType === 'date' && (
                    <div>
                      <label className="block font-semibold uppercase text-slate-500 mb-1">Data de Término</label>
                      <input
                        type="date"
                        value={editRecurrenceEndDate}
                        onChange={(e) => setEditRecurrenceEndDate(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition shadow-sm cursor-pointer"
                >
                  Salvar Alteração
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DA LIXEIRA */}
      {isTrashModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full p-6 space-y-6 relative border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3 border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Trash className="w-5 h-5 text-rose-600" />
                Lixeira de Lançamentos
              </h3>
              <button
                onClick={() => setIsTrashModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedTrashIds.length > 0 && (
              <div className="flex items-center justify-between bg-indigo-50 border border-indigo-200 p-3 rounded-xl text-xs">
                <span className="font-bold text-indigo-900">{selectedTrashIds.length} item(ns) selecionado(s) na lixeira</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={restoreBatchFromTrash}
                    className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restaurar Selecionados</span>
                  </button>
                  <button
                    onClick={() => setIsBatchPermanentModalOpen(true)}
                    className="flex items-center gap-1 bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir Definitivo (Lote)</span>
                  </button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-200">
                    <th className="p-3 w-10 text-center">
                      <button onClick={toggleSelectAllTrash} className="cursor-pointer text-slate-500">
                        {trashedTransactions.length > 0 && trashedTransactions.every(t => selectedTrashIds.includes(t.id)) ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="p-3">Descrição</th>
                    <th className="p-3">Categoria</th>
                    <th className="p-3">Vencimento</th>
                    <th className="p-3">Valor</th>
                    <th className="p-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {trashedTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        A lixeira está vazia. Nenhum registro excluído recentemente.
                      </td>
                    </tr>
                  ) : (
                    trashedTransactions.map(t => {
                      const isSelected = selectedTrashIds.includes(t.id);
                      return (
                        <tr key={t.id} className={`hover:bg-slate-50 transition ${isSelected ? 'bg-indigo-50/40' : ''}`}>
                          <td className="p-3 text-center">
                            <button onClick={() => toggleSelectTrashOne(t.id)} className="cursor-pointer text-slate-500">
                              {isSelected ? <CheckSquare className="w-4 h-4 text-emerald-600" /> : <Square className="w-4 h-4" />}
                            </button>
                          </td>
                          <td className="p-3 font-medium text-slate-800">{t.description}</td>
                          <td className="p-3 text-slate-600">{t.category}</td>
                          <td className="p-3 text-slate-500">{t.dueDate || t.date}</td>
                          <td className={`p-3 font-semibold ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {formatCurrency(t.amount)}
                          </td>
                          <td className="p-3 text-center space-x-2">
                            <button
                              onClick={() => restoreFromTrash(t.id)}
                              className="inline-flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Restaurar</span>
                            </button>
                            <button
                              onClick={() => confirmPermanentDelete(t.id)}
                              className="inline-flex items-center gap-1 bg-rose-50 hover:bg-rose-100 text-rose-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer"
                              title="Excluir Definitivamente"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Excluir Definitivo</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsTrashModalOpen(false)}
                className="px-5 py-2 text-sm font-medium bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition cursor-pointer"
              >
                Fechar Lixeira
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO DEFINITIVA INDIVIDUAL */}
      {isPermanentDeleteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 space-y-5 relative border border-slate-200 text-center">
            <div className="mx-auto w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900">Exclusão Definitiva</h3>
              <p className="text-xs text-slate-500">
                Tem certeza que deseja excluir permanentemente este registro? Esta ação não poderá ser desfeita.
              </p>
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsPermanentDeleteModalOpen(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer border border-slate-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={executePermanentDelete}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition shadow-sm cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sim, Excluir</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO DEFINITIVA EM LOTE */}
      {isBatchPermanentModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 space-y-5 relative border border-slate-200 text-center">
            <div className="mx-auto w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900">Exclusão Definitiva em Lote</h3>
              <p className="text-xs text-slate-500">
                Tem certeza que deseja excluir permanentemente os <strong className="text-slate-800">{selectedTrashIds.length}</strong> itens selecionados? Esta ação não poderá ser desfeita.
              </p>
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsBatchPermanentModalOpen(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer border border-slate-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={executeBatchPermanentDelete}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition shadow-sm cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sim, Excluir Todos</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {isDeleteModalOpen && transactionToDelete && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-5 relative border border-slate-200">
            <div className="mx-auto w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            
            <div className="space-y-2 text-center">
              <h3 className="text-lg font-bold text-slate-900">Excluir Lançamento</h3>
              <p className="text-sm text-slate-500">
                Você está prestes a enviar para a lixeira: <strong className="text-slate-800">{transactionToDelete.description}</strong> ({formatCurrency(transactionToDelete.amount)})
              </p>
            </div>

            {transactionToDelete.installmentGroup && (
              <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <span className="font-bold text-slate-700 block uppercase">Opções de Exclusão:</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="delOpt" checked={deleteOption === 'single'} onChange={() => setDeleteOption('single')} />
                  <span>Excluir somente esta competência</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="delOpt" checked={deleteOption === 'forward'} onChange={() => setDeleteOption('forward')} />
                  <span>Excluir esta e as próximas</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="delOpt" checked={deleteOption === 'all'} onChange={() => setDeleteOption('all')} />
                  <span>Excluir todo o histórico</span>
                </label>
              </div>
            )}

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
                onClick={executeSoftDelete}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition shadow-sm cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Confirmar Exclusão</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {isBatchDeleteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-5 relative border border-slate-200 text-center">
            <div className="mx-auto w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900">Confirmação de Exclusão em Lote</h3>
              <p className="text-sm text-slate-500">
                Você selecionou <strong className="text-slate-800">{selectedTransactionIds.length}</strong> lançamento(s).
              </p>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 font-bold text-rose-600 text-base">
                Valor Total Envolvido: {formatCurrency(batchTotalAmount)}
              </div>
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsBatchDeleteModalOpen(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer border border-slate-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={executeBatchDelete}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition shadow-sm cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sim, Excluir Todos</span>
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
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Descrição</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Aluguel, Supermercado..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                    {launchMode === 'installment' && installmentModeType === 'divide' ? 'Valor Total (R$)' : 'Valor (R$)'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 1.365,11"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Tipo</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-white"
                  >
                    <option value="expense">Despesa (Saída)</option>
                    <option value="income">Receita (Entrada)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Conta / Cartão</label>
                  <select
                    value={paymentSource}
                    onChange={(e) => setPaymentSource(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-white font-medium"
                  >
                    <optgroup label="Cartões de Crédito">
                      {creditCards.map(c => (
                        <option key={c.id} value={`card-${c.id}`}>{c.name}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Contas / Carteira">
                      {accounts.map(acc => (
                        <option key={acc} value={`acc-${acc}`}>{acc}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Categoria</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-white"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Data Inicial</label>
                  <input
                    type="date"
                    required
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Modalidade</label>
                  <select
                    value={launchMode}
                    onChange={(e) => setLaunchMode(e.target.value as any)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-white font-semibold text-indigo-900"
                  >
                    <option value="single">Lançamento Único</option>
                    <option value="installment">Parcelado (Finito)</option>
                    <option value="recurring">Recorrente (Contínuo)</option>
                  </select>
                </div>
              </div>

              {launchMode === 'installment' && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Tipo de Parcelamento</label>
                    <select
                      value={installmentModeType}
                      onChange={(e) => setInstallmentModeType(e.target.value as any)}
                      className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white font-medium"
                    >
                      <option value="divide">Dividir valor total pelas parcelas</option>
                      <option value="repeat">Repetir valor informado em cada parcela</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Quantidade de Parcelas</label>
                    <select
                      value={installmentsCount}
                      onChange={(e) => setInstallmentsCount(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white"
                    >
                      {Array.from({ length: 359 }, (_, i) => i + 2).map(num => (
                        <option key={num} value={num}>{num}x vezes</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {launchMode === 'recurring' && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Periodicidade</label>
                      <select
                        value={recurrencePeriod}
                        onChange={(e) => setRecurrencePeriod(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white"
                      >
                        <option value="Diária">Diária</option>
                        <option value="Semanal">Semanal</option>
                        <option value="Quinzenal">Quinzenal</option>
                        <option value="Mensal">Mensal</option>
                        <option value="Bimestral">Bimestral</option>
                        <option value="Trimestral">Trimestral</option>
                        <option value="Semestral">Semestral</option>
                        <option value="Anual">Anual</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Prazo</label>
                      <select
                        value={recurrenceEndType}
                        onChange={(e) => setRecurrenceEndType(e.target.value as any)}
                        className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white"
                      >
                        <option value="indeterminate">Prazo Indeterminado</option>
                        <option value="date">Até Data Final</option>
                      </select>
                    </div>
                  </div>

                  {recurrenceEndType === 'date' && (
                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Data de Término</label>
                      <input
                        type="date"
                        value={recurrenceEndDate}
                        onChange={(e) => setRecurrenceEndDate(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white"
                      />
                    </div>
                  )}
                </div>
              )}

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

    </div>
  );
}