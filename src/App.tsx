import { useState, useEffect } from 'react';
import { 
  PlusCircle, Trash2, X, AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, RotateCcw, Lock, User, KeyRound, Sparkles, Calendar, Filter
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

  // NOVO FILTRO POR PERÍODO DE DATAS (Data Inicial e Data Final)
  const [filterStartDate, setFilterStartDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [filterEndDate, setFilterEndDate] = useState(() => {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  });

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

  // ESTADOS DA LIXEIRA
  const [selectedTrashIds, setSelectedTrashIds] = useState<string[]>([]);
  const [isBatchPermanentModalOpen, setIsBatchPermanentModalOpen] = useState(false);

  const [description, setDescription] = useState('');
  const [category] = useState(categories[0] || 'Outros');
  const [paymentSource] = useState<string>('acc-Banco do Brasil');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [status] = useState<'paid' | 'pending'>('pending');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);

  const [launchMode, setLaunchMode] = useState<'single' | 'installment' | 'recurring'>('single');
  const [installmentModeType] = useState<'divide' | 'repeat'>('divide');
  const [installmentsCount] = useState('12');

  const [recurrencePeriod] = useState<string>('Mensal');

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
                  type="password"
                  required
                  placeholder="••••••••"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                />
              </div>
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

  const activeTransactions = transactions.filter(t => !t.deletedAt);
  const trashedTransactions = transactions.filter(t => t.deletedAt);

  // FUNÇÕES DE AÇÃO EM LOTE NA LIXEIRA
  const handleSelectAllTrash = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedTrashIds(trashedTransactions.map(t => t.id));
    } else {
      setSelectedTrashIds([]);
    }
  };

  const handleToggleTrashSelect = (id: string) => {
    if (selectedTrashIds.includes(id)) {
      setSelectedTrashIds(selectedTrashIds.filter(item => item !== id));
    } else {
      setSelectedTrashIds([...selectedTrashIds, id]);
    }
  };

  const handleBatchRestore = () => {
    setTransactions(transactions.map(t => {
      if (selectedTrashIds.includes(t.id)) {
        return { ...t, deletedAt: undefined };
      }
      return t;
    }));
    setSelectedTrashIds([]);
  };

  const handleBatchPermanentDelete = () => {
    setTransactions(transactions.filter(t => !selectedTrashIds.includes(t.id)));
    setSelectedTrashIds([]);
    setIsBatchPermanentModalOpen(false);
  };

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

  // PROJEÇÃO DE RECORRÊNCIAS AJUSTADA AO INTERVALO DE DATAS
  const getExpandedTransactions = () => {
    const result: Transaction[] = [];
    const startYear = filterStartDate ? new Date(filterStartDate + 'T00:00:00').getFullYear() : new Date().getFullYear();
    const startMonth = filterStartDate ? new Date(filterStartDate + 'T00:00:00').getMonth() : 0;
    const endYear = filterEndDate ? new Date(filterEndDate + 'T00:00:00').getFullYear() : startYear;
    const endMonth = filterEndDate ? new Date(filterEndDate + 'T00:00:00').getMonth() : 11;

    activeTransactions.forEach(t => {
      if (t.recurringInfo && t.recurringInfo.includes('Mensal') && !t.installmentGroup) {
        const origDate = new Date((t.dueDate || t.date) + 'T00:00:00');
        const origYear = origDate.getFullYear();
        const origMonth = origDate.getMonth();
        const origDay = origDate.getDate();

        // Gerar instâncias para cada mês dentro ou próximo ao intervalo selecionado
        for (let y = startYear; y <= endYear; y++) {
          const mStart = (y === startYear) ? startMonth : 0;
          const mEnd = (y === endYear) ? endMonth : 11;

          for (let m = mStart; m <= mEnd; m++) {
            const diffMonths = (y - origYear) * 12 + (m - origMonth);
            if (diffMonths >= 0) {
              const targetDateObj = new Date(y, m, Math.min(origDay, 28));
              const targetDateStr = targetDateObj.toISOString().split('T')[0];

              const existsReal = activeTransactions.some(sub => 
                sub.installmentGroup === t.installmentGroup && 
                sub.dueDate?.startsWith(`${y}-${String(m + 1).padStart(2, '0')}`)
              );

              if (!existsReal || diffMonths === 0) {
                result.push({
                  ...t,
                  id: diffMonths === 0 ? t.id : `${t.id}-rec-${y}-${m}`,
                  dueDate: targetDateStr,
                  date: targetDateStr
                });
              }
            }
          }
        }
        return;
      }
      result.push(t);
    });

    return result;
  };

  const expandedActiveTransactions = getExpandedTransactions();

  // FILTRAGEM POR PERÍODO DE DATA ESCOLHIDO
  const periodTransactions = expandedActiveTransactions.filter(t => {
    const itemDate = t.dueDate || t.date;
    if (filterStartDate && itemDate < filterStartDate) return false;
    if (filterEndDate && itemDate > filterEndDate) return false;
    return true;
  });

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
          newTransactionsList.push(installmentTransaction);
        }
      }
    } else if (launchMode === 'recurring') {
      const recurringTransaction: Transaction = {
        id: crypto.randomUUID(),
        description,
        category: category || categories[0],
        account: accountName,
        creditCardId: selectedCardId,
        date: purchaseDate,
        dueDate: purchaseDate,
        amount: baseAmount,
        type,
        status: 'pending',
        recurringInfo: `Recorrente (${recurrencePeriod})`,
        auditHistory: [`Criado por ${currentUser.username} em ${new Date().toLocaleString()}`]
      };
      newTransactionsList.push(recurringTransaction);
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
        auditHistory: [`Criado por ${currentUser.username} em ${new Date().toLocaleString()}`]
      };
      newTransactionsList.push(singleTransaction);
    }

    setTransactions(newTransactionsList);
    setDescription('');
    setAmount('');
    setIsModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-800">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 space-y-6 border border-slate-200">
        <div className="flex justify-between items-center border-b pb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Sistema Financeiro Ativo</h2>
            <p className="text-xs text-slate-500">Logado como: <strong>{currentUser.name}</strong> ({currentUser.username})</p>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-800 font-semibold cursor-pointer border border-rose-200 px-3 py-1.5 rounded-lg transition">
            <span className="w-4 h-4 flex items-center justify-center">🚪</span> Sair
          </button>
        </div>

        {/* Bloco da Lixeira com botões em lote integrados */}
        {isTrashModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4 border border-slate-200 text-xs">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="text-base font-bold text-slate-900">Lixeira</h3>
                <button onClick={() => setIsTrashModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {trashedTransactions.length === 0 ? (
                <p className="text-slate-500 text-center py-6">A lixeira está vazia.</p>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        onChange={handleSelectAllTrash}
                        checked={trashedTransactions.length > 0 && selectedTrashIds.length === trashedTransactions.length}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                      />
                      <span className="font-semibold text-slate-600">Selecionar Todos</span>
                    </div>

                    {selectedTrashIds.length > 0 && (
                      <div className="flex gap-2">
                        <button 
                          onClick={handleBatchRestore}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-1.5 rounded-lg transition shadow-sm cursor-pointer flex items-center gap-1"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Recuperar ({selectedTrashIds.length})
                        </button>
                        <button 
                          onClick={() => setIsBatchPermanentModalOpen(true)}
                          className="bg-rose-600 hover:bg-rose-700 text-white font-semibold px-3 py-1.5 rounded-lg transition shadow-sm cursor-pointer flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Excluir ({selectedTrashIds.length})
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                    {trashedTransactions.map(t => (
                      <div key={t.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                        <div className="flex items-center gap-3">
                          <input 
                            type="checkbox" 
                            checked={selectedTrashIds.includes(t.id)}
                            onChange={() => handleToggleTrashSelect(t.id)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                          />
                          <div>
                            <p className="font-bold text-slate-800">{t.description}</p>
                            <p className="text-slate-500">Valor: R$ {t.amount.toFixed(2)} | Vencimento: {t.dueDate || t.date}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal de Confirmação para Exclusão Definitiva em Lote */}
        {isBatchPermanentModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4 border border-slate-200 text-xs z-50">
              <h3 className="text-base font-bold text-slate-900">Exclusão Definitiva em Lote</h3>
              <p className="text-slate-600">Tem certeza de que deseja excluir permanentemente os {selectedTrashIds.length} itens selecionados? Esta ação não poderá ser desfeita.</p>
              <div className="flex gap-2 pt-2">
                <button 
                  onClick={() => setIsBatchPermanentModalOpen(false)}
                  className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-2 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleBatchPermanentDelete}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-semibold py-2 rounded-xl transition cursor-pointer"
                >
                  Sim, Excluir Tudo
                </button>
              </div>
            </div>
          </div>
        )}

        {/* NOVO FILTRO POR PERÍODO DE DATA (Data Inicial e Data Final) */}
        <div className="bg-slate-100 p-4 rounded-xl space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase">
            <Filter className="w-4 h-4 text-indigo-600" /> Filtrar por Período de Data
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">Data Inicial</label>
              <input 
                type="date" 
                value={filterStartDate} 
                onChange={(e) => setFilterStartDate(e.target.value)} 
                className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs focus:ring-2 focus:ring-indigo-500" 
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">Data Final</label>
              <input 
                type="date" 
                value={filterEndDate} 
                onChange={(e) => setFilterEndDate(e.target.value)} 
                className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs focus:ring-2 focus:ring-indigo-500" 
              />
            </div>
          </div>
          <div className="text-[11px] text-slate-500 text-right">
            Lançamentos encontrados no período: <strong>{periodTransactions.length}</strong>
          </div>
        </div>

        <div className="flex justify-between gap-4 pt-2">
          <button onClick={() => setIsModalOpen(true)} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl transition text-xs shadow-md cursor-pointer flex items-center justify-center gap-2">
            <PlusCircle className="w-4 h-4" /> Novo Lançamento
          </button>
          <button onClick={() => setIsTrashModalOpen(true)} className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold px-4 py-2.5 rounded-xl transition text-xs cursor-pointer flex items-center gap-1.5">
            <Trash2 className="w-4 h-4" /> Lixeira ({trashedTransactions.length})
          </button>
          <button onClick={handleRemoveDuplicates} className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold px-4 py-2.5 rounded-xl transition text-xs cursor-pointer">
            Limpar Duplicados
          </button>
        </div>

        {duplicateMessage && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-center text-xs">
            {duplicateMessage}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 relative border border-slate-200">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-slate-900">Novo Lançamento</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddTransaction} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold uppercase text-slate-500 mb-1">Descrição</label>
                <input type="text" required placeholder="Ex: Aluguel ou Academia" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border border-slate-300 rounded-xl p-2.5 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase text-slate-500 mb-1">Valor (R$)</label>
                  <input type="text" required placeholder="0,00" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full border border-slate-300 rounded-xl p-2.5 text-sm" />
                </div>
                <div>
                  <label className="block font-semibold uppercase text-slate-500 mb-1">Data Inicial</label>
                  <input type="date" required value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} className="w-full border border-slate-300 rounded-xl p-2.5 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase text-slate-500 mb-1">Tipo</label>
                  <select value={type} onChange={(e) => setType(e.target.value as 'income' | 'expense')} className="w-full border border-slate-300 rounded-xl p-2.5 text-sm">
                    <option value="expense">Despesa</option>
                    <option value="income">Receita</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold uppercase text-slate-500 mb-1">Modalidade</label>
                  <select value={launchMode} onChange={(e) => setLaunchMode(e.target.value as any)} className="w-full border border-slate-300 rounded-xl p-2.5 text-sm">
                    <option value="single">Lançamento Único</option>
                    <option value="installment">Parcelado</option>
                    <option value="recurring">Recorrente (Contínuo)</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition cursor-pointer text-xs mt-2 shadow-md">
                Salvar Lançamento
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}