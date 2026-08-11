# OSS Upgrade Path — Spring Boot 4.x with all version pins removed

This worktree answers a fair challenge to the enterprise-remediation demo:

> *"Couldn't you just move to the latest Spring Boot and delete the pinned versions?"*

**Short answer: yes — it closes every CVE, but it is a migration, not an upgrade.**
It cost a new JDK, a new Maven, a build-plugin workaround, a rewritten security
config, a Jackson namespace change, and a four-year jump in the Spring Cloud
release train. Contrast that with the enterprise path (`patched-enterprise`),
which closed the same 12 CVEs with a dependency-only `pom.xml` diff and zero code
changes.

---

## Experiment 1 — bump the parent only (pins left in place)

Starting from `main`, changing **only** the parent to Spring Boot 3.5.3:

| Result | CVEs |
|---|---|
| ✅ Fixed | **4** — Spring4Shell, SpEL DoS, Security bypass, actuator |
| ❌ Still vulnerable | **7** — log4j 2.14.1, commons-text 1.9, commons-collections 3.2.1, snakeyaml 1.29, jackson 2.13.1, h2 1.4.199, spring-cloud-function 3.2.2 |

**Why:** an explicit `<version>` in the POM overrides the Boot BOM. Maven downloaded
Boot 3.5.3's managed jackson 2.19.1 metadata and then resolved **2.13.1** anyway,
because the POM pinned it. Only the versions Boot controls transitively moved.

> This is the real-world failure mode: someone pins a version years ago, and every
> framework upgrade afterwards silently steps around it.

It also **does not compile** — `WebSecurityConfig` uses `authorizeRequests()` and
`regexMatchers()`, both removed in Spring Security 6.

## Experiment 2 — latest Boot 4.x **and** delete the pins (this branch)

Spring Boot **4.1.0**, every removable `<version>` deleted:

| CVE | Component | Was | Now | How |
|-----|-----------|-----|-----|-----|
| CVE-2022-22965 | spring-beans / webmvc | 5.3.15 | **7.0.8** | Boot BOM |
| CVE-2022-22950 | spring-expression | 5.3.15 | **7.0.8** | Boot BOM |
| CVE-2022-22978 | spring-security-web | 5.6.1 | **7.1.0** | Boot BOM |
| CVE-2023-20873 | spring-boot-actuator | 2.6.3 | **4.1.0** | Boot BOM |
| CVE-2021-44228 | log4j-core | 2.14.1 | **2.25.4** | pin removed → Boot BOM |
| CVE-2022-1471 | snakeyaml | 1.29 | **2.6** | pin removed → Boot BOM |
| CVE-2021-42392 | h2database | 1.4.199 | **2.4.240** | pin removed → Boot BOM |
| CVE-2020-36518 | jackson-databind | 2.13.1 | **3.1.4** | pin removed → Boot BOM ⚠️ *namespace change* |
| CVE-2022-22963 | spring-cloud-function | 3.2.2 | **5.0.3** | release train 2021.0.1 → 2025.1.2 |
| CVE-2022-42889 | commons-text | 1.9 | **1.15.0** | ⚠️ **manual** — not in the Boot BOM |
| CVE-2015-6420 | commons-collections | 3.2.1 | **removed** | ⚠️ deleted, not upgraded (unused) |
| CVE-2022-45688 | org.json | — | **absent** | never on the classpath |

**Result: 12 / 12 closed.**

### But note *how* they closed

- **10** were fixed by a version moving.
- **1** (`commons-text`) could **not** have its pin removed — Spring Boot does not
  manage it, so deleting the version breaks the build. It still requires manual
  version management forever. Same for anything else outside the BOM.
- **1** (`commons-collections`) was fixed by **deleting the dependency**, which was
  only safe because nothing used it. That is the correct fix for dead weight — but
  it is not something an upgrade does for you.

## What the upgrade actually cost

Everything below was required to get a green build. None of it was needed on the
enterprise path.

| # | Cost | Detail |
|---|------|--------|
| 1 | **JDK** | Built with Java 21 (`sdk use java 21.0.8-librca`) |
| 2 | **Maven** | 3.8.5 → **3.9.9**; Boot 4's plugin set requires it |
| 3 | **Build workaround** | Boot 4.1.0 pins maven-compiler-plugin 3.15.0, which crashes here (`Cannot load from object array because "this.hashes" is null`). Pinned 3.13.0 + `<fork>true</fork>` |
| 4 | **Spring Security 7** | `WebSecurityConfig` fully rewritten — `authorizeRequests()` → `authorizeHttpRequests()`, `regexMatchers()` → `RegexRequestMatcher.regexMatcher()`, `csrf()`/`headers()` → lambda customizers |
| 5 | **Jackson 2 → 3** | `com.fasterxml.jackson.core` → **`tools.jackson.core`**. This app never imported Jackson directly; one that did would need every import changed |
| 5b | **Boot package moves** | `ErrorController` relocated: `org.springframework.boot.web.servlet.error` → **`org.springframework.boot.webmvc.error`**. Found the hard way, at compile time |
| 6 | **Spring Cloud** | Release train 2021.0.1 → **2025.1.2**, spring-cloud-function 3.2.2 → **5.0.3** (two major versions) |
| 7 | **Jakarta EE** | `javax.*` → `jakarta.*` — free here only because this app has no servlet-API imports; most real apps are not so lucky |

## Build & run

```bash
export JAVA_HOME=~/.sdkman/candidates/java/21.0.8-librca
cd frontend && npm install && npm run build && cd ..
~/.sdkman/candidates/maven/3.9.9/bin/mvn clean package -DskipTests
java -jar target/tanzu-vuln-demo-1.0.0-OSS-LATEST.jar --server.port=8082
```

Then open <http://localhost:8082>.

### Demoing from this branch

The dashboard renders the remediated state (green, **0 active CVEs**) with each
card showing the version Boot 4.1.0 actually resolved, plus an amber
**"What this upgrade cost"** panel listing everything the migration required —
so the screen tells the whole story without narration.

Every replayed attack returns an explanatory refusal rather than a raw 500:

| Replay | Response |
|---|---|
| SnakeYAML | `ComposerException: Global tag is not allowed: tag:yaml.org,2002:java.util.Date` — *snakeyaml 2.6 refused arbitrary-type construction* |
| Spring Cloud Function SpEL | `SpelEvaluationException: EL1005E: Type cannot be found 'java.lang.Runtime'` — the sandbox blocking the RCE primitive itself |
| Text4Shell | payload returned verbatim, `interpolated == input` |
| Log4Shell | logged inertly by log4j 2.25.4, message lookups disabled |

Refusals raised deep inside a library (the SpEL router) can't be caught by a
`@RestControllerAdvice`, so `DemoErrorController` overrides `/error` to turn any
such failure into a clear "the attack was refused, and here is what refused it".

## Takeaway

Both paths reach zero CVEs. The difference is what it costs and when you can ship it:

| | OSS latest (this branch) | Broadcom Spring Enterprise (`patched-enterprise`) |
|---|---|---|
| CVEs closed | 12 / 12 | 12 / 12 |
| App code changes | **Security config rewrite** (+ Jackson/Jakarta risk) | **None** |
| Toolchain changes | New JDK, new Maven, plugin workaround | None |
| Major versions crossed | Boot 2→4, Spring 5→7, Security 5→7, Jackson 2→3, Cloud 2021→2025 | None (stays on 2.7.x) |
| Libraries outside the BOM | Still manual | Still manual |
| Realistic effort | Migration project | Dependency bump |
