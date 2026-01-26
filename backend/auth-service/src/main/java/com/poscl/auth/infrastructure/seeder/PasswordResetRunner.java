package com.poscl.auth.infrastructure.seeder;

import com.poscl.auth.domain.entity.User;
import com.poscl.auth.domain.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
@RequiredArgsConstructor
@Slf4j
public class PasswordResetRunner implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        log.info("--- STARTING EMERGENCY PASSWORD RESET ---");

        Optional<User> userOpt = userRepository.findByEmailWithRolesAndBranches("admin@eltrigal.cl");
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            String rawPassword = "demo1234";
            String newHash = passwordEncoder.encode(rawPassword);

            user.setPasswordHash(newHash);
            userRepository.save(user);

            log.info("PASSWORD RESET SUCCESS: admin@eltrigal.cl password set to '{}'", rawPassword);
            log.info("NEW HASH: {}", newHash);
        } else {
            log.error("PASSWORD RESET FAILED: User admin@eltrigal.cl not found!");
        }

        // Also fix backup user
        Optional<User> userOpt2 = userRepository.findByEmailWithRolesAndBranches("admin2@eltrigal.cl");
        if (userOpt2.isPresent()) {
            User user = userOpt2.get();
            user.setPasswordHash(passwordEncoder.encode("demo1234"));
            userRepository.save(user);
            log.info("PASSWORD RESET SUCCESS: admin2@eltrigal.cl password set to 'demo1234'");
        }

        log.info("--- EMERGENCY PASSWORD RESET COMPLETED ---");
    }
}
