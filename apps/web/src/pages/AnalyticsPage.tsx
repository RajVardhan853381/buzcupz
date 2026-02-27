import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, Users, ShoppingBag, Clock, ArrowRight } from 'lucide-react';
import { Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/utils/cn';

const revenueData = [
  { name: 'Mon', revenue: 4200, orders: 52 },
  { name: 'Tue', revenue: 3800, orders: 48 },
  { name: 'Wed', revenue: 5100, orders: 63 },
  { name: 'Thu', revenue: 4800, orders: 59 },
  { name: 'Fri', revenue: 6200, orders: 78 },
  { name: 'Sat', revenue: 7500, orders: 95 },
  { name: 'Sun', revenue: 6800, orders: 85 },
];

const categoryData = [
  { name: 'Main Course', value: 45, color: '#f59e0b' },
  { name: 'Drinks', value: 25, color: '#ea580c' },
  { name: 'Starters', value: 18, color: '#fbbf24' },
  { name: 'Desserts', value: 12, color: '#fed7aa' },
];

const topItems = [
  { name: 'Wagyu Steak', orders: 145, revenue: 13048.55, trend: 12 },
  { name: 'Truffle Bruschetta', orders: 128, revenue: 1918.72, trend: 8 },
  { name: 'Signature Martini', orders: 112, revenue: 1902.88, trend: -3 },
  { name: 'Lobster Bisque', orders: 98, revenue: 1861.02, trend: 15 },
  { name: 'Tiramisu', orders: 94, revenue: 1221.06, trend: 5 },
];

const hourlyData = [
  { hour: '11AM', guests: 15 },
  { hour: '12PM', guests: 45 },
  { hour: '1PM', guests: 58 },
  { hour: '2PM', guests: 32 },
  { hour: '3PM', guests: 18 },
  { hour: '4PM', guests: 12 },
  { hour: '5PM', guests: 25 },
  { hour: '6PM', guests: 48 },
  { hour: '7PM', guests: 72 },
  { hour: '8PM', guests: 85 },
  { hour: '9PM', guests: 65 },
  { hour: '10PM', guests: 38 },
];

const periods = ['Today', 'This Week', 'This Month', 'This Year'];

export function AnalyticsPage() {
  const [activePeriod, setActivePeriod] = useState('This Week');

  const stats = [
    { label: 'Total Revenue', value: '$38,400', change: '+12.5%', positive: true, icon: DollarSign },
    { label: 'Total Orders', value: '480', change: '+8.2%', positive: true, icon: ShoppingBag },
    { label: 'Total Guests', value: '1,245', change: '+15.3%', positive: true, icon: Users },
    { label: 'Avg. Order Value', value: '$80.00', change: '-2.1%', positive: false, icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-500">Track your restaurant performance</p>
        </div>
        <Card hover={false} className="p-1 flex gap-1">
          {periods.map((period) => (
            <motion.button
              key={period}
              onClick={() => setActivePeriod(period)}
              className={cn(
                'relative px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap',
                activePeriod === period ? 'text-white' : 'text-gray-600 hover:bg-gray-100'
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {activePeriod === period && (
                <motion.div
                  layoutId="analyticsPeriod"
                  className="absolute inset-0 bg-gradient-to-r from-gold-500 to-warm-500 rounded-lg"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">{period}</span>
            </motion.button>
          ))}
        </Card>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card hover={false} className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold-100 to-warm-100 flex items-center justify-center">
                  <stat.icon className="w-6 h-6 text-gold-600" />
                </div>
                <Badge variant={stat.positive ? 'success' : 'error'} className="flex items-center gap-1">
                  {stat.positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {stat.change}
                </Badge>
              </div>
              <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card hover={false}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">Revenue Overview</h3>
                  <p className="text-sm text-gray-500">Daily revenue for the week</p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-gradient-to-r from-gold-500 to-warm-500" />
                    Revenue
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-gold-200" />
                    Orders
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(value) => `$${value}`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #fed7aa',
                      borderRadius: '12px',
                      boxShadow: '0 10px 40px rgba(245, 158, 11, 0.1)',
                    }}
                    formatter={(value) => [
                      typeof value === 'number' ? `$${value}` : value,
                      'Value'
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#f59e0b"
                    strokeWidth={3}
                    fill="url(#colorRevenue)"
                  />
                  <Line
                    type="monotone"
                    dataKey="orders"
                    stroke="#fcd34d"
                    strokeWidth={2}
                    dot={{ fill: '#fcd34d', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Category Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card hover={false}>
            <CardHeader>
              <h3 className="font-semibold text-gray-900">Sales by Category</h3>
              <p className="text-sm text-gray-500">Revenue distribution</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #fed7aa',
                      borderRadius: '12px',
                    }}
                    formatter={(value) => [`${value}%`, 'Percentage']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {categoryData.map((cat) => (
                  <div key={cat.name} className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="text-sm text-gray-600">{cat.name}</span>
                    <span className="text-sm font-semibold text-gray-900 ml-auto">{cat.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card hover={false}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">Top Selling Items</h3>
                  <p className="text-sm text-gray-500">Best performers this period</p>
                </div>
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {topItems.map((item, index) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-gold-50/50 transition-colors"
                >
                  <div className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white',
                    index === 0 && 'bg-gradient-to-br from-gold-400 to-gold-600',
                    index === 1 && 'bg-gradient-to-br from-gray-300 to-gray-400',
                    index === 2 && 'bg-gradient-to-br from-amber-600 to-amber-700',
                    index > 2 && 'bg-gray-200 text-gray-600'
                  )}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{item.name}</p>
                    <p className="text-sm text-gray-500">{item.orders} orders</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gold-600">${item.revenue.toFixed(2)}</p>
                    <Badge variant={item.trend > 0 ? 'success' : 'error'} className="text-xs">
                      {item.trend > 0 ? '+' : ''}{item.trend}%
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Peak Hours */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card hover={false}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">Peak Hours</h3>
                  <p className="text-sm text-gray-500">Guest traffic throughout the day</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  Peak: 8PM
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="hour" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #fed7aa',
                      borderRadius: '12px',
                    }}
                    formatter={(value) => [`${value} guests`, 'Guests']}
                  />
                  <Bar
                    dataKey="guests"
                    radius={[6, 6, 0, 0]}
                    fill="url(#barGradient)"
                  />
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#fcd34d" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card hover={false} className="p-6 bg-gradient-to-r from-gold-50 via-warm-50 to-gold-50">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-2xl">💡</span> Quick Insights
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-white/80 backdrop-blur-sm">
              <p className="text-sm text-gray-500 mb-1">Best Selling Day</p>
              <p className="font-semibold text-gray-900">Saturday</p>
              <p className="text-sm text-gold-600">$7,500 avg revenue</p>
            </div>
            <div className="p-4 rounded-xl bg-white/80 backdrop-blur-sm">
              <p className="text-sm text-gray-500 mb-1">Most Popular Time</p>
              <p className="font-semibold text-gray-900">7-9 PM</p>
              <p className="text-sm text-gold-600">42% of daily guests</p>
            </div>
            <div className="p-4 rounded-xl bg-white/80 backdrop-blur-sm">
              <p className="text-sm text-gray-500 mb-1">Returning Customers</p>
              <p className="font-semibold text-gray-900">68%</p>
              <p className="text-sm text-gold-600">+5% from last month</p>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
