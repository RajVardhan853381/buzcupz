import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, AlertTriangle, TrendingDown, Search, Plus, ArrowUpDown, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/utils/cn';

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  minStock: number;
  cost: number;
  supplier: string;
  lastOrdered: string;
}

const inventoryItems: InventoryItem[] = [
  { id: '1', name: 'Wagyu Beef (A5)', category: 'Meats', quantity: 12, unit: 'kg', minStock: 10, cost: 180.00, supplier: 'Premium Meats Co.', lastOrdered: '2026-01-10' },
  { id: '2', name: 'Atlantic Salmon', category: 'Seafood', quantity: 8, unit: 'kg', minStock: 15, cost: 28.00, supplier: 'Ocean Fresh', lastOrdered: '2026-01-12' },
  { id: '3', name: 'Black Truffle', category: 'Specialty', quantity: 3, unit: 'pieces', minStock: 5, cost: 95.00, supplier: 'Truffle Imports', lastOrdered: '2026-01-08' },
  { id: '4', name: 'Arborio Rice', category: 'Dry Goods', quantity: 25, unit: 'kg', minStock: 10, cost: 8.50, supplier: 'Italian Imports', lastOrdered: '2026-01-05' },
  { id: '5', name: 'Heavy Cream', category: 'Dairy', quantity: 15, unit: 'liters', minStock: 20, cost: 6.00, supplier: 'Local Dairy', lastOrdered: '2026-01-13' },
  { id: '6', name: 'Eggs (Free Range)', category: 'Dairy', quantity: 120, unit: 'pieces', minStock: 100, cost: 0.45, supplier: 'Farm Fresh', lastOrdered: '2026-01-12' },
  { id: '7', name: 'Olive Oil (Extra Virgin)', category: 'Oils', quantity: 8, unit: 'liters', minStock: 10, cost: 22.00, supplier: 'Mediterranean Imports', lastOrdered: '2026-01-09' },
  { id: '8', name: 'Parmesan Cheese', category: 'Dairy', quantity: 4, unit: 'kg', minStock: 5, cost: 35.00, supplier: 'Italian Imports', lastOrdered: '2026-01-11' },
  { id: '9', name: 'Lobster (Live)', category: 'Seafood', quantity: 6, unit: 'pieces', minStock: 8, cost: 42.00, supplier: 'Ocean Fresh', lastOrdered: '2026-01-13' },
  { id: '10', name: 'Vanilla Pods', category: 'Specialty', quantity: 20, unit: 'pieces', minStock: 15, cost: 8.00, supplier: 'Spice World', lastOrdered: '2026-01-07' },
  { id: '11', name: 'Fresh Basil', category: 'Herbs', quantity: 2, unit: 'bunches', minStock: 5, cost: 3.50, supplier: 'Local Farm', lastOrdered: '2026-01-14' },
  { id: '12', name: 'Premium Vodka', category: 'Beverages', quantity: 6, unit: 'bottles', minStock: 4, cost: 45.00, supplier: 'Spirits Direct', lastOrdered: '2026-01-10' },
];

const categories = ['All', 'Meats', 'Seafood', 'Dairy', 'Dry Goods', 'Specialty', 'Herbs', 'Oils', 'Beverages'];

export function InventoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'name' | 'quantity' | 'cost'>('name');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  const filteredItems = inventoryItems
    .filter(item => {
      const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'quantity') return a.quantity - b.quantity;
      return b.cost - a.cost;
    });

  const lowStockItems = inventoryItems.filter(item => item.quantity < item.minStock);
  const totalValue = inventoryItems.reduce((sum, item) => sum + (item.quantity * item.cost), 0);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Items', value: inventoryItems.length, icon: Package, color: 'from-blue-100 to-blue-50' },
          { label: 'Low Stock Alerts', value: lowStockItems.length, icon: AlertTriangle, color: 'from-red-100 to-red-50', danger: true },
          { label: 'Categories', value: categories.length - 1, icon: TrendingDown, color: 'from-purple-100 to-purple-50' },
          { label: 'Total Value', value: `$${totalValue.toFixed(0)}`, icon: Package, color: 'from-gold-100 to-warm-50' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card hover={false} className={cn('p-5 bg-gradient-to-br', stat.color)}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className={cn(
                    'text-3xl font-bold',
                    stat.danger && stat.value > 0 ? 'text-red-600' : 'text-gray-900'
                  )}>
                    {stat.value}
                  </p>
                </div>
                <div className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center',
                  stat.danger && stat.value > 0 ? 'bg-red-200' : 'bg-white/70'
                )}>
                  <stat.icon className={cn(
                    'w-6 h-6',
                    stat.danger && stat.value > 0 ? 'text-red-600' : 'text-gray-600'
                  )} />
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card hover={false} className="p-4 bg-gradient-to-r from-red-50 to-amber-50 border-red-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-red-800">Low Stock Alert</h3>
                <p className="text-sm text-red-600">{lowStockItems.length} items need restocking</p>
              </div>
              <Button size="sm" className="ml-auto" onClick={() => setIsOrderModalOpen(true)}>
                Order Now
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {lowStockItems.map(item => (
                <span key={item.id} onClick={() => setSelectedItem(item)}>
                  <Badge variant="error" className="cursor-pointer">
                    {item.name}: {item.quantity} {item.unit}
                  </Badge>
                </span>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Filters */}
      <Card hover={false} className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search inventory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-gold-400 focus:ring-2 focus:ring-gold-100 outline-none"
            />
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto">
            {categories.slice(0, 5).map((cat) => (
              <motion.button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  'relative px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap',
                  activeCategory === cat ? 'text-white' : 'text-gray-600 hover:bg-gray-100'
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {activeCategory === cat && (
                  <motion.div
                    layoutId="inventoryCategory"
                    className="absolute inset-0 bg-gradient-to-r from-gold-500 to-warm-500 rounded-xl"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{cat}</span>
              </motion.button>
            ))}
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'quantity' | 'cost')}
            className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:border-gold-400 outline-none"
          >
            <option value="name">Sort by Name</option>
            <option value="quantity">Sort by Quantity</option>
            <option value="cost">Sort by Cost</option>
          </select>

          <Button onClick={() => setIsOrderModalOpen(true)}>
            <Plus className="w-4 h-4" />
            New Order
          </Button>
        </div>
      </Card>

      {/* Inventory Table */}
      <Card hover={false} className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-gold-50 to-warm-50 border-b border-gold-100">
                <th className="text-left px-6 py-4 font-semibold text-gray-700">
                  <button className="flex items-center gap-1 hover:text-gold-600" onClick={() => setSortBy('name')}>
                    Item <ArrowUpDown className="w-4 h-4" />
                  </button>
                </th>
                <th className="text-left px-6 py-4 font-semibold text-gray-700">Category</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-700">
                  <button className="flex items-center gap-1 hover:text-gold-600" onClick={() => setSortBy('quantity')}>
                    Stock <ArrowUpDown className="w-4 h-4" />
                  </button>
                </th>
                <th className="text-left px-6 py-4 font-semibold text-gray-700">Min Stock</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-700">
                  <button className="flex items-center gap-1 hover:text-gold-600" onClick={() => setSortBy('cost')}>
                    Unit Cost <ArrowUpDown className="w-4 h-4" />
                  </button>
                </th>
                <th className="text-left px-6 py-4 font-semibold text-gray-700">Supplier</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-700">Status</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filteredItems.map((item, index) => {
                  const isLowStock = item.quantity < item.minStock;
                  return (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className={cn(
                        'border-b border-gray-100 hover:bg-gold-50/30 transition-colors cursor-pointer',
                        isLowStock && 'bg-red-50/50'
                      )}
                      onClick={() => setSelectedItem(item)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gold-100 to-warm-100 flex items-center justify-center text-lg">
                            📦
                          </div>
                          <span className="font-medium text-gray-900">{item.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{item.category}</td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          'font-semibold',
                          isLowStock ? 'text-red-600' : 'text-gray-900'
                        )}>
                          {item.quantity} {item.unit}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{item.minStock} {item.unit}</td>
                      <td className="px-6 py-4 font-medium text-gold-600">${item.cost.toFixed(2)}</td>
                      <td className="px-6 py-4 text-gray-600 text-sm">{item.supplier}</td>
                      <td className="px-6 py-4">
                        <Badge variant={isLowStock ? 'error' : 'success'}>
                          {isLowStock ? 'Low Stock' : 'In Stock'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                            onClick={(e) => { e.stopPropagation(); }}
                          >
                            <Plus className="w-4 h-4" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="p-2 rounded-lg hover:bg-red-100 text-red-500"
                            onClick={(e) => { e.stopPropagation(); }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Item Detail Modal */}
      <Modal
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title="Inventory Item Details"
        size="md"
      >
        {selectedItem && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gold-100 to-warm-100 flex items-center justify-center text-4xl">
                📦
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{selectedItem.name}</h3>
                <p className="text-gray-500">{selectedItem.category}</p>
                <Badge variant={selectedItem.quantity < selectedItem.minStock ? 'error' : 'success'}>
                  {selectedItem.quantity < selectedItem.minStock ? 'Low Stock' : 'In Stock'}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-gray-50">
                <p className="text-sm text-gray-500">Current Stock</p>
                <p className="text-2xl font-bold text-gray-900">{selectedItem.quantity} {selectedItem.unit}</p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50">
                <p className="text-sm text-gray-500">Minimum Stock</p>
                <p className="text-2xl font-bold text-gray-900">{selectedItem.minStock} {selectedItem.unit}</p>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-gold-50 to-warm-50">
                <p className="text-sm text-gray-500">Unit Cost</p>
                <p className="text-2xl font-bold text-gold-700">${selectedItem.cost.toFixed(2)}</p>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-gold-50 to-warm-50">
                <p className="text-sm text-gray-500">Total Value</p>
                <p className="text-2xl font-bold text-gold-700">
                  ${(selectedItem.quantity * selectedItem.cost).toFixed(2)}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-gray-50">
              <p className="text-sm text-gray-500 mb-1">Supplier</p>
              <p className="font-medium text-gray-900">{selectedItem.supplier}</p>
              <p className="text-sm text-gray-500 mt-2">Last ordered: {selectedItem.lastOrdered}</p>
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1">
                Edit Item
              </Button>
              <Button className="flex-1">
                <Plus className="w-4 h-4" />
                Order More
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Order Modal */}
      <Modal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        title="Create Purchase Order"
        size="lg"
      >
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-gold-50 border border-gold-100">
            <p className="text-sm text-gold-700 font-medium mb-2">Quick Add Low Stock Items</p>
            <div className="flex flex-wrap gap-2">
              {lowStockItems.map(item => (
                <Badge key={item.id} variant="warning" className="cursor-pointer">
                  + {item.name}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Items</label>
            <select className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-gold-400 focus:ring-2 focus:ring-gold-100 outline-none bg-white">
              <option value="">Choose item to add...</option>
              {inventoryItems.map(item => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input
                type="number"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-gold-400 focus:ring-2 focus:ring-gold-100 outline-none"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
              <select className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-gold-400 focus:ring-2 focus:ring-gold-100 outline-none bg-white">
                <option>Premium Meats Co.</option>
                <option>Ocean Fresh</option>
                <option>Italian Imports</option>
                <option>Local Dairy</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setIsOrderModalOpen(false)}>
              Cancel
            </Button>
            <Button className="flex-1">
              Submit Order
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
