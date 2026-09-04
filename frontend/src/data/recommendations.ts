import { RankedRecommendation } from "../types";

export const mockRecommendations: RankedRecommendation[] = [
  {
    id: "rec-1",
    rank: 1,
    title: "Rollback payment-service v2.4 → v2.3",
    description: "Revert the container image of payment-service back to stable release v2.3. Immediately terminates leaking worker threads and restores verified connection pool lifecycle.",
    category: "Immediate Remediation",
    effectiveness: "High",
    risk: "Low",
    reversible: true,
    blastRadius: "Isolated",
    estimatedRecovery: "1 - 2 minutes",
    whyThisRank: "Ranked #1 because telemetry confirms failures began exactly 60 seconds after v2.4 was deployed. A rollback has the lowest blast radius, immediate reversibility, and guarantees restoration of the previous 100% healthy state without code modifications during an active P0 incident.",
    evidenceBasis: [
      "Deployment of payment-service v2.4 completed at 10:20:00",
      "Database connection pool exhaustion errors began at 10:21:03",
      "Active database connections reached maximum capacity (100/100) at 10:22:00",
      "Rollback is 100% reversible with zero data schema migration conflicts"
    ],
    tradeoffs: "Brief rolling restart of payment pods (~30s). New features in v2.4 will be temporarily held until the connection leak is patched in staging.",
    externalSources: [
      {
        source: "Google SRE Book - Chapter 17",
        sourceType: "SRE Playbook",
        title: "Mitigating Incidents: Rollback First, Diagnose Later",
        snippet: "When an incident closely follows a deployment, roll back immediately before conducting deep debugging. Preserving MTTR takes precedence over immediate root-cause extraction in production.",
        relevance: "Direct Match"
      },
      {
        source: "Kubernetes Operational Guidelines",
        sourceType: "Official Docs",
        title: "Zero-Downtime Rollback of Stateful Deployments",
        snippet: "Use standard rolling rollback to replace faulty pod replicas without dropping in-flight traffic.",
        relevance: "High"
      }
    ]
  },
  {
    id: "rec-2",
    rank: 2,
    title: "Investigate database connection pool usage & leaks",
    description: "Inspect HikariCP / JDBC connection acquisition routines in v2.4. Identify unclosed connection handles, missing try-with-resources blocks, or asynchronous queries holding connections open.",
    category: "Investigation & Root Fix",
    effectiveness: "High",
    risk: "Medium",
    reversible: true,
    blastRadius: "Service",
    estimatedRecovery: "30 - 45 minutes",
    whyThisRank: "Ranked #2 because it directly addresses the underlying software defect causing the operational failure. While rollback recovers user traffic immediately, this step is essential before v2.4 can be safely redeployed.",
    evidenceBasis: [
      "Logs show 'Database connection pool exhausted' across 11 worker instances",
      "DB connections climbed monotonically from 35 to 100 without releasing",
      "HikariCP thread dump indicates blocked acquisition threads waiting on checkout timeout"
    ],
    tradeoffs: "Requires code inspection, thread dump extraction, and staging validation before redeployment.",
    externalSources: [
      {
        source: "PostgreSQL Documentation (v15)",
        sourceType: "Official Docs",
        title: "Handling Idle In Transaction Sessions & Pool Saturation",
        snippet: "Ensure all application clients configure explicit checkout timeouts and idle transaction reap timers to prevent pool starvation.",
        relevance: "Direct Match"
      },
      {
        source: "HikariCP Best Practices Guide",
        sourceType: "Engineering Post",
        title: "Connection Leak Detection and Maximum Pool Sizing",
        snippet: "Enable leakDetectionThreshold=5000ms to automatically log stack traces of unclosed connection requests.",
        relevance: "Direct Match"
      }
    ]
  },
  {
    id: "rec-3",
    rank: 3,
    title: "Increase database connection pool capacity (100 → 250)",
    description: "Temporarily scale the max-connections limit in PostgreSQL RDS parameter group and the application connection pool ceiling.",
    category: "Capacity Mitigation",
    effectiveness: "Medium",
    risk: "Medium",
    reversible: true,
    blastRadius: "Platform",
    estimatedRecovery: "3 - 5 minutes",
    whyThisRank: "Ranked #3 because increasing the connection ceiling only provides temporary relief. If v2.4 suffers from a true connection leak, increasing the pool to 250 will simply delay the next failure while placing dangerous memory and CPU pressure on the database cluster.",
    evidenceBasis: [
      "Connections capped at 100/100 limit",
      "Database host CPU is at 71%, with moderate memory headroom remaining",
      "Risk of cascading DB server crash if connection limit is raised without resolving leak"
    ],
    tradeoffs: "May temporarily absorb traffic, but hides the underlying leak and increases DB server memory footprint.",
    externalSources: [
      {
        source: "AWS RDS PostgreSQL Best Practices",
        sourceType: "Cloud Provider",
        title: "Managing PostgreSQL Connections with RDS Proxy",
        snippet: "Arbitrarily increasing max_connections can degrade query throughput due to OS context switching overhead. Prefer connection pooling over oversized limits.",
        relevance: "High"
      }
    ]
  },
  {
    id: "rec-4",
    rank: 4,
    title: "Deploy Envoy Circuit Breaker & Pool Saturation Alerts",
    description: "Configure an ingress circuit breaker on the payment-service gateway to shed excessive downstream requests and alert SREs when connection pool saturation exceeds 85%.",
    category: "Architectural Defense",
    effectiveness: "High",
    risk: "Low",
    reversible: true,
    blastRadius: "Service",
    estimatedRecovery: "10 - 15 minutes",
    whyThisRank: "Ranked #4 as a long-term architectural defense. Prevents future connection pool spikes from cascading into downstream checkout timeouts.",
    evidenceBasis: [
      "Downstream checkout service latency spiked to 4800ms due to unconstrained retries",
      "No circuit breaker was triggered when error rate crossed 40%"
    ],
    tradeoffs: "Requires gateway configuration reload.",
    externalSources: [
      {
        source: "Envoy Proxy Architecture",
        sourceType: "Official Docs",
        title: "Circuit Breaking & Outlier Detection Pattern",
        snippet: "Protect upstream dependencies by failing fast when connection pool queues exceed defined thresholds.",
        relevance: "Supplementary"
      }
    ]
  }
];
