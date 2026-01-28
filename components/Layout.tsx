import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  BarChart3,
  Settings,
  LogOut,
  Search,
  Bell,
  Mail,
  HelpCircle,
  Calendar,
  Menu,
  X,
  Loader2,
  CreditCard
} from 'lucide-react';
import { useStore } from '../services/store';
import { useAuth } from '../contexts/AuthContext';
import { TaskStatus } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeView: string;
  onViewChange: (view: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeView, onViewChange }) => {
  const { state } = useStore();
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoggingOut(false);
    }
  };

  const pendingTasksCount = state.tasks.filter(t => t.status !== TaskStatus.COMPLETE).length;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tasks', label: 'Attività', icon: CheckSquare, badge: pendingTasksCount },
    { id: 'clients', label: 'Clienti', icon: Users },
    { id: 'payments', label: 'Pagamenti', icon: CreditCard },
    { id: 'analytics', label: 'Analisi', icon: BarChart3 },
    { id: 'calendar', label: 'Calendario', icon: Calendar },
  ];

  const generalItems = [
    { id: 'settings', label: 'Impostazioni', icon: Settings },
    { id: 'help', label: 'Aiuto', icon: HelpCircle },
  ];

  // Get user display info
  const userName = user?.profile?.full_name || user?.email?.split('@')[0] || 'Utente';
  const userRole = user?.profile?.role === 'admin' ? 'Admin'
    : user?.profile?.role === 'manager' ? 'Manager'
    : user?.profile?.role === 'content_creator' ? 'Content Creator'
    : 'Designer';

  return (
    <div className="flex h-screen bg-[#F9FAFB] text-gray-800">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transition-transform duration-300 lg:static lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">D</span>
            </div>
            <h1 className="text-xl font-bold text-primary tracking-tight">Droppable</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 ml-2">Menu</div>
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
                  activeView === item.id
                    ? 'bg-primary/5 text-primary border-l-4 border-primary'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </div>
                {item.badge && item.badge > 0 && (
                  <span className="bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                    {item.badge}+
                  </span>
                )}
              </button>
            ))}

            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-8 ml-2">Generale</div>
            {generalItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-gray-600 hover:bg-gray-50`}
              >
                <item.icon size={20} />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-red-500 hover:bg-red-50 disabled:opacity-50"
            >
              {loggingOut ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <LogOut size={20} />
              )}
              <span className="font-medium">{loggingOut ? 'Uscita...' : 'Esci'}</span>
            </button>
          </nav>

          {/* Promotion Card */}
          <div className="p-4 mx-4 mb-6 bg-primary rounded-2xl text-white relative overflow-hidden">
             <div className="relative z-10">
               <p className="text-xs font-medium opacity-80">Scarica la nostra</p>
               <p className="font-bold text-sm mb-3">App Mobile</p>
               <button className="bg-secondary text-primary font-bold text-[10px] px-4 py-2 rounded-lg hover:brightness-110 transition-all">
                 Scarica
               </button>
             </div>
             <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-secondary/20 rounded-full blur-xl"></div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8">
          <div className="flex items-center gap-4 flex-1">
            <button className="lg:hidden" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              {isSidebarOpen ? <X /> : <Menu />}
            </button>
            <div className="relative w-96 hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Cerca progetti, attività..."
                className="w-full pl-10 pr-12 py-2.5 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-gray-200 transition-all text-sm outline-none"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-gray-400 border border-gray-200 px-1 py-0.5 rounded">⌘F</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 pr-6 border-r border-gray-100">
              <button className="text-gray-400 hover:text-gray-600 relative">
                <Mail size={20} />
              </button>
              <button className="text-gray-400 hover:text-gray-600 relative">
                <Bell size={20} />
                <span className="absolute top-0 right-0 w-2 h-2 bg-critical rounded-full border-2 border-white"></span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-bold text-gray-800 leading-tight">{userName}</p>
                <p className="text-xs text-gray-400">{userRole}</p>
              </div>
            </div>
          </div>
        </header>

        {/* View Content */}
        <div className="flex-1 overflow-y-auto bg-[#F9FAFB] p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
