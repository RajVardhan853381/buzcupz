import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign,
  ShoppingCart,
  Users,
  TrendingUp,
  Calendar,
  Clock,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/utils/cn';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const revenueData = [
  { day: 'Mon', revenue: 2400, orders: 45 },
  { day: 'Tue', revenue: 3200, orders: 58 },
  { day: 'Wed', revenue: 2800, orders: 52 },
  { day: 'Thu', revenue: 3600, orders: 64 },
  { day: 'Fri', revenue: 4800, orders: 89 },
  { day: 'Sat', revenue: 5200, orders: 96 },
  { day: 'Sun', revenue: 4600, orders: 84 },
];

const topItems = [
  { name: 'Wagyu Steak', orders: 45, revenue: 4049.55, trend: 12 },
  { name: 'Truffle Bruschetta', orders: 38, revenue: 569.62, trend: 8 },
  { name: 'Lobster Bisque', orders: 32, revenue: 607.68, trend: -3 },
  { name: 'Tiramisu', orders: 29, revenue: 376.71, trend: 15 },
  { name: 'Grilled Salmon', orders: 24, revenue: 839.76, trend: 5 },
];

const recentOrders = [
  { id: '#2847', table: 'Table 5', items: 3, total: 89.97, status: 'Completed', time: '5 min ago' },
  { id: '#2846', table: 'Table 12', items: 2, total: 45.98, status: 'Preparing', time: '12 min ago' },
  { id: '#2845', table: 'Takeaway', items: 4, total: 124.96, status: 'Ready', time: '18 min ago' },
  { id: '#2844', table: 'Table 3', items: 5, total: 156.45, status: 'Completed', time: '25 min ago' },
];

const upcomingReservations = [
  { name: 'Sarah Johnson', party: 4, time: '6:00 PM', table: 'Table 8' },
  { name: 'Michael Chen', party: 2, time: '6:30 PM', table: 'Table 3' },
  { name: 'Emma Williams', party: 6, time: '7:00 PM', table: 'Table 12' },
  { name: 'David Brown', party: 3, time: '7:30 PM', table: 'Table 5' },
];

export function DashboardPage() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const stats = [
    {
      title: "Today's Revenue",
      value: '$5,234.50',
      change: '+12.5%',
      trend: 'up',
      icon: DollarSign,
      color: 'from-emerald-400 to-emerald-600',
    },
    {
      title: "Today's Orders",
      value: '96',
      change: '+8.2%',
      trend: 'up',
      icon: ShoppingCart,
      color: 'from-blue-400 to-blue-600',
    },
    {
      title: 'Active Tables',
      value: '12/18',
      change: '66%',
      trend: 'neutral',
      icon: Users,
      color: 'from-purple-400 to-purple-600',
    },
    {
      title: 'Avg Order Value',
      value: '$54.52',
      change: '+3.1%',
      trend: 'up',
      icon: TrendingUp,
      color: 'from-gold-400 to-gold-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header with Time */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
            Dashboard Overview
          </h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's what's happening today.</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">
            {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="text-sm text-gray-500">
            {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card hover className="relative overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={cn('w-12 h-12 rounded-xl bg-gradient-to-br shadow-lg flex items-center justify-center', stat.color)}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  {stat.trend !== 'neutral' && (
                    <Badge variant={stat.trend === 'up' ? 'success' : 'danger'} className="gap-1">
                      {stat.trend === 'up' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                      {stat.change}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Weekly Revenue</h3>
            <p className="text-sm text-gray-500">Revenue trend for the last 7 days</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="day" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="url(#colorRevenue)"
                  strokeWidth={3}
                  dot={{ fill: '#d97706', r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#d97706" />
                  </linearGradient>
                </defs>
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Orders Chart */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Weekly Orders</h3>
            <p className="text-sm text-gray-500">Number of orders per day</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="day" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Bar dataKey="orders" fill="url(#colorOrders)" radius={[8, 8, 0, 0]} />
                <defs>
                  <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#d97706" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Content Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Items */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Top Selling Items</h3>
            <p className="text-sm text-gray-500">Best performing menu items today</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topItems.map((item, index) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold-100 to-warm-100 flex items-center justify-center text-sm font-bold text-gold-600">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-500">{item.orders} orders</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">${item.revenue.toFixed(2)}</p>
                    <Badge variant={item.trend > 0 ? 'success' : 'danger'} className="gap-1">
                      {item.trend > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                      {Math.abs(item.trend)}%
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
            <p className="text-sm text-gray-500">Latest order activity</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentOrders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-900">{order.id}</p>
                      <Badge
                        variant={
                          order.status === 'Completed'
                            ? 'success'
                            : order.status === 'Preparing'
                            ? 'warning'
                            : 'info'
                        }
                      >
                        {order.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500">
                      {order.table} • {order.items} items
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">${order.total.toFixed(2)}</p>
                    <p className="text-xs text-gray-500">{order.time}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Reservations */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gold-600" />
            <h3 className="text-lg font-semibold text-gray-900">Upcoming Reservations</h3>
          </div>
          <p className="text-sm text-gray-500">Reservations for today</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {upcomingReservations.map((reservation, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card hover className="border-l-4 border-l-gold-500">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-semibold text-gray-900">{reservation.name}</p>
                      <Badge variant="outline" className="gap-1">
                        <Users className="w-3 h-3" />
                        {reservation.party}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      {reservation.time}
                    </div>
                    <p className="text-sm text-gold-600 font-medium mt-2">{reservation.table}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
