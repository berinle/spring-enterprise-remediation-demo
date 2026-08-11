# Tanzu Vulnerability Demo

An **intentionally vulnerable** Spring Boot application built to demonstrate
Tanzu Platform / Broadcom Spring Enterprise supply-chain scanning and
remediation. The React landing page is a live CVE dashboard: it lists every
known vulnerability shipped in this build, and each card can fire a real request
against the corresponding insecure endpoint.

> ⚠️ **Do not deploy this anywhere reachable from an untrusted network.** Every
> dependency is deliberately pinned to a vulnerable version.

---

## Stack

- **Backend:** Spring Boot 2.6.3 (Spring Framework 5.3.15), Java 17
- **Frontend:** React 18 + Vite, built straight into `src/main/resources/static`
  so `mvn package` produces one self-contained executable jar
- **Data:** the dashboard is driven by `VulnerabilityRegistry`, which mirrors the
  pinned versions in `pom.xml` — so what the page advertises is what a scanner
  (Tanzu / Grype / Carbon Black) will actually report

## Advertised CVEs

| CVE | Component | Affected → Fixed | Severity | Live demo |
|-----|-----------|------------------|----------|-----------|
| CVE-2021-44228 (Log4Shell) | log4j-core | 2.14.1 → 2.17.1 | Critical | `GET /api/log` |
| CVE-2022-22965 (Spring4Shell) | spring-beans / webmvc | 5.3.15 → 5.3.18 | Critical | `POST /api/greeting` |
| CVE-2022-22963 | spring-cloud-function-web | 3.2.2 → 3.2.3 | Critical | `POST /fn/functionRouter` |
| CVE-2022-42889 (Text4Shell) | commons-text | 1.9 → 1.10.0 | Critical | `GET /api/lookup` |
| CVE-2022-1471 | snakeyaml | 1.29 → 2.0 | High | `POST /api/yaml` |
| CVE-2021-42392 | h2database | 1.4.199 → 2.0.206 | High | H2 console |
| CVE-2022-22978 | spring-security-web | 5.6.1 → 5.6.4 | High | `GET /admin/secret` |
| CVE-2020-36518 | jackson-databind | 2.13.1 → 2.13.2.1 | High | `POST /api/json` |
| CVE-2015-6420 | commons-collections | 3.2.1 → 3.2.2 | High | — |
| CVE-2022-22950 | spring-expression | 5.3.15 → 5.3.17 | Medium | — |
| CVE-2023-20873 | spring-boot-actuator | 2.6.3 → 2.7.11 | Medium | `/actuator` |
| CVE-2022-45688 | org.json (transitive) | — | Medium | — |

## Build & run

```bash
# 1. Build the React dashboard into the Spring static resources
cd frontend
npm install
npm run build
cd ..

# 2. Package and run the self-contained jar
mvn clean package -DskipTests
java -jar target/tanzu-vuln-demo-1.0.0-VULNERABLE.jar
```

Open http://localhost:8080.

### Front-end dev loop (optional)

Run the Spring app on 8080, then in another terminal:

```bash
cd frontend
npm run dev      # Vite dev server on :5173, proxies /api and /actuator to :8080
```

## What the dashboard does

- **Animated risk summary** — CVE count and max-CVSS ring count up on load.
- **Clickable severity tiles** — filter the grid by Critical / High / Medium.
- **Search** — filter by CVE id, title, or component.
- **Live exploit console** — expand any card and click *Run* to send a real
  (safe) request to the vulnerable endpoint and see the response inline.
- **Remediation preview** — toggles the banner between the vulnerable state and
  the future "0 CVEs" patched state.

## Endpoints

| Path | Purpose |
|------|---------|
| `/` | React CVE dashboard |
| `/api/dashboard` | JSON payload backing the dashboard |
| `/api/vulnerabilities` | Raw CVE list |
| `/api/log`, `/api/lookup`, `/api/yaml`, `/api/json`, `/api/greeting` | Vulnerable demo endpoints |
| `/fn/functionRouter` | Spring Cloud Function routing (SpEL) endpoint |
| `/admin/secret` | "Protected" resource (basic auth: `admin` / `admin`) |
| `/actuator/**` | Fully-exposed actuator endpoints |
| `/h2-console` | H2 web console |

## Future phase

A companion worktree will rebuild this exact application against the **Broadcom
Spring Enterprise** repository, replacing every pinned artifact with a patched,
commercially-supported release — clearing the board without changing a line of
application code. (Out of scope for this phase.)
