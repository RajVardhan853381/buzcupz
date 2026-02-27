import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, Eye, EyeOff, Search, DollarSign } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/utils/cn';

type Category = 'starters' | 'mains' | 'desserts' | 'drinks' | 'specials';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  cost: number;
  image: string;
  category: Category;
  available: boolean;
  popular?: boolean;
  allergens?: string[];
}

const categories: { id: Category; label: string; emoji: string }[] = [
  { id: 'starters', label: 'Starters', emoji: '🥗' },
  { id: 'mains', label: 'Main Course', emoji: '🍽️' },
  { id: 'desserts', label: 'Desserts', emoji: '🍰' },
  { id: 'drinks', label: 'Drinks', emoji: '🍹' },
  { id: 'specials', label: 'Chef\'s Specials', emoji: '⭐' },
];

const menuItems: MenuItem[] = [
  { id: '1', name: 'Truffle Bruschetta', description: 'Toasted sourdough with black truffle spread', price: 14.99, cost: 4.50, image: '🍞', category: 'starters', available: true, popular: true, allergens: ['Gluten'] },
  { id: '2', name: 'Lobster Bisque', description: 'Creamy lobster soup with herb croutons', price: 18.99, cost: 6.00, image: '🍲', category: 'starters', available: true, allergens: ['Shellfish', 'Dairy'] },
  { id: '3', name: 'Caprese Salad', description: 'Fresh mozzarella, tomatoes, and basil', price: 12.99, cost: 3.80, image: '🥗', category: 'starters', available: true, allergens: ['Dairy'] },
  { id: '4', name: 'Wagyu Steak', description: 'A5 Japanese wagyu with seasonal vegetables', price: 89.99, cost: 35.00, image: '🥩', category: 'mains', available: true, popular: true },
  { id: '5', name: 'Grilled Salmon', description: 'Atlantic salmon with lemon butter sauce', price: 34.99, cost: 12.00, image: '🐟', category: 'mains', available: true, allergens: ['Fish', 'Dairy'] },
  { id: '6', name: 'Mushroom Risotto', description: 'Arborio rice with wild mushrooms', price: 28.99, cost: 7.50, image: '🍚', category: 'mains', available: false, allergens: ['Dairy'] },
  { id: '7', name: 'Tiramisu', description: 'Classic Italian coffee dessert', price: 12.99, cost: 3.20, image: '🍰', category: 'desserts', available: true, popular: true, allergens: ['Dairy', 'Eggs', 'Gluten'] },
  { id: '8', name: 'Crème Brûlée', description: 'Vanilla custard with caramelized sugar', price: 11.99, cost: 2.80, image: '🍮', category: 'desserts', available: true, allergens: ['Dairy', 'Eggs'] },
  { id: '9', name: 'Signature Martini', description: 'Premium vodka with a hint of citrus', price: 16.99, cost: 5.00, image: '🍸', category: 'drinks', available: true },
  { id: '10', name: 'Aged Wine', description: '2018 Cabernet Sauvignon', price: 24.99, cost: 12.00, image: '🍷', category: 'drinks', available: true },
  { id: '11', name: 'Chef\'s Tasting Menu', description: '7-course seasonal tasting experience', price: 149.99, cost: 45.00, image: '👨‍🍳', category: 'specials', available: true, popular: true },
];

export function MenuPage() {
  const [activeCategory, setActiveCategory] = useState<Category | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const stats = {
    totalItems: menuItems.length,
    available: menuItems.filter(i => i.available).length,
    avgMargin: Math.round(menuItems.reduce((sum, i) => sum + ((i.price - i.cost) / i.price * 100), 0) / menuItems.length),
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Menu Items', value: stats.totalItems, icon: '📋' },
          { label: 'Available Items', value: stats.available, icon: '✅' },
          { label: 'Avg. Profit Margin', value: `${stats.avgMargin}%`, icon: '📈' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card hover={false} className="p-5 bg-gradient-to-br from-white to-gold-50/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <span className="text-3xl">{stat.icon}</span>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Search & Filters */}
      <Card hover={false} className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-gold-400 focus:ring-2 focus:ring-gold-100 outline-none transition-all"
            />
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto">
            <motion.button
              onClick={() => setActiveCategory('all')}
              className={cn(
                'relative px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap',
                activeCategory === 'all' ? 'text-white' : 'text-gray-600 hover:bg-gray-100'
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {activeCategory === 'all' && (
                <motion.div
                  layoutId="menuCategory"
                  className="absolute inset-0 bg-gradient-to-r from-gold-500 to-warm-500 rounded-xl"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">All Items</span>
            </motion.button>
            {categories.map((cat) => (
              <motion.button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  'relative px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap flex items-center gap-1.5',
                  activeCategory === cat.id ? 'text-white' : 'text-gray-600 hover:bg-gray-100'
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {activeCategory === cat.id && (
                  <motion.div
                    layoutId="menuCategory"
                    className="absolute inset-0 bg-gradient-to-r from-gold-500 to-warm-500 rounded-xl"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{cat.emoji}</span>
                <span className="relative z-10">{cat.label}</span>
              </motion.button>
            ))}
          </div>

          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="w-4 h-4" />
            Add Item
          </Button>
        </div>
      </Card>

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.03 }}
              layout
            >
              <Card
                className={cn(
                  'overflow-hidden',
                  !item.available && 'opacity-60'
                )}
              >
                <div className="p-4">
                  <div className="flex gap-4">
                    {/* Item Image */}
                    <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-gold-100 to-warm-100 flex items-center justify-center text-4xl flex-shrink-0">
                      {item.image}
                    </div>

                    {/* Item Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
                        {item.popular && (
                          <Badge variant="gold" className="flex-shrink-0">Popular</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 line-clamp-2 mb-2">{item.description}</p>
                      
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold bg-gradient-to-r from-gold-600 to-warm-500 bg-clip-text text-transparent">
                          ${item.price.toFixed(2)}
                        </span>
                        <span className="text-sm text-gray-400">
                          Cost: ${item.cost.toFixed(2)}
                        </span>
                        <Badge variant={item.available ? 'success' : 'error'}>
                          {item.available ? 'Available' : 'Unavailable'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Allergens */}
                  {item.allergens && item.allergens.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-1">
                      {item.allergens.map(allergen => (
                        <span
                          key={allergen}
                          className="px-2 py-0.5 text-xs bg-amber-100 text-amber-700 rounded-full"
                        >
                          {allergen}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedItem(item)}
                      className="flex-1 py-2 rounded-lg bg-gray-100 text-gray-700 font-medium text-sm hover:bg-gray-200 transition-colors flex items-center justify-center gap-1"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                    >
                      {item.available ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 rounded-lg hover:bg-red-100 text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Edit Item Modal */}
      <Modal
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title="Edit Menu Item"
        size="lg"
      >
        {selectedItem && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-gold-100 to-warm-100 flex items-center justify-center text-5xl">
                {selectedItem.image}
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  defaultValue={selectedItem.name}
                  className="w-full text-xl font-semibold border-0 border-b-2 border-gray-200 focus:border-gold-400 pb-1 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                defaultValue={selectedItem.description}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-gold-400 focus:ring-2 focus:ring-gold-100 outline-none resize-none"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    step="0.01"
                    defaultValue={selectedItem.price}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-gold-400 focus:ring-2 focus:ring-gold-100 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cost ($)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    step="0.01"
                    defaultValue={selectedItem.cost}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-gold-400 focus:ring-2 focus:ring-gold-100 outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                defaultValue={selectedItem.category}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-gold-400 focus:ring-2 focus:ring-gold-100 outline-none bg-white"
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.emoji} {cat.label}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked={selectedItem.available}
                  className="w-5 h-5 rounded border-gray-300 text-gold-500 focus:ring-gold-400"
                />
                <span className="text-sm text-gray-700">Available for ordering</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked={selectedItem.popular}
                  className="w-5 h-5 rounded border-gray-300 text-gold-500 focus:ring-gold-400"
                />
                <span className="text-sm text-gray-700">Mark as Popular</span>
              </label>
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setSelectedItem(null)}>
                Cancel
              </Button>
              <Button className="flex-1">
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Item Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Menu Item"
        size="lg"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
              <input
                type="text"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-gold-400 focus:ring-2 focus:ring-gold-100 outline-none"
                placeholder="e.g., Truffle Pasta"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-gold-400 focus:ring-2 focus:ring-gold-100 outline-none resize-none"
                rows={2}
                placeholder="Describe the dish..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
              <input
                type="number"
                step="0.01"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-gold-400 focus:ring-2 focus:ring-gold-100 outline-none"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cost ($)</label>
              <input
                type="number"
                step="0.01"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-gold-400 focus:ring-2 focus:ring-gold-100 outline-none"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-gold-400 focus:ring-2 focus:ring-gold-100 outline-none bg-white">
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.emoji} {cat.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Emoji Icon</label>
              <input
                type="text"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-gold-400 focus:ring-2 focus:ring-gold-100 outline-none"
                placeholder="🍝"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button className="flex-1">
              <Plus className="w-4 h-4" />
              Add Item
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
