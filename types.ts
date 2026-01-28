// Re-export Supabase types for compatibility
export type {
  Package as DBPackage,
  PackageTask as DBPackageTask,
  Client as DBClient,
  Task as DBTask,
  TaskNote as DBTaskNote,
  ClientNote as DBClientNote,
  Payment as DBPayment,
  ActivityLog,
  UserProfile,
  ClientOverview,
  DashboardMetrics,
} from './types/supabase';

// =====================================================
// ENUMS - Used for UI display (Italian labels)
// =====================================================

export enum ProjectStatus {
  NOT_STARTED = 'Non iniziato',
  ACTIVE = 'Attivo',
  COMPLETED = 'Completato',
  ARCHIVED = 'Archiviato',
}

export enum TaskStatus {
  NOT_STARTED = 'Da iniziare',
  IN_RESEARCH = 'In ricerca',
  IN_PROGRESS = 'In corso',
  ON_TRACK = 'In linea',
  COMPLETE = 'Completato',
  BLOCKED = 'Bloccato',
}

export enum TaskPriority {
  LOW = 'Bassa',
  MEDIUM = 'Media',
  HIGH = 'Alta',
  URGENT = 'Urgente',
}

export enum PaymentStatus {
  PAID = 'Pagato',
  PARTIAL = 'Parziale',
  PENDING = 'In attesa',
  REFUNDED = 'Rimborsato',
}

// =====================================================
// STATUS MAPPERS - Convert DB values to UI display
// =====================================================

export const dbToProjectStatus: Record<string, ProjectStatus> = {
  not_started: ProjectStatus.NOT_STARTED,
  in_progress: ProjectStatus.ACTIVE,
  completed: ProjectStatus.COMPLETED,
  archived: ProjectStatus.ARCHIVED,
};

export const projectStatusToDb: Record<ProjectStatus, string> = {
  [ProjectStatus.NOT_STARTED]: 'not_started',
  [ProjectStatus.ACTIVE]: 'in_progress',
  [ProjectStatus.COMPLETED]: 'completed',
  [ProjectStatus.ARCHIVED]: 'archived',
};

export const dbToTaskStatus: Record<string, TaskStatus> = {
  not_started: TaskStatus.NOT_STARTED,
  in_research: TaskStatus.IN_RESEARCH,
  in_progress: TaskStatus.IN_PROGRESS,
  on_track: TaskStatus.ON_TRACK,
  completed: TaskStatus.COMPLETE,
  blocked: TaskStatus.BLOCKED,
};

export const taskStatusToDb: Record<TaskStatus, string> = {
  [TaskStatus.NOT_STARTED]: 'not_started',
  [TaskStatus.IN_RESEARCH]: 'in_research',
  [TaskStatus.IN_PROGRESS]: 'in_progress',
  [TaskStatus.ON_TRACK]: 'on_track',
  [TaskStatus.COMPLETE]: 'completed',
  [TaskStatus.BLOCKED]: 'blocked',
};

export const dbToPaymentStatus: Record<string, PaymentStatus> = {
  paid: PaymentStatus.PAID,
  partial: PaymentStatus.PARTIAL,
  pending: PaymentStatus.PENDING,
  refunded: PaymentStatus.REFUNDED,
};

export const paymentStatusToDb: Record<PaymentStatus, string> = {
  [PaymentStatus.PAID]: 'paid',
  [PaymentStatus.PARTIAL]: 'partial',
  [PaymentStatus.PENDING]: 'pending',
  [PaymentStatus.REFUNDED]: 'refunded',
};

export const dbToPriority: Record<string, TaskPriority> = {
  low: TaskPriority.LOW,
  medium: TaskPriority.MEDIUM,
  high: TaskPriority.HIGH,
  urgent: TaskPriority.URGENT,
};

export const priorityToDb: Record<TaskPriority, string> = {
  [TaskPriority.LOW]: 'low',
  [TaskPriority.MEDIUM]: 'medium',
  [TaskPriority.HIGH]: 'high',
  [TaskPriority.URGENT]: 'urgent',
};

// =====================================================
// UI INTERFACES - Used by components
// =====================================================

export interface PackageTask {
  title: string;
  description: string;
  baseHours: number;
  complexity: 'simple' | 'medium' | 'complex' | 'veryComplex';
  type: 'research' | 'design' | 'development' | 'testing' | 'strategy' | 'delivery' | 'filming' | 'content' | 'mockup' | 'editing' | 'review';
  dependencies?: string[];
}

export interface PackageTemplate {
  id: string;
  name: string;
  description: string;
  price: number;
  priceMax?: number;
  defaultDeadlineDays: number;
  isAddon?: boolean;
  tasks: PackageTask[];
}

export interface Note {
  id: string;
  author: string;
  content: string;
  timestamp: string;
  category: 'Aggiornamento' | 'Blocco' | 'Decisione' | 'Passaggio' | 'Feedback' | 'Preferenza' | 'Comunicazione' | 'Problema' | 'Generale';
  tags?: string[];
}

export interface Payment {
  id: string;
  amount: number;
  date: string;
  method: string;
  invoiceNumber: string;
  status: PaymentStatus;
  notes?: string;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo: string[];
  scheduledDate: string;
  dueDate: string;
  estimatedHours: number;
  actualHours: number;
  clientId: string;
  clientName?: string;
  notes: Note[];
  subtasks: Subtask[];
  taskType?: string;
  complexity?: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  instagramHandle?: string;
  company: string;
  contact: string;
  packageId: string;
  packageName?: string;
  addonPackageId?: string;
  status: ProjectStatus;
  startDate: string;
  deadline: string;
  completionPercentage: number;
  payments: Payment[];
  notes: Note[];
  totalPrice: number;
  createdAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
  status: 'online' | 'offline';
  currentTask?: string;
}

export interface Activity {
  id: string;
  user: string;
  action: string;
  time: string;
  entityType?: string;
  entityId?: string;
}

// =====================================================
// TYPE CONVERTERS - DB to UI
// =====================================================

export function dbClientToClient(
  dbClient: import('./types/supabase').ClientOverview,
  notes: import('./types/supabase').ClientNote[] = [],
  payments: import('./types/supabase').Payment[] = []
): Client {
  return {
    id: dbClient.id,
    name: dbClient.name,
    email: dbClient.email,
    phone: dbClient.phone || undefined,
    instagramHandle: dbClient.instagram_handle || undefined,
    company: dbClient.company_name || '',
    contact: dbClient.phone || '',
    packageId: '', // Will be fetched separately if needed
    packageName: dbClient.package_name,
    status: dbToProjectStatus[dbClient.status] || ProjectStatus.NOT_STARTED,
    startDate: dbClient.start_date || '',
    deadline: dbClient.deadline,
    completionPercentage: dbClient.completion_percentage,
    payments: payments.map(dbPaymentToPayment),
    notes: notes.map(dbClientNoteToNote),
    totalPrice: dbClient.actual_price,
    createdAt: dbClient.created_at,
  };
}

export function dbTaskToTask(
  dbTask: import('./types/supabase').Task,
  notes: import('./types/supabase').TaskNote[] = [],
  clientName?: string
): Task {
  return {
    id: dbTask.id,
    title: dbTask.title,
    description: dbTask.description || '',
    status: dbToTaskStatus[dbTask.status] || TaskStatus.NOT_STARTED,
    priority: dbToPriority[dbTask.priority] || TaskPriority.MEDIUM,
    assignedTo: dbTask.assigned_to || [],
    scheduledDate: dbTask.scheduled_date,
    dueDate: dbTask.due_date,
    estimatedHours: dbTask.estimated_hours,
    actualHours: dbTask.actual_hours || 0,
    clientId: dbTask.client_id,
    clientName,
    notes: notes.map(dbTaskNoteToNote),
    subtasks: [],
    taskType: dbTask.task_type,
    complexity: dbTask.complexity,
  };
}

export function dbPaymentToPayment(dbPayment: import('./types/supabase').Payment): Payment {
  return {
    id: dbPayment.id,
    amount: dbPayment.amount,
    date: dbPayment.payment_date,
    method: dbPayment.payment_method || '',
    invoiceNumber: dbPayment.invoice_number || '',
    status: dbToPaymentStatus[dbPayment.status] || PaymentStatus.PENDING,
    notes: dbPayment.notes || undefined,
  };
}

export function dbClientNoteToNote(dbNote: import('./types/supabase').ClientNote): Note {
  const categoryMap: Record<string, Note['category']> = {
    preference: 'Preferenza',
    communication: 'Comunicazione',
    feedback: 'Feedback',
    issue: 'Problema',
    general: 'Generale',
  };

  return {
    id: dbNote.id,
    author: dbNote.author_name,
    content: dbNote.content,
    timestamp: dbNote.created_at,
    category: categoryMap[dbNote.category] || 'Generale',
  };
}

export function dbTaskNoteToNote(dbNote: import('./types/supabase').TaskNote): Note {
  const categoryMap: Record<string, Note['category']> = {
    progress: 'Aggiornamento',
    blocker: 'Blocco',
    decision: 'Decisione',
    handoff: 'Passaggio',
    client_feedback: 'Feedback',
  };

  return {
    id: dbNote.id,
    author: dbNote.author_name,
    content: dbNote.content,
    timestamp: dbNote.created_at,
    category: categoryMap[dbNote.note_type] || 'Aggiornamento',
  };
}

export function dbPackageToTemplate(
  dbPackage: import('./types/supabase').Package,
  dbTasks: import('./types/supabase').PackageTask[]
): PackageTemplate {
  const complexityMap: Record<string, PackageTask['complexity']> = {
    simple: 'simple',
    medium: 'medium',
    complex: 'complex',
    very_complex: 'veryComplex',
  };

  return {
    id: dbPackage.id,
    name: dbPackage.name,
    description: dbPackage.description || '',
    price: dbPackage.price_min,
    priceMax: dbPackage.price_max || undefined,
    defaultDeadlineDays: dbPackage.default_duration_days,
    isAddon: dbPackage.is_addon,
    tasks: dbTasks.map((t) => ({
      title: t.title,
      description: t.description || '',
      baseHours: t.estimated_hours,
      complexity: complexityMap[t.complexity] || 'medium',
      type: t.task_type as PackageTask['type'],
    })),
  };
}

export function dbActivityToActivity(dbActivity: import('./types/supabase').ActivityLog): Activity {
  return {
    id: dbActivity.id,
    user: dbActivity.user_name,
    action: dbActivity.description || dbActivity.action,
    time: dbActivity.created_at,
    entityType: dbActivity.entity_type,
    entityId: dbActivity.entity_id,
  };
}

export function dbUserProfileToTeamMember(profile: import('./types/supabase').UserProfile): TeamMember {
  const roleMap: Record<string, string> = {
    designer: 'Designer',
    content_creator: 'Content Creator',
    manager: 'Manager',
    admin: 'Admin',
  };

  return {
    id: profile.id,
    name: profile.full_name || 'Unknown',
    role: roleMap[profile.role] || profile.role,
    avatar: profile.avatar_url || `https://picsum.photos/seed/${profile.id}/100`,
    status: profile.online ? 'online' : 'offline',
  };
}
