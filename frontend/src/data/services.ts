import { ServiceNode } from "../types";

export const mockServices: ServiceNode[] = [
  {
    id: "svc-payment",
    name: "Payment Service",
    status: "critical",
    errorRate: 41.8,
    latency: 4700,
    dependencies: ["svc-database", "svc-fraud"],
    availability: "71%",
    lastDeployment: "v4.8.2"
  },
  {
    id: "svc-order",
    name: "Order Service",
    status: "warning",
    errorRate: 2.1,
    latency: 350,
    dependencies: ["svc-payment", "svc-inventory"],
    availability: "98.5%",
    lastDeployment: "v3.2.1"
  },
  {
    id: "svc-user",
    name: "User Service",
    status: "healthy",
    errorRate: 0.1,
    latency: 45,
    dependencies: ["svc-auth"],
    availability: "99.9%",
    lastDeployment: "v5.0.0"
  },
  {
    id: "svc-inventory",
    name: "Inventory Service",
    status: "warning",
    errorRate: 12.6,
    latency: 1200,
    dependencies: ["svc-database"],
    availability: "87.4%",
    lastDeployment: "v2.9.4"
  },
  {
    id: "svc-database",
    name: "Primary Database",
    status: "critical",
    errorRate: 18.2,
    latency: 2400,
    availability: "81%",
    lastDeployment: "v1.1.0"
  },
  {
    id: "svc-auth",
    name: "Auth Service",
    status: "healthy",
    errorRate: 0.0,
    latency: 32,
    dependencies: [],
    availability: "100%",
    lastDeployment: "v4.1.2"
  }
];
