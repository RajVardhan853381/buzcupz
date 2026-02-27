import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Clock, Check, AlertCircle, Plus } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/utils/cn';

type TableStatus = 'available' | 'occupied' | 'reserved' | 'cleaning';

interface Table {
  id: string;
  number: number;
  seats: number;
  status: TableStatus;
  guests?: number;
  order?: string;
  time?: string;
  total?: number;
}

const tables: Table[] = [
  { id: '1', number: 1, seats: 2, status: 'available' },
  { id: '2', number: 2, seats: 2, status: 'occupied', guests: 2, order: '#1234', time: '45 min', total: 86.50 },
  { id: '3', number: 3, seats: 4, status: 'occupied', guests: 3, order: '#1235', time: '20 min', total: 124.00 },
  { id: '4', number: 4, seats: 4, status: 'reserved', time: '6:30 PM' },
  { id: '5', number: 5, seats: 6, status: 'available' },
  { id: '6', number: 6, seats: 6, status: 'occupied', guests: 5, order: '#1236', time: '1h 15 min', total: 245.80 },
  { id: '7', number: 7, seats: 8, status: 'cleaning' },
  { id: '8', number: 8, seats: 8, status: 'available' },
  { id: '9', number: 9, seats: 4, status: 'occupied', guests: 4, order: '#1237', time: '30 min', total: 156.20 },
  { id: '10', number: 10, seats: 2, status: 'reserved', time: '7:00 PM' },
  { id: '11', number: 11, seats: 4, status: 'available' },
  { id: '12', number: 12, seats: 6, status: 'occupied', guests: 6, order: '#1238', time: '55 min', total: 312.40 },
];

const statusConfig = {
  available: { label: 'Available', color: 'bg-emerald-500', badge: 'success' as const },
  occupied: { label: 'Occupied', color: 'bg-warm-500', badge: 'warning' as const },
  reserved: { label: 'Reserved', color: 'bg-blue-500', badge: 'default' as const },
  cleaning: { label: 'Cleaning', color: 'bg-gray-400', badge: 'default' as const },
};

export function TablesPage() {
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [filterStatus, setFilterStatus] = useState<TableStatus | 'all'>('all');

  const filteredTables = tables.filter(
    t => filterStatus === 'all' || t.status === filterStatus
  );

  const stats = {
    available: tables.filter(t => t.status === 'available').length,
    occupied: tables.filter(t => t.status === 'occupied').length,
    reserved: tables.filter(t => t.status === 'reserved').length,
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Tables', value: tables.length, icon: '🪑', color: 'from-gray-100 to-gray-50' },
          { label: 'Available', value: stats.available, icon: '✅', color: 'from-emerald-100 to-emerald-50' },
          { label: 'Occupied', value: stats.occupied, icon: '🍽️', color: 'from-gold-100 to-warm-50' },
          { label: 'Reserved', value: stats.reserved, icon: '📅', color: 'from-blue-100 to-blue-50' },
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
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <span className="text-3xl">{stat.icon}</span>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filter Tabs */}
      <Card hover={false} className="p-2 flex gap-2 overflow-x-auto">
        {(['all', 'available', 'occupied', 'reserved', 'cleaning'] as const).map((status) => (
          <motion.button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={cn(
              'relative px-4 py-2 rounded-lg font-medium text-sm capitalize whitespace-nowrap transition-colors',
              filterStatus === status
                ? 'text-white'
                : 'text-gray-600 hover:bg-gray-100'
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {filterStatus === status && (
              <motion.div
                layoutId="tableFilter"
                className="absolute inset-0 bg-gradient-to-r from-gold-500 to-warm-500 rounded-lg"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">
              {status === 'all' ? 'All Tables' : status}
            </span>
          </motion.button>
        ))}
      </Card>

      {/* Tables Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredTables.map((table, index) => {
            const config = statusConfig[table.status];
            return (
              <motion.div
                key={table.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: index * 0.03 }}
                layout
              >
                <Card
                  onClick={() => setSelectedTable(table)}
                  className={cn(
                    'relative overflow-hidden',
                    table.status === 'occupied' && 'border-gold-200'
                  )}
                >
                  <div className="p-4 text-center">
                    {/* Status Indicator */}
                    <div className={cn(
                      'absolute top-3 right-3 w-3 h-3 rounded-full',
                      config.color,
                      table.status === 'occupied' && 'animate-pulse'
                    )} />

                    {/* Table Visual */}
                    <div className={cn(
                      'w-16 h-16 mx-auto rounded-xl flex items-center justify-center text-2xl font-bold mb-3 transition-colors',
                      table.status === 'available' && 'bg-emerald-100 text-emerald-600',
                      table.status === 'occupied' && 'bg-gradient-to-br from-gold-100 to-warm-100 text-gold-700',
                      table.status === 'reserved' && 'bg-blue-100 text-blue-600',
                      table.status === 'cleaning' && 'bg-gray-100 text-gray-500'
                    )}>
                      {table.number}
                    </div>

                    <h3 className="font-semibold text-gray-900 mb-1">Table {table.number}</h3>
                    <p className="text-xs text-gray-500 flex items-center justify-center gap-1 mb-2">
                      <Users className="w-3 h-3" /> {table.seats} seats
                    </p>

                    <Badge variant={config.badge}>{config.label}</Badge>

                    {table.status === 'occupied' && table.time && (
                      <p className="text-xs text-gold-600 flex items-center justify-center gap-1 mt-2">
                        <Clock className="w-3 h-3" /> {table.time}
                      </p>
                    )}
                    
                    {table.status === 'reserved' && table.time && (
                      <p className="text-xs text-blue-600 flex items-center justify-center gap-1 mt-2">
                        <Clock className="w-3 h-3" /> {table.time}
                      </p>
                    )}
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Table Details Modal */}
      <Modal
        isOpen={!!selectedTable}
        onClose={() => setSelectedTable(null)}
        title={`Table ${selectedTable?.number}`}
        size="md"
      >
        {selectedTable && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className={cn(
                'w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold',
                selectedTable.status === 'available' && 'bg-emerald-100 text-emerald-600',
                selectedTable.status === 'occupied' && 'bg-gradient-to-br from-gold-100 to-warm-100 text-gold-700',
                selectedTable.status === 'reserved' && 'bg-blue-100 text-blue-600',
                selectedTable.status === 'cleaning' && 'bg-gray-100 text-gray-500'
              )}>
                {selectedTable.number}
              </div>
              <div>
                <Badge variant={statusConfig[selectedTable.status].badge} className="mb-2">
                  {statusConfig[selectedTable.status].label}
                </Badge>
                <p className="text-sm text-gray-600">
                  <Users className="w-4 h-4 inline mr-1" />
                  {selectedTable.seats} seats capacity
                </p>
                {selectedTable.guests && (
                  <p className="text-sm text-gray-600">
                    Current guests: {selectedTable.guests}
                  </p>
                )}
              </div>
            </div>

            {selectedTable.status === 'occupied' && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-gold-50 to-warm-50 border border-gold-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Order {selectedTable.order}</span>
                  <Badge variant="gold">{selectedTable.time}</Badge>
                </div>
                <p className="text-2xl font-bold text-gold-700">
                  ${selectedTable.total?.toFixed(2)}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {selectedTable.status === 'available' && (
                <>
                  <Button variant="secondary" className="w-full">
                    <AlertCircle className="w-4 h-4" />
                    Reserve
                  </Button>
                  <Button className="w-full">
                    <Plus className="w-4 h-4" />
                    New Order
                  </Button>
                </>
              )}
              {selectedTable.status === 'occupied' && (
                <>
                  <Button variant="secondary" className="w-full">
                    View Order
                  </Button>
                  <Button className="w-full">
                    <Check className="w-4 h-4" />
                    Close Table
                  </Button>
                </>
              )}
              {selectedTable.status === 'reserved' && (
                <>
                  <Button variant="secondary" className="w-full">
                    Cancel
                  </Button>
                  <Button className="w-full">
                    <Users className="w-4 h-4" />
                    Seat Guests
                  </Button>
                </>
              )}
              {selectedTable.status === 'cleaning' && (
                <Button className="w-full col-span-2">
                  <Check className="w-4 h-4" />
                  Mark Ready
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
