package com.broadcom.vulndemo.web;

import com.broadcom.vulndemo.model.Vulnerability;
import com.broadcom.vulndemo.model.Vulnerability.Severity;
import com.broadcom.vulndemo.service.VulnerabilityRegistry;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * JSON API backing the React dashboard. The static React bundle is served from
 * classpath:/static by Spring Boot; all dashboard data comes from here.
 */
@RestController
@RequestMapping("/api")
public class DashboardController {

    private final VulnerabilityRegistry registry;

    public DashboardController(VulnerabilityRegistry registry) {
        this.registry = registry;
    }

    /** Everything the landing page needs in a single round trip. */
    @GetMapping("/dashboard")
    public Map<String, Object> dashboard() {
        Map<String, Object> counts = new LinkedHashMap<>();
        counts.put("critical", registry.countBySeverity(Severity.CRITICAL));
        counts.put("high", registry.countBySeverity(Severity.HIGH));
        counts.put("medium", registry.countBySeverity(Severity.MEDIUM));
        counts.put("low", registry.countBySeverity(Severity.LOW));

        boolean remediated = registry.isRemediated();

        Map<String, Object> build = new LinkedHashMap<>();
        build.put("appVersion", "1.0.0-PATCHED");
        build.put("springBootVersion", "2.7.33");
        build.put("springFrameworkVersion", "5.3.48");
        build.put("javaVersion", System.getProperty("java.version"));
        build.put("remediated", remediated);
        build.put("repository", "Broadcom Spring Enterprise · packages.broadcom.com/artifactory/tanzu-maven");

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("build", build);
        payload.put("total", registry.total());
        // Active (unpatched) exposure — 0 in this build. The CVSS ring reflects
        // live risk, not the historical severity of the closed CVEs.
        payload.put("maxCvss", remediated ? 0.0 : registry.maxCvss());
        payload.put("activeCount", registry.activeCount());
        payload.put("remediated", remediated);
        payload.put("counts", counts);
        payload.put("vulnerabilities", registry.getAll());
        return payload;
    }

    /** Raw CVE list. */
    @GetMapping("/vulnerabilities")
    public List<Vulnerability> vulnerabilities() {
        return registry.getAll();
    }
}
