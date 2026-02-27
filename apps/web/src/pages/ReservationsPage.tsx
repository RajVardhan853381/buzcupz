import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Users, Phone, Mail, Check, X, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/utils/cn';

interface Reservation {
  id: string;
  name: string;
  phone: string;
  email: string;
  date: string;
  time: string;
  guests: number;
  table: number;
  status: 'confirmed' | 'pending' | 'cancelled';
  notes?: string;
}

const reservations: Reservation[] = [
  { id: '1', name: 'Sarah Johnson', phone: '+1 555-0123', email: 'sarah@email.com', date: '2026-01-15', time: '6:00 PM', guests: 4, table: 5, status: 'confirmed' },
  { id: '2', name: 'Michael Chen', phone: '+1 555-0456', email: 'michael@email.com', date: '2026-01-15', time: '7:00 PM', guests: 2, table: 2, status: 'confirmed' },
  { id: '3', name: 'Emily Davis', phone: '+1 555-0789', email: 'emily@email.com', date: '2026-01-15', time: '7:30 PM', guests: 6, table: 8, status: 'pending' },
  { id: '4', name: 'James Wilson', phone: '+1 555-0321', email: 'james@email.com', date: '2026-01-15', time: '8:00 PM', guests: 3, table: 4, status: 'confirmed', notes: 'Anniversary dinner, request quiet table' },
  { id: '5', name: 'Lisa Anderson', phone: '+1 555-0654', email: 'lisa@email.com', date: '2026-01-16', time: '6:30 PM', guests: 5, table: 6, status: 'pending' },
  { id: '6', name: 'Robert Brown', phone: '+1 555-0987', email: 'robert@email.com', date: '2026-01-16', time: '7:00 PM', guests: 2, table: 1, status: 'cancelled' },
];

const timeSlots = ['5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM', '9:00 PM'];

const statusConfig = {
  confirmed: { label: 'Confirmed', badge: 'success' as const },
  pending: { label: 'Pending', badge: 'warning' as const },
  cancelled: { label: 'Cancelled', badge: 'error' as const },
};

export function ReservationsPage() {
  const [selectedDate] = useState('2026-01-15');
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [isNewReservationOpen, setIsNewReservationOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list');

  const todayReservations = reservations.filter(r => r.date === selectedDate);

  const stats = {
    total: todayReservations.length,
    confirmed: todayReservations.filter(r => r.status === 'confirmed').length,
    pending: todayReservations.filter(r => r.status === 'pending').length,
    guests: todayReservations.reduce((sum, r) => sum + r.guests, 0),
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full lg:w-auto">
          {[
            { label: 'Total Reservations', value: stats.total, icon: Calendar },
            { label: 'Confirmed', value: stats.confirmed, icon: Check },
            { label: 'Pending', value: stats.pending, icon: Clock },
            { label: 'Expected Guests', value: stats.guests, icon: Users },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card hover={false} className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-100 to-warm-100 flex items-center justify-center">
                    <stat.icon className="w-5 h-5 text-gold-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-xs text-gray-500">{stat.label}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        <Button onClick={() => setIsNewReservationOpen(true)}>
          <Plus className="w-4 h-4" />
          New Reservation
        </Button>
      </div>

      {/* Date Navigation & View Toggle */}
      <Card hover={false} className="p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </motion.button>
            
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-900">Monday, January 15</p>
              <p className="text-sm text-gray-500">Today</p>
            </div>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </motion.button>
          </div>

          <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg">
            {(['list', 'timeline'] as const).map((mode) => (
              <motion.button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  'relative px-4 py-2 rounded-md font-medium text-sm capitalize',
                  viewMode === mode ? 'text-white' : 'text-gray-600'
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {viewMode === mode && (
                  <motion.div
                    layoutId="viewMode"
                    className="absolute inset-0 bg-gradient-to-r from-gold-500 to-warm-500 rounded-md"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{mode}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </Card>

      {/* Reservations List/Timeline */}
      <AnimatePresence mode="wait">
        {viewMode === 'list' ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-3"
          >
            {todayReservations.map((reservation, index) => (
              <motion.div
                key={reservation.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  onClick={() => setSelectedReservation(reservation)}
                  className={cn(
                    'p-4',
                    reservation.status === 'cancelled' && 'opacity-60'
                  )}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Time */}
                    <div className="flex items-center gap-3 sm:w-32">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold-100 to-warm-100 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-gold-600" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{reservation.time}</p>
                        <Badge variant={statusConfig[reservation.status].badge}>
                          {statusConfig[reservation.status].label}
                        </Badge>
                      </div>
                    </div>

                    {/* Guest Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{reservation.name}</h3>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" /> {reservation.guests} guests
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-4 h-4" /> {reservation.phone}
                        </span>
                      </div>
                    </div>

                    {/* Table & Actions */}
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center font-bold text-gray-700">
                        T{reservation.table}
                      </div>
                      
                      {reservation.status === 'pending' && (
                        <div className="flex gap-2">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 hover:bg-emerald-200"
                          >
                            <Check className="w-5 h-5" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600 hover:bg-red-200"
                          >
                            <X className="w-5 h-5" />
                          </motion.button>
                        </div>
                      )}
                    </div>
                  </div>

                  {reservation.notes && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-sm text-gray-600 italic">📝 {reservation.notes}</p>
                    </div>
                  )}
                </Card>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="timeline"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card hover={false} className="p-4 overflow-x-auto">
              <div className="min-w-[800px]">
                {/* Time Headers */}
                <div className="grid grid-cols-9 gap-2 mb-4">
                  {timeSlots.map(slot => (
                    <div key={slot} className="text-center">
                      <span className="text-sm font-medium text-gray-600">{slot}</span>
                    </div>
                  ))}
                </div>

                {/* Timeline Rows */}
                {[...Array(8)].map((_, tableIndex) => (
                  <div key={tableIndex} className="grid grid-cols-9 gap-2 mb-2">
                    {timeSlots.map((slot, slotIndex) => {
                      const reservation = todayReservations.find(
                        r => r.table === tableIndex + 1 && r.time === slot
                      );
                      return (
                        <motion.div
                          key={`${tableIndex}-${slotIndex}`}
                          className={cn(
                            'h-16 rounded-lg border-2 border-dashed flex items-center justify-center',
                            reservation
                              ? 'border-gold-300 bg-gradient-to-br from-gold-100 to-warm-100 cursor-pointer'
                              : 'border-gray-200 hover:border-gold-200 hover:bg-gold-50/50 cursor-pointer'
                          )}
                          whileHover={{ scale: 1.05 }}
                          onClick={() => reservation && setSelectedReservation(reservation)}
                        >
                          {reservation ? (
                            <div className="text-center p-1">
                              <p className="text-xs font-semibold text-gold-700 truncate">
                                {reservation.name.split(' ')[0]}
                              </p>
                              <p className="text-xs text-gold-600">{reservation.guests} pax</p>
                            </div>
                          ) : (
                            <Plus className="w-4 h-4 text-gray-300" />
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                ))}

                {/* Table Labels */}
                <div className="absolute left-0 top-0 flex flex-col gap-2 mt-10 -ml-12">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="h-16 flex items-center">
                      <span className="text-sm font-medium text-gray-600">T{i + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reservation Details Modal */}
      <Modal
        isOpen={!!selectedReservation}
        onClose={() => setSelectedReservation(null)}
        title="Reservation Details"
        size="md"
      >
        {selectedReservation && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-100 to-warm-100 flex items-center justify-center text-2xl">
                👤
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{selectedReservation.name}</h3>
                <Badge variant={statusConfig[selectedReservation.status].badge}>
                  {statusConfig[selectedReservation.status].label}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-gray-50">
                <p className="text-sm text-gray-500 mb-1">Date & Time</p>
                <p className="font-semibold text-gray-900">{selectedReservation.time}</p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50">
                <p className="text-sm text-gray-500 mb-1">Guests</p>
                <p className="font-semibold text-gray-900">{selectedReservation.guests} people</p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50">
                <p className="text-sm text-gray-500 mb-1">Table</p>
                <p className="font-semibold text-gray-900">Table {selectedReservation.table}</p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50">
                <p className="text-sm text-gray-500 mb-1">Contact</p>
                <p className="font-semibold text-gray-900 text-sm truncate">{selectedReservation.phone}</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-gray-50">
              <p className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                <Mail className="w-4 h-4" /> Email
              </p>
              <p className="font-medium text-gray-900">{selectedReservation.email}</p>
            </div>

            {selectedReservation.notes && (
              <div className="p-4 rounded-xl bg-gold-50 border border-gold-100">
                <p className="text-sm text-gold-700 font-medium">Special Notes</p>
                <p className="text-gray-700">{selectedReservation.notes}</p>
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1">
                Edit
              </Button>
              {selectedReservation.status === 'confirmed' && (
                <Button className="flex-1">
                  <Users className="w-4 h-4" />
                  Seat Guests
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* New Reservation Modal */}
      <Modal
        isOpen={isNewReservationOpen}
        onClose={() => setIsNewReservationOpen(false)}
        title="New Reservation"
        size="lg"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Guest Name</label>
              <input
                type="text"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-gold-400 focus:ring-2 focus:ring-gold-100 outline-none transition-all"
                placeholder="Enter guest name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-gold-400 focus:ring-2 focus:ring-gold-100 outline-none transition-all"
                placeholder="+1 555-0000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-gold-400 focus:ring-2 focus:ring-gold-100 outline-none transition-all"
                placeholder="email@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Number of Guests</label>
              <select className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-gold-400 focus:ring-2 focus:ring-gold-100 outline-none transition-all bg-white">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                  <option key={n} value={n}>{n} {n === 1 ? 'guest' : 'guests'}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-gold-400 focus:ring-2 focus:ring-gold-100 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
              <select className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-gold-400 focus:ring-2 focus:ring-gold-100 outline-none transition-all bg-white">
                {timeSlots.map(slot => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Special Notes</label>
            <textarea
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-gold-400 focus:ring-2 focus:ring-gold-100 outline-none transition-all resize-none"
              rows={3}
              placeholder="Any special requests or notes..."
            />
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setIsNewReservationOpen(false)}>
              Cancel
            </Button>
            <Button className="flex-1">
              <Check className="w-4 h-4" />
              Create Reservation
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
