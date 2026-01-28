import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Instagram, Loader2 } from 'lucide-react';
import { useStore } from '../services/store';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { it } from 'date-fns/locale';
import { TaskStatus } from '../types';

const Calendar: React.FC = () => {
  const { state } = useStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Get days in current month view
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get the day of week the month starts on (0 = Sunday)
  const startDayOfWeek = monthStart.getDay();
  // Adjust for Monday start (Italian calendar)
  const adjustedStartDay = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

  // Get tasks and deadlines for each day
  const getEventsForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');

    const tasks = state.tasks.filter(t =>
      t.scheduledDate === dateStr && t.status !== TaskStatus.COMPLETE
    );

    const deadlines = state.clients.filter(c =>
      c.deadline === dateStr
    );

    return { tasks, deadlines };
  };

  // Get selected day events
  const selectedDayEvents = selectedDate ? getEventsForDay(selectedDate) : null;

  // Loading state
  if (state.loading && !state.initialized) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Caricamento calendario...</p>
        </div>
      </div>
    );
  }

  const weekDays = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div>
        <h2 className="text-3xl font-bold">Calendario</h2>
        <p className="text-gray-400 mt-1">Visualizza scadenze e attività programmate</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-2 hover:bg-gray-100 rounded-lg transition-all"
            >
              <ChevronLeft size={20} />
            </button>
            <h3 className="text-xl font-bold capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: it })}
            </h3>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-2 hover:bg-gray-100 rounded-lg transition-all"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Week Days Header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map(day => (
              <div key={day} className="text-center text-xs font-bold text-gray-400 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for days before month starts */}
            {Array.from({ length: adjustedStartDay }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square p-1" />
            ))}

            {/* Actual days */}
            {daysInMonth.map(day => {
              const events = getEventsForDay(day);
              const hasEvents = events.tasks.length > 0 || events.deadlines.length > 0;
              const isToday = isSameDay(day, new Date());
              const isSelected = selectedDate && isSameDay(day, selectedDate);

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={`aspect-square p-1 rounded-lg transition-all relative ${
                    isSelected ? 'bg-primary text-white' :
                    isToday ? 'bg-primary/10 text-primary font-bold' :
                    'hover:bg-gray-50'
                  }`}
                >
                  <span className="text-sm">{format(day, 'd')}</span>
                  {hasEvents && !isSelected && (
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                      {events.deadlines.length > 0 && (
                        <div className="w-1.5 h-1.5 rounded-full bg-critical" />
                      )}
                      {events.tasks.length > 0 && (
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-6 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-critical" />
              <span className="text-xs text-gray-500">Scadenze</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-xs text-gray-500">Attività</span>
            </div>
          </div>
        </div>

        {/* Selected Day Details */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-lg mb-4">
            {selectedDate
              ? format(selectedDate, 'd MMMM yyyy', { locale: it })
              : 'Seleziona un giorno'
            }
          </h3>

          {selectedDate && selectedDayEvents ? (
            <div className="space-y-4">
              {/* Deadlines */}
              {selectedDayEvents.deadlines.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase mb-2">Scadenze</p>
                  <div className="space-y-2">
                    {selectedDayEvents.deadlines.map(client => (
                      <div key={client.id} className="p-3 bg-red-50 rounded-xl border border-red-100">
                        <div className="flex items-center gap-2">
                          <Instagram size={14} className="text-red-500" />
                          <span className="font-bold text-red-700 text-sm">
                            {client.instagramHandle || client.name}
                          </span>
                        </div>
                        <p className="text-xs text-red-500 mt-1">{client.packageName}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tasks */}
              {selectedDayEvents.tasks.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase mb-2">Attività</p>
                  <div className="space-y-2">
                    {selectedDayEvents.tasks.map(task => (
                      <div key={task.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <p className="font-medium text-sm text-gray-800">{task.title}</p>
                        <p className="text-xs text-gray-400 mt-1">{task.clientName}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedDayEvents.deadlines.length === 0 && selectedDayEvents.tasks.length === 0 && (
                <p className="text-center text-gray-400 py-8 text-sm">
                  Nessun evento per questo giorno
                </p>
              )}
            </div>
          ) : (
            <p className="text-center text-gray-400 py-8 text-sm">
              Clicca su un giorno per vedere i dettagli
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Calendar;
