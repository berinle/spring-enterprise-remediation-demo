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

## Remediation (branch: `patched-enterprise`)

A companion git worktree rebuilds this exact application against the **Broadcom
Spring Enterprise** repository. Every CVE closes with the **security fix entirely in
`pom.xml`** — dependency bumps only, no application logic. (That branch also re-skins
the dashboard to a remediated state, but those changes don't affect the fix.) The
headline Spring CVEs are fixed by moving to the **Spring Boot 2.7.33** patch line,
which is past open-source end-of-life and resolves only from
`packages.broadcom.com/artifactory/tanzu-maven`.

A one-page, self-contained explainer lives on that branch at
[`remediation-report.html`](remediation-report.html) — open it in any browser.

### CVE → patched version (actually-resolved artifacts)

| CVE | Component | Severity | Was | Installed | Fixed in |
|-----|-----------|----------|-----|-----------|----------|
| CVE-2022-22965 (Spring4Shell) | spring-beans / spring-webmvc | Critical | 5.3.15 | 5.3.48 | 5.3.18 |
| CVE-2021-44228 (Log4Shell) | log4j-core | Critical | 2.14.1 | 2.17.1 | 2.17.1 |
| CVE-2022-22963 | spring-cloud-function | Critical | 3.2.2 | 3.2.12 | 3.2.3 |
| CVE-2022-42889 (Text4Shell) | commons-text | Critical | 1.9 | 1.10.0 | 1.10.0 |
| CVE-2022-1471 | snakeyaml | High | 1.29 | 2.0 | 2.0 |
| CVE-2015-6420 | commons-collections | High | 3.2.1 | 3.2.2 | 3.2.2 |
| CVE-2021-42392 | h2database | High | 1.4.199 | 2.1.214 | 2.0.206 |
| CVE-2022-22978 | spring-security-web | High | 5.6.1 | 5.7.23 | 5.6.4 |
| CVE-2020-36518 | jackson-databind | High | 2.13.1 | 2.13.5 | 2.13.2.1 |
| CVE-2022-22950 | spring-expression | Medium | 5.3.15 | 5.3.48 | 5.3.17 |
| CVE-2023-20873 | spring-boot-actuator | Medium | 2.6.3 | 2.7.33 | 2.7.11 |
| CVE-2022-45688 | org.json (transitive) | Medium | 20090211 | not present | 20230227 |

```bash
# the entire remediation, in one diff:
git diff main patched-enterprise -- pom.xml
```

### Enterprise repository setup (summary)

1. Configure `~/.m2/settings.xml` with the `tanzu-maven` server + repository; the
   token is read from `TANZU_TOKEN` (never committed).
2. Export `TANZU_USER` / `TANZU_TOKEN`, then verify entitlement (expect `200`):
   ```bash
   curl -u "$TANZU_USER:$TANZU_TOKEN" -o /dev/null -w "%{http_code}\n" \
     https://packages.broadcom.com/artifactory/tanzu-maven/
   ```
3. Build the patched branch — a successful resolve of Boot 2.7.33 is itself proof
   the entitlement is in effect.
