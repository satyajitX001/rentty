export const queryKeys = {
  health: ["health"] as const,
  dashboard: {
    summary: ["dashboard", "summary"] as const
  },
  properties: {
    list: ["properties"] as const
  },
  tenants: {
    list: ["tenants"] as const
  },
  collections: {
    payments: ["collections", "payments"] as const
  },
  maintenance: {
    requests: ["maintenance", "requests"] as const
  },
  expenses: {
    list: ["expenses"] as const
  },
  documents: {
    list: ["documents"] as const
  },
  notifications: {
    list: ["notifications"] as const
  },
  support: {
    tickets: ["support", "tickets"] as const
  }
};
