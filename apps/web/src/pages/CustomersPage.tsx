import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Plus,
  Search,
  Mail,
  Phone,
  Calendar,
  TrendingUp,
  Star,
  Gift,
  DollarSign,
  Filter,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/utils/cn';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  visits: number;
  totalSpent: number;
  lastVisit: string;
  loyalty: 'bronze' | 'silver' | 'gold' | 'platinum';
  favorite?: string;
}

const customers: Customer[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah.j@email.com',
    phone: '+1 (555) 123-4567',
    visits: 24,
    totalSpent: 2150.50,
    lastVisit: '2 days ago',
    loyalty: 'gold',
    favorite: 'Wagyu Steak',
  },
  {
    id: '2',
    name: 'Michael Chen',
    email: 'mchen@email.com',
    phone: '+1 (555) 234-5678',
    visits: 48,
    totalSpent: 4280.75,
    lastVisit: '5 hours ago',
    loyalty: 'platinum',
    favorite: 'Lobster Bisque',
  },
  {
    id: '3',
    name: 'Emma Williams',
    email: 'emma.w@email.com',
    phone: '+1 (555) 345-6789',
    visits: 12,
    totalSpent: 980.25,
    lastVisit: '1 week ago',
    loyalty: 'silver',
    favorite: 'Truffle Bruschetta',
  },
  {
    id: '4',
    name: 'David Brown',
    email: 'dbrown@email.com',
    phone: '+1 (555) 456-7890',
    visits: 6,
    totalSpent: 425.00,
    lastVisit: '3 days ago',
    loyalty: 'bronze',
  },
];

const loyaltyConfig = {
  bronze: { color: 'from-orange-400 to-orange-600', bgColor: 'bg-orange-100', textColor: 'text-orange-600' },
  silver: { color: 'from-gray-400 to-gray-600', bgColor: 'bg-gray-100', textColor: 'text-gray-600' },
  gold: { color: 'from-gold-400 to-gold-600', bgColor: 'bg-gold-100', textColor: 'text-gold-600' },
  platinum: { color: 'from-purple-400 to-purple-600', bgColor: 'bg-purple-100', textColor: 'text-purple-600' },
};

export function CustomersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [filterLoyalty, setFilterLoyalty] = useState<string>('all');

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.includes(searchQuery);
    const matchesFilter = filterLoyalty === 'all' || customer.loyalty === filterLoyalty;
    return matchesSearch && matchesFilter;
  });

  const stats = [
    {
      title: 'Total Customers',
      value: '1,248',
      change: '+12.5%',
      icon: Users,
      color: 'from-blue-400 to-blue-600',
    },
    {
      title: 'New This Month',
      value: '86',
      change: '+8.2%',
      icon: TrendingUp,
      color: 'from-green-400 to-green-600',
    },
    {
      title: 'Avg Lifetime Value',
      value: '$1,850',
      change: '+15.3%',
      icon: DollarSign,
      color: 'from-gold-400 to-gold-600',
    },
    {
      title: 'Loyalty Members',
      value: '892',
      change: '71%',
      icon: Star,
      color: 'from-purple-400 to-purple-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
            Customer Management
          </h1>
          <p className="text-gray-600 mt-1">Manage your customer database and loyalty program</p>
        </div>
        <Button className="gap-2" onClick={() => setIsAddCustomerOpen(true)}>
          <Plus className="w-4 h-4" />
          Add Customer
        </Button>
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
            <Card hover>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={cn('w-12 h-12 rounded-xl bg-gradient-to-br shadow-lg flex items-center justify-center', stat.color)}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <Badge variant="success">{stat.change}</Badge>
                </div>
                <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search customers by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={filterLoyalty}
                onChange={(e) => setFilterLoyalty(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
              >
                <option value="all">All Tiers</option>
                <option value="platinum">Platinum</option>
                <option value="gold">Gold</option>
                <option value="silver">Silver</option>
                <option value="bronze">Bronze</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customers List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredCustomers.map((customer, index) => {
          const loyaltyStyles = loyaltyConfig[customer.loyalty];
          return (
            <motion.div
              key={customer.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card hover>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={cn('w-16 h-16 rounded-xl bg-gradient-to-br shadow-lg flex items-center justify-center text-white font-bold text-xl', loyaltyStyles.color)}>
                        {customer.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{customer.name}</h3>
                          <Badge className={cn(loyaltyStyles.bgColor, loyaltyStyles.textColor)}>
                            <Star className="w-3 h-3 mr-1" />
                            {customer.loyalty.charAt(0).toUpperCase() + customer.loyalty.slice(1)}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            {customer.email}
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            {customer.phone}
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Last visit: {customer.lastVisit}
                          </div>
                          {customer.favorite && (
                            <div className="flex items-center gap-2">
                              <Gift className="w-4 h-4" />
                              Favorite: {customer.favorite}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-6">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">{customer.visits}</p>
                        <p className="text-xs text-gray-500">Visits</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold bg-gradient-to-r from-gold-600 to-warm-500 bg-clip-text text-transparent">
                          ${customer.totalSpent.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">Total Spent</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button variant="outline" size="sm">View Details</Button>
                        <Button size="sm">Send Offer</Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Add Customer Modal */}
      <Modal isOpen={isAddCustomerOpen} onClose={() => setIsAddCustomerOpen(false)}>
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Add New Customer</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address (Optional)</label>
              <textarea
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <Button variant="outline" onClick={() => setIsAddCustomerOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button className="flex-1" onClick={() => setIsAddCustomerOpen(false)}>
              Add Customer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
