import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bell,
  ShoppingCart,
  Calendar,
  Package,
  AlertTriangle,
  CheckCircle,
  Info,
  X,
  Trash2,
  Check,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/utils/cn';

type NotificationType = 'order' | 'reservation' | 'inventory' | 'alert' | 'success' | 'info';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  read: boolean;
  action?: string;
}

const notifications: Notification[] = [
  {
    id: '1',
    type: 'order',
    title: 'New Order Received',
    message: 'Order #2847 for Table 5 - 3 items, $89.97',
    time: '2 minutes ago',
    read: false,
    action: 'View Order',
  },
  {
    id: '2',
    type: 'inventory',
    title: 'Low Stock Alert',
    message: 'Tomatoes running low - only 5 units remaining',
    time: '15 minutes ago',
    read: false,
    action: 'Restock',
  },
  {
    id: '3',
    type: 'reservation',
    title: 'New Reservation',
    message: 'Sarah Johnson booked Table 8 for 4 guests at 6:00 PM',
    time: '1 hour ago',
    read: false,
    action: 'View Details',
  },
  {
    id: '4',
    type: 'success',
    title: 'Payment Received',
    message: 'Table 12 payment processed successfully - $124.50',
    time: '2 hours ago',
    read: true,
  },
  {
    id: '5',
    type: 'alert',
    title: 'Reservation Cancelled',
    message: 'Michael Chen cancelled reservation for tonight',
    time: '3 hours ago',
    read: true,
  },
  {
    id: '6',
    type: 'info',
    title: 'System Update',
    message: 'New features available - Check out the updated analytics dashboard',
    time: '1 day ago',
    read: true,
  },
];

const notificationConfig = {
  order: { icon: ShoppingCart, color: 'from-blue-400 to-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
  reservation: { icon: Calendar, color: 'from-purple-400 to-purple-600', bgColor: 'bg-purple-50', borderColor: 'border-purple-200' },
  inventory: { icon: Package, color: 'from-orange-400 to-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' },
  alert: { icon: AlertTriangle, color: 'from-red-400 to-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200' },
  success: { icon: CheckCircle, color: 'from-green-400 to-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200' },
  info: { icon: Info, color: 'from-gray-400 to-gray-600', bgColor: 'bg-gray-50', borderColor: 'border-gray-200' },
};

export function NotificationsPage() {
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [notificationsList, setNotificationsList] = useState(notifications);

  const filteredNotifications = notificationsList.filter((notification) => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.read;
    if (filter === 'read') return notification.read;
    return true;
  });

  const unreadCount = notificationsList.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    setNotificationsList((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotificationsList((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotificationsList((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAll = () => {
    setNotificationsList([]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-lg shadow-gold-200/50">
            <Bell className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
              Notifications
            </h1>
            <p className="text-gray-600 mt-1">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead} className="gap-2">
              <Check className="w-4 h-4" />
              Mark All Read
            </Button>
          )}
          <Button variant="outline" onClick={clearAll} className="gap-2">
            <Trash2 className="w-4 h-4" />
            Clear All
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <Card hover={false} className="p-2">
        <div className="flex gap-2">
          {[
            { id: 'all' as const, label: 'All', count: notificationsList.length },
            { id: 'unread' as const, label: 'Unread', count: unreadCount },
            { id: 'read' as const, label: 'Read', count: notificationsList.length - unreadCount },
          ].map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={cn(
                'relative flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-colors',
                filter === tab.id ? 'text-white' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {filter === tab.id && (
                <motion.div
                  layoutId="activeFilter"
                  className="absolute inset-0 bg-gradient-to-r from-gold-500 via-warm-500 to-gold-600 rounded-xl shadow-lg shadow-gold-200/50"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">{tab.label}</span>
              <Badge variant={filter === tab.id ? 'gold' : 'default'} className={cn('relative z-10', filter === tab.id && 'border-white/20 text-white')}>
                {tab.count}
              </Badge>
            </motion.button>
          ))}
        </div>
      </Card>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-gray-100 mx-auto mb-4 flex items-center justify-center">
              <Bell className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No notifications</h3>
            <p className="text-gray-500">You're all caught up! Check back later.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification, index) => {
            const config = notificationConfig[notification.type];
            const NotificationIcon = config.icon;

            return (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  hover
                  className={cn(
                    'border-l-4 transition-all',
                    config.borderColor,
                    !notification.read && config.bgColor
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={cn('w-12 h-12 rounded-xl bg-gradient-to-br shadow-lg flex items-center justify-center flex-shrink-0', config.color)}>
                        <NotificationIcon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                            {notification.title}
                            {!notification.read && (
                              <span className="w-2 h-2 rounded-full bg-gold-500" />
                            )}
                          </h3>
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="p-1 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
                          >
                            <X className="w-4 h-4 text-gray-400" />
                          </button>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-500">{notification.time}</span>
                          {notification.action && (
                            <Button variant="outline" size="sm" className="h-7">
                              {notification.action}
                            </Button>
                          )}
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-xs text-gold-600 hover:text-gold-700 font-medium"
                            >
                              Mark as read
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
