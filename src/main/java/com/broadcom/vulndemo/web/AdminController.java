package com.broadcom.vulndemo.web;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * "Protected" admin area used to demonstrate the Spring Security authorization
 * bypass (CVE-2022-22978).
 */
@RestController
@RequestMapping("/admin")
public class AdminController {

    @GetMapping("/secret")
    public Map<String, String> secret() {
        return Map.of(
                "secret", "flag{tanzu-remediation-demo}",
                "note", "This should require authentication — reachable via CVE-2022-22978 bypass.");
    }
}
