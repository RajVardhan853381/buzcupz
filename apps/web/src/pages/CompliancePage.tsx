import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  Download,
  Trash2,
  FileText,
  Eye,
  CheckCircle,
  AlertTriangle,
  Lock,
  Users,
  Clock,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/utils/cn';

interface DataRequest {
  id: string;
  type: 'export' | 'deletion';
  user: string;
  email: string;
  status: 'pending' | 'processing' | 'completed';
  requestDate: string;
  completedDate?: string;
}

interface ConsentRecord {
  id: string;
  user: string;
  email: string;
  type: string;
  status: 'granted' | 'revoked';
  date: string;
}

const dataRequests: DataRequest[] = [
  {
    id: '1',
    type: 'export',
    user: 'John Doe',
    email: 'john@email.com',
    status: 'pending',
    requestDate: '2026-02-27',
  },
  {
    id: '2',
    type: 'deletion',
    user: 'Jane Smith',
    email: 'jane@email.com',
    status: 'processing',
    requestDate: '2026-02-26',
  },
  {
    id: '3',
    type: 'export',
    user: 'Mike Johnson',
    email: 'mike@email.com',
    status: 'completed',
    requestDate: '2026-02-20',
    completedDate: '2026-02-21',
  },
];

const consentRecords: ConsentRecord[] = [
  {
    id: '1',
    user: 'Sarah Williams',
    email: 'sarah@email.com',
    type: 'Marketing Communications',
    status: 'granted',
    date: '2026-02-25',
  },
  {
    id: '2',
    user: 'David Brown',
    email: 'david@email.com',
    type: 'Data Processing',
    status: 'granted',
    date: '2026-02-24',
  },
  {
    id: '3',
    user: 'Emma Wilson',
    email: 'emma@email.com',
    type: 'Marketing Communications',
    status: 'revoked',
    date: '2026-02-23',
  },
];

export function CompliancePage() {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const pendingRequests = dataRequests.filter((r) => r.status === 'pending').length;
  const processingRequests = dataRequests.filter((r) => r.status === 'processing').length;
  const activeConsents = consentRecords.filter((c) => c.status === 'granted').length;

  const stats = [
    {
      title: 'Pending Requests',
      value: pendingRequests,
      icon: Clock,
      color: 'from-yellow-400 to-yellow-600',
    },
    {
      title: 'Processing',
      value: processingRequests,
      icon: AlertTriangle,
      color: 'from-orange-400 to-orange-600',
    },
    {
      title: 'Active Consents',
      value: activeConsents,
      icon: CheckCircle,
      color: 'from-green-400 to-green-600',
    },
    {
      title: 'Total Users',
      value: '1,248',
      icon: Users,
      color: 'from-blue-400 to-blue-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-200/50">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
              GDPR & Compliance
            </h1>
            <p className="text-gray-600 mt-1">Manage data privacy and compliance requirements</p>
          </div>
        </div>
        <Button className="gap-2" onClick={() => setIsExportModalOpen(true)}>
          <Download className="w-4 h-4" />
          Compliance Report
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card hover>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={cn('w-12 h-12 rounded-xl bg-gradient-to-br shadow-lg flex items-center justify-center', stat.color)}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Data Requests */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Data Access Requests</h2>
            <Badge>{dataRequests.length} Total</Badge>
          </div>
          <div className="space-y-3">
            {dataRequests.map((request, index) => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div
                    className={cn(
                      'w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center',
                      request.type === 'export'
                        ? 'from-blue-400 to-blue-600'
                        : 'from-red-400 to-red-600'
                    )}
                  >
                    {request.type === 'export' ? (
                      <Download className="w-6 h-6 text-white" />
                    ) : (
                      <Trash2 className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{request.user}</h3>
                      <Badge
                        variant={
                          request.status === 'completed'
                            ? 'success'
                            : request.status === 'processing'
                            ? 'warning'
                            : 'default'
                        }
                      >
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>{request.email}</span>
                      <span>•</span>
                      <span>
                        {request.type === 'export' ? 'Data Export' : 'Data Deletion'} Request
                      </span>
                      <span>•</span>
                      <span>Requested: {new Date(request.requestDate).toLocaleDateString()}</span>
                      {request.completedDate && (
                        <>
                          <span>•</span>
                          <span>Completed: {new Date(request.completedDate).toLocaleDateString()}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                  {request.status === 'pending' && (
                    <Button size="sm">Process</Button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Consent Management */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Consent Records</h2>
            <Badge>{consentRecords.length} Total</Badge>
          </div>
          <div className="space-y-3">
            {consentRecords.map((consent, index) => (
              <motion.div
                key={consent.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div
                    className={cn(
                      'w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center',
                      consent.status === 'granted'
                        ? 'from-green-400 to-green-600'
                        : 'from-gray-400 to-gray-600'
                    )}
                  >
                    {consent.status === 'granted' ? (
                      <CheckCircle className="w-6 h-6 text-white" />
                    ) : (
                      <Lock className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{consent.user}</h3>
                      <Badge variant={consent.status === 'granted' ? 'success' : 'default'}>
                        {consent.status.charAt(0).toUpperCase() + consent.status.slice(1)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>{consent.email}</span>
                      <span>•</span>
                      <span>{consent.type}</span>
                      <span>•</span>
                      <span>{new Date(consent.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Legal Documents */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Legal Documents</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { title: 'Privacy Policy', version: 'v1.0.0', updated: '2026-02-27' },
              { title: 'Terms of Service', version: 'v1.0.0', updated: '2026-02-27' },
              { title: 'Cookie Policy', version: 'v1.0.0', updated: '2026-02-27' },
              { title: 'Data Processing Agreement', version: 'v1.0.0', updated: '2026-02-27' },
              { title: 'GDPR Compliance Guide', version: 'v1.0.0', updated: '2026-02-27' },
              { title: 'User Consent Forms', version: 'v1.0.0', updated: '2026-02-27' },
            ].map((doc, index) => (
              <motion.div
                key={doc.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card hover className="h-full">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-sm mb-1">{doc.title}</h3>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Badge variant="default" className="text-xs">
                            {doc.version}
                          </Badge>
                          <span>Updated {doc.updated}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 text-xs">
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      <Button size="sm" className="flex-1 text-xs">
                        <Download className="w-3 h-3 mr-1" />
                        Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Export Modal */}
      <Modal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)}>
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Export Compliance Report</h2>
          <p className="text-gray-600 mb-6">
            Generate a comprehensive compliance report including all data requests, consent records, and audit logs.
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Report Period</label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent">
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>Last 90 days</option>
                <option>This year</option>
                <option>Custom range</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Report Format</label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent">
                <option>PDF</option>
                <option>CSV</option>
                <option>Excel (XLSX)</option>
                <option>JSON</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <Button variant="outline" onClick={() => setIsExportModalOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button className="flex-1 gap-2" onClick={() => setIsExportModalOpen(false)}>
              <Download className="w-4 h-4" />
              Generate Report
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
