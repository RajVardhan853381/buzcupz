import { useState } from 'react';
import { TopNavigation } from './components/TopNavigation';
import { BokehBackground } from './components/BokehBackground';
import { DashboardPage } from './pages/DashboardPage';
import { OrdersPage } from './pages/OrdersPage';
import { TablesPage } from './pages/TablesPage';
import { ReservationsPage } from './pages/ReservationsPage';
import { MenuPage } from './pages/MenuPage';
import { InventoryPage } from './pages/InventoryPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { SupportPage } from './pages/SupportPage';
import { BillingPage } from './pages/BillingPage';
import { CustomersPage } from './pages/CustomersPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { TasksPage } from './pages/TasksPage';
import { WastagePage } from './pages/WastagePage';
import { CompliancePage } from './pages/CompliancePage';

type Tab = 'dashboard' | 'orders' | 'tables' | 'reservations' | 'menu' | 'inventory' | 'analytics' | 'settings' | 'support' | 'billing' | 'customers' | 'notifications' | 'tasks' | 'wastage' | 'compliance';

export function DashboardApp() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage />;
      case 'orders':
        return <OrdersPage />;
      case 'tables':
        return <TablesPage />;
      case 'reservations':
        return <ReservationsPage />;
      case 'menu':
        return <MenuPage />;
      case 'inventory':
        return <InventoryPage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'settings':
        return <SettingsPage />;
      case 'support':
        return <SupportPage />;
      case 'billing':
        return <BillingPage />;
      case 'customers':
        return <CustomersPage />;
      case 'notifications':
        return <NotificationsPage />;
      case 'tasks':
        return <TasksPage />;
      case 'wastage':
        return <WastagePage />;
      case 'compliance':
        return <CompliancePage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gold-50/30">
      <BokehBackground />
      <TopNavigation activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab as Tab)} />
      <main className="relative z-10 max-w-[1400px] mx-auto px-4 lg:px-6 py-6">
        {renderPage()}
      </main>
    </div>
  );
}
