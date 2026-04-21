import { useState, useEffect } from 'react'
import { api, Transaction, Summary } from '../lib/api'
import { formatCurrency, formatMonth } from '../lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Download } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts'

const COLORS = ['#22c55e', '#10b981', '#14b8a6', '#ef4444', '#f97316', '#eab308', '#3b82f6', '#ec4899', '#8b5cf6', '#6b7280']

export default function Relatorios() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('6')

  useEffect(() => {
    loadData()
  }, [period])

  const loadData = async () => {
    try {
      const [txData, summaryData] = await Promise.all([
        api.transactions.list(),
        api.transactions.summary(),
      ])
      setTransactions(txData)
      setSummary(summaryData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportCSV = () => {
    const headers = ['Data', 'Tipo', 'Categoria', 'Descrição', 'Valor']
    const rows = transactions.map((t) => [
      new Date(t.date).toLocaleDateString('pt-BR'),
      t.type === 'income' ? 'Receita' : 'Despesa',
      t.category,
      t.description || '',
      t.amount.toString().replace('.', ','),
    ])

    const csv = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `extrato_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const pieData = transactions
    .filter((t) => t.type === 'expense')
    .reduce((acc: { name: string; value: number }[], t) => {
      const existing = acc.find((a) => a.name === t.category)
      if (existing) {
        existing.value += t.amount
      } else {
        acc.push({ name: t.category, value: t.amount })
      }
      return acc
    }, [])

  const months = Array.from({ length: parseInt(period) }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - (parseInt(period) - 1 - i))
    return d
  })

  const lineData = months.map((d) => {
    const monthTransactions = transactions.filter((t) => {
      const td = new Date(t.date)
      return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear()
    })

    return {
      month: formatMonth(d),
      income: monthTransactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
      expense: monthTransactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    }
  })

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
        <h2 className="text-2xl font-bold">Relatórios</h2>
        <Button onClick={exportCSV}>
          <Download className="h-4 w-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      <div className="flex gap-2">
        <Button variant={period === '3' ? 'default' : 'outline'} onClick={() => setPeriod('3')}>
          3 meses
        </Button>
        <Button variant={period === '6' ? 'default' : 'outline'} onClick={() => setPeriod('6')}>
          6 meses
        </Button>
        <Button variant={period === '12' ? 'default' : 'outline'} onClick={() => setPeriod('12')}>
          12 meses
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Receitas vs Despesas</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => formatCurrency(v)} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend />
                <Line type="monotone" dataKey="income" stroke="#22c55e" name="Receitas" />
                <Line type="monotone" dataKey="expense" stroke="#ef4444" name="Despesas" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Despesas por Categoria</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                Nenhuma despesa registrada
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumo Geral</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950">
              <p className="text-sm text-green-600 dark:text-green-400">Total de Receitas</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(summary?.income || 0)}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950">
              <p className="text-sm text-red-600 dark:text-red-400">Total de Despesas</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {formatCurrency(summary?.expenses || 0)}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-primary/10">
              <p className="text-sm text-primary">Saldo Total</p>
              <p className="text-2xl font-bold">
                {formatCurrency(summary?.total || 0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}