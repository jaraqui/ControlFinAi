import { useState, useEffect } from 'react'
import { api, Transaction, Category } from '../lib/api'
import { formatCurrency, formatDate } from '../lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Plus, Pencil, Trash2, X } from 'lucide-react'

export default function Transacoes() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Transaction | null>(null)
  const [form, setForm] = useState({
    type: 'expense' as 'income' | 'expense',
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [txData, catData] = await Promise.all([
        api.transactions.list(),
        api.categories.list(),
      ])
      setTransactions(txData)
      setCategories(catData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const openModal = (transaction?: Transaction) => {
    if (transaction) {
      setEditing(transaction)
      setForm({
        type: transaction.type,
        amount: transaction.amount.toString(),
        category: transaction.category,
        description: transaction.description || '',
        date: new Date(transaction.date).toISOString().split('T')[0],
      })
    } else {
      setEditing(null)
      setForm({
        type: 'expense',
        amount: '',
        category: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
      })
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditing(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const data = { ...form, amount: parseFloat(form.amount) }
    try {
      if (editing) {
        await api.transactions.update(editing.id, data)
      } else {
        await api.transactions.create(data)
      }
      closeModal()
      loadData()
    } catch (error) {
      console.error('Error saving transaction:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir?')) {
      try {
        await api.transactions.delete(id)
        loadData()
      } catch (error) {
        console.error('Error deleting transaction:', error)
      }
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Transações</h2>
        <Button onClick={() => openModal()}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Transação
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todas as Transações</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length > 0 ? (
            <div className="space-y-4">
              {transactions.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{t.description || t.category}</p>
                    <p className="text-sm text-muted-foreground">
                      {t.category} • {formatDate(t.date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={t.type === 'income' ? 'text-green-500 font-medium' : 'text-red-500 font-medium'}>
                      {t.type === 'income' ? '+' : '-'}
                      {formatCurrency(t.amount)}
                    </span>
                    <Button variant="ghost" size="icon" onClick={() => openModal(t)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              Nenhuma transação registrada. Clique em "Nova Transação" para começar.
            </div>
          )}
        </CardContent>
      </Card>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">
                {editing ? 'Editar Transação' : 'Nova Transação'}
              </h3>
              <Button variant="ghost" size="icon" onClick={closeModal}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo</label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={form.type === 'expense' ? 'default' : 'outline'}
                    onClick={() => setForm({ ...form, type: 'expense' })}
                    className="flex-1"
                  >
                    Despesa
                  </Button>
                  <Button
                    type="button"
                    variant={form.type === 'income' ? 'default' : 'outline'}
                    onClick={() => setForm({ ...form, type: 'income' })}
                    className="flex-1"
                  >
                    Receita
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Valor</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border bg-background"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Categoria</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border bg-background"
                  required
                >
                  <option value="">Selecione...</option>
                  {categories
                    .filter((c) => c.type === form.type)
                    .map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Descrição</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Opcional"
                  className="w-full h-10 px-3 rounded-md border bg-background"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Data</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border bg-background"
                  required
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" onClick={closeModal} className="flex-1">
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1">
                  Salvar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}