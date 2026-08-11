package com.broadcom.vulndemo.web;

import jakarta.servlet.RequestDispatcher;
import jakarta.servlet.http.HttpServletRequest;
// NOTE: Boot 4 relocated this interface. It was
// org.springframework.boot.web.servlet.error.ErrorController through Boot 3.x.
import org.springframework.boot.webmvc.error.ErrorController;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Replaces Boot's default error JSON with a demo-friendly payload.
 *
 * Several of the replayed attacks are refused deep inside a library rather than
 * in our own controllers — most notably the Spring Cloud Function SpEL router,
 * whose rejection surfaces as a raw 500 that no @RestControllerAdvice can catch
 * (it is not dispatched through a @Controller). Boot still forwards those to
 * /error, so overriding this one endpoint turns "unexplained 500" into a clear
 * "the attack was refused, and here is what refused it".
 */
@RestController
public class DemoErrorController implements ErrorController {

    @RequestMapping("/error")
    public ResponseEntity<Map<String, Object>> handleError(HttpServletRequest request) {
        Object statusAttr = request.getAttribute(RequestDispatcher.ERROR_STATUS_CODE);
        int status = statusAttr instanceof Integer i ? i : 500;

        Throwable ex = (Throwable) request.getAttribute(RequestDispatcher.ERROR_EXCEPTION);
        Throwable root = rootCause(ex);
        String path = String.valueOf(request.getAttribute(RequestDispatcher.ERROR_REQUEST_URI));

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("refused", true);
        body.put("path", path);
        body.put("status", status);
        if (root != null) {
            body.put("reason", root.getClass().getSimpleName() + ": " + firstLine(root.getMessage()));
        }
        body.put("note", "The request was rejected by the patched dependency stack "
                + "(Spring Boot 4.1.0 / Spring 7.0.8). On the vulnerable build this same "
                + "payload succeeded — the failure you are seeing is the fix working.");
        return ResponseEntity.status(HttpStatus.valueOf(status)).body(body);
    }

    private static Throwable rootCause(Throwable t) {
        if (t == null) return null;
        Throwable cur = t;
        while (cur.getCause() != null && cur.getCause() != cur) {
            cur = cur.getCause();
        }
        return cur;
    }

    private static String firstLine(String s) {
        if (s == null) return "";
        int nl = s.indexOf('\n');
        String line = nl < 0 ? s : s.substring(0, nl);
        return line.length() > 240 ? line.substring(0, 240) + "…" : line;
    }
}
