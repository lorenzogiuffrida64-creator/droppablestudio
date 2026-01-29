import React, { useState } from 'react';
import {
  ChevronRight, ChevronDown, CheckCircle2, Circle, Instagram,
  Calendar as CalendarIcon, Tag, Loader2, X
} from 'lucide-react';
import { useStore } from '../services/store';
import { Client, Task, TaskStatus, ProjectStatus } from '../types';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

const Tasks: React.FC = () => {
  const { state, actions } = useStore();
  const [expandedClient, setExpandedClient] = useState<string | null>(null);
  const [updatingTask, setUpdatingTask] = useState<string | null>(null);

  // Group tasks by client - show ALL tasks (including completed)
  const clientsWithTasks = state.clients.map(client => {
    const allTasks = state.tasks
      .filter(t => t.clientId === client.id)
      .sort((a, b) => {
        // Pending tasks first, then completed
        if (a.status === TaskStatus.COMPLETE && b.status !== TaskStatus.COMPLETE) return 1;
        if (a.status !== TaskStatus.COMPLETE && b.status === TaskStatus.COMPLETE) return -1;
        // Then sort by scheduled date
        return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
      });
    const completedCount = allTasks.filter(t => t.status === TaskStatus.COMPLETE).length;
    const pendingCount = allTasks.filter(t => t.status !== TaskStatus.COMPLETE).length;
    return {
      client,
      tasks: allTasks, // Show ALL tasks
      completedCount,
      pendingCount,
      totalCount: allTasks.length,
    };
  }).filter(item => item.tasks.length > 0); // Show clients with ANY tasks

  const handleMarkTaskDone = async (task: Task) => {
    setUpdatingTask(task.id);
    try {
      const newStatus = task.status === TaskStatus.COMPLETE ? TaskStatus.NOT_STARTED : TaskStatus.COMPLETE;
      await actions.updateTask(task.id, newStatus);
    } catch (err) {
      console.error('Failed to update task:', err);
    } finally {
      setUpdatingTask(null);
    }
  };

  const toggleClient = (clientId: string) => {
    setExpandedClient(expandedClient === clientId ? null : clientId);
  };

  const getProgressPercentage = (completed: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  };

  // Loading state
  if (state.loading && !state.initialized) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Caricamento attività...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div>
        <h2 className="text-3xl font-bold">Attività</h2>
        <p className="text-gray-400 mt-1">Gestisci le attività per ogni cliente</p>
      </div>

      {clientsWithTasks.length > 0 ? (
        <div className="space-y-4">
          {clientsWithTasks.map(({ client, tasks, completedCount, pendingCount, totalCount }) => {
            const isExpanded = expandedClient === client.id;
            const progress = getProgressPercentage(completedCount, totalCount);
            const pkg = state.packages.find(p => p.id === client.packageId || p.name === client.packageName);

            return (
              <div key={client.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Client Header - Clickable */}
                <div
                  onClick={() => toggleClient(client.id)}
                  className="p-6 cursor-pointer hover:bg-gray-50 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                        <Instagram size={24} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-800">
                          {client.instagramHandle || client.company || client.name}
                        </h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-sm text-gray-500">{client.name}</span>
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded font-medium">
                            {pkg?.name || client.packageName}
                          </span>
                          <span className="text-xs bg-secondary/10 text-secondary px-2 py-0.5 rounded font-bold">
                            €{client.totalPrice}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      {/* Progress */}
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">{progress}%</p>
                        <p className="text-xs text-gray-400">
                          {pendingCount > 0 ? `${pendingCount} da fare` : 'Tutto completato'}
                        </p>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-32">
                        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-primary h-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Expand Icon */}
                      <div className={`p-2 rounded-lg transition-all ${isExpanded ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'}`}>
                        {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tasks List - Expandable */}
                {isExpanded && (
                  <div className="border-t border-gray-100 p-6 bg-gray-50/50">
                    <div className="space-y-3">
                      {tasks.map((task) => {
                        const isCompleted = task.status === TaskStatus.COMPLETE;
                        const isUpdating = updatingTask === task.id;

                        return (
                          <div
                            key={task.id}
                            className={`flex items-center justify-between p-4 rounded-xl transition-all ${
                              isCompleted ? 'bg-green-50 border border-green-100' : 'bg-white border border-gray-100'
                            }`}
                          >
                            <div className="flex items-center gap-4 flex-1">
                              {/* Checkbox */}
                              <button
                                onClick={() => handleMarkTaskDone(task)}
                                disabled={isUpdating}
                                className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                                  isCompleted
                                    ? 'bg-green-500 text-white'
                                    : 'border-2 border-gray-300 hover:border-primary'
                                }`}
                              >
                                {isUpdating ? (
                                  <Loader2 size={14} className="animate-spin" />
                                ) : isCompleted ? (
                                  <CheckCircle2 size={14} />
                                ) : null}
                              </button>

                              {/* Task Info */}
                              <div className="flex-1">
                                <p className={`font-medium ${isCompleted ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                                  {task.title}
                                </p>
                                {task.description && (
                                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{task.description}</p>
                                )}
                              </div>
                            </div>

                            {/* Task Meta */}
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1 text-gray-400">
                                <CalendarIcon size={14} />
                                <span className="text-xs">{format(new Date(task.scheduledDate), 'd MMM', { locale: it })}</span>
                              </div>

                              {!isCompleted && (
                                <button
                                  onClick={() => handleMarkTaskDone(task)}
                                  disabled={isUpdating}
                                  className="text-xs font-bold px-3 py-1.5 bg-primary text-white rounded-lg hover:brightness-110 transition-all disabled:opacity-50"
                                >
                                  {isUpdating ? 'Salvataggio...' : 'Completa'}
                                </button>
                              )}

                              {isCompleted && (
                                <span className="text-xs font-bold px-3 py-1.5 bg-green-100 text-green-600 rounded-lg">
                                  Fatto
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20">
          <CheckCircle2 size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-bold text-gray-400 mb-2">Nessuna attività</h3>
          <p className="text-gray-400">Le attività appariranno quando crei un nuovo cliente.</p>
        </div>
      )}
    </div>
  );
};

export default Tasks;
