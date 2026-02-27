import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  Plus,
  Search,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Send,
  Paperclip,
  BookOpen,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/utils/cn';

type TicketStatus = 'open' | 'in-progress' | 'resolved' | 'closed';

interface Ticket {
  id: string;
  subject: string;
  category: string;
  status: TicketStatus;
  priority: 'low' | 'medium' | 'high';
  created: string;
  lastUpdate: string;
  messages: number;
}

const tickets: Ticket[] = [
  {
    id: '#2847',
    subject: 'Payment integration issue',
    category: 'Billing',
    status: 'in-progress',
    priority: 'high',
    created: '2 hours ago',
    lastUpdate: '30 min ago',
    messages: 5,
  },
  {
    id: '#2846',
    subject: 'How to setup online reservations?',
    category: 'General',
    status: 'resolved',
    priority: 'medium',
    created: '1 day ago',
    lastUpdate: '4 hours ago',
    messages: 8,
  },
  {
    id: '#2845',
    subject: 'Menu item not appearing',
    category: 'Technical',
    status: 'open',
    priority: 'low',
    created: '2 days ago',
    lastUpdate: '2 days ago',
    messages: 2,
  },
];

const knowledgeBase = [
  {
    title: 'Getting Started',
    articles: [
      { title: 'How to create your first order', icon: '📝' },
      { title: 'Setting up your menu', icon: '🍽️' },
      { title: 'Managing table layouts', icon: '🪑' },
      { title: 'Adding staff members', icon: '👥' },
    ],
  },
  {
    title: 'Features',
    articles: [
      { title: 'Using the POS system', icon: '💳' },
      { title: 'Inventory management guide', icon: '📦' },
      { title: 'Analytics and reports', icon: '📊' },
      { title: 'Reservation system', icon: '📅' },
    ],
  },
  {
    title: 'Troubleshooting',
    articles: [
      { title: 'Payment issues', icon: '❌' },
      { title: 'Printer not working', icon: '🖨️' },
      { title: 'Login problems', icon: '🔐' },
      { title: 'Data export guide', icon: '💾' },
    ],
  },
];

const statusConfig = {
  open: { icon: AlertCircle, color: 'text-blue-600 bg-blue-100', label: 'Open' },
  'in-progress': { icon: Clock, color: 'text-yellow-600 bg-yellow-100', label: 'In Progress' },
  resolved: { icon: CheckCircle, color: 'text-green-600 bg-green-100', label: 'Resolved' },
  closed: { icon: XCircle, color: 'text-gray-600 bg-gray-100', label: 'Closed' },
};

export function SupportPage() {
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [activeView, setActiveView] = useState<'tickets' | 'knowledge'>('tickets');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
            Support Center
          </h1>
          <p className="text-gray-600 mt-1">Get help and manage support tickets</p>
        </div>
        <Button className="gap-2" onClick={() => setIsNewTicketOpen(true)}>
          <Plus className="w-4 h-4" />
          New Ticket
        </Button>
      </div>

      {/* View Tabs */}
      <Card hover={false} className="p-2">
        <div className="flex gap-2">
          {[
            { id: 'tickets' as const, label: 'My Tickets', icon: MessageSquare },
            { id: 'knowledge' as const, label: 'Knowledge Base', icon: BookOpen },
          ].map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveView(tab.id)}
              className={cn(
                'relative flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-colors',
                activeView === tab.id ? 'text-white' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {activeView === tab.id && (
                <motion.div
                  layoutId="activeView"
                  className="absolute inset-0 bg-gradient-to-r from-gold-500 via-warm-500 to-gold-600 rounded-xl shadow-lg shadow-gold-200/50"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <tab.icon className="w-4 h-4 relative z-10" />
              <span className="relative z-10">{tab.label}</span>
            </motion.button>
          ))}
        </div>
      </Card>

      {activeView === 'tickets' ? (
        <>
          {/* Search and Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tickets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                />
              </div>
            </CardContent>
          </Card>

          {/* Tickets List */}
          <div className="space-y-3">
            {tickets.map((ticket, index) => {
              const StatusIcon = statusConfig[ticket.status].icon;
              return (
                <motion.div
                  key={ticket.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card hover>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div
                            className={cn(
                              'w-12 h-12 rounded-xl flex items-center justify-center',
                              statusConfig[ticket.status].color
                            )}
                          >
                            <StatusIcon className="w-6 h-6" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-gray-900">{ticket.subject}</h3>
                              <Badge variant="outline" className="text-xs">
                                {ticket.id}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <MessageSquare className="w-4 h-4" />
                                {ticket.messages} messages
                              </span>
                              <span>Category: {ticket.category}</span>
                              <span>Created {ticket.created}</span>
                              <span>Updated {ticket.lastUpdate}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              ticket.priority === 'high'
                                ? 'danger'
                                : ticket.priority === 'medium'
                                ? 'warning'
                                : 'default'
                            }
                          >
                            {ticket.priority}
                          </Badge>
                          <Badge
                            variant={
                              ticket.status === 'resolved'
                                ? 'success'
                                : ticket.status === 'in-progress'
                                ? 'warning'
                                : 'default'
                            }
                          >
                            {statusConfig[ticket.status].label}
                          </Badge>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {knowledgeBase.map((section, sectionIndex) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: sectionIndex * 0.1 }}
            >
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {section.articles.map((article, index) => (
                      <button
                        key={index}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                      >
                        <span className="text-2xl">{article.icon}</span>
                        <span className="text-sm text-gray-700">{article.title}</span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* New Ticket Modal */}
      <Modal isOpen={isNewTicketOpen} onClose={() => setIsNewTicketOpen(false)}>
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Create New Ticket</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <input
                type="text"
                placeholder="Brief description of your issue"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent">
                <option>General</option>
                <option>Technical</option>
                <option>Billing</option>
                <option>Feature Request</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent">
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                rows={4}
                placeholder="Please provide as much detail as possible"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
              />
            </div>
            <div>
              <Button variant="outline" className="gap-2 w-full">
                <Paperclip className="w-4 h-4" />
                Attach Files
              </Button>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <Button variant="outline" onClick={() => setIsNewTicketOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button className="flex-1 gap-2" onClick={() => setIsNewTicketOpen(false)}>
              <Send className="w-4 h-4" />
              Submit Ticket
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
