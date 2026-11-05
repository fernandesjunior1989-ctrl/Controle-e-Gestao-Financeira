import { useState } from 'react';
import { Wallet, TrendingUp, TrendingDown, PlusCircle, Trash2, X } from 'lucide-react';

interface Transaction {
  id: string;
  description: string;
  category: string;
  date: string;
  amount: number;
  type: 'income' | 'expense';
}

export default function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: '1',
      description: 'Salário Mensal',
      category: 'Trabalho',
      date: '2026-06-01',
      amount: 4500.00,
      type: 'income'
    },
    {
      id: '2',
      description: 'Supermercado Mensal',
      category: 'Alimentação',
      date: '2026-06-03',
      amount: 850.00,
      type: 'expense'
    },
    {
      id: '3',
      description: 'Manutenção de Escritório',
      category: 'Serviços',
      date: '2026-06-05',
      amount: 300.00,
      type: 'expense'
    }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('income');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Cálculos dos totais
  const income = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  const expense = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const total = income - expense;

  // Função para adicionar lançamento
  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || !category) return;

    const newTransaction: Transaction = {
      id: crypto.randomUUID(),
      description,
      category,
      date,
      amount: parseFloat(amount),
      type
    };

    setTransactions([newTransaction, ...transactions]);
    
    // Reset do formulário
    setDescription('');
    setCategory('');
    setAmount('');
    setType('income');
    setIsModalOpen(false);
  };

  // Função para apagar lançamento
  const handleDeleteTransaction = (id: string) => {
    setTransactions(transactions.filter(t => t.id !== id));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Cabeçalho */}
        <header className="flex justify-between items-center border-b pb-4 border-slate-200">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Controle & Gestão Financeira</h1>
            <p className="text-sm text-slate-500">Painel Principal</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition duration-200 shadow-sm cursor-pointer"
          >
            <PlusCircle className="w-5 h-5" />
            <span>Novo Lançamento</span>
          </button>
        </header>

        {/* Resumo / Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Saldo Atual</p>
              <h2 className={`text-2xl font-bold mt-1 ${total >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
                R$ {total.toFixed(2)}
              </h2>
            </div>
            <div className="p-3 bg-slate-100 rounded-lg text-slate-700">
              <Wallet className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Receitas do Mês</p>
              <h2 className="text-2xl font-bold text-emerald-600 mt-1">
                R$ {income.toFixed(2)}
              </h2>
            </div>
            <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Despesas do Mês</p>
              <h2 className="text-2xl font-bold text-rose-600 mt-1">
                R$ {expense.toFixed(2)}
              </h2>
            </div>
            <div className="p-3 bg-rose-50 rounded-lg text-rose-600">
              <TrendingDown className="w-6 h-6" />
            </div>
          </div>
        </section>

        {/* Tabela de Lançamentos */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">Lançamentos Recentes</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-200">
                  <th className="p-4">Descrição</th>
                  <th className="p-4">Categoria</th>
                  <th className="p-4">Data</th>
                  <th className="p-4">Valor</th>
                  <th className="p-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">
                      Nenhum lançamento encontrado.
                    </td>
                  </tr>
                ) : (
                  transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-4 font-medium text-slate-800">{t.description}</td>
                      <td className="p-4 text-slate-500">{t.category}</td>
                      <td className="p-4 text-slate-500">{t.date}</td>
                      <td className={`p-4 font-semibold ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {t.type === 'income' ? '+' : '-'} R$ {t.amount.toFixed(2)}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleDeleteTransaction(t.id)}
                          className="text-slate-400 hover:text-rose-600 transition p-1 rounded cursor-pointer"
                          title="Excluir Lançamento"
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
        </section>

      </div>

      {/* Modal de Novo Lançamento */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-6 relative border border-slate-200">
            <div className="flex justify-between items-center border-b pb-3 border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Novo Lançamento</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
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
                  placeholder="Ex: Consultoria, Supermercado..."
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
                    onChange={(e) => setType(e.target.value as 'income' | 'expense')}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="income">Receita</option>
                    <option value="expense">Despesa</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                    Categoria
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Serviços, Alimentação"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

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
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition"
                >
                  Salvar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}