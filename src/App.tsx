import { useState } from 'react';
import { Wallet, TrendingUp, TrendingDown, PlusCircle, Trash2 } from 'lucide-react';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
}

export function App() {
  const [transactions] = useState<Transaction[]>([
    { id: '1', description: 'Salário Mensal', amount: 4500, type: 'income', category: 'Trabalho', date: '2026-06-01' },
    { id: '2', description: 'Supermercado Mensal', amount: 850, type: 'expense', category: 'Alimentação', date: '2026-06-03' },
    { id: '3', description: 'Manutenção de Escritório', amount: 300, type: 'expense', category: 'Serviços', date: '2026-06-05' },
  ]);

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const balance = totalIncome - totalExpense;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      {/* Cabeçalho */}
      <header className="bg-slate-900 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Wallet className="w-8 h-8 text-emerald-400" />
            <h1 className="text-xl font-bold tracking-wide">Controle & Gestão Financeira</h1>
          </div>
          <span className="text-sm bg-slate-800 px-3 py-1 rounded-full text-slate-300 border border-slate-700">
            Painel Principal
          </span>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        
        {/* Cartões de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Saldo Atual</p>
              <h3 className={`text-2xl font-bold mt-1 ${balance >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
                R$ {balance.toFixed(2)}
              </h3>
            </div>
            <div className="p-3 bg-slate-100 rounded-xl text-slate-700">
              <Wallet className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Receitas do Mês</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">
                R$ {totalIncome.toFixed(2)}
              </h3>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Despesas do Mês</p>
              <h3 className="text-2xl font-bold text-rose-600 mt-1">
                R$ {totalExpense.toFixed(2)}
              </h3>
            </div>
            <div className="p-3 bg-rose-50 rounded-xl text-rose-600">
              <TrendingDown className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Secção da Tabela de Lançamentos */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900">Lançamentos Recentes</h2>
            <button className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
              <PlusCircle className="w-4 h-4" /> Novo Lançamento
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-6">Descrição</th>
                  <th className="py-3 px-6">Categoria</th>
                  <th className="py-3 px-6">Data</th>
                  <th className="py-3 px-6">Valor</th>
                  <th className="py-3 px-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {transactions.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-medium text-slate-800">{t.description}</td>
                    <td className="py-4 px-6 text-slate-500">
                      <span className="bg-slate-100 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-600">
                        {t.category}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-500">{t.date}</td>
                    <td className={`py-4 px-6 font-semibold ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {t.type === 'income' ? '+' : '-'} R$ {t.amount.toFixed(2)}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button className="text-slate-400 hover:text-rose-600 transition-colors p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}
export default App;