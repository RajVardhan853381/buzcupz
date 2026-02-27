import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Trash2,
  TrendingUp,
  Calendar,
  AlertTriangle,
  DollarSign,
  Package,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '@/utils/cn';

interface WastageEntry {
  id: string;
  item: string;
  quantity: number;
  unit: string;
  cost: number;
  reason: string;
  date: string;
  category: string;
}

const wastageData: WastageEntry[] = [
  {
    id: '1',
    item: 'Tomatoes',
    quantity: 2.5,
    unit: 'kg',
    cost: 15.00,
    reason: 'Spoilage',
    date: '2026-02-01',
    category: 'Vegetables',
  },
  {
    id: '2',
    item: 'Chicken Breast',
    quantity: 1.2,
    unit: 'kg',
    cost: 24.00,
    reason: 'Overproduction',
    date: '2026-02-01',
    category: 'Meat',
  },
  {
    id: '3',
    item: 'Milk',
    quantity: 3,
    unit: 'liters',
    cost: 12.00,
    reason: 'Expired',
    date: '2026-01-31',
    category: 'Dairy',
  },
  {
    id: '4',
    item: 'Lettuce',
    quantity: 1.5,
    unit: 'kg',
    cost: 8.50,
    reason: 'Spoilage',
    date: '2026-01-31',
    category: 'Vegetables',
  },
];

const weeklyData = [
  { day: 'Mon', amount: 45, items: 8 },
  { day: 'Tue', amount: 62, items: 12 },
  { day: 'Wed', amount: 38, items: 7 },
  { day: 'Thu', amount: 71, items: 14 },
  { day: 'Fri', amount: 89, items: 18 },
  { day: 'Sat', amount: 54, items: 11 },
  { day: 'Sun', amount: 41, items: 9 },
];

const categoryData = [
  { name: 'Vegetables', value: 145, percentage: 32 },
  { name: 'Meat', value: 128, percentage: 28 },
  { name: 'Dairy', value: 89, percentage: 20 },
  { name: 'Seafood', value: 67, percentage: 15 },
  { name: 'Others', value: 23, percentage: 5 },
];

export function WastagePage() {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('week');

  const totalWastage = wastageData.reduce((sum, entry) => sum + entry.cost, 0);
  const totalItems = wastageData.reduce((sum, entry) => sum + entry.quantity, 0);
  const avgDaily = (totalWastage / 7).toFixed(2);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center shadow-lg shadow-red-200/50">
            <Trash2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
              Wastage Tracking
            </h1>
            <p className="text-gray-600 mt-1">Monitor and reduce food wastage</p>
          </div>
        </div>
        <Button className="gap-2">
          <Trash2 className="w-4 h-4" />
          Log Wastage
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: 'Total Wastage',
            value: `$${totalWastage.toFixed(2)}`,
            change: '-8.5%',
            icon: DollarSign,
            color: 'from-red-400 to-red-600',
            changePositive: true,
          },
          {
            title: 'Items Wasted',
            value: totalItems.toFixed(1),
            change: '-12.3%',
            icon: Package,
            color: 'from-orange-400 to-orange-600',
            changePositive: true,
          },
          {
            title: 'Daily Average',
            value: `$${avgDaily}`,
            change: '-5.7%',
            icon: TrendingUp,
            color: 'from-yellow-400 to-yellow-600',
            changePositive: true,
          },
          {
            title: 'High Risk Items',
            value: '8',
            change: '+2',
            icon: AlertTriangle,
            color: 'from-purple-400 to-purple-600',
            changePositive: false,
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card hover>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={cn('w-12 h-12 rounded-xl bg-gradient-to-br shadow-lg flex items-center justify-center', stat.color)}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <Badge variant={stat.changePositive ? 'success' : 'error'}>
                    {stat.change}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Trend Chart */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Weekly Wastage Trend</h2>
              <div className="flex gap-2">
                {['week', 'month', 'year'].map((period) => (
                  <button
                    key={period}
                    onClick={() => setSelectedPeriod(period as any)}
                    className={cn(
                      'px-3 py-1 rounded-lg text-sm font-medium transition-colors',
                      selectedPeriod === period
                        ? 'bg-gradient-to-r from-gold-500 to-gold-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                  >
                    {period.charAt(0).toUpperCase() + period.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#ef4444"
                  strokeWidth={3}
                  dot={{ fill: '#ef4444', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Wastage by Category</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Bar dataKey="value" fill="url(#categoryGradient)" radius={[8, 8, 0, 0]} />
                <defs>
                  <linearGradient id="categoryGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#d97706" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Wastage Entries */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Wastage Entries</h2>
          <div className="space-y-3">
            {wastageData.map((entry, index) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center">
                    <Trash2 className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{entry.item}</h3>
                      <Badge variant="default">{entry.category}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>{entry.quantity} {entry.unit}</span>
                      <span>•</span>
                      <span>Reason: {entry.reason}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(entry.date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-red-600">${entry.cost.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">Lost value</p>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
