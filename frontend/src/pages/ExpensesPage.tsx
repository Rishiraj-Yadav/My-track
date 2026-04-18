import { useState } from 'react'
import { PageFrame } from '../components'
import { formatINR, monthlyEquivalent } from '../lib/finance'
import { useAppStore } from '../store'

export function ExpensesPage() {
  const { expenses, addExpense, updateExpense, deleteExpense } = useAppStore()
  const [form, setForm] = useState({
    name: '',
    category: '', // mapping category to name/type
    amount: '',
    frequency: 'monthly',
    tag: 'avoidable',
  })

  const submit = () => {
    if (!form.name.trim() || !form.amount) return
    addExpense({
      id: crypto.randomUUID(),
      name: form.name.trim(),
      amount: Number(form.amount),
      frequency: form.frequency as 'daily' | 'weekly' | 'monthly',
      tag: form.tag as 'essential' | 'avoidable' | 'impulse',
    })
    setForm({ name: '', category: '', amount: '', frequency: 'monthly', tag: 'avoidable' })
  }

  return (
    <PageFrame>
      {/* Header */}
      <header className="w-full flex justify-between items-end mb-8">
        <div>
          <h1 className="font-headline text-5xl font-bold text-on-surface tracking-tight mb-2">Expense Management</h1>
          <p className="font-body text-on-surface-variant text-lg">Record and categorize your financial outflow.</p>
        </div>
      </header>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Data Entry */}
        <div className="lg:col-span-5 bg-surface-container-low rounded-xl p-10 relative overflow-hidden ghost-border shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -z-10 translate-x-1/2 -translate-y-1/2"></div>
          <h2 className="font-headline text-2xl font-bold text-on-surface mb-8">New Outflow</h2>
          
          <form className="flex flex-col gap-8 relative z-10" onSubmit={(e) => { e.preventDefault(); submit(); }}>
            {/* Amount Input */}
            <div className="flex flex-col group">
              <label className="font-label text-sm font-medium text-on-surface-variant mb-2">Amount</label>
              <div className="relative flex items-end">
                <span className="font-headline text-4xl font-bold text-on-surface mr-2 pb-1">₹</span>
                <input
                  className="w-full bg-transparent border-none text-5xl font-headline font-extrabold text-on-surface p-0 focus:ring-0 placeholder:text-surface-variant outline-none border-b-2 border-surface-variant focus:border-primary transition-colors"
                  placeholder="0.00"
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                />
              </div>
            </div>

            {/* Description/Category Input */}
            <div className="flex flex-col">
              <label className="font-label text-sm font-medium text-on-surface-variant mb-2">Expense Name</label>
              <div className="relative">
                <input
                  className="w-full bg-transparent border-none text-xl font-body text-on-surface p-0 pb-2 focus:ring-0 placeholder:text-surface-variant outline-none border-b-2 border-surface-variant focus:border-primary transition-colors"
                  placeholder="e.g. Dining, Utilities"
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
                <span className="material-symbols-outlined absolute right-0 bottom-3 text-on-surface-variant" style={{ fontVariationSettings: "'FILL' 1" }}>category</span>
              </div>
            </div>

            {/* Type Selector (Pills) */}
            <div className="flex flex-col gap-3">
              <label className="font-label text-sm font-medium text-on-surface-variant">Classification</label>
              <div className="flex flex-wrap gap-3">
                {(['essential', 'avoidable', 'impulse'] as const).map((tagType) => (
                  <label key={tagType} className="cursor-pointer">
                    <input
                      className="peer sr-only"
                      name="expense_tag"
                      type="radio"
                      checked={form.tag === tagType}
                      onChange={() => setForm({ ...form, tag: tagType })}
                    />
                    <div className={`px-5 py-2 rounded-full font-body text-sm bg-surface-container-highest text-on-surface border border-transparent transition-all capitalize
                      ${tagType === 'essential' ? 'peer-checked:bg-primary/20 peer-checked:text-primary peer-checked:border-primary/30' : ''}
                      ${tagType === 'avoidable' ? 'peer-checked:bg-secondary/20 peer-checked:text-secondary peer-checked:border-secondary/30' : ''}
                      ${tagType === 'impulse' ? 'peer-checked:bg-tertiary/20 peer-checked:text-tertiary peer-checked:border-tertiary/30' : ''}
                    `}>
                      {tagType}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Frequency */}
            <div className="flex flex-col">
              <label className="font-label text-sm font-medium text-on-surface-variant mb-2">Frequency</label>
              <select
                className="w-full bg-transparent border-none text-base font-body text-on-surface p-0 pb-2 focus:ring-0 outline-none border-b-2 border-surface-variant focus:border-primary transition-colors cursor-pointer"
                value={form.frequency}
                onChange={(e) => setForm({ ...form, frequency: e.target.value })}
              >
                <option value="daily" className="bg-surface">Daily</option>
                <option value="weekly" className="bg-surface">Weekly</option>
                <option value="monthly" className="bg-surface">Monthly</option>
              </select>
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              className="mt-4 w-full bg-gradient-to-br from-primary to-on-primary-container text-on-primary font-headline font-bold text-lg py-4 rounded-xl shadow-[0_10px_20px_rgba(78,222,163,0.15)] hover:shadow-[0_15px_30px_rgba(78,222,163,0.25)] transition-all flex justify-center items-center gap-2"
            >
              <span>Record Outflow</span>
              <span className="material-symbols-outlined text-xl">arrow_forward</span>
            </button>
          </form>
        </div>

        {/* Right Column: Ledger */}
        <div className="lg:col-span-7 bg-surface-container-lowest rounded-xl p-8 lg:p-12 ghost-border shadow-[inset_0_0_0_1px_rgba(68,71,72,0.15)]">
          <div className="flex justify-between items-center mb-10">
            <h2 className="font-headline text-2xl font-bold text-on-surface">Recent Ledger</h2>
          </div>

          {/* Expense List */}
          <div className="flex flex-col gap-4 max-h-[600px] overflow-y-auto pr-2">
            {expenses.map((expense) => {
              const monthly = monthlyEquivalent(expense.amount, expense.frequency)
              return (
                <div key={expense.id} className="group flex items-center justify-between p-4 rounded-lg hover:bg-surface-container-low transition-colors border border-transparent hover:border-outline-variant/15">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface-variant group-hover:text-primary transition-colors">
                      <span className="material-symbols-outlined">payments</span>
                    </div>
                    <div>
                      <h3 className="font-headline text-lg font-bold text-on-surface truncate max-w-[200px]">{expense.name}</h3>
                      <p className="font-body text-sm text-on-surface-variant capitalize">{expense.frequency}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="flex flex-col items-end gap-1">
                      <span className="font-headline text-xl font-extrabold text-on-surface">-{formatINR(monthly)}</span>
                      <button 
                        onClick={() =>
                          updateExpense(expense.id, {
                            tag: expense.tag === 'essential' ? 'avoidable' : expense.tag === 'avoidable' ? 'impulse' : 'essential',
                          })
                        }
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors
                          ${expense.tag === 'essential' ? 'bg-primary/10 text-primary hover:bg-primary/20' : ''}
                          ${expense.tag === 'avoidable' ? 'bg-secondary/10 text-secondary hover:bg-secondary/20' : ''}
                          ${expense.tag === 'impulse' ? 'bg-tertiary/10 text-tertiary hover:bg-tertiary/20' : ''}
                        `}
                      >
                        <span className="capitalize">{expense.tag}</span>
                      </button>
                    </div>
                    <button 
                      onClick={() => deleteExpense(expense.id)}
                      className="opacity-0 group-hover:opacity-100 p-2 text-on-surface-variant hover:text-tertiary transition-all rounded-full hover:bg-surface-container-highest"
                      title="Delete expense"
                    >
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                </div>
              )
            })}
            
            {expenses.length === 0 && (
              <div className="text-center py-12">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-4">receipt_long</span>
                <p className="text-on-surface-variant font-body">Your ledger is perfectly clean.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageFrame>
  )
}
