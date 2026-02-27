import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckSquare,
  Plus,
  Calendar,
  User,
  Flag,
  Clock,
  Trash2,
  Edit,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/utils/cn';

type TaskPriority = 'low' | 'medium' | 'high';
type TaskStatus = 'todo' | 'in-progress' | 'completed';

interface Task {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  assignee: string;
  dueDate: string;
  category: string;
}

const tasks: Task[] = [
  {
    id: '1',
    title: 'Order fresh ingredients for weekend',
    description: 'Contact suppliers for weekend inventory',
    priority: 'high',
    status: 'todo',
    assignee: 'John Doe',
    dueDate: '2026-02-02',
    category: 'Inventory',
  },
  {
    id: '2',
    title: 'Update menu prices',
    description: 'Review and adjust menu pricing for Q1',
    priority: 'medium',
    status: 'in-progress',
    assignee: 'Jane Smith',
    dueDate: '2026-02-05',
    category: 'Menu',
  },
  {
    id: '3',
    title: 'Staff training session',
    description: 'New POS system training for evening shift',
    priority: 'high',
    status: 'todo',
    assignee: 'Mike Johnson',
    dueDate: '2026-02-03',
    category: 'Staff',
  },
  {
    id: '4',
    title: 'Clean kitchen equipment',
    description: 'Deep clean all kitchen appliances',
    priority: 'low',
    status: 'completed',
    assignee: 'Sarah Williams',
    dueDate: '2026-02-01',
    category: 'Maintenance',
  },
];

const priorityConfig = {
  low: { color: 'from-gray-400 to-gray-600', badge: 'default' as const, label: 'Low' },
  medium: { color: 'from-yellow-400 to-yellow-600', badge: 'warning' as const, label: 'Medium' },
  high: { color: 'from-red-400 to-red-600', badge: 'error' as const, label: 'High' },
};

const statusConfig = {
  'todo': { label: 'To Do', variant: 'default' as const },
  'in-progress': { label: 'In Progress', variant: 'warning' as const },
  'completed': { label: 'Completed', variant: 'success' as const },
};

export function TasksPage() {
  const [tasksList, setTasksList] = useState(tasks);
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all');
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);

  const filteredTasks = tasksList.filter((task) =>
    filterStatus === 'all' ? true : task.status === filterStatus
  );

  const todoCount = tasksList.filter((t) => t.status === 'todo').length;
  const inProgressCount = tasksList.filter((t) => t.status === 'in-progress').length;
  const completedCount = tasksList.filter((t) => t.status === 'completed').length;

  const toggleTaskStatus = (id: string) => {
    setTasksList((prev) =>
      prev.map((task) => {
        if (task.id === id) {
          const statusOrder: TaskStatus[] = ['todo', 'in-progress', 'completed'];
          const currentIndex = statusOrder.indexOf(task.status);
          const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];
          return { ...task, status: nextStatus };
        }
        return task;
      })
    );
  };

  const deleteTask = (id: string) => {
    setTasksList((prev) => prev.filter((task) => task.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
            Tasks & To-Do
          </h1>
          <p className="text-gray-600 mt-1">Manage your daily tasks and assignments</p>
        </div>
        <Button className="gap-2" onClick={() => setIsAddTaskOpen(true)}>
          <Plus className="w-4 h-4" />
          Add Task
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { title: 'To Do', count: todoCount, color: 'from-blue-400 to-blue-600', icon: Clock },
          { title: 'In Progress', count: inProgressCount, color: 'from-yellow-400 to-yellow-600', icon: CheckSquare },
          { title: 'Completed', count: completedCount, color: 'from-green-400 to-green-600', icon: CheckSquare },
        ].map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card hover>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.count}</p>
                  </div>
                  <div className={cn('w-14 h-14 rounded-xl bg-gradient-to-br shadow-lg flex items-center justify-center', stat.color)}>
                    <stat.icon className="w-7 h-7 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filter Tabs */}
      <Card hover={false} className="p-2">
        <div className="flex gap-2 overflow-x-auto">
          {[
            { id: 'all' as const, label: 'All Tasks' },
            { id: 'todo' as const, label: 'To Do' },
            { id: 'in-progress' as const, label: 'In Progress' },
            { id: 'completed' as const, label: 'Completed' },
          ].map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={cn(
                'relative px-5 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-colors',
                filterStatus === tab.id ? 'text-white' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {filterStatus === tab.id && (
                <motion.div
                  layoutId="activeTaskFilter"
                  className="absolute inset-0 bg-gradient-to-r from-gold-500 via-warm-500 to-gold-600 rounded-xl shadow-lg shadow-gold-200/50"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">{tab.label}</span>
            </motion.button>
          ))}
        </div>
      </Card>

      {/* Tasks List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredTasks.map((task, index) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card hover className={cn(task.status === 'completed' && 'opacity-60')}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() => toggleTaskStatus(task.id)}
                      className={cn(
                        'w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all mt-1',
                        task.status === 'completed'
                          ? 'bg-gradient-to-r from-green-500 to-green-600 border-green-500'
                          : 'border-gray-300 hover:border-gold-500'
                      )}
                    >
                      {task.status === 'completed' && <CheckSquare className="w-4 h-4 text-white" />}
                    </button>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1">
                          <h3
                            className={cn(
                              'font-semibold text-gray-900 mb-1',
                              task.status === 'completed' && 'line-through text-gray-500'
                            )}
                          >
                            {task.title}
                          </h3>
                          <p className="text-sm text-gray-600">{task.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" className="gap-1">
                            <Edit className="w-3 h-3" />
                          </Button>
                          <button
                            onClick={() => deleteTask(task.id)}
                            className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm">
                        <Badge variant={priorityConfig[task.priority].badge} className="gap-1">
                          <Flag className="w-3 h-3" />
                          {priorityConfig[task.priority].label}
                        </Badge>
                        <Badge variant={statusConfig[task.status].variant}>
                          {statusConfig[task.status].label}
                        </Badge>
                        <Badge variant="default">{task.category}</Badge>
                        <span className="flex items-center gap-1 text-gray-600">
                          <User className="w-4 h-4" />
                          {task.assignee}
                        </span>
                        <span className="flex items-center gap-1 text-gray-600">
                          <Calendar className="w-4 h-4" />
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add Task Modal */}
      <Modal isOpen={isAddTaskOpen} onClose={() => setIsAddTaskOpen(false)}>
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Create New Task</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Task Title</label>
              <input
                type="text"
                placeholder="Enter task title"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                rows={3}
                placeholder="Add task details..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent">
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent">
                  <option>Inventory</option>
                  <option>Menu</option>
                  <option>Staff</option>
                  <option>Maintenance</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent">
                  <option>John Doe</option>
                  <option>Jane Smith</option>
                  <option>Mike Johnson</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input
                  type="date"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <Button variant="outline" onClick={() => setIsAddTaskOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button className="flex-1" onClick={() => setIsAddTaskOpen(false)}>
              Create Task
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
