# IOMETE ProofPlan

> Turn a buyer's current data workload into an evidence-backed plan for evaluating IOMETE.

## Recommendation

Build a tool that answers: **What do we need to prove before we can confidently move this workload to IOMETE?**

The first version serves an IOMETE sales engineer preparing a proof of concept with a buyer migrating Oracle analytical reporting. It converts buyer requirements and a report inventory into an editable evaluation plan with tests, acceptance criteria, owners, sources, and explicit unknowns.

This recommendation follows a review of IOMETE's product positioning, architecture, deployment requirements, pricing, banking use cases, migration experience, and release notes. The problem is supported by published experience; its frequency and commercial impact still need validation with IOMETE's sales team.

## Hackathon context

The hackCBS IOMETE track asks teams to **Make Complex Tech Easy to Buy** by removing one difficulty in understanding, evaluating, or buying IOMETE. Solutions may help sales representatives or buyers and do not require running IOMETE or integrating its API.

| Judging criterion | Weight |
| --- | ---: |
| Practical impact | 35% |
| Buyer clarity | 25% |
| Accuracy | 25% |
| Working execution | 15% |

The brief favors one friction solved well, supported claims, visible assumptions, and honest handling of unknowns.

Source: [IOMETE Track Starter Kit](https://drive.google.com/file/d/1IZMaWkmiC0Z28S8e_sNyoaAm58-64KAH/view).

## Product context

IOMETE is a sovereign, self-hosted data lakehouse built around Apache Spark, Apache Iceberg, and Kubernetes. It runs in customer-controlled infrastructure, with on-premises, cloud, hybrid, and air-gapped deployment options described in its materials.

Sources: [IOMETE](https://iomete.com/), [Deployment options](https://iomete.com/product/deployment), [Technical architecture](https://iomete.com/resources/blog/iomete-core-components-technical-architecture).

## The actual problem

Understanding what a lakehouse does is only the beginning. A buyer also needs to establish whether it will work with their infrastructure, satisfy their workload requirements, and justify the effort of changing platforms.

IOMETE's Oracle migration report describes approximately 50 reports running roughly 20 times faster in aggregate, while 17 individual reports were slower. Some workloads needed changes to file layout and table structure. An overall benchmark therefore did not settle the customer's concerns.

Its banking assessment article also describes unreliable change capture, accumulated tables, and missing lineage. These issues require workload-specific evaluation.

**Inference:** A valuable buying friction is the gap between a promising product and an agreed, testable reason to proceed. ProofPlan addresses the preparation of that evaluation.

Sources: [Oracle-to-Spark migration](https://iomete.com/resources/blog/oracle-to-spark-migration), [Banking assessment findings](https://iomete.com/resources/blog/data-lakehouse-for-banks).

## Target user and scope

- **Primary user:** An IOMETE sales engineer preparing a proof of concept.
- **Collaborator:** A buyer's data platform lead responsible for Oracle analytical reporting.
- **Trigger:** A buyer expresses interest but has unresolved workload and deployment questions.
- **Outcome:** An agreed evaluation brief specifying what to test, how success will be measured, who owns each task, and what is still unknown.

The MVP focuses on Oracle analytical reporting to keep its rules, examples, and tests specific enough to be useful.

## End-to-end workflow

1. **Describe the workload.** Capture the existing database, reporting goals, infrastructure, freshness needs, and operational constraints in a short guided form.
2. **Import a report inventory.** Accept a CSV with report name, current runtime, required runtime, business importance, and dependence on selective lookups.
3. **Identify evaluation gaps.** Surface missing prerequisites, requirements needing confirmation, and workloads needing particular attention.
4. **Generate an editable evaluation plan.** Assign a proposed test, acceptance criterion, owner, and supporting source to each requirement.
5. **Export a shared brief.** Produce a document the buyer and sales engineer can review and use to organize the proof of concept.

## Example output

| Buyer requirement or input | Output |
| --- | --- |
| A critical report must finish within two seconds. | A benchmark test with the buyer-defined threshold; performance remains unverified until measured. |
| No Kubernetes cluster is available. | A deployment prerequisite gap and a task for the infrastructure owner. |
| Data must be refreshed every five minutes. | A proposed ingestion and freshness test, with connector details marked for confirmation. |
| Existing report results must be preserved. | A reconciliation test against the current system. |
| Concurrency requirements are missing. | An unanswered question that prevents the plan from being marked ready for evaluation. |

Kubernetes, object storage, and PostgreSQL are documented deployment dependencies. Minimum installation resources must not be treated as production workload sizing.

Source: [On-premises deployment requirements](https://iomete.com/resources/deployment/on-prem/install).

## Evidence and accuracy model

Every finding carries one of four labels:

- **Documented:** Supported by a specific IOMETE source.
- **Buyer-provided:** Supplied by the user.
- **Proposed test:** A recommendation that still needs validation.
- **Unknown:** Requires measurement or confirmation.

Each documented finding should retain its source URL, relevant passage, retrieval date, and applicable version or plan where known. Conflicting or incomplete evidence should produce a review item.

Deployment support does not establish that a particular workload will meet its latency target. Results from published customer examples do not predict another customer's performance.

Use explicit rules for prerequisite checks, missing-input detection, and report prioritization. AI can help extract requirements and explain findings. Generated claims must remain traceable to sources or inputs, and unsupported claims must be marked unknown.

## MVP deliverables

- A guided workload intake form.
- CSV import with validation and an example inventory.
- A small curated collection of official IOMETE sources.
- Rules that identify prerequisite gaps and prioritize critical reports.
- An editable test matrix with acceptance criteria and owners.
- An exportable evaluation brief with sources and unknowns.
- A fictional bank scenario for a complete demonstration.

The MVP generates an evaluation plan. Actual workload execution and measured performance require a separate proof of concept in an appropriate environment.

## Demo scenario

Use a fictional bank with ten reports. Nine meet their targets; one business-critical report misses its target. Any example benchmark results must be visibly labeled **simulated**.

Demonstrate that ProofPlan:

1. Flags the critical report despite favorable aggregate performance.
2. Adds a specific test and acceptance criterion.
3. Identifies an unanswered infrastructure question.
4. Produces a sourced evaluation brief with assigned next steps.
5. Updates the plan's readiness when the missing evidence is supplied.

The demonstration should distinguish readiness to begin evaluation from evidence supporting a purchase decision.

## Validation

Compare a manual preparation workflow with the prototype using the same sample buyer information. Measure:

- Time needed to prepare an actionable evaluation brief.
- Number of critical requirements missed.
- Coverage of factual claims by valid sources.
- Correct identification of missing information.
- Whether an independent reviewer can execute the proposed plan without asking what the tests mean.

Ask an IOMETE sales engineer whether the inputs, tests, and handoff match a real qualification workflow. Report measured results only after running the comparison.

## Alternatives considered

These comparisons are product judgments, not measured market rankings.

| Idea | Strength | Main limitation |
| --- | --- | --- |
| Role-based product explainer | Easy to understand and demonstrate | Harder to demonstrate meaningful workflow improvement |
| ROI calculator | Helps justify spending | Credible results need infrastructure, staffing, migration, and licensing inputs |
| Security questionnaire helper | Clear, repetitive workflow | Important evidence may be unavailable publicly |
| ProofPlan | Converts buyer-specific requirements into a concrete next step | Needs disciplined scope and careful handling of unknowns |

IOMETE's public pricing includes annual minimum commitments, while onboarding is scoped separately. Any future cost model must use current official terms and account for infrastructure and operating costs.

Source: [Official pricing](https://iomete.com/pricing).

## Pitch

**ProofPlan helps IOMETE sales engineers and buyers turn migration uncertainty into an agreed set of tests, so they know what evidence is needed to make a purchase decision.**

It targets one focused buying problem, completes a reviewable workflow, and makes practical impact and accuracy visible in the demo.

## Research references

- [Track starter kit](https://drive.google.com/file/d/1IZMaWkmiC0Z28S8e_sNyoaAm58-64KAH/view)
- [IOMETE product overview](https://iomete.com/)
- [Deployment options](https://iomete.com/product/deployment)
- [Technical architecture](https://iomete.com/resources/blog/iomete-core-components-technical-architecture)
- [On-premises deployment guide](https://iomete.com/resources/deployment/on-prem/install)
- [Oracle-to-Spark migration experience](https://iomete.com/resources/blog/oracle-to-spark-migration)
- [Banking assessment findings](https://iomete.com/resources/blog/data-lakehouse-for-banks)
- [Proof at scale](https://iomete.com/resources/blog/sovereign-lakehouse-proof-at-scale)
- [Official pricing](https://iomete.com/pricing)
- [Release notes](https://iomete.com/resources/deployment/on-prem/release-notes)

Research reviewed: November 1, 2026. Product features, requirements, and pricing should be checked against the applicable version and current official materials before use in a customer evaluation.
