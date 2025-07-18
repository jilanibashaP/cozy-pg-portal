
import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Plus, Search, Filter, InfoIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { getIncomeExpenseSummary } from '@/api/dashboardApi';
import { IncomeExpenseSummary, RentPayment, Expense } from '@/models/types';
import { fetchPayments } from '@/api/paymentApi';
import { fetchExpenses } from '@/api/expenseApi';
import AddTransactionDialog from '@/components/finance/AddTransactionDialog';
import { ChartContainer } from '@/components/ui/chart';
import { Tooltip as TooltipUI } from '@/components/ui/tooltip';
import { TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';



const Finance = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [financialSummary, setFinancialSummary] = useState<IncomeExpenseSummary | null>(null);
  const [payments, setPayments] = useState<RentPayment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [summary, paymentsData, expensesData] = await Promise.all([
        getIncomeExpenseSummary(),
        fetchPayments(),
        fetchExpenses(),
      ]);
      setFinancialSummary(summary);
      setPayments(paymentsData);
      setExpenses(expensesData);
      setLoading(false);
    };
    fetchData();
  }, []);

  // Combine and filter payments and expenses for display
  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 'Rent Payment'.toLowerCase().includes(searchQuery.toLowerCase()) ||
      'Rent'.toLowerCase().includes(searchQuery.toLowerCase());
    return activeTab === 'all' || activeTab === 'income' ? matchesSearch : false;
  });
  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = (expense.description || 'Expense').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (expense.category || '').toLowerCase().includes(searchQuery.toLowerCase());
    return activeTab === 'all' || activeTab === 'expense' ? matchesSearch : false;
  });
  // Merge and sort
  const mergedRows = [
    ...filteredPayments.map((p) => ({
      id: p.id,
      type: 'income',
      description: 'Rent Payment',
      category: 'Rent',
      amount: p.paidAmount || 0,
      date: p.paidDate || p.dueDate,
    })),
    ...filteredExpenses.map((e) => ({
      id: e.id,
      type: 'expense',
      description: e.description || 'Expense',
      category: e.category,
      amount: e.amount || 0,
      date: e.date,
    })),
  ];
  const sortedRows = mergedRows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Generate monthly data with simplified labels
  const monthlyData = financialSummary
    ? financialSummary.monthlyData.map((m) => {
        const date = new Date(m.month + '-01');
        const monthName = date.toLocaleString('default', { month: 'short' });
        return {
          name: monthName,
          moneyIn: m.income,
          moneyOut: m.expenses,
          savings: m.netProfit,
        };
      })
    : [];

  // Chart configurations with user-friendly colors
  const chartConfig = {
    moneyIn: { color: '#22c55e' },  // Green for income/money in
    moneyOut: { color: '#ef4444' },  // Red for expenses/money out
    savings: { color: '#9b87f5' },   // Purple for savings/profit
  };

  // Data for expense breakdown chart with simplified labels
  const expenseData = financialSummary
    ? Object.entries(financialSummary.expenseBreakdown).map(([category, amount]) => ({
        name: category,
        value: amount,
        color: (['Rent', 'Utility', 'Maintenance', 'Supplies', 'Food'].includes(category))
          ? chartConfig[category.toLowerCase()]?.color || (['Rent', 'Utility'].includes(category) ? '#3b82f6' :
            ['Maintenance'].includes(category) ? '#8b5cf6' :
            ['Supplies'].includes(category) ? '#14b8a6' :
            ['Food'].includes(category) ? '#f97316' : '#6b7280')
          : '#6b7280',
      }))
    : [];

  // Format date to display in a more readable format
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading finance data...</div>;
  }

  return (
    <div className="pb-16">
      <PageHeader 
        title="Finance" 
        subtitle="Easy tracking of money in and out" 
        action={<Button size="sm" onClick={() => setAddDialogOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Transaction</Button>} 
      />

      {/* Financial Summary Cards - Simplified Language */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Money In</CardTitle>
            <CardDescription>Total income this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">₹{financialSummary?.totalIncome?.toLocaleString() ?? 0}</div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Money Out</CardTitle>
            <CardDescription>Total expenses this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">₹{financialSummary?.totalExpenses?.toLocaleString() ?? 0}</div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Savings</CardTitle>
            <CardDescription>Money left after expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${financialSummary && financialSummary.netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              ₹{financialSummary?.netProfit?.toLocaleString() ?? 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section - With Simplified Visuals and Labels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Monthly Income vs Expenses Chart - with intuitive labels */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Money Flow By Month</CardTitle>
                <CardDescription>How much money comes in and goes out each month</CardDescription>
              </div>
              <TooltipProvider>
                <TooltipUI>
                  <TooltipTrigger asChild>
                    <InfoIcon size={16} className="text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Green bars show money received. Red bars show expenses. 
                    The higher the green bar, the more money you earned that month.</p>
                  </TooltipContent>
                </TooltipUI>
              </TooltipProvider>
            </div>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ChartContainer config={chartConfig}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    content={(props) => {
                      if (props.active && props.payload && props.payload.length) {
                        return (
                          <div className="bg-background p-2 border rounded-md shadow-md">
                            <p className="font-medium">{props.label} Month</p>
                            {props.payload.map((entry, index) => (
                              <p key={index} className="text-sm" style={{ color: entry.color }}>
                                {entry.name === "moneyIn" ? "Money In: " : entry.name === "moneyOut" ? "Money Out: " : "Savings: "}
                                ₹{entry.value.toLocaleString()}
                              </p>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend formatter={(value) => value === "moneyIn" ? "Money In" : value === "moneyOut" ? "Money Out" : "Savings"} />
                  <Bar dataKey="moneyIn" name="moneyIn" fill={chartConfig.moneyIn.color} />
                  <Bar dataKey="moneyOut" name="moneyOut" fill={chartConfig.moneyOut.color} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
            <div className="mt-4 flex justify-center gap-6 text-sm">
              <div className="flex items-center">
                <span className="inline-block w-3 h-3 mr-1 bg-green-500 rounded-sm"></span>
                <span>Money Coming In</span>
              </div>
              <div className="flex items-center">
                <span className="inline-block w-3 h-3 mr-1 bg-red-500 rounded-sm"></span>
                <span>Money Going Out</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expense Breakdown Chart - With simpler labels */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Where Money is Going</CardTitle>
                <CardDescription>Main areas where money is being spent</CardDescription>
              </div>
              <TooltipProvider>
                <TooltipUI>
                  <TooltipTrigger asChild>
                    <InfoIcon size={16} className="text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>This pie chart shows what you're spending money on. 
                    Larger pieces mean more money spent in that category.</p>
                  </TooltipContent>
                </TooltipUI>
              </TooltipProvider>
            </div>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            <ChartContainer config={chartConfig} className="w-full max-w-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {expenseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    content={(props) => {
                      if (props.active && props.payload && props.payload.length) {
                        const data = props.payload[0].payload;
                        return (
                          <div className="bg-background p-2 border rounded-md shadow-md">
                            <p className="font-medium">{data.name}</p>
                            <p className="text-sm">₹{data.value.toLocaleString()}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Transaction List - now with Created At column explicitly added */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <div className="flex items-center space-x-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="income">Money In</TabsTrigger>
                <TabsTrigger value="expense">Money Out</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Created At</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6">
                      No transactions found.
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedRows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{formatDate(row.date)}</TableCell>
                      <TableCell>{row.description}</TableCell>
                      <TableCell>
                        <Badge variant={row.type === 'income' ? "outline" : "secondary"}>
                          {row.category}
                        </Badge>
                      </TableCell>
                      <TableCell className={`text-right font-medium ${
                        row.type === 'income' ? "text-green-600" : "text-red-600"
                      }`}>
                        {row.type === 'income' ? "+" : "-"}₹{row.amount.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AddTransactionDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
    </div>
  );
};

export default Finance;
