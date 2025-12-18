package com.poscl.auth.application.service;

import com.poscl.auth.api.dto.*;
import com.poscl.auth.domain.entity.*;
import com.poscl.auth.domain.repository.*;
import com.poscl.auth.infrastructure.security.JwtService;
import com.poscl.shared.dto.BusinessType;
import com.poscl.shared.exception.BusinessConflictException;
import com.poscl.shared.exception.DomainException;
import com.poscl.shared.exception.ResourceNotFoundException;
import com.poscl.shared.security.Roles;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

/**
 * Servicio de autenticación: registro, login, refresh token
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final TenantRepository tenantRepository;
    private final BranchRepository branchRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    /**
     * Registra una nueva empresa con su usuario administrador
     */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        log.info("Registrando nueva empresa con RUT: {}", request.getRut());

        // Validar que el RUT no exista
        if (tenantRepository.existsByRut(request.getRut())) {
            throw new BusinessConflictException("RUT_EXISTS",
                    "Ya existe una empresa registrada con el RUT " + request.getRut());
        }

        // Crear tenant
        Tenant tenant = Tenant.builder()
                .rut(request.getRut())
                .razonSocial(request.getRazonSocial())
                .nombreFantasia(request.getNombreFantasia())
                .giro(request.getGiro())
                .direccion(request.getDireccion())
                .comuna(request.getComuna())
                .region(request.getRegion())
                .businessType(request.getBusinessType() != null ? request.getBusinessType() : BusinessType.OTRO)
                .currency("CLP")
                .timezone("America/Santiago")
                .precioConIva(true)
                .activo(true)
                .plan("FREE")
                .build();

        tenant = tenantRepository.save(tenant);

        // Crear sucursal principal
        Branch mainBranch = Branch.builder()
                .tenant(tenant)
                .nombre("Sucursal Principal")
                .codigo("MAIN")
                .esPrincipal(true)
                .activa(true)
                .build();

        mainBranch = branchRepository.save(mainBranch);

        // Obtener rol OWNER_ADMIN
        Role ownerRole = roleRepository.findByNombre(Roles.OWNER_ADMIN)
                .orElseThrow(() -> new ResourceNotFoundException("Rol OWNER_ADMIN no encontrado"));

        // Crear usuario admin
        User user = User.builder()
                .tenant(tenant)
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .nombre(request.getNombre())
                .apellido(request.getApellido())
                .telefono(request.getTelefono())
                .activo(true)
                .emailVerificado(false)
                .build();

        user.addRole(ownerRole);
        user.addBranch(mainBranch);
        user = userRepository.save(user);

        log.info("Empresa {} registrada exitosamente con usuario {}", tenant.getId(), user.getEmail());

        // Generar tokens y respuesta
        return createAuthResponse(user, tenant);
    }

    /**
     * Inicia sesión y retorna tokens
     */
    @Transactional
    public AuthResponse login(LoginRequest request) {
        try {
            log.info("Intento de login para: {}", request.getEmail());

            // Buscar usuario por email (puede estar en cualquier tenant)
            User user = userRepository.findByEmailWithRolesAndBranches(request.getEmail())
                    .orElseThrow(() -> new DomainException("INVALID_CREDENTIALS",
                            "Email o contraseña incorrectos", HttpStatus.UNAUTHORIZED));

            log.debug("Usuario encontrado: {}, tenant: {}", user.getEmail(), user.getTenantId());

            // Validar contraseña
            if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
                throw new DomainException("INVALID_CREDENTIALS",
                        "Email o contraseña incorrectos", HttpStatus.UNAUTHORIZED);
            }

            log.debug("Password verificado correctamente");

            // Validar que el usuario esté activo
            if (!user.getActivo()) {
                throw new DomainException("USER_INACTIVE",
                        "El usuario está desactivado", HttpStatus.FORBIDDEN);
            }

            // Validar que el tenant esté activo
            Tenant tenant = user.getTenant();
            log.debug("Tenant obtenido: {}", tenant != null ? tenant.getId() : "NULL");

            if (!tenant.getActivo()) {
                throw new DomainException("TENANT_INACTIVE",
                        "La empresa está desactivada", HttpStatus.FORBIDDEN);
            }

            // Actualizar último login
            user.setUltimoLogin(Instant.now());
            userRepository.save(user);

            log.info("Login exitoso para usuario: {}", user.getEmail());

            return createAuthResponse(user, tenant);
        } catch (Exception e) {
            log.error("ERROR EN LOGIN: {} - {}", e.getClass().getName(), e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Refresca el access token usando un refresh token válido
     */
    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        log.debug("Refrescando token");

        RefreshToken refreshToken = refreshTokenRepository
                .findValidToken(request.getRefreshToken(), Instant.now())
                .orElseThrow(() -> new DomainException("INVALID_REFRESH_TOKEN",
                        "Refresh token inválido o expirado", HttpStatus.UNAUTHORIZED));

        User user = userRepository.findByIdWithRolesAndBranches(refreshToken.getUser().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        // Revocar el token usado
        refreshToken.revoke();
        refreshTokenRepository.save(refreshToken);

        return createAuthResponse(user, user.getTenant());
    }

    /**
     * Revoca todos los refresh tokens del usuario (logout global)
     */
    @Transactional
    public void logout(UUID userId) {
        log.info("Logout global para usuario: {}", userId);
        refreshTokenRepository.revokeAllByUserId(userId, Instant.now());
    }

    /**
     * Crea la respuesta de autenticación con tokens
     */
    private AuthResponse createAuthResponse(User user, Tenant tenant) {
        String accessToken = jwtService.generateAccessToken(user);
        String refreshTokenValue = jwtService.generateRefreshToken();

        // Guardar refresh token
        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .token(refreshTokenValue)
                .expiresAt(Instant.now().plusMillis(jwtService.getRefreshExpiration()))
                .revoked(false)
                .build();

        refreshTokenRepository.save(refreshToken);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshTokenValue)
                .tokenType("Bearer")
                .expiresIn(jwtService.getAccessTokenExpirationSeconds())
                .user(AuthResponse.UserInfo.builder()
                        .id(user.getId())
                        .email(user.getEmail())
                        .nombre(user.getNombre())
                        .apellido(user.getApellido())
                        .roles(user.getRoleNames())
                        .permissions(user.getPermissions())
                        .build())
                .tenant(AuthResponse.TenantInfo.builder()
                        .id(tenant.getId())
                        .rut(tenant.getRut())
                        .nombre(tenant.getDisplayName())
                        .businessType(tenant.getBusinessType().name())
                        .plan(tenant.getPlan())
                        .build())
                .build();
    }
}
