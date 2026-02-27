import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CreditCard,
  Download,
  CheckCircle,
  Calendar,
  DollarSign,
  TrendingUp,
  FileText,
  Crown,
  Zap,
  Shield,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/utils/cn';

const plans = [
  {
    name: 'Starter',
    price: 29,
    icon: Zap,
    color: 'from-blue-400 to-blue-600',
    features: [
      'Up to 5 staff members',
      '100 orders per month',
      'Basic analytics',
      'Email support',
      '1 location',
    ],
  },
  {
    name: 'Professional',
    price: 79,
    icon: Crown,
    color: 'from-gold-400 to-gold-600',
    popular: true,
    features: [
      'Up to 20 staff members',
      'Unlimited orders',
      'Advanced analytics',
      'Priority support',
      'Up to 3 locations',
      'Custom branding',
    ],
  },
  {
    name: 'Enterprise',
    price: 199,
    icon: Shield,
    color: 'from-purple-400 to-purple-600',
    features: [
      'Unlimited staff',
      'Unlimited orders',
      'AI-powered insights',
      '24/7 phone support',
      'Unlimited locations',
      'White-label solution',
      'Dedicated account manager',
    ],
  },
];

const invoices = [
  { id: 'INV-2026-001', date: 'Feb 27, 2026', amount: 79.0, status: 'Paid', plan: 'Professional' },
  { id: 'INV-2025-012', date: 'Dec 1, 2025', amount: 79.0, status: 'Paid', plan: 'Professional' },
  { id: 'INV-2025-011', date: 'Nov 1, 2025', amount: 79.0, status: 'Paid', plan: 'Professional' },
  { id: 'INV-2025-010', date: 'Oct 1, 2025', amount: 79.0, status: 'Paid', plan: 'Professional' },
];

export function BillingPage() {
  const [currentPlan] = useState('Professional');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
          Billing & Subscription
        </h1>
        <p className="text-gray-600 mt-1">Manage your subscription and billing details</p>
      </div>

      {/* Current Subscription */}
      <Card className="border-2 border-gold-200 bg-gradient-to-br from-gold-50 to-warm-50">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-lg shadow-gold-200/50">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-2xl font-bold text-gray-900">Professional Plan</h3>
                  <Badge variant="gold">Active</Badge>
                </div>
                <p className="text-gray-600 mb-4">Your current subscription plan</p>
                <div className="flex items-center gap-6 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    $79.00/month
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Next billing: Feb 1, 2026
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Auto-renewal enabled
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">Cancel Subscription</Button>
              <Button>Upgrade Plan</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { title: 'Orders This Month', value: '1,248', max: 'Unlimited', percentage: 100, icon: TrendingUp },
          { title: 'Staff Members', value: '12', max: '20', percentage: 60, icon: CheckCircle },
          { title: 'Locations', value: '2', max: '3', percentage: 66, icon: FileText },
        ].map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gold-100 to-warm-100 flex items-center justify-center">
                    <stat.icon className="w-5 h-5 text-gold-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{stat.title}</p>
                    <p className="text-xl font-bold text-gray-900">
                      {stat.value} <span className="text-sm text-gray-500 font-normal">/ {stat.max}</span>
                    </p>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-gold-500 to-warm-500 h-2 rounded-full transition-all"
                    style={{ width: `${stat.percentage}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Plans Comparison */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                hover
                className={cn(
                  'relative overflow-hidden',
                  plan.popular && 'border-2 border-gold-400 shadow-xl shadow-gold-100'
                )}
              >
                {plan.popular && (
                  <div className="absolute top-4 right-4">
                    <Badge variant="gold">Most Popular</Badge>
                  </div>
                )}
                <CardContent className="p-6">
                  <div className={cn('w-14 h-14 rounded-xl bg-gradient-to-br shadow-lg flex items-center justify-center mb-4', plan.color)}>
                    <plan.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                    <span className="text-gray-600">/month</span>
                  </div>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    variant={currentPlan === plan.name ? 'outline' : 'default'}
                    disabled={currentPlan === plan.name}
                  >
                    {currentPlan === plan.name ? 'Current Plan' : 'Upgrade to ' + plan.name}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Payment Method */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Payment Method</h3>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
            <div className="flex items-center gap-4">
              <div className="w-14 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-medium text-gray-900">•••• •••• •••• 4242</p>
                <p className="text-sm text-gray-500">Expires 12/2025</p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              Update
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Billing History</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {invoices.map((invoice, index) => (
              <motion.div
                key={invoice.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{invoice.id}</p>
                    <p className="text-sm text-gray-500">{invoice.date} • {invoice.plan}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">${invoice.amount.toFixed(2)}</p>
                    <Badge variant="success" className="text-xs">
                      {invoice.status}
                    </Badge>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
