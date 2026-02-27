import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import {
  LayoutDashboard,
  ShoppingCart,
  Grid3X3,
  CalendarDays,
  BookOpen,
  Package,
  BarChart3,
  Search,
  Bell,
  User,
  Menu,
  X,
  ChevronDown,
  Coffee,
  LogOut,
  Settings as SettingsIcon,
  MessageSquare,
  CreditCard,
  Users,
  CheckSquare,
  Trash2,
  Shield,
} from 'lucide-react';
import { cn } from '@/utils/cn';

type NavItem = {
  id: string;
  label: string;
  icon: React.ElementType;
};

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'orders', label: 'Orders / POS', icon: ShoppingCart },
  { id: 'tables', label: 'Tables', icon: Grid3X3 },
  { id: 'reservations', label: 'Reservations', icon: CalendarDays },
  { id: 'menu', label: 'Menu', icon: BookOpen },
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
];

interface TopNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function TopNavigation({ activeTab, onTabChange }: TopNavigationProps) {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [notifications] = useState(3);
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gold-200/50 shadow-lg shadow-gold-100/20"
      >
        <div className="max-w-[1400px] mx-auto px-4 lg:px-6">
          <div className="flex items-center justify-between h-16 lg:h-18">
            {/* Logo */}
            <motion.div
              className="flex items-center gap-2 cursor-pointer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-400 via-warm-500 to-gold-600 flex items-center justify-center shadow-lg shadow-gold-300/50">
                  <Coffee className="w-5 h-5 text-white" />
                </div>
                <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-gradient-to-r from-gold-300 to-warm-400 rounded-full animate-pulse" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-gold-600 via-warm-500 to-gold-500 bg-clip-text text-transparent hidden sm:block">
                BuzCupz
              </span>
            </motion.div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <motion.button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    className={cn(
                      'relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300',
                      isActive
                        ? 'text-white'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gold-50'
                    )}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-gradient-to-r from-gold-500 via-warm-500 to-gold-600 rounded-full shadow-lg shadow-gold-300/50"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                    <Icon className={cn('w-4 h-4 relative z-10', isActive && 'text-white')} />
                    <span className="relative z-10">{item.label}</span>
                  </motion.button>
                );
              })}
            </nav>

            {/* Right Section */}
            <div className="flex items-center gap-3">
              {/* Search */}
              <motion.div
                className={cn(
                  'hidden md:flex items-center gap-2 px-3 py-2 rounded-full border transition-all duration-300',
                  isSearchFocused
                    ? 'border-gold-400 bg-white shadow-lg shadow-gold-100/50 w-64'
                    : 'border-gray-200 bg-gray-50/80 w-48'
                )}
                animate={{ width: isSearchFocused ? 256 : 192 }}
              >
                <Search className="w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="flex-1 bg-transparent text-sm outline-none placeholder-gray-400"
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                />
              </motion.div>

              {/* Notifications */}
              <motion.button
                onClick={() => {
                  onTabChange('notifications');
                  setIsProfileOpen(false);
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative p-2 rounded-full hover:bg-gold-50 transition-colors"
              >
                <Bell className="w-5 h-5 text-gray-600" />
                {notifications > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-gradient-to-r from-warm-500 to-gold-500 text-white text-xs rounded-full flex items-center justify-center font-medium shadow-lg"
                  >
                    {notifications}
                  </motion.span>
                )}
              </motion.button>

              {/* Profile Dropdown */}
              <div className="relative">
                <motion.button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-2 p-1.5 pr-3 rounded-full hover:bg-gold-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-400 to-warm-500 flex items-center justify-center text-white font-semibold text-sm shadow-md">
                    JD
                  </div>
                  <ChevronDown className={cn(
                    'w-4 h-4 text-gray-500 transition-transform duration-200 hidden sm:block',
                    isProfileOpen && 'rotate-180'
                  )} />
                </motion.button>

                <AnimatePresence>
                  {isProfileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl shadow-gold-200/30 border border-gold-100 overflow-hidden"
                    >
                      <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-gold-50 to-warm-50">
                        <p className="font-semibold text-gray-900">John Doe</p>
                        <p className="text-sm text-gray-500">john@buzcupz.com</p>
                      </div>
                      <div className="p-2">
                        <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gold-50 rounded-xl transition-colors">
                          <User className="w-4 h-4" />
                          Profile
                        </button>
                        <button 
                          onClick={() => {
                            onTabChange('settings');
                            setIsProfileOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gold-50 rounded-xl transition-colors"
                        >
                          <SettingsIcon className="w-4 h-4" />
                          Settings
                        </button>
                        <button 
                          onClick={() => {
                            onTabChange('customers');
                            setIsProfileOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gold-50 rounded-xl transition-colors"
                        >
                          <Users className="w-4 h-4" />
                          Customers
                        </button>
                        <button 
                          onClick={() => {
                            onTabChange('tasks');
                            setIsProfileOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gold-50 rounded-xl transition-colors"
                        >
                          <CheckSquare className="w-4 h-4" />
                          Tasks
                        </button>
                        <button 
                          onClick={() => {
                            onTabChange('wastage');
                            setIsProfileOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gold-50 rounded-xl transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Wastage
                        </button>
                        <button 
                          onClick={() => {
                            onTabChange('compliance');
                            setIsProfileOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gold-50 rounded-xl transition-colors"
                        >
                          <Shield className="w-4 h-4" />
                          Compliance
                        </button>
                        <hr className="my-2 border-gray-100" />
                        <button 
                          onClick={() => {
                            onTabChange('billing');
                            setIsProfileOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gold-50 rounded-xl transition-colors"
                        >
                          <CreditCard className="w-4 h-4" />
                          Billing
                        </button>
                        <button 
                          onClick={() => {
                            onTabChange('support');
                            setIsProfileOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gold-50 rounded-xl transition-colors"
                        >
                          <MessageSquare className="w-4 h-4" />
                          Support
                        </button>
                        <hr className="my-2 border-gray-100" />
                        <button 
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-warm-600 hover:bg-warm-50 rounded-xl transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Mobile Menu Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-full hover:bg-gold-50 transition-colors"
              >
                <Menu className="w-6 h-6 text-gray-700" />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] lg:hidden"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-400 via-warm-500 to-gold-600 flex items-center justify-center">
                    <Coffee className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xl font-bold bg-gradient-to-r from-gold-600 to-warm-500 bg-clip-text text-transparent">
                    BuzCupz
                  </span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-full hover:bg-gray-100"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </motion.button>
              </div>

              <div className="p-4">
                {/* Mobile Search */}
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 mb-4">
                  <Search className="w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="flex-1 bg-transparent text-sm outline-none"
                  />
                </div>

                {/* Mobile Navigation */}
                <nav className="space-y-1">
                  {navItems.map((item, index) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <motion.button
                        key={item.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => {
                          onTabChange(item.id);
                          setIsMobileMenuOpen(false);
                        }}
                        className={cn(
                          'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium transition-all',
                          isActive
                            ? 'bg-gradient-to-r from-gold-500 to-warm-500 text-white shadow-lg shadow-gold-200/50'
                            : 'text-gray-700 hover:bg-gold-50'
                        )}
                      >
                        <Icon className="w-5 h-5" />
                        {item.label}
                      </motion.button>
                    );
                  })}
                </nav>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spacer for fixed header */}
      <div className="h-16 lg:h-18" />
    </>
  );
}
