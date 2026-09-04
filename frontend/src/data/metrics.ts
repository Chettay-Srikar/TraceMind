import { Metric } from "../types";

export const mockMetrics: Metric[] = [
  {
    name: "Error Rate",
    value: "3.8%",
    trend: "up",
    trendValue: "18.4%",
    status: "critical",
    history: [1.2, 1.4, 1.3, 1.5, 2.1, 2.8, 3.5, 3.8],
  },
  {
    name: "P95 Latency",
    value: "842 ms",
    trend: "up",
    trendValue: "21.7%",
    status: "warning",
    history: [400, 420, 450, 410, 500, 650, 780, 842],
  },
  {
    name: "Requests/sec",
    value: "18,421",
    trend: "up",
    trendValue: "8.2%",
    status: "healthy",
    history: [15000, 16000, 15500, 16500, 17000, 17800, 18100, 18421],
  },
  {
    name: "CPU Utilization",
    value: "73.8%",
    trend: "flat",
    trendValue: "1.2%",
    status: "healthy",
    history: [65, 68, 70, 72, 71, 74, 73, 73.8],
  },
  {
    name: "Memory",
    value: "68.2%",
    trend: "up",
    trendValue: "4.5%",
    status: "healthy",
    history: [60, 61, 62, 63, 64, 65, 67, 68.2],
  },
  {
    name: "Database Health",
    value: "91.2%",
    trend: "down",
    trendValue: "4.1%",
    status: "warning",
    history: [99, 99, 98, 97, 95, 94, 92, 91.2],
  },
];
