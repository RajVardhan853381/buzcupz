import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, Trash2, Clock, Users, CreditCard, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/utils/cn';

type Category = 'starters' | 'mains' | 'desserts' | 'drinks';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: Category;
  popular?: boolean;
}

interface CartItem extends MenuItem {
  quantity: number;
}

const categories: { id: Category; label: string }[] = [
  { id: 'starters', label: 'Starters' },
  { id: 'mains', label: 'Main Course' },
  { id: 'desserts', label: 'Desserts' },
  { id: 'drinks', label: 'Drinks' },
];

const menuItems: MenuItem[] = [
  { id: '1', name: 'Truffle Bruschetta', description: 'Toasted sourdough with black truffle spread', price: 14.99, image: '🍞', category: 'starters', popular: true },
  { id: '2', name: 'Lobster Bisque', description: 'Creamy lobster soup with herb croutons', price: 18.99, image: '🍲', category: 'starters' },
  { id: '3', name: 'Caprese Salad', description: 'Fresh mozzarella, tomatoes, and basil', price: 12.99, image: '🥗', category: 'starters' },
  { id: '4', name: 'Wagyu Steak', description: 'A5 Japanese wagyu with seasonal vegetables', price: 89.99, image: '🥩', category: 'mains', popular: true },
  { id: '5', name: 'Grilled Salmon', description: 'Atlantic salmon with lemon butter sauce', price: 34.99, image: '🐟', category: 'mains' },
  { id: '6', name: 'Mushroom Risotto', description: 'Arborio rice with wild mushrooms', price: 28.99, image: '🍚', category: 'mains' },
  { id: '7', name: 'Tiramisu', description: 'Classic Italian coffee dessert', price: 12.99, image: '🍰', category: 'desserts', popular: true },
  { id: '8', name: 'Crème Brûlée', description: 'Vanilla custard with caramelized sugar', price: 11.99, image: '🍮', category: 'desserts' },
  { id: '9', name: 'Signature Martini', description: 'Premium vodka with a hint of citrus', price: 16.99, image: '🍸', category: 'drinks' },
  { id: '10', name: 'Aged Wine', description: '2018 Cabernet Sauvignon', price: 24.99, image: '🍷', category: 'drinks' },
];

export function OrdersPage() {
  const [activeCategory, setActiveCategory] = useState<Category>('starters');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedTable] = useState('Table 5');

  const filteredItems = menuItems.filter(item => item.category === activeCategory);
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = cartTotal * 0.08;
  const grandTotal = cartTotal + tax;

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => {
      return prev
        .map(i => i.id === id ? { ...i, quantity: i.quantity + delta } : i)
        .filter(i => i.quantity > 0);
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Menu Section */}
      <div className="lg:col-span-2 space-y-6">
        {/* Category Tabs */}
        <Card hover={false} className="p-2">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {categories.map((cat) => (
              <motion.button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  'relative px-5 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-colors',
                  activeCategory === cat.id
                    ? 'text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {activeCategory === cat.id && (
                  <motion.div
                    layoutId="activeCategory"
                    className="absolute inset-0 bg-gradient-to-r from-gold-500 via-warm-500 to-gold-600 rounded-xl shadow-lg shadow-gold-200/50"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{cat.label}</span>
              </motion.button>
            ))}
          </div>
        </Card>

        {/* Menu Items Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  onClick={() => addToCart(item)}
                  className="group overflow-hidden"
                >
                  <div className="relative p-4">
                    {item.popular && (
                      <Badge variant="gold" className="absolute top-2 right-2 z-10">
                        Popular
                      </Badge>
                    )}
                    <div className="w-full h-24 rounded-xl bg-gradient-to-br from-gold-50 to-warm-50 flex items-center justify-center text-5xl mb-3 group-hover:scale-105 transition-transform">
                      {item.image}
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1 truncate">{item.name}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-2 h-10">{item.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold bg-gradient-to-r from-gold-600 to-warm-500 bg-clip-text text-transparent">
                        ${item.price.toFixed(2)}
                      </span>
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="w-8 h-8 rounded-full bg-gradient-to-r from-gold-500 to-warm-500 flex items-center justify-center text-white shadow-lg shadow-gold-200/50"
                      >
                        <Plus className="w-4 h-4" />
                      </motion.div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Cart Section */}
      <div className="lg:col-span-1">
        <Card hover={false} className="sticky top-24 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-gold-50 to-warm-50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Current Order</h2>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <Users className="w-4 h-4" /> {selectedTable}
                </p>
              </div>
              <Badge variant="gold" className="flex items-center gap-1">
                <Clock className="w-3 h-3" /> 12:45
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="max-h-[400px] overflow-y-auto">
            {cart.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12 text-gray-400"
              >
                <div className="text-5xl mb-3">🍽️</div>
                <p className="font-medium">No items yet</p>
                <p className="text-sm">Add items from the menu</p>
              </motion.div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {cart.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20, height: 0 }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100"
                    >
                      <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-2xl shadow-sm">
                        {item.image}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate text-sm">{item.name}</h4>
                        <p className="text-sm font-semibold text-gold-600">${item.price.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-300"
                        >
                          <Minus className="w-3 h-3" />
                        </motion.button>
                        <span className="w-6 text-center font-semibold text-sm">{item.quantity}</span>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-7 h-7 rounded-full bg-gradient-to-r from-gold-500 to-warm-500 flex items-center justify-center text-white"
                        >
                          <Plus className="w-3 h-3" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => removeFromCart(item.id)}
                          className="w-7 h-7 rounded-full hover:bg-red-100 flex items-center justify-center text-red-500 ml-1"
                        >
                          <Trash2 className="w-3 h-3" />
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </CardContent>

          {cart.length > 0 && (
            <div className="p-5 border-t border-gray-100 bg-white space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax (8%)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-100">
                  <span>Total</span>
                  <span className="bg-gradient-to-r from-gold-600 to-warm-500 bg-clip-text text-transparent">
                    ${grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button variant="secondary" size="lg" className="w-full">
                  <DollarSign className="w-4 h-4" />
                  Split
                </Button>
                <Button size="lg" className="w-full" onClick={() => setIsPaymentModalOpen(true)}>
                  <CreditCard className="w-4 h-4" />
                  Pay ${grandTotal.toFixed(2)}
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Complete Payment"
        size="md"
      >
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-gradient-to-r from-gold-50 to-warm-50 border border-gold-100">
            <p className="text-sm text-gray-600 mb-1">Total Amount</p>
            <p className="text-3xl font-bold bg-gradient-to-r from-gold-600 to-warm-500 bg-clip-text text-transparent">
              ${grandTotal.toFixed(2)}
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Payment Method</h3>
            <div className="grid grid-cols-3 gap-3">
              {['💳 Card', '💵 Cash', '📱 Mobile'].map((method, i) => (
                <motion.button
                  key={method}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    'p-4 rounded-xl border-2 text-center font-medium transition-all',
                    i === 0 
                      ? 'border-gold-400 bg-gold-50 text-gold-700' 
                      : 'border-gray-200 hover:border-gold-200 hover:bg-gold-50/50'
                  )}
                >
                  {method}
                </motion.button>
              ))}
            </div>
          </div>

          <Button size="lg" className="w-full">
            Complete Payment
          </Button>
        </div>
      </Modal>
    </div>
  );
}
