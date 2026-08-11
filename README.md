# Tanzu Vulnerability Demo — Remediated Build (`patched-enterprise`)

This is the **patched** counterpart of the intentionally-vulnerable demo. It is the
same application, rebuilt against the **Broadcom Spring Enterprise** repository so
that every CVE from the vulnerable build is closed. **The security fix is entirely in
`pom.xml`** — dependency bumps only, no application logic. (The Java/React changes on
this branch only re-skin the dashboard to its remediated state and make the demo
probes report the now-refused attacks cleanly; they don't affect the fix.)

> 📄 See **[`remediation-report.html`](remediation-report.html)** for a one-page,
> self-contained explanation of the whole demo (open it in any browser).

---

## What changed

| Aspect | Vulnerable (`main`) | Patched (`patched-enterprise`) |
|---|---|---|
| Spring Boot | 2.6.3 | **2.7.33** (enterprise, past OSS EOL) |
| Spring Framework | 5.3.15 | **5.3.48** |
| Spring Security | 5.6.1 | **5.7.23** |
| Resolved from | Maven Central | **packages.broadcom.com/artifactory/tanzu-maven** |
| Active CVEs | 12 | **0** |
| Application code | — | **unchanged** |

The headline Spring CVEs are fixed simply by moving to the **Spring Boot 2.7.33**
patch line, which is **past open-source end-of-life** and is not on Maven Central —
it resolves only from the Broadcom Spring Enterprise repository. That single parent
bump carries patched Spring Framework, Spring Security, Jackson and H2. The remaining
pinned libraries are bumped to their public fixed versions.

## CVE → patched version

Versions below are the **actually resolved** artifacts (`mvn dependency:tree`).

| CVE | Component | Severity | Was | **Installed** | Fixed in |
|-----|-----------|----------|-----|---------------|----------|
| CVE-2022-22965 (Spring4Shell) | spring-beans / spring-webmvc | Critical | 5.3.15 | **5.3.48** | 5.3.18 |
| CVE-2021-44228 (Log4Shell) | log4j-core | Critical | 2.14.1 | **2.17.1** | 2.17.1 |
| CVE-2022-22963 | spring-cloud-function | Critical | 3.2.2 | **3.2.12** | 3.2.3 |
| CVE-2022-42889 (Text4Shell) | commons-text | Critical | 1.9 | **1.10.0** | 1.10.0 |
| CVE-2022-1471 | snakeyaml | High | 1.29 | **2.0** | 2.0 |
| CVE-2015-6420 | commons-collections | High | 3.2.1 | **3.2.2** | 3.2.2 |
| CVE-2021-42392 | h2database | High | 1.4.199 | **2.1.214** | 2.0.206 |
| CVE-2022-22978 | spring-security-web | High | 5.6.1 | **5.7.23** | 5.6.4 |
| CVE-2020-36518 | jackson-databind | High | 2.13.1 | **2.13.5** | 2.13.2.1 |
| CVE-2022-22950 | spring-expression | Medium | 5.3.15 | **5.3.48** | 5.3.17 |
| CVE-2023-20873 | spring-boot-actuator | Medium | 2.6.3 | **2.7.33** | 2.7.11 |
| CVE-2022-45688 | org.json (transitive) | Medium | 20090211 | **not present** | 20230227 |

## Proof, not just version numbers

The dashboard (now themed green, **0 active CVEs**) keeps the live console. Each card
replays the *same attack payload* as the vulnerable build; only the response changes:

| CVE | Vulnerable response | Patched response |
|-----|--------------------|------------------|
| Text4Shell | `${script:…}` interpolated | payload returned **verbatim**, unresolved |
| SnakeYAML | `!!java.util.Date` instantiated | `Global tag is not allowed` — **refused** |
| SpEL routing | header expression executed | `T(java.lang.Runtime)` **rejected** |
| Spring Security `/admin/secret` | newline-path bypass | still 401, bypass fixed |

## Prerequisites — enterprise repository access

This build resolves Spring Boot 2.7.33 from the Broadcom Spring Enterprise repo, so
you need entitlement configured (see the setup guide). In short:

1. `~/.m2/settings.xml` declares the `tanzu-maven` server + repository (the token is
   read from the `TANZU_TOKEN` env var, never committed).
2. Export the credentials for the build:

   ```bash
   export TANZU_USER="you@yourcompany.com"
   export TANZU_TOKEN="<registry-token>"
   ```

3. Verify entitlement (expect `200`):

   ```bash
   curl -u "$TANZU_USER:$TANZU_TOKEN" -o /dev/null -w "%{http_code}\n" \
     https://packages.broadcom.com/artifactory/tanzu-maven/
   ```

## Build & run

```bash
cd frontend && npm install && npm run build && cd ..
mvn clean package -DskipTests
java -jar target/tanzu-vuln-demo-1.0.0-PATCHED.jar     # http://localhost:8080
```

Confirm the enterprise artifacts resolved:

```bash
mvn dependency:tree | grep -E 'spring-boot:jar|spring-security-web|log4j-core|snakeyaml|h2:jar'
```

## The whole story in one command

```bash
git diff main patched-enterprise -- pom.xml
```

That diff is the entire remediation.
