import { LogEntry } from "../types";

export const mockLogs: LogEntry[] = [
  {
    id: "log-101",
    timestamp: "10:23:15.110",
    severity: "CRITICAL",
    service: "payment-service",
    traceId: "tr_db_8841",
    message: "HTTP 500: Database connection pool exhausted - 100/100 active connections in use",
    latency: "4820ms",
    source: "hikari-pool"
  },
  {
    id: "log-102",
    timestamp: "10:22:58.402",
    severity: "ERROR",
    service: "payment-service",
    traceId: "tr_db_8839",
    message: "Connection acquisition timeout after 30000ms: pool 'PaymentPool' exhausted",
    latency: "4800ms",
    source: "hikari-pool"
  },
  {
    id: "log-103",
    timestamp: "10:22:31.908",
    severity: "ERROR",
    service: "payment-service",
    traceId: "tr_pay_9021",
    message: "Payment transaction failed: Unable to commit lock on ledger record",
    latency: "4650ms",
    source: "payment-processor"
  },
  {
    id: "log-104",
    timestamp: "10:22:00.120",
    severity: "CRITICAL",
    service: "alertmanager",
    traceId: "tr_alt_0019",
    message: "Anomaly Alert: Error rate spiked to 42.7% (Baseline: 1.2%), DB connections 100/100",
    source: "observability-engine"
  },
  {
    id: "log-105",
    timestamp: "10:21:44.331",
    severity: "ERROR",
    service: "payment-service",
    traceId: "tr_db_8790",
    message: "Database connection timeout: Postgres backend did not respond within 5000ms",
    latency: "5000ms",
    source: "pg-driver"
  },
  {
    id: "log-106",
    timestamp: "10:21:03.210",
    severity: "WARN",
    service: "payment-service",
    traceId: "tr_db_8742",
    message: "Database connection pool saturated (92/100 active connections)",
    latency: "1250ms",
    source: "hikari-pool"
  },
  {
    id: "log-107",
    timestamp: "10:20:00.000",
    severity: "INFO",
    service: "payment-service",
    traceId: "tr_deploy_24",
    message: "Deployment completed: payment-service updated from v2.3 to v2.4 (status: success)",
    source: "deploy-pipeline"
  },
  {
    id: "log-108",
    timestamp: "10:19:15.654",
    severity: "INFO",
    service: "payment-service",
    traceId: "tr_pay_7601",
    message: "Payment transaction processed successfully (status: 200 OK)",
    latency: "182ms",
    source: "payment-processor"
  },
  {
    id: "log-109",
    timestamp: "10:18:02.190",
    severity: "INFO",
    service: "order-service",
    traceId: "tr_ord_5521",
    message: "Order #84919 fulfilled, payment status confirmed",
    latency: "145ms",
    source: "order-worker"
  }
];
