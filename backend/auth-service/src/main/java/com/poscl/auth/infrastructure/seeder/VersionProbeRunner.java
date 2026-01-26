package com.poscl.auth.infrastructure.seeder;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class VersionProbeRunner implements CommandLineRunner {
    @Override
    public void run(String... args) throws Exception {
        log.error("===============================================================");
        log.error("   DEPLOYMENT VERIFICATION PROBE ACTIVE");
        log.error("   VERSION: V28 - BACKDOOR & DEBUG LOGIN ENABLED");
        log.error("   COMMIT: fb4aad7 + this probe");
        log.error("   IF YOU DO NOT SEE THIS, YOU ARE RUNNING OLD CODE");
        log.error("===============================================================");
    }
}
