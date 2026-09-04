import { Deployment } from "../types";

export const mockDeployments: Deployment[] = [
  {
    id: "dep-482",
    version: "v4.8.2",
    service: "Payment Service",
    environment: "Production",
    deployedAt: "14:17 UTC",
    risk: "HIGH",
    previousHealth: 98,
    currentHealth: 71,
    status: "Investigating"
  },
  {
    id: "dep-321",
    version: "v3.2.1",
    service: "Order Service",
    environment: "Production",
    deployedAt: "10:05 UTC",
    risk: "LOW",
    previousHealth: 98,
    currentHealth: 98,
    status: "Stable"
  },
  {
    id: "dep-294",
    version: "v2.9.4",
    service: "Inventory Service",
    environment: "Production",
    deployedAt: "Yesterday 18:30 UTC",
    risk: "MEDIUM",
    previousHealth: 95,
    currentHealth: 87,
    status: "Stable"
  },
  {
    id: "dep-481",
    version: "v4.8.1",
    service: "Payment Service",
    environment: "Production",
    deployedAt: "2 days ago",
    risk: "MEDIUM",
    previousHealth: 99,
    currentHealth: 98,
    status: "Rolled Back"
  }
];
