import React, { createContext, useContext, useReducer, useEffect, ReactNode, useCallback } from 'react';
import {
  Client,
  Task,
  TeamMember,
  PackageTemplate,
  Note,
  Payment,
  Activity,
  TaskStatus,
  PaymentStatus,
  ProjectStatus,
  dbClientToClient,
  dbTaskToTask,
  dbPackageToTemplate,
  dbActivityToActivity,
  dbUserProfileToTeamMember,
  taskStatusToDb,
  paymentStatusToDb,
  projectStatusToDb,
} from '../types';
import * as api from './api';
import { useAuth } from '../contexts/AuthContext';
import { PACKAGE_TEMPLATES, MOCK_TEAM } from '../constants';

interface State {
  clients: Client[];
  tasks: Task[];
  team: TeamMember[];
  packages: PackageTemplate[];
  loading: boolean;
  error: string | null;
  recentActivity: Activity[];
  initialized: boolean;
  archivedRevenue: number;
}

type Action =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_INITIALIZED'; payload: boolean }
  | { type: 'SET_CLIENTS'; payload: Client[] }
  | { type: 'SET_TASKS'; payload: Task[] }
  | { type: 'SET_TEAM'; payload: TeamMember[] }
  | { type: 'SET_PACKAGES'; payload: PackageTemplate[] }
  | { type: 'SET_ACTIVITY'; payload: Activity[] }
  | { type: 'ADD_CLIENT'; payload: Client }
  | { type: 'UPDATE_CLIENT'; payload: Client }
  | { type: 'DELETE_CLIENT'; payload: string }
  | { type: 'ADD_TASKS'; payload: Task[] }
  | { type: 'UPDATE_TASK'; payload: Task }
  | { type: 'UPDATE_TASKS_BATCH'; payload: Task[] }
  | { type: 'ADD_NOTE_TO_CLIENT'; payload: { clientId: string; note: Note } }
  | { type: 'DELETE_NOTE_FROM_CLIENT'; payload: { clientId: string; noteId: string } }
  | { type: 'ADD_NOTE_TO_TASK'; payload: { taskId: string; note: Note } }
  | { type: 'ADD_PAYMENT'; payload: { clientId: string; payment: Payment } }
  | { type: 'ADD_ACTIVITY'; payload: Activity }
  | { type: 'SET_TEAM_STATUS'; payload: { id: string; status: 'online' | 'offline' } }
  | { type: 'ADD_ARCHIVED_REVENUE'; payload: number }
  | { type: 'RESET_ARCHIVED_REVENUE' };

const ARCHIVED_REVENUE_KEY = 'crm_archived_revenue';

const getArchivedRevenue = (): number => {
  if (typeof window === 'undefined') return 0;
  const stored = localStorage.getItem(ARCHIVED_REVENUE_KEY);
  return stored ? parseFloat(stored) : 0;
};

const saveArchivedRevenue = (amount: number): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(ARCHIVED_REVENUE_KEY, amount.toString());
  }
};

const initialState: State = {
  clients: [],
  tasks: [],
  team: MOCK_TEAM, // Fallback until profiles load
  packages: PACKAGE_TEMPLATES, // Fallback until packages load
  loading: true,
  error: null,
  recentActivity: [],
  initialized: false,
  archivedRevenue: 0,
};

const storeContext = createContext<{
  state: State;
  dispatch: React.Dispatch<Action>;
  actions: {
    createClient: (data: api.CreateClientInput) => Promise<Client>;
    updateClient: (clientId: string, updates: Partial<Client>) => Promise<void>;
    deleteClient: (clientId: string) => Promise<void>;
    updateTask: (taskId: string, status: TaskStatus) => Promise<void>;
    completeClientTasks: (clientId: string) => Promise<void>;
    addClientNote: (clientId: string, content: string, category: Note['category']) => Promise<void>;
    deleteClientNote: (clientId: string, noteId: string) => Promise<void>;
    addTaskNote: (taskId: string, content: string, category: Note['category']) => Promise<void>;
    addPayment: (clientId: string, payment: Omit<Payment, 'id'>) => Promise<void>;
    refreshData: () => Promise<void>;
    resetArchivedRevenue: () => void;
  };
} | undefined>(undefined);

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_INITIALIZED':
      return { ...state, initialized: action.payload };
    case 'SET_CLIENTS':
      return { ...state, clients: action.payload };
    case 'SET_TASKS':
      return { ...state, tasks: action.payload };
    case 'SET_TEAM':
      return { ...state, team: action.payload };
    case 'SET_PACKAGES':
      return { ...state, packages: action.payload };
    case 'SET_ACTIVITY':
      return { ...state, recentActivity: action.payload };
    case 'ADD_CLIENT':
      return { ...state, clients: [action.payload, ...state.clients] };
    case 'UPDATE_CLIENT':
      return {
        ...state,
        clients: state.clients.map((c) =>
          c.id === action.payload.id ? action.payload : c
        ),
      };
    case 'DELETE_CLIENT':
      return {
        ...state,
        clients: state.clients.filter((c) => c.id !== action.payload),
        tasks: state.tasks.filter((t) => t.clientId !== action.payload),
      };
    case 'ADD_TASKS':
      return { ...state, tasks: [...state.tasks, ...action.payload] };
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.payload.id ? action.payload : t
        ),
      };
    case 'UPDATE_TASKS_BATCH':
      return {
        ...state,
        tasks: state.tasks.map((t) => {
          const updated = action.payload.find((u) => u.id === t.id);
          return updated || t;
        }),
      };
    case 'ADD_NOTE_TO_CLIENT':
      return {
        ...state,
        clients: state.clients.map((c) =>
          c.id === action.payload.clientId
            ? { ...c, notes: [action.payload.note, ...c.notes] }
            : c
        ),
      };
    case 'DELETE_NOTE_FROM_CLIENT':
      return {
        ...state,
        clients: state.clients.map((c) =>
          c.id === action.payload.clientId
            ? { ...c, notes: c.notes.filter((n) => n.id !== action.payload.noteId) }
            : c
        ),
      };
    case 'ADD_NOTE_TO_TASK':
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.payload.taskId
            ? { ...t, notes: [action.payload.note, ...t.notes] }
            : t
        ),
      };
    case 'ADD_PAYMENT':
      return {
        ...state,
        clients: state.clients.map((c) =>
          c.id === action.payload.clientId
            ? { ...c, payments: [action.payload.payment, ...c.payments] }
            : c
        ),
      };
    case 'ADD_ACTIVITY':
      return {
        ...state,
        recentActivity: [action.payload, ...state.recentActivity].slice(0, 50),
      };
    case 'SET_TEAM_STATUS':
      return {
        ...state,
        team: state.team.map((m) =>
          m.id === action.payload.id ? { ...m, status: action.payload.status } : m
        ),
      };
    case 'ADD_ARCHIVED_REVENUE': {
      const newArchivedRevenue = state.archivedRevenue + action.payload;
      saveArchivedRevenue(newArchivedRevenue);
      return {
        ...state,
        archivedRevenue: newArchivedRevenue,
      };
    }
    case 'RESET_ARCHIVED_REVENUE': {
      saveArchivedRevenue(0);
      return {
        ...state,
        archivedRevenue: 0,
      };
    }
    default:
      return state;
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState, (initial) => ({
    ...initial,
    archivedRevenue: getArchivedRevenue(),
  }));
  const { user } = useAuth();

  // Load initial data
  const loadData = useCallback(async () => {
    if (!user) {
      dispatch({ type: 'SET_INITIALIZED', payload: true });
      dispatch({ type: 'SET_LOADING', payload: false });
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      // Load all data in parallel
      const [clientsData, tasksData, packagesData, activityData, teamData] = await Promise.all([
        api.fetchClients(),
        api.fetchTasks(),
        api.fetchPackagesWithTasks(),
        api.fetchRecentActivity(50),
        api.fetchTeamMembers(),
      ]);

      // Create client name map for tasks
      const clientNameMap = new Map(clientsData.map((c) => [c.id, c.name]));

      // Convert to UI types
      const clients = clientsData.map((c) => dbClientToClient(c));
      const tasks = tasksData.map((t) => dbTaskToTask(t, [], clientNameMap.get(t.client_id)));
      const packages = packagesData.map((p) => dbPackageToTemplate(p, p.tasks));
      const activity = activityData.map(dbActivityToActivity);
      const team = teamData.length > 0
        ? teamData.map(dbUserProfileToTeamMember)
        : MOCK_TEAM;

      dispatch({ type: 'SET_CLIENTS', payload: clients });
      dispatch({ type: 'SET_TASKS', payload: tasks });
      dispatch({ type: 'SET_PACKAGES', payload: packages.length > 0 ? packages : PACKAGE_TEMPLATES });
      dispatch({ type: 'SET_ACTIVITY', payload: activity });
      dispatch({ type: 'SET_TEAM', payload: team });
      dispatch({ type: 'SET_INITIALIZED', payload: true });
    } catch (err) {
      console.error('Failed to load data:', err);
      dispatch({ type: 'SET_ERROR', payload: 'Impossibile caricare i dati. Riprova.' });
      // Use fallback data
      dispatch({ type: 'SET_PACKAGES', payload: PACKAGE_TEMPLATES });
      dispatch({ type: 'SET_TEAM', payload: MOCK_TEAM });
      dispatch({ type: 'SET_INITIALIZED', payload: true });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) return;

    const clientsChannel = api.subscribeToClients((payload) => {
      if (payload.eventType === 'INSERT' && payload.new) {
        // Refetch to get the full client overview
        api.fetchClients().then((clients) => {
          const newClient = clients.find((c) => c.id === payload.new?.id);
          if (newClient) {
            dispatch({ type: 'ADD_CLIENT', payload: dbClientToClient(newClient) });
          }
        });
      } else if (payload.eventType === 'UPDATE' && payload.new) {
        api.fetchClients().then((clients) => {
          const updatedClient = clients.find((c) => c.id === payload.new?.id);
          if (updatedClient) {
            dispatch({ type: 'UPDATE_CLIENT', payload: dbClientToClient(updatedClient) });
          }
        });
      } else if (payload.eventType === 'DELETE' && payload.old) {
        dispatch({ type: 'DELETE_CLIENT', payload: payload.old.id });
      }
    });

    const tasksChannel = api.subscribeToTasks((payload) => {
      if (payload.eventType === 'INSERT' && payload.new) {
        const task = dbTaskToTask(payload.new);
        dispatch({ type: 'ADD_TASKS', payload: [task] });
      } else if (payload.eventType === 'UPDATE' && payload.new) {
        const task = dbTaskToTask(payload.new);
        dispatch({ type: 'UPDATE_TASK', payload: task });
      }
    });

    const activityChannel = api.subscribeToActivity((payload) => {
      const activity = dbActivityToActivity(payload.new);
      dispatch({ type: 'ADD_ACTIVITY', payload: activity });
    });

    return () => {
      api.unsubscribe(clientsChannel);
      api.unsubscribe(tasksChannel);
      api.unsubscribe(activityChannel);
    };
  }, [user]);

  // Action handlers
  const createClient = async (data: api.CreateClientInput): Promise<Client> => {
    if (!user) throw new Error('Not authenticated');

    const dbClient = await api.createClient(data);

    // Create tasks from package
    const dbTasks = await api.createTasksFromPackage(
      dbClient.id,
      data.package_id,
      data.start_date,
      data.deadline
    );

    // Convert to UI types
    const tasks = dbTasks.map((t) => dbTaskToTask(t));

    // Fetch the full client overview
    const clientsData = await api.fetchClients();
    const clientOverview = clientsData.find((c) => c.id === dbClient.id);

    if (!clientOverview) throw new Error('Client not found after creation');

    const client = dbClientToClient(clientOverview);

    dispatch({ type: 'ADD_CLIENT', payload: client });
    dispatch({ type: 'ADD_TASKS', payload: tasks });

    return client;
  };

  const updateClient = async (clientId: string, updates: Partial<Client>): Promise<void> => {
    if (!user) throw new Error('Not authenticated');

    const dbUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.email !== undefined) dbUpdates.email = updates.email;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
    if (updates.instagramHandle !== undefined) dbUpdates.instagram_handle = updates.instagramHandle;
    if (updates.company !== undefined) dbUpdates.company_name = updates.company;
    if (updates.totalPrice !== undefined) dbUpdates.actual_price = updates.totalPrice;
    if (updates.deadline !== undefined) dbUpdates.deadline = updates.deadline;
    if (updates.status !== undefined) dbUpdates.status = projectStatusToDb[updates.status];

    await api.updateClient(clientId, dbUpdates);

    // Refetch client to get updated data
    const clientsData = await api.fetchClients();
    const updatedClient = clientsData.find((c) => c.id === clientId);
    if (updatedClient) {
      dispatch({ type: 'UPDATE_CLIENT', payload: dbClientToClient(updatedClient) });
    }
  };

  const deleteClient = async (clientId: string): Promise<void> => {
    if (!user) throw new Error('Not authenticated');

    // Find the client to preserve their totalPrice before deletion
    const client = state.clients.find((c) => c.id === clientId);
    if (client && client.totalPrice > 0) {
      dispatch({ type: 'ADD_ARCHIVED_REVENUE', payload: client.totalPrice });
    }

    await api.deleteClient(clientId);
    dispatch({ type: 'DELETE_CLIENT', payload: clientId });
  };

  const updateTask = async (taskId: string, status: TaskStatus): Promise<void> => {
    if (!user) throw new Error('Not authenticated');

    const dbStatus = taskStatusToDb[status];
    const updates: Partial<api.Task> = {
      status: dbStatus as api.Task['status'],
    };

    if (status === TaskStatus.COMPLETE) {
      updates.completed_at = new Date().toISOString();
      updates.completed_by = user.id;
    }

    await api.updateTask(taskId, updates);

    // Update local state
    const existingTask = state.tasks.find((t) => t.id === taskId);
    if (existingTask) {
      dispatch({
        type: 'UPDATE_TASK',
        payload: { ...existingTask, status },
      });
    }
  };

  const completeClientTasks = async (clientId: string): Promise<void> => {
    if (!user) throw new Error('Not authenticated');

    const updates: Partial<api.Task> = {
      status: 'completed',
      completed_at: new Date().toISOString(),
      completed_by: user.id,
    };

    await api.updateTasksByClient(clientId, updates);

    // Update local state
    const updatedTasks = state.tasks
      .filter((t) => t.clientId === clientId)
      .map((t) => ({ ...t, status: TaskStatus.COMPLETE }));

    if (updatedTasks.length > 0) {
      dispatch({ type: 'UPDATE_TASKS_BATCH', payload: updatedTasks });
    }
  };

  const addClientNote = async (
    clientId: string,
    content: string,
    category: Note['category']
  ): Promise<void> => {
    if (!user) throw new Error('Not authenticated');

    const categoryMap: Record<Note['category'], string> = {
      Preferenza: 'preference',
      Comunicazione: 'communication',
      Feedback: 'feedback',
      Problema: 'issue',
      Generale: 'general',
      Aggiornamento: 'general',
      Blocco: 'issue',
      Decisione: 'general',
      Passaggio: 'general',
    };

    const dbNote = await api.addClientNote(
      clientId,
      content,
      categoryMap[category] as api.ClientNote['category'],
      user.id,
      user.profile?.full_name || user.email
    );

    const note: Note = {
      id: dbNote.id,
      author: dbNote.author_name,
      content: dbNote.content,
      timestamp: dbNote.created_at,
      category,
    };

    dispatch({ type: 'ADD_NOTE_TO_CLIENT', payload: { clientId, note } });
  };

  const deleteClientNote = async (clientId: string, noteId: string): Promise<void> => {
    if (!user) throw new Error('Not authenticated');

    await api.deleteClientNote(noteId);
    dispatch({ type: 'DELETE_NOTE_FROM_CLIENT', payload: { clientId, noteId } });
  };

  const addTaskNote = async (
    taskId: string,
    content: string,
    category: Note['category']
  ): Promise<void> => {
    if (!user) throw new Error('Not authenticated');

    const categoryMap: Record<Note['category'], string> = {
      Aggiornamento: 'progress',
      Blocco: 'blocker',
      Decisione: 'decision',
      Passaggio: 'handoff',
      Feedback: 'client_feedback',
      Preferenza: 'progress',
      Comunicazione: 'progress',
      Problema: 'blocker',
      Generale: 'progress',
    };

    const dbNote = await api.addTaskNote(
      taskId,
      content,
      categoryMap[category] as api.TaskNote['note_type'],
      user.id,
      user.profile?.full_name || user.email
    );

    const note: Note = {
      id: dbNote.id,
      author: dbNote.author_name,
      content: dbNote.content,
      timestamp: dbNote.created_at,
      category,
    };

    dispatch({ type: 'ADD_NOTE_TO_TASK', payload: { taskId, note } });
  };

  const addPayment = async (
    clientId: string,
    paymentData: Omit<Payment, 'id'>
  ): Promise<void> => {
    if (!user) throw new Error('Not authenticated');

    const dbPayment = await api.addPayment({
      client_id: clientId,
      amount: paymentData.amount,
      payment_date: paymentData.date,
      payment_method: paymentData.method,
      invoice_number: paymentData.invoiceNumber,
      status: paymentStatusToDb[paymentData.status] as api.Payment['status'],
      notes: paymentData.notes,
    });

    const payment: Payment = {
      id: dbPayment.id,
      amount: dbPayment.amount,
      date: dbPayment.payment_date,
      method: dbPayment.payment_method || '',
      invoiceNumber: dbPayment.invoice_number || '',
      status: paymentData.status,
      notes: dbPayment.notes || undefined,
    };

    dispatch({ type: 'ADD_PAYMENT', payload: { clientId, payment } });
  };

  const refreshData = async (): Promise<void> => {
    await loadData();
  };

  const resetArchivedRevenue = () => {
    dispatch({ type: 'RESET_ARCHIVED_REVENUE' });
  };

  const actions = {
    createClient,
    updateClient,
    deleteClient,
    updateTask,
    completeClientTasks,
    addClientNote,
    deleteClientNote,
    addTaskNote,
    addPayment,
    refreshData,
    resetArchivedRevenue,
  };

  return (
    <storeContext.Provider value={{ state, dispatch, actions }}>
      {children}
    </storeContext.Provider>
  );
}

export function useStore() {
  const context = useContext(storeContext);
  if (!context) {
    throw new Error('useStore must be used within StoreProvider');
  }
  return context;
}
