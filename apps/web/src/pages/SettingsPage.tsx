import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Store,
  Clock,
  MapPin,
  Phone,
  Mail,
  Globe,
  Users,
  Bell,
  Shield,
  Palette,
  Save,
  Upload,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/utils/cn';

type SettingsTab = 'general' | 'hours' | 'staff' | 'notifications' | 'security' | 'appearance';

const tabs: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
  { id: 'general', label: 'General', icon: Store },
  { id: 'hours', label: 'Operating Hours', icon: Clock },
  { id: 'staff', label: 'Staff & Roles', icon: Users },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'appearance', label: 'Appearance', icon: Palette },
];

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [hasChanges, setHasChanges] = useState(false);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Restaurant Information</h3>
              <div className="space-y-4">
                {/* Logo Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Restaurant Logo</label>
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-gold-100 to-warm-100 flex items-center justify-center">
                      <Store className="w-12 h-12 text-gold-600" />
                    </div>
                    <Button variant="outline" className="gap-2">
                      <Upload className="w-4 h-4" />
                      Upload Logo
                    </Button>
                  </div>
                </div>

                {/* Restaurant Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Restaurant Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    defaultValue="The Golden Spoon"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                    onChange={() => setHasChanges(true)}
                  />
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    rows={3}
                    defaultValue="Fine dining experience with contemporary cuisine"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                    onChange={() => setHasChanges(true)}
                  />
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      <Phone className="w-4 h-4 inline mr-1" />
                      Phone Number
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      defaultValue="+1 (555) 123-4567"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                      onChange={() => setHasChanges(true)}
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      <Mail className="w-4 h-4 inline mr-1" />
                      Email Address
                    </label>
                    <input
                      id="email"
                      type="email"
                      defaultValue="contact@goldenspoon.com"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                      onChange={() => setHasChanges(true)}
                    />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Address
                  </label>
                  <input
                    id="address"
                    type="text"
                    defaultValue="123 Main Street, Downtown, NY 10001"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                    onChange={() => setHasChanges(true)}
                  />
                </div>

                {/* Website */}
                <div>
                  <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
                    <Globe className="w-4 h-4 inline mr-1" />
                    Website
                  </label>
                  <input
                    id="website"
                    type="url"
                    defaultValue="https://goldenspoon.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                    onChange={() => setHasChanges(true)}
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 'hours':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Operating Hours</h3>
              <div className="space-y-3">
                {daysOfWeek.map((day) => (
                  <div key={day} className="flex items-center gap-4 p-4 rounded-xl bg-gray-50">
                    <div className="w-32">
                      <p className="font-medium text-gray-900">{day}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="rounded border-gray-300 text-gold-600 focus:ring-gold-500"
                        onChange={() => setHasChanges(true)}
                      />
                      <span className="text-sm text-gray-600">Open</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        defaultValue="11:00"
                        className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                        onChange={() => setHasChanges(true)}
                      />
                      <span className="text-gray-500">to</span>
                      <input
                        type="time"
                        defaultValue="22:00"
                        className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                        onChange={() => setHasChanges(true)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'staff':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Staff Members</h3>
              <Button className="gap-2">
                <Users className="w-4 h-4" />
                Add Staff
              </Button>
            </div>
            <div className="space-y-3">
              {[
                { name: 'John Doe', role: 'Manager', email: 'john@restaurant.com', status: 'Active' },
                { name: 'Jane Smith', role: 'Chef', email: 'jane@restaurant.com', status: 'Active' },
                { name: 'Mike Johnson', role: 'Waiter', email: 'mike@restaurant.com', status: 'Active' },
                { name: 'Sarah Williams', role: 'Waiter', email: 'sarah@restaurant.com', status: 'On Leave' },
              ].map((staff, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card hover>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold-400 to-warm-500 flex items-center justify-center text-white font-semibold">
                            {staff.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{staff.name}</p>
                            <p className="text-sm text-gray-500">{staff.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">{staff.role}</Badge>
                          <Badge variant={staff.status === 'Active' ? 'success' : 'warning'}>
                            {staff.status}
                          </Badge>
                          <Button variant="outline" size="sm">Edit</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Preferences</h3>
              <div className="space-y-4">
                {[
                  { title: 'New Orders', description: 'Get notified when new orders are placed' },
                  { title: 'Low Inventory', description: 'Alert when stock is running low' },
                  { title: 'Reservations', description: 'Notifications for new reservations' },
                  { title: 'Customer Reviews', description: 'Get notified about new reviews' },
                  { title: 'Staff Updates', description: 'Updates about staff schedules and changes' },
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
                    <div>
                      <p className="font-medium text-gray-900">{item.title}</p>
                      <p className="text-sm text-gray-500">{item.description}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="rounded border-gray-300 text-gold-600 focus:ring-gold-500"
                          onChange={() => setHasChanges(true)}
                        />
                        <span className="text-sm text-gray-600">Email</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="rounded border-gray-300 text-gold-600 focus:ring-gold-500"
                          onChange={() => setHasChanges(true)}
                        />
                        <span className="text-sm text-gray-600">SMS</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Settings</h3>
              <div className="space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                        <p className="text-sm text-gray-500">Add an extra layer of security</p>
                      </div>
                      <Badge variant="success">Enabled</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">Password</p>
                        <p className="text-sm text-gray-500">Last changed 30 days ago</p>
                      </div>
                      <Button variant="outline" size="sm">Change Password</Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">Active Sessions</p>
                        <p className="text-sm text-gray-500">You are logged in on 2 devices</p>
                      </div>
                      <Button variant="outline" size="sm">View All</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        );

      case 'appearance':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Appearance Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
                  <div className="grid grid-cols-3 gap-4">
                    {['Light', 'Dark', 'Auto'].map((theme) => (
                      <Card
                        key={theme}
                        hover
                        className={cn(
                          'cursor-pointer border-2',
                          theme === 'Light' ? 'border-gold-500' : 'border-transparent'
                        )}
                      >
                        <CardContent className="p-4 text-center">
                          <p className="font-medium text-gray-900">{theme}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
                  <div className="grid grid-cols-6 gap-3">
                    {['#d97706', '#ef4444', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899'].map((color) => (
                      <button
                        key={color}
                        className={cn(
                          'w-full h-12 rounded-lg border-2',
                          color === '#d97706' ? 'border-gray-900' : 'border-transparent'
                        )}
                        style={{ backgroundColor: color }}
                        onClick={() => setHasChanges(true)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
          Settings
        </h1>
        <p className="text-gray-600 mt-1">Manage your restaurant settings and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-2">
              <nav className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors',
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-gold-500 to-warm-500 text-white shadow-lg shadow-gold-200/50'
                        : 'text-gray-700 hover:bg-gray-100'
                    )}
                  >
                    <tab.icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                ))}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-6">
              {renderTabContent()}

              {hasChanges && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 flex items-center justify-end gap-3"
                >
                  <Button variant="outline" onClick={() => setHasChanges(false)}>
                    Cancel
                  </Button>
                  <Button className="gap-2" onClick={() => setHasChanges(false)}>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </Button>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
