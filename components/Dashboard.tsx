
import React from 'react';
import {
  ArrowUpRight,
  Plus,
  Calendar,
  Users,
  FolderKanban,
  CheckCircle2,
  Euro
} from 'lucide-react';
import { useStore } from '../services/store';
import { ProjectStatus, TaskStatus } from '../types';
import { format, differenceInDays } from 'date-fns';
import { it } from 'date-fns/locale';

interface DashboardProps {
  onNavigate: (view: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { state } = useStore();

  // Calculate real metrics from state
  const totalProjects = state.clients.length;
  const completedProjects = state.clients.filter(c => c.status === ProjectStatus.COMPLETED).length;
  const activeProjects = state.clients.filter(c => c.status === ProjectStatus.ACTIVE).length;

  // Calculate total paid amount (includes archived revenue from deleted clients)
  const clientPayments = state.clients.reduce((sum, client) => {
    const payments = client.payments?.reduce((pSum, p) => pSum + p.amount, 0) || 0;
    return sum + payments;
  }, 0);
  const totalPaid = clientPayments + state.archivedRevenue;

  // Format amount like "1.2k" or "12.5k"
  const formatAmount = (amount: number) => {
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1).replace('.0', '')}k`;
    }
    return amount.toString();
  };

  const metrics = [
    { label: 'Progetti Totali', value: totalProjects, color: 'bg-primary text-white', icon: FolderKanban, isNumber: true },
    { label: 'Progetti Terminati', value: completedProjects, color: 'bg-white text-gray-800', icon: CheckCircle2, isNumber: true },
    { label: 'Progetti In Corso', value: activeProjects, color: 'bg-white text-gray-800', icon: ArrowUpRight, isNumber: true },
    { label: 'Pagati', value: `€${formatAmount(totalPaid)}`, color: 'bg-white text-gray-800', icon: Euro, isNumber: false },
  ];

  // Get upcoming deadlines from real clients
  const upcomingDeadlines = state.clients
    .filter(c => c.deadline && c.status !== ProjectStatus.COMPLETED && c.status !== ProjectStatus.ARCHIVED)
    .map(c => ({
      id: c.id,
      title: c.name,
      packageName: c.packageName,
      deadline: new Date(c.deadline),
      daysLeft: differenceInDays(new Date(c.deadline), new Date()),
    }))
    .sort((a, b) => a.deadline.getTime() - b.deadline.getTime())
    .slice(0, 5);

  // Get upcoming tasks
  const upcomingTasks = state.tasks
    .filter(t => t.status !== TaskStatus.COMPLETE && t.scheduledDate)
    .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
    .slice(0, 5);

  const getDeadlineColor = (daysLeft: number) => {
    if (daysLeft < 0) return 'bg-critical';
    if (daysLeft <= 3) return 'bg-warning';
    if (daysLeft <= 7) return 'bg-info';
    return 'bg-primary';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-gray-400 mt-1">Panoramica dei tuoi progetti e attività.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => onNavigate('clients')}
            className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm hover:brightness-110 transition-all"
          >
            <Plus size={18} />
            Aggiungi Progetto
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, i) => (
          <div key={i} className={`p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-40 ${metric.color}`}>
            <div className="flex justify-between items-start">
              <span className={`text-sm font-medium ${metric.color.includes('white') ? 'text-gray-500' : 'text-white/80'}`}>{metric.label}</span>
              <div className={`p-1.5 rounded-full ${metric.color.includes('white') ? 'bg-gray-100' : 'bg-white/20'}`}>
                <metric.icon size={16} />
              </div>
            </div>
            <div>
              <p className="text-4xl font-bold mb-1">{metric.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Team Collaboration */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">Team</h3>
            <Users size={20} className="text-gray-400" />
          </div>
          {state.team.length > 0 ? (
            <div className="space-y-5">
              {state.team.map((member) => (
                <div key={member.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img src={member.avatar} alt={member.name} className="w-10 h-10 rounded-full object-cover shadow-sm border border-gray-100" />
                      <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${member.status === 'online' ? 'bg-secondary' : 'bg-gray-300'}`}></div>
                    </div>
                    <div>
                      <p className="text-sm font-bold">{member.name}</p>
                      <p className="text-[10px] text-gray-400">{member.role}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                    member.status === 'online' ? 'bg-secondary/10 text-secondary' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {member.status === 'online' ? 'Online' : 'Offline'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Users size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nessun membro del team</p>
            </div>
          )}
        </div>

        {/* Upcoming Deadlines */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">Scadenze</h3>
            <Calendar size={20} className="text-gray-400" />
          </div>
          {upcomingDeadlines.length > 0 ? (
            <div className="space-y-4">
              {upcomingDeadlines.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className={`w-1 h-10 rounded-full ${getDeadlineColor(item.daysLeft)}`}></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800 leading-tight truncate">{item.title}</p>
                    <p className="text-[10px] text-gray-400">
                      {format(item.deadline, 'd MMM yyyy', { locale: it })}
                      {item.daysLeft < 0 && <span className="text-critical ml-1">(Scaduto)</span>}
                      {item.daysLeft >= 0 && item.daysLeft <= 3 && <span className="text-warning ml-1">({item.daysLeft}g)</span>}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Calendar size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nessuna scadenza</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Tasks */}
      {upcomingTasks.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold mb-6">Prossime Attività</h3>
          <div className="space-y-3">
            {upcomingTasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-gray-800">{task.title}</p>
                  <p className="text-xs text-gray-400">{task.clientName || 'Cliente'}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">
                    {format(new Date(task.scheduledDate), 'd MMM', { locale: it })}
                  </p>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${
                    task.status === TaskStatus.IN_PROGRESS ? 'bg-info/10 text-info' :
                    task.status === TaskStatus.BLOCKED ? 'bg-critical/10 text-critical' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {task.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
