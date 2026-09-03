import http from './http';

export interface DashboardSummary {
  clients: {
    total: number;
    active: number;
    potential: number;
    inactive: number;
    byStatus: Record<string, number>;
  };
  matters: {
    total: number;
    pending: number;
    inProgress: number;
    waitingClient: number;
    completed: number;
    byStatus: Record<string, number>;
    upcomingDeadlines: any[];
  };
  tasks: {
    total: number;
    todo: number;
    inProgress: number;
    done: number;
    byStatus: Record<string, number>;
    upcomingTasks: any[];
    overdueTasks: any[];
  };
  timeEntries: {
    totalEntries: number;
    totalDuration: number;
    totalBillable: number;
  };
  invoices: {
    totalInvoices: number;
    totalAmount: number;
    totalPaid: number;
    totalUnpaid: number;
    statusBreakdown: Record<string, { count: number; amount: number }>;
  };
  documents: {
    totalDocuments: number;
    totalSize: number;
  };
  recentMatters: any[];
}

export const dashboardService = {
  getSummary: () => http.get<DashboardSummary>('/dashboard/summary'),
};
