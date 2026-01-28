import { supabase } from './supabase';
import type {
  Package,
  PackageTask,
  Client,
  Task,
  TaskNote,
  ClientNote,
  Payment,
  ActivityLog,
  UserProfile,
  ClientOverview,
  DashboardMetrics,
} from '../types/supabase';

// =====================================================
// PACKAGES
// =====================================================

export async function fetchPackages(): Promise<Package[]> {
  const { data, error } = await supabase
    .from('packages')
    .select('*')
    .eq('active', true)
    .order('price_min', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function fetchPackageWithTasks(packageId: string): Promise<{
  package: Package;
  tasks: PackageTask[];
}> {
  const [packageResult, tasksResult] = await Promise.all([
    supabase.from('packages').select('*').eq('id', packageId).single(),
    supabase
      .from('package_tasks')
      .select('*')
      .eq('package_id', packageId)
      .order('order_number', { ascending: true }),
  ]);

  if (packageResult.error) throw packageResult.error;
  if (tasksResult.error) throw tasksResult.error;

  return {
    package: packageResult.data,
    tasks: tasksResult.data || [],
  };
}

export async function fetchPackagesWithTasks(): Promise<
  Array<Package & { tasks: PackageTask[] }>
> {
  const { data: packages, error: packagesError } = await supabase
    .from('packages')
    .select('*')
    .eq('active', true)
    .order('price_min', { ascending: true });

  if (packagesError) throw packagesError;

  const { data: tasks, error: tasksError } = await supabase
    .from('package_tasks')
    .select('*')
    .order('order_number', { ascending: true });

  if (tasksError) throw tasksError;

  return (packages || []).map((pkg) => ({
    ...pkg,
    tasks: (tasks || []).filter((t) => t.package_id === pkg.id),
  }));
}

// =====================================================
// CLIENTS
// =====================================================

export async function fetchClients(): Promise<ClientOverview[]> {
  const { data, error } = await supabase
    .from('client_overview')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function fetchClientById(clientId: string): Promise<Client | null> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}

export async function fetchClientWithDetails(clientId: string): Promise<{
  client: ClientOverview;
  tasks: Task[];
  notes: ClientNote[];
  payments: Payment[];
} | null> {
  const [clientResult, tasksResult, notesResult, paymentsResult] = await Promise.all([
    supabase.from('client_overview').select('*').eq('id', clientId).single(),
    supabase.from('tasks').select('*').eq('client_id', clientId).order('scheduled_date'),
    supabase.from('client_notes').select('*').eq('client_id', clientId).order('created_at', { ascending: false }),
    supabase.from('payments').select('*').eq('client_id', clientId).order('payment_date', { ascending: false }),
  ]);

  if (clientResult.error) {
    if (clientResult.error.code === 'PGRST116') return null;
    throw clientResult.error;
  }

  return {
    client: clientResult.data,
    tasks: tasksResult.data || [],
    notes: notesResult.data || [],
    payments: paymentsResult.data || [],
  };
}

export interface CreateClientInput {
  name: string;
  email: string;
  phone?: string;
  instagram_handle?: string;
  company_name?: string;
  package_id: string;
  addon_package_id?: string;
  actual_price: number;
  start_date: string;
  deadline: string;
}

export async function createClient(input: CreateClientInput): Promise<Client> {
  const { data, error } = await supabase
    .from('clients')
    .insert({
      name: input.name,
      email: input.email,
      phone: input.phone || null,
      instagram_handle: input.instagram_handle || null,
      company_name: input.company_name || null,
      package_id: input.package_id,
      addon_package_id: input.addon_package_id || null,
      actual_price: input.actual_price,
      status: 'not_started',
      start_date: input.start_date,
      deadline: input.deadline,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateClient(
  clientId: string,
  updates: Partial<Client>
): Promise<Client> {
  const { data, error } = await supabase
    .from('clients')
    .update(updates)
    .eq('id', clientId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteClient(clientId: string): Promise<void> {
  const { error } = await supabase.from('clients').delete().eq('id', clientId);
  if (error) throw error;
}

// =====================================================
// TASKS
// =====================================================

export async function fetchTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('scheduled_date', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function fetchTasksByClient(clientId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('client_id', clientId)
    .order('scheduled_date', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function fetchTaskWithNotes(taskId: string): Promise<{
  task: Task;
  notes: TaskNote[];
} | null> {
  const [taskResult, notesResult] = await Promise.all([
    supabase.from('tasks').select('*').eq('id', taskId).single(),
    supabase.from('task_notes').select('*').eq('task_id', taskId).order('created_at', { ascending: false }),
  ]);

  if (taskResult.error) {
    if (taskResult.error.code === 'PGRST116') return null;
    throw taskResult.error;
  }

  return {
    task: taskResult.data,
    notes: notesResult.data || [],
  };
}

export async function updateTask(
  taskId: string,
  updates: Partial<Task>
): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', taskId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function createTasksFromPackage(
  clientId: string,
  packageId: string,
  startDate: string,
  deadline: string
): Promise<Task[]> {
  // Fetch package tasks
  const { data: packageTasks, error: fetchError } = await supabase
    .from('package_tasks')
    .select('*')
    .eq('package_id', packageId)
    .order('order_number', { ascending: true });

  if (fetchError) throw fetchError;
  if (!packageTasks || packageTasks.length === 0) return [];

  // Calculate date distribution
  const start = new Date(startDate);
  const end = new Date(deadline);
  const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  const tasksPerDay = packageTasks.length / totalDays;

  const tasksToInsert = packageTasks.map((pt, index) => {
    const dayOffset = Math.floor(index / Math.max(1, tasksPerDay));
    const scheduledDate = new Date(start);
    scheduledDate.setDate(scheduledDate.getDate() + dayOffset);

    // Skip weekends
    while (scheduledDate.getDay() === 0 || scheduledDate.getDay() === 6) {
      scheduledDate.setDate(scheduledDate.getDate() + 1);
    }

    return {
      client_id: clientId,
      package_task_id: pt.id,
      title: pt.title,
      description: pt.description,
      estimated_hours: pt.estimated_hours,
      actual_hours: null,
      task_type: pt.task_type,
      complexity: pt.complexity,
      scheduled_date: scheduledDate.toISOString().split('T')[0],
      due_date: deadline,
      status: 'not_started' as const,
      priority: 'medium' as const,
      assigned_to: [],
      dependencies: null,
      completed_at: null,
      completed_by: null,
    };
  });

  const { data, error } = await supabase
    .from('tasks')
    .insert(tasksToInsert)
    .select();

  if (error) throw error;
  return data || [];
}

// =====================================================
// NOTES
// =====================================================

export async function addClientNote(
  clientId: string,
  content: string,
  category: ClientNote['category'],
  authorId: string,
  authorName: string
): Promise<ClientNote> {
  const { data, error } = await supabase
    .from('client_notes')
    .insert({
      client_id: clientId,
      content,
      category,
      author_id: authorId,
      author_name: authorName,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function addTaskNote(
  taskId: string,
  content: string,
  noteType: TaskNote['note_type'],
  authorId: string,
  authorName: string
): Promise<TaskNote> {
  const { data, error } = await supabase
    .from('task_notes')
    .insert({
      task_id: taskId,
      content,
      note_type: noteType,
      author_id: authorId,
      author_name: authorName,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteClientNote(noteId: string): Promise<void> {
  const { error } = await supabase
    .from('client_notes')
    .delete()
    .eq('id', noteId);

  if (error) throw error;
}

// =====================================================
// PAYMENTS
// =====================================================

export async function fetchPaymentsByClient(clientId: string): Promise<Payment[]> {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('client_id', clientId)
    .order('payment_date', { ascending: false });

  if (error) throw error;
  return data || [];
}

export interface AddPaymentInput {
  client_id: string;
  amount: number;
  payment_date: string;
  payment_method?: string;
  invoice_number?: string;
  status: Payment['status'];
  notes?: string;
}

export async function addPayment(input: AddPaymentInput): Promise<Payment> {
  const { data, error } = await supabase
    .from('payments')
    .insert({
      client_id: input.client_id,
      amount: input.amount,
      payment_date: input.payment_date,
      payment_method: input.payment_method || null,
      invoice_number: input.invoice_number || null,
      status: input.status,
      notes: input.notes || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// =====================================================
// ACTIVITY LOG
// =====================================================

export async function fetchRecentActivity(limit: number = 50): Promise<ActivityLog[]> {
  const { data, error } = await supabase
    .from('activity_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function logActivity(
  userId: string,
  userName: string,
  action: string,
  entityType: ActivityLog['entity_type'],
  entityId: string,
  description?: string,
  metadata?: Record<string, unknown>
): Promise<ActivityLog> {
  const { data, error } = await supabase
    .from('activity_log')
    .insert({
      user_id: userId,
      user_name: userName,
      action,
      entity_type: entityType,
      entity_id: entityId,
      description: description || null,
      metadata: metadata || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// =====================================================
// USER PROFILES
// =====================================================

export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}

export async function createUserProfile(
  userId: string,
  fullName: string,
  role: UserProfile['role'] = 'designer'
): Promise<UserProfile> {
  const { data, error } = await supabase
    .from('user_profiles')
    .insert({
      id: userId,
      full_name: fullName,
      role,
      online: true,
      last_active: new Date().toISOString(),
      preferences: { notifications: true, email_digest: 'daily' },
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<UserProfile>
): Promise<UserProfile> {
  const { data, error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function fetchTeamMembers(): Promise<UserProfile[]> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .order('full_name', { ascending: true });

  if (error) throw error;
  return data || [];
}

// =====================================================
// DASHBOARD METRICS
// =====================================================

export async function fetchDashboardMetrics(): Promise<DashboardMetrics | null> {
  const { data, error } = await supabase
    .from('dashboard_metrics')
    .select('*')
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}

// =====================================================
// REAL-TIME SUBSCRIPTIONS
// =====================================================

export function subscribeToClients(
  callback: (payload: { eventType: string; new: Client | null; old: Client | null }) => void
) {
  return supabase
    .channel('clients-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'clients' },
      (payload) => {
        callback({
          eventType: payload.eventType,
          new: payload.new as Client | null,
          old: payload.old as Client | null,
        });
      }
    )
    .subscribe();
}

export function subscribeToTasks(
  callback: (payload: { eventType: string; new: Task | null; old: Task | null }) => void
) {
  return supabase
    .channel('tasks-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'tasks' },
      (payload) => {
        callback({
          eventType: payload.eventType,
          new: payload.new as Task | null,
          old: payload.old as Task | null,
        });
      }
    )
    .subscribe();
}

export function subscribeToActivity(
  callback: (payload: { new: ActivityLog }) => void
) {
  return supabase
    .channel('activity-changes')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'activity_log' },
      (payload) => {
        callback({ new: payload.new as ActivityLog });
      }
    )
    .subscribe();
}

export function unsubscribe(channel: ReturnType<typeof supabase.channel>) {
  supabase.removeChannel(channel);
}
