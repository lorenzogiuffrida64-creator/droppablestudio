import React from 'react';
import {
  TrendingUp, Users, Euro, CheckCircle2,
  BarChart3, PieChart, Activity, Loader2, Calendar
} from 'lucide-react';
import { useStore } from '../services/store';
import { ProjectStatus, TaskStatus, PaymentStatus } from '../types';
import { differenceInDays, format, subDays } from 'date-fns';
import { it } from 'date-fns/locale';

const Analytics: React.FC = () => {
  const { state } = useStore();

  // Calculate metrics
  const totalClients = state.clients.length;
  const activeClients = state.clients.filter(c => c.status === ProjectStatus.ACTIVE).length;
  const completedClients = state.clients.filter(c => c.status === ProjectStatus.COMPLETED).length;
  const archivedClients = state.clients.filter(c => c.status === ProjectStatus.ARCHIVED).length;

  // Revenue metrics
  const totalRevenue = state.clients.reduce((sum, c) =>
    sum + c.payments.reduce((pSum, p) => pSum + p.amount, 0), 0
  );
  const potentialRevenue = state.clients.reduce((sum, c) => sum + c.totalPrice, 0);

  // Task metrics
  const totalTasks = state.tasks.length;
  const completedTasks = state.tasks.filter(t => t.status === TaskStatus.COMPLETE).length;
  const pendingTasks = state.tasks.filter(t => t.status !== TaskStatus.COMPLETE).length;
  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Package distribution
  const packageDistribution = state.clients.reduce((acc, client) => {
    const pkgName = client.packageName || 'Altro';
    acc[pkgName] = (acc[pkgName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Revenue by package
  const revenueByPackage = state.clients.reduce((acc, client) => {
    const pkgName = client.packageName || 'Altro';
    const revenue = client.payments.reduce((sum, p) => sum + p.amount, 0);
    acc[pkgName] = (acc[pkgName] || 0) + revenue;
    return acc;
  }, {} as Record<string, number>);

  // Clients with upcoming deadlines (next 7 days)
  const upcomingDeadlines = state.clients.filter(c => {
    if (c.status === ProjectStatus.COMPLETED || c.status === ProjectStatus.ARCHIVED) return false;
    const daysLeft = differenceInDays(new Date(c.deadline), new Date());
    return daysLeft >= 0 && daysLeft <= 7;
  }).length;

  // Average project value
  const avgProjectValue = totalClients > 0 ? Math.round(potentialRevenue / totalClients) : 0;

  // Format currency
  const formatCurrency = (amount: number) => {
    if (amount >= 1000) {
      return `€${(amount / 1000).toFixed(1).replace('.0', '')}k`;
    }
    return `€${amount}`;
  };

  // Loading state
  if (state.loading && !state.initialized) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Caricamento analisi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div>
        <h2 className="text-3xl font-bold">Analisi</h2>
        <p className="text-gray-400 mt-1">Panoramica delle performance e statistiche</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-primary text-white p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm opacity-80">Fatturato Totale</span>
            <Euro size={20} className="opacity-60" />
          </div>
          <p className="text-3xl font-bold">{formatCurrency(totalRevenue)}</p>
          <p className="text-xs opacity-60 mt-1">su {formatCurrency(potentialRevenue)} potenziale</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-500">Clienti Totali</span>
            <Users size={20} className="text-gray-400" />
          </div>
          <p className="text-3xl font-bold text-gray-800">{totalClients}</p>
          <p className="text-xs text-gray-400 mt-1">{activeClients} attivi</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-500">Tasso Completamento</span>
            <CheckCircle2 size={20} className="text-gray-400" />
          </div>
          <p className="text-3xl font-bold text-gray-800">{taskCompletionRate}%</p>
          <p className="text-xs text-gray-400 mt-1">{completedTasks}/{totalTasks} attività</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-500">Valore Medio</span>
            <TrendingUp size={20} className="text-gray-400" />
          </div>
          <p className="text-3xl font-bold text-gray-800">{formatCurrency(avgProjectValue)}</p>
          <p className="text-xs text-gray-400 mt-1">per progetto</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Client Status Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg">Stato Clienti</h3>
            <PieChart size={20} className="text-gray-400" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-sm text-gray-600">Attivi</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold">{activeClients}</span>
                <span className="text-xs text-gray-400">
                  ({totalClients > 0 ? Math.round((activeClients / totalClients) * 100) : 0}%)
                </span>
              </div>
            </div>
            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-blue-500 h-full"
                style={{ width: `${totalClients > 0 ? (activeClients / totalClients) * 100 : 0}%` }}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm text-gray-600">Completati</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold">{completedClients}</span>
                <span className="text-xs text-gray-400">
                  ({totalClients > 0 ? Math.round((completedClients / totalClients) * 100) : 0}%)
                </span>
              </div>
            </div>
            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-green-500 h-full"
                style={{ width: `${totalClients > 0 ? (completedClients / totalClients) * 100 : 0}%` }}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-gray-400" />
                <span className="text-sm text-gray-600">Archiviati</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold">{archivedClients}</span>
                <span className="text-xs text-gray-400">
                  ({totalClients > 0 ? Math.round((archivedClients / totalClients) * 100) : 0}%)
                </span>
              </div>
            </div>
            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gray-400 h-full"
                style={{ width: `${totalClients > 0 ? (archivedClients / totalClients) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Revenue Overview */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg">Fatturato</h3>
            <BarChart3 size={20} className="text-gray-400" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
              <div>
                <p className="text-sm text-gray-600">Incassato</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</p>
              </div>
              <CheckCircle2 size={32} className="text-green-400" />
            </div>

            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">Percentuale incassata</span>
                <span className="font-bold text-primary">
                  {potentialRevenue > 0 ? Math.round((totalRevenue / potentialRevenue) * 100) : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full transition-all duration-500"
                  style={{ width: `${potentialRevenue > 0 ? (totalRevenue / potentialRevenue) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Package Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg">Distribuzione Pacchetti</h3>
            <Activity size={20} className="text-gray-400" />
          </div>
          <div className="space-y-3">
            {Object.entries(packageDistribution)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([pkg, count]) => (
                <div key={pkg} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-2 h-8 rounded-full bg-primary" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800 truncate">{pkg}</p>
                      <div className="w-full bg-gray-100 h-1.5 rounded-full mt-1">
                        <div
                          className="bg-primary h-full rounded-full"
                          style={{ width: `${(count / totalClients) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <span className="font-bold text-gray-800 ml-4">{count}</span>
                </div>
              ))}
            {Object.keys(packageDistribution).length === 0 && (
              <p className="text-center text-gray-400 py-4">Nessun dato disponibile</p>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg">Statistiche Rapide</h3>
            <Calendar size={20} className="text-gray-400" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-xl text-center">
              <p className="text-3xl font-bold text-primary">{upcomingDeadlines}</p>
              <p className="text-xs text-gray-500 mt-1">Scadenze prossime 7gg</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl text-center">
              <p className="text-3xl font-bold text-primary">{pendingTasks}</p>
              <p className="text-xs text-gray-500 mt-1">Attività da fare</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl text-center">
              <p className="text-3xl font-bold text-primary">{state.team.length}</p>
              <p className="text-xs text-gray-500 mt-1">Membri Team</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl text-center">
              <p className="text-3xl font-bold text-primary">{state.packages.length}</p>
              <p className="text-xs text-gray-500 mt-1">Pacchetti Disponibili</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
