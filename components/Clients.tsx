import React, { useState, useEffect } from 'react';
import {
  Plus, Mail, Phone, Building2, Calendar as CalendarIcon,
  ChevronRight, Tag, X, Archive, CheckCircle, Instagram,
  FileText, CreditCard, Activity, Search, Clock, Send, Loader2, AlertCircle, Check, Trash2, Euro
} from 'lucide-react';
import { useStore } from '../services/store';
import { useAuth } from '../contexts/AuthContext';
import { ProjectStatus, Client, Note, TaskStatus, PaymentStatus } from '../types';
import { addDays, format } from 'date-fns';
import { it } from 'date-fns/locale';

const Clients: React.FC = () => {
  const { state, actions } = useStore();
  const { user } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'notes' | 'payments' | 'activity'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newClient, setNewClient] = useState({
    name: '',
    email: '',
    igNickname: '',
    contact: '',
    selectedPackages: [] as string[],
    deadlineDays: 10
  });

  const [newNote, setNewNote] = useState('');
  const [noteCategory, setNoteCategory] = useState<Note['category']>('Aggiornamento');
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [newPayment, setNewPayment] = useState({
    amount: '',
    method: 'Bonifico',
    invoiceNumber: '',
    notes: ''
  });

  // No need to set default package - user will select

  // Refresh selected client when state changes
  useEffect(() => {
    if (selectedClient) {
      const updated = state.clients.find(c => c.id === selectedClient.id);
      if (updated) {
        setSelectedClient(updated);
      }
    }
  }, [state.clients, selectedClient?.id]);

  const handleAddClient = async () => {
    if (!newClient.igNickname || newClient.selectedPackages.length === 0) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // First package is main, second is addon (if any)
      const mainPackageId = newClient.selectedPackages[0];
      const addonPackageId = newClient.selectedPackages[1] || undefined;

      const selectedPkgs = state.packages.filter(p => newClient.selectedPackages.includes(p.id));
      const totalPrice = selectedPkgs.reduce((sum, p) => sum + p.price, 0);
      const maxDeadlineDays = Math.max(...selectedPkgs.map(p => p.defaultDeadlineDays), newClient.deadlineDays);

      const startDate = new Date().toISOString().split('T')[0];
      const deadline = addDays(new Date(), maxDeadlineDays).toISOString().split('T')[0];

      await actions.createClient({
        name: newClient.name || newClient.igNickname,
        email: newClient.email || `${newClient.igNickname.replace('@', '')}@instagram.placeholder`,
        instagram_handle: newClient.igNickname,
        phone: newClient.contact || undefined,
        package_id: mainPackageId,
        addon_package_id: addonPackageId,
        actual_price: totalPrice,
        start_date: startDate,
        deadline: deadline,
      });

      setShowAddModal(false);
      setNewClient({
        name: '',
        email: '',
        igNickname: '',
        contact: '',
        selectedPackages: [],
        deadlineDays: 10
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante la creazione del cliente');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddNote = async () => {
    if (!selectedClient || !newNote.trim()) return;

    setIsSubmitting(true);
    try {
      await actions.addClientNote(selectedClient.id, newNote, noteCategory);
      setNewNote('');
    } catch (err) {
      console.error('Failed to add note:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!selectedClient) return;
    if (!window.confirm('Sei sicuro di voler eliminare questa nota?')) return;

    setDeletingNoteId(noteId);
    try {
      await actions.deleteClientNote(selectedClient.id, noteId);
    } catch (err) {
      console.error('Failed to delete note:', err);
    } finally {
      setDeletingNoteId(null);
    }
  };

  const handleAddPayment = async () => {
    if (!selectedClient || !newPayment.amount) return;

    setIsSubmitting(true);
    try {
      await actions.addPayment(selectedClient.id, {
        amount: parseFloat(newPayment.amount),
        date: new Date().toISOString(),
        method: newPayment.method,
        invoiceNumber: newPayment.invoiceNumber || `INV-${Date.now()}`,
        status: PaymentStatus.PAID,
        notes: newPayment.notes || undefined
      });
      setShowPaymentModal(false);
      setNewPayment({ amount: '', method: 'Bonifico', invoiceNumber: '', notes: '' });
    } catch (err) {
      console.error('Failed to add payment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClient = async () => {
    if (!selectedClient) return;

    const clientIdentifier = selectedClient.instagramHandle || selectedClient.company || selectedClient.name;
    if (!window.confirm(`Sei sicuro di voler eliminare ${clientIdentifier}?`)) return;

    setIsSubmitting(true);
    try {
      await actions.deleteClient(selectedClient.id);
      setSelectedClient(null);
    } catch (err) {
      console.error('Failed to delete client:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleTaskStatus = async (taskId: string, currentStatus: TaskStatus) => {
    setUpdatingTaskId(taskId);
    try {
      const newStatus = currentStatus === TaskStatus.COMPLETE ? TaskStatus.NOT_STARTED : TaskStatus.COMPLETE;
      await actions.updateTask(taskId, newStatus);
    } catch (err) {
      console.error('Failed to update task:', err);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const filteredClients = state.clients.filter(c =>
    (c.instagramHandle || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const togglePackageSelection = (packageId: string) => {
    setNewClient(prev => {
      const isSelected = prev.selectedPackages.includes(packageId);
      if (isSelected) {
        return { ...prev, selectedPackages: prev.selectedPackages.filter(id => id !== packageId) };
      } else {
        return { ...prev, selectedPackages: [...prev.selectedPackages, packageId] };
      }
    });
  };

  const renderClientDetail = () => {
    if (!selectedClient) return null;
    const pkg = state.packages.find(p => p.id === selectedClient.packageId || p.name === selectedClient.packageName);
    const clientTasks = state.tasks.filter(t => t.clientId === selectedClient.id);
    const completedTasks = clientTasks.filter(t => t.status === TaskStatus.COMPLETE).length;
    const progress = clientTasks.length > 0 ? Math.round((completedTasks / clientTasks.length) * 100) : selectedClient.completionPercentage || 0;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-sm">
        <div className="bg-white w-full max-w-4xl h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-primary text-white">
            <div className="flex items-center gap-4">
              <button onClick={() => setSelectedClient(null)} className="hover:bg-white/20 p-2 rounded-lg transition-all">
                <X size={24} />
              </button>
              <div>
                <h3 className="text-2xl font-bold leading-tight">{selectedClient.instagramHandle || selectedClient.company || selectedClient.name}</h3>
                <p className="text-sm opacity-80">{selectedClient.name} • {pkg?.name || selectedClient.packageName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => {}} className="flex items-center gap-2 bg-secondary text-primary px-4 py-2 rounded-xl font-bold text-sm hover:brightness-110">
                <CheckCircle size={18} />
                Completa
              </button>
              <button onClick={() => {}} className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-xl font-bold text-sm hover:bg-white/30">
                <Archive size={18} />
                Archivia
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-100 px-6">
            {[
              { id: 'overview', label: 'Panoramica', icon: FileText },
              { id: 'tasks', label: 'Attività', icon: CalendarIcon },
              { id: 'notes', label: 'Note', icon: Send },
              { id: 'payments', label: 'Pagamenti', icon: CreditCard },
              { id: 'activity', label: 'Attività Team', icon: Activity },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`py-4 px-6 text-sm font-bold flex items-center gap-2 transition-all border-b-2 ${
                  activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-8 bg-gray-50/30">
            {activeTab === 'overview' && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <div className="grid grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-2">Avanzamento</p>
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-3xl font-bold text-primary">{progress}%</p>
                      <span className="text-xs bg-secondary/10 text-secondary px-2 py-1 rounded-lg">On Track</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-primary h-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-2">Scadenza</p>
                    <p className="text-xl font-bold text-gray-800">{format(new Date(selectedClient.deadline), 'dd MMMM yyyy', { locale: it })}</p>
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1"><Clock size={12} /> Progetto {selectedClient.status}</p>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-2">Budget</p>
                    <p className="text-xl font-bold text-gray-800">€ {selectedClient.totalPrice}</p>
                    <p className="text-xs text-secondary font-bold mt-1">Saldato: € {selectedClient.payments.reduce((sum, p) => sum + p.amount, 0)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h4 className="text-lg font-bold">Informazioni Contatto</h4>
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 space-y-4">
                      {selectedClient.instagramHandle && (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-pink-50 rounded-xl flex items-center justify-center text-pink-500"><Instagram size={20} /></div>
                          <div><p className="text-[10px] text-gray-400 font-bold uppercase">Instagram</p><p className="font-medium">{selectedClient.instagramHandle}</p></div>
                        </div>
                      )}
                      {selectedClient.email && (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400"><Mail size={20} /></div>
                          <div><p className="text-[10px] text-gray-400 font-bold uppercase">Email</p><p className="font-medium">{selectedClient.email}</p></div>
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400"><Phone size={20} /></div>
                        <div><p className="text-[10px] text-gray-400 font-bold uppercase">Telefono</p><p className="font-medium">{selectedClient.contact || selectedClient.phone || '-'}</p></div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-lg font-bold">Dettagli Pacchetto</h4>
                    <div className="bg-primary p-6 rounded-2xl text-white relative overflow-hidden">
                       <h5 className="font-bold text-lg mb-1">{pkg?.name || selectedClient.packageName}</h5>
                       <p className="text-sm opacity-80 mb-4">{pkg?.description || 'Pacchetto personalizzato'}</p>
                       <div className="flex items-center gap-2 text-xs font-bold">
                         <span className="bg-white/20 px-2 py-1 rounded">{clientTasks.length} Attività</span>
                         <span className="bg-white/20 px-2 py-1 rounded">Handoff Premium</span>
                       </div>
                       <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'tasks' && (
              <div className="space-y-4">
                {/* Progress Summary */}
                <div className="bg-white p-4 rounded-xl border border-gray-100 mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-gray-600">Avanzamento Attività</span>
                    <span className="text-lg font-bold text-primary">{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-primary h-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">{completedTasks} di {clientTasks.length} attività completate</p>
                </div>

                {clientTasks.length > 0 ? clientTasks.map(task => {
                  const isCompleted = task.status === TaskStatus.COMPLETE;
                  const isUpdating = updatingTaskId === task.id;

                  return (
                    <div key={task.id} className={`p-4 rounded-xl border flex items-center justify-between group transition-all ${
                      isCompleted ? 'bg-green-50 border-green-100' : 'bg-white border-gray-100 hover:shadow-sm'
                    }`}>
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => handleToggleTaskStatus(task.id, task.status)}
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
                            <Check size={14} />
                          ) : null}
                        </button>
                        <div>
                          <p className={`font-bold ${isCompleted ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{task.title}</p>
                          <p className="text-xs text-gray-400">{format(new Date(task.scheduledDate), 'dd MMM yyyy')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {!isCompleted && (
                          <button
                            onClick={() => handleToggleTaskStatus(task.id, task.status)}
                            disabled={isUpdating}
                            className="text-xs font-bold px-3 py-1.5 bg-primary text-white rounded-lg hover:brightness-110 transition-all disabled:opacity-50"
                          >
                            {isUpdating ? 'Salvataggio...' : 'Completa'}
                          </button>
                        )}
                        {isCompleted && (
                          <span className="text-xs font-bold px-3 py-1.5 bg-green-100 text-green-600 rounded-lg">Fatto</span>
                        )}
                      </div>
                    </div>
                  );
                }) : (
                  <p className="text-center text-gray-400 py-10">Nessuna attività per questo cliente.</p>
                )}
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="space-y-6 flex flex-col h-full">
                <div className="flex-1 space-y-4">
                  {(selectedClient.notes || []).length > 0 ? selectedClient.notes.map(note => (
                    <div key={note.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm group">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            note.category === 'Feedback' ? 'bg-pink-100 text-pink-600' : 'bg-primary/10 text-primary'
                          }`}>{note.category}</span>
                          <span className="text-[10px] text-gray-400 font-bold">{note.author}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-300">{format(new Date(note.timestamp), 'dd/MM HH:mm')}</span>
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            disabled={deletingNoteId === note.id}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded transition-all text-gray-400 hover:text-red-500"
                          >
                            {deletingNoteId === note.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Trash2 size={14} />
                            )}
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">{note.content}</p>
                    </div>
                  )) : <p className="text-center text-gray-400 mt-10">Nessuna nota presente.</p>}
                </div>

                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-lg mt-auto">
                  <div className="flex items-center gap-2 mb-3 overflow-x-auto no-scrollbar">
                    {(['Aggiornamento', 'Feedback', 'Decisione', 'Blocco'] as const).map(cat => (
                      <button
                        key={cat}
                        onClick={() => setNoteCategory(cat)}
                        className={`text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap transition-all ${
                          noteCategory === cat ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    <textarea
                      placeholder="Aggiungi una nota al cliente..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      className="flex-1 bg-gray-50 border border-transparent focus:bg-white focus:border-primary/20 rounded-xl px-4 py-2 text-sm outline-none resize-none h-12"
                      disabled={isSubmitting}
                    />
                    <button
                      onClick={handleAddNote}
                      disabled={isSubmitting || !newNote.trim()}
                      className="bg-primary text-white p-3 rounded-xl hover:brightness-110 transition-all disabled:opacity-50"
                    >
                      {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'payments' && (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100">
                  <h4 className="font-bold mb-4">Cronologia Pagamenti</h4>
                  <div className="space-y-4">
                    {selectedClient.payments.map(p => (
                      <div key={p.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-secondary shadow-sm"><CreditCard size={20} /></div>
                          <div>
                            <p className="font-bold">€ {p.amount}</p>
                            <p className="text-[10px] text-gray-400">{p.method} • {p.invoiceNumber}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold px-3 py-1 bg-secondary/10 text-secondary rounded-full">{p.status}</span>
                      </div>
                    ))}
                    {selectedClient.payments.length === 0 && <p className="text-center text-gray-400 py-10">Nessun pagamento registrato.</p>}
                  </div>
                </div>
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl font-bold text-gray-400 hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={18} /> Registra Pagamento
                </button>
              </div>
            )}

            {/* Payment Modal */}
            {showPaymentModal && (
              <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl animate-in zoom-in duration-200">
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-gray-800">Registra Pagamento</h3>
                      <button onClick={() => setShowPaymentModal(false)} className="text-gray-400 hover:text-gray-600 transition-all">
                        <X size={20} />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-600">Importo *</label>
                        <div className="relative">
                          <Euro className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          <input
                            type="number"
                            value={newPayment.amount}
                            onChange={(e) => setNewPayment({...newPayment, amount: e.target.value})}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-primary transition-all"
                            placeholder="0.00"
                            disabled={isSubmitting}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-600">Metodo di Pagamento</label>
                        <select
                          value={newPayment.method}
                          onChange={(e) => setNewPayment({...newPayment, method: e.target.value})}
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-primary transition-all"
                          disabled={isSubmitting}
                        >
                          <option value="Bonifico">Bonifico</option>
                          <option value="Stripe">Stripe</option>
                          <option value="PayPal">PayPal</option>
                          <option value="Contanti">Contanti</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-600">Numero Fattura <span className="text-gray-400 font-normal">(opzionale)</span></label>
                        <input
                          type="text"
                          value={newPayment.invoiceNumber}
                          onChange={(e) => setNewPayment({...newPayment, invoiceNumber: e.target.value})}
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-primary transition-all"
                          placeholder="INV-001"
                          disabled={isSubmitting}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-600">Note <span className="text-gray-400 font-normal">(opzionale)</span></label>
                        <textarea
                          value={newPayment.notes}
                          onChange={(e) => setNewPayment({...newPayment, notes: e.target.value})}
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-primary transition-all resize-none h-20"
                          placeholder="Note sul pagamento..."
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>

                    <div className="mt-6 flex gap-3">
                      <button
                        onClick={() => setShowPaymentModal(false)}
                        className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all"
                        disabled={isSubmitting}
                      >
                        Annulla
                      </button>
                      <button
                        onClick={handleAddPayment}
                        disabled={!newPayment.amount || isSubmitting}
                        className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 size={18} className="animate-spin" />
                            Salvataggio...
                          </>
                        ) : (
                          <>
                            <CreditCard size={18} />
                            Registra
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="space-y-8">
                {state.recentActivity.filter(a => a.action.includes(selectedClient.company)).map(act => (
                  <div key={act.id} className="flex gap-4 relative">
                    <div className="w-10 h-10 bg-white border border-gray-100 rounded-full flex items-center justify-center shrink-0 z-10">
                      <Activity size={18} className="text-primary" />
                    </div>
                    <div className="pt-2">
                      <p className="text-sm font-bold text-gray-800">{act.action}</p>
                      <p className="text-xs text-gray-400">{act.user} • {format(new Date(act.time), 'HH:mm')}</p>
                    </div>
                    <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-gray-100 -translate-x-1/2"></div>
                  </div>
                ))}
                {state.recentActivity.filter(a => a.action.includes(selectedClient.company)).length === 0 &&
                  <p className="text-center text-gray-400 py-10">Nessuna attività recente registrata per questo cliente.</p>
                }
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Loading state
  if (state.loading && !state.initialized) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Caricamento clienti...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold">Gestione Clienti</h2>
          <p className="text-gray-400 mt-1">Gestisci i progetti del drop e le relazioni con i brand streetwear.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Cerca cliente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-primary outline-none transition-all text-sm w-64"
            />
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm hover:brightness-110 transition-all"
          >
            <Plus size={18} />
            Nuovo Cliente
          </button>
        </div>
      </div>

      {filteredClients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <div
              key={client.id}
              onClick={() => { setSelectedClient(client); setActiveTab('overview'); }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-primary/5 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                  <Instagram size={24} />
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${
                    client.status === ProjectStatus.ACTIVE ? 'bg-blue-100 text-blue-600' :
                    client.status === ProjectStatus.COMPLETED ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {client.status}
                  </span>
                </div>
              </div>

              <h3 className="text-xl font-bold mb-1 group-hover:text-primary transition-all">{client.instagramHandle || client.company || client.name}</h3>
              <p className="text-sm text-gray-500 mb-6">{client.name || client.company}</p>

              <div className="space-y-3 mb-6">
                {client.email && (
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <Mail size={16} className="text-gray-400" />
                    <span>{client.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <Tag size={16} className="text-gray-400" />
                  <span className="font-bold text-primary">{client.packageName || state.packages.find(p => p.id === client.packageId)?.name}</span>
                  <span className="text-xs bg-secondary/10 text-secondary px-2 py-0.5 rounded font-bold">€{client.totalPrice}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  <CalendarIcon size={14} />
                  <span>Deadline: {format(new Date(client.deadline), 'dd MMM yyyy')}</span>
                </div>
                <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-primary group-hover:text-white transition-all">
                  <ChevronRight size={18} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <Building2 size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-bold text-gray-400 mb-2">Nessun cliente trovato</h3>
          <p className="text-gray-400 mb-6">Inizia aggiungendo il tuo primo cliente.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold text-sm shadow-sm hover:brightness-110 transition-all"
          >
            <Plus size={18} />
            Aggiungi Cliente
          </button>
        </div>
      )}

      {renderClientDetail()}

      {/* Add Client Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl animate-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="p-8">
               <div className="flex justify-between items-center mb-6">
                 <h3 className="text-2xl font-bold text-gray-800">Aggiungi Nuovo Cliente</h3>
                 <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 transition-all"><X size={24} /></button>
               </div>

               {error && (
                 <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
                   <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                   <p className="text-red-600 text-sm">{error}</p>
                 </div>
               )}

               <div className="space-y-5">
                 {/* IG Nickname - Required */}
                 <div className="space-y-2">
                   <label className="text-sm font-bold text-gray-600">Instagram Nickname *</label>
                   <div className="relative">
                     <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                     <input
                       type="text"
                       value={newClient.igNickname}
                       onChange={(e) => setNewClient({...newClient, igNickname: e.target.value})}
                       className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-primary transition-all"
                       placeholder="@username"
                       disabled={isSubmitting}
                     />
                   </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                   {/* Full Name - Optional */}
                   <div className="space-y-2">
                     <label className="text-sm font-bold text-gray-600">Nome Completo <span className="text-gray-400 font-normal">(opzionale)</span></label>
                     <input
                        type="text"
                        value={newClient.name}
                        onChange={(e) => setNewClient({...newClient, name: e.target.value})}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-primary transition-all"
                        placeholder="Nome e Cognome"
                        disabled={isSubmitting}
                      />
                   </div>
                   {/* Email - Optional */}
                   <div className="space-y-2">
                     <label className="text-sm font-bold text-gray-600">Email <span className="text-gray-400 font-normal">(opzionale)</span></label>
                     <input
                        type="email"
                        value={newClient.email}
                        onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-primary transition-all"
                        placeholder="email@esempio.it"
                        disabled={isSubmitting}
                      />
                   </div>
                 </div>

                 {/* Package Selection - Multi-select */}
                 <div className="space-y-3">
                   <label className="text-sm font-bold text-gray-600">Seleziona Pacchetti *</label>
                   <p className="text-xs text-gray-400">Puoi selezionare più pacchetti da combinare</p>
                   <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto">
                     {state.packages.map(pkg => {
                       const isSelected = newClient.selectedPackages.includes(pkg.id);
                       const selectionIndex = newClient.selectedPackages.indexOf(pkg.id);
                       return (
                         <div
                           key={pkg.id}
                           onClick={() => !isSubmitting && togglePackageSelection(pkg.id)}
                           className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                             isSelected
                               ? 'border-primary bg-primary/5'
                               : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                           }`}
                         >
                           <div className="flex items-center justify-between">
                             <div className="flex items-center gap-3">
                               <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                                 isSelected ? 'bg-primary text-white' : 'bg-gray-200'
                               }`}>
                                 {isSelected && <Check size={14} />}
                               </div>
                               <div>
                                 <p className="font-bold text-gray-800">{pkg.name}</p>
                                 <p className="text-xs text-gray-400">{pkg.description}</p>
                               </div>
                             </div>
                             <div className="text-right">
                               <p className="font-bold text-primary">€{pkg.price}</p>
                               <p className="text-[10px] text-gray-400">{pkg.defaultDeadlineDays}gg</p>
                             </div>
                           </div>
                           {isSelected && selectionIndex === 0 && (
                             <span className="inline-block mt-2 text-[10px] font-bold bg-primary text-white px-2 py-0.5 rounded">PRINCIPALE</span>
                           )}
                           {isSelected && selectionIndex > 0 && (
                             <span className="inline-block mt-2 text-[10px] font-bold bg-secondary text-primary px-2 py-0.5 rounded">ADDON</span>
                           )}
                         </div>
                       );
                     })}
                   </div>
                   {newClient.selectedPackages.length > 0 && (
                     <div className="p-3 bg-gray-100 rounded-xl">
                       <p className="text-sm font-bold text-gray-600">
                         Totale: €{state.packages.filter(p => newClient.selectedPackages.includes(p.id)).reduce((sum, p) => sum + p.price, 0)}
                       </p>
                     </div>
                   )}
                 </div>

                 {/* Deadline */}
                 <div className="space-y-2">
                   <label className="text-sm font-bold text-gray-600">Scadenza (Giorni)</label>
                   <input
                     type="number"
                     value={newClient.deadlineDays}
                     onChange={(e) => setNewClient({...newClient, deadlineDays: parseInt(e.target.value) || 10})}
                     className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-primary transition-all"
                     disabled={isSubmitting}
                   />
                 </div>
               </div>

               <div className="mt-8 flex gap-4">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all"
                    disabled={isSubmitting}
                  >
                    Annulla
                  </button>
                  <button
                    onClick={handleAddClient}
                    disabled={!newClient.igNickname || newClient.selectedPackages.length === 0 || isSubmitting}
                    className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:brightness-110 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Creazione...
                      </>
                    ) : (
                      'Crea Cliente'
                    )}
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clients;
