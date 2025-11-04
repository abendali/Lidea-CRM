import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, MinusCircle, Search } from "lucide-react";
import { AddTransactionModal } from "@/components/add-transaction-modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// TODO: remove mock data
const mockTransactions = [
  { id: 1, type: 'income', amount: 450, category: 'Sales', description: 'Product Sale - Widget A', date: '2025-11-03' },
  { id: 2, type: 'expense', amount: 850, category: 'Materials', description: 'Raw Materials Purchase', date: '2025-11-03' },
  { id: 3, type: 'income', amount: 320, category: 'Sales', description: 'Product Sale - Widget B', date: '2025-11-02' },
  { id: 4, type: 'expense', amount: 125, category: 'Utilities', description: 'Electricity and Water Bills', date: '2025-11-02' },
  { id: 5, type: 'income', amount: 1200, category: 'Sales', description: 'Bulk Order - 50 units', date: '2025-11-01' },
  { id: 6, type: 'expense', amount: 450, category: 'Labor', description: 'Worker Wages - Week 44', date: '2025-11-01' },
  { id: 7, type: 'expense', amount: 200, category: 'Marketing', description: 'Facebook Ads Campaign', date: '2025-10-31' },
  { id: 8, type: 'income', amount: 675, category: 'Services', description: 'Custom Assembly Service', date: '2025-10-30' },
];

export default function Cashflow() {
  const [transactions, setTransactions] = useState(mockTransactions);
  const [initialCapital, setInitialCapital] = useState(5000);
  const [isEditingCapital, setIsEditingCapital] = useState(false);
  const [capitalInput, setCapitalInput] = useState(initialCapital.toString());
  const [addTransactionOpen, setAddTransactionOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('income');
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const netBalance = totalIncome - totalExpense;
  const currentCapital = initialCapital + netBalance;

  const categories = Array.from(new Set(transactions.map(t => t.category)));

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         t.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || t.type === filterType;
    const matchesCategory = filterCategory === 'all' || t.category === filterCategory;
    return matchesSearch && matchesType && matchesCategory;
  });

  const handleAddTransaction = (data: any) => {
    const newTransaction = {
      id: Math.max(...transactions.map(t => t.id)) + 1,
      type: transactionType,
      ...data,
    };
    setTransactions([newTransaction, ...transactions]);
    console.log('Transaction added:', newTransaction);
  };

  const openAddTransaction = (type: 'income' | 'expense') => {
    setTransactionType(type);
    setAddTransactionOpen(true);
  };

  const handleSaveCapital = () => {
    const value = parseFloat(capitalInput);
    if (!isNaN(value) && value >= 0) {
      setInitialCapital(value);
      setIsEditingCapital(false);
      console.log('Initial capital updated:', value);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">Cashflow Tracker</h1>
          <p className="text-sm text-muted-foreground">
            Monitor your income and expenses
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => openAddTransaction('income')} data-testid="button-add-income">
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Income
          </Button>
          <Button variant="secondary" onClick={() => openAddTransaction('expense')} data-testid="button-add-expense">
            <MinusCircle className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Balance Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Initial Capital</p>
              {isEditingCapital ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    value={capitalInput}
                    onChange={(e) => setCapitalInput(e.target.value)}
                    className="w-32"
                    data-testid="input-initial-capital"
                  />
                  <Button size="sm" onClick={handleSaveCapital} data-testid="button-save-capital">
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setIsEditingCapital(false);
                      setCapitalInput(initialCapital.toString());
                    }}
                    data-testid="button-cancel-capital"
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold tabular-nums" data-testid="text-initial-capital">
                    ${initialCapital.toFixed(2)}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsEditingCapital(true)}
                    data-testid="button-edit-capital"
                  >
                    Edit
                  </Button>
                </div>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Current Capital</p>
              <p className={`text-2xl font-bold tabular-nums ${currentCapital >= initialCapital ? 'text-chart-2' : 'text-destructive'}`} data-testid="text-current-capital">
                ${currentCapital.toFixed(2)}
              </p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Income</p>
              <p className="text-xl font-bold tabular-nums text-chart-2" data-testid="text-total-income">
                +${totalIncome.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Expenses</p>
              <p className="text-xl font-bold tabular-nums text-destructive" data-testid="text-total-expenses">
                -${totalExpense.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Net Balance</p>
              <p className={`text-xl font-bold tabular-nums ${netBalance >= 0 ? 'text-chart-2' : 'text-destructive'}`} data-testid="text-net-balance">
                {netBalance >= 0 ? '+' : ''}${netBalance.toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
            data-testid="input-search"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[150px]" data-testid="select-type-filter">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="income">Income</SelectItem>
            <SelectItem value="expense">Expense</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[150px]" data-testid="select-category-filter">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Date</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Type</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Category</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Description</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Amount</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b last:border-0" data-testid={`row-transaction-${transaction.id}`}>
                    <td className="p-4 text-sm">{new Date(transaction.date).toLocaleDateString()}</td>
                    <td className="p-4">
                      <Badge variant={transaction.type === 'income' ? 'default' : 'secondary'}>
                        {transaction.type}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm">{transaction.category}</td>
                    <td className="p-4 text-sm">{transaction.description}</td>
                    <td className={`p-4 text-sm text-right tabular-nums font-semibold ${
                      transaction.type === 'income' ? 'text-chart-2' : 'text-destructive'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <AddTransactionModal
        open={addTransactionOpen}
        onOpenChange={setAddTransactionOpen}
        type={transactionType}
        onConfirm={handleAddTransaction}
      />
    </div>
  );
}
