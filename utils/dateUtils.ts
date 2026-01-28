
import { addDays, differenceInCalendarDays, isWeekend, format, startOfDay } from 'date-fns';
import { PackageTask, Task, TaskStatus, TaskPriority } from '../types';

const taskComplexityHours = {
  simple: 2,
  medium: 5,
  complex: 8,
  veryComplex: 12
};

export function calculateTaskHours(task: PackageTask | Partial<Task>): number {
  const complexity = (task as PackageTask).complexity || 'medium';
  let hours = taskComplexityHours[complexity] || 5;
  
  const type = (task as PackageTask).type || 'design';
  if (type === 'research') hours *= 0.8;
  if (type === 'development') hours *= 1.2;
  if (type === 'strategy') hours *= 1.0;
  if (type === 'delivery') hours *= 0.7;
  
  if ((task as PackageTask).dependencies?.length) {
    hours *= 1.1;
  }
  
  return Math.round(hours * 10) / 10;
}

export function calculateWorkdays(start: Date, end: Date): number {
  let count = 0;
  let current = startOfDay(start);
  const finish = startOfDay(end);
  
  while (current <= finish) {
    if (!isWeekend(current)) {
      count++;
    }
    current = addDays(current, 1);
  }
  return count || 1; // Minimum 1 workday
}

export function distributeTasksAcrossDays(
  packageTasks: PackageTask[],
  startDate: string,
  deadlineDate: string,
  clientId: string
): Task[] {
  const start = new Date(startDate);
  const end = new Date(deadlineDate);
  const workdays = calculateWorkdays(start, end);
  
  const tasksPerDay = Math.floor(packageTasks.length / workdays);
  const remainderTasks = packageTasks.length % workdays;
  
  const tasks: Task[] = [];
  let taskIndex = 0;
  let currentWorkday = 0;
  let datePointer = start;

  while (taskIndex < packageTasks.length) {
    if (!isWeekend(datePointer)) {
      const dailyCount = tasksPerDay + (currentWorkday < remainderTasks ? 1 : 0);
      
      for (let j = 0; j < dailyCount && taskIndex < packageTasks.length; j++) {
        const pTask = packageTasks[taskIndex];
        // Fix: Added subtasks property to match Task interface requirements
        tasks.push({
          id: `t-${clientId}-${taskIndex}`,
          title: pTask.title,
          description: pTask.description,
          status: TaskStatus.NOT_STARTED,
          priority: pTask.complexity === 'veryComplex' ? TaskPriority.HIGH : 
                    pTask.complexity === 'complex' ? TaskPriority.HIGH :
                    pTask.complexity === 'medium' ? TaskPriority.MEDIUM : TaskPriority.LOW,
          assignedTo: [],
          scheduledDate: format(datePointer, 'yyyy-MM-dd'),
          estimatedHours: calculateTaskHours(pTask),
          actualHours: 0,
          clientId,
          notes: [],
          subtasks: []
        });
        taskIndex++;
      }
      currentWorkday++;
    }
    datePointer = addDays(datePointer, 1);
    if (datePointer > addDays(end, 30)) break; // Safety exit
  }
  
  return tasks;
}
