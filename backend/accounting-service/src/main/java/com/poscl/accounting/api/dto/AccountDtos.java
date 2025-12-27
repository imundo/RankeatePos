package com.poscl.accounting.api.dto;

import com.poscl.accounting.domain.entity.Account;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public class AccountDtos {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateAccountRequest {
        @NotBlank(message = "El código es requerido")
        @Size(max = 20, message = "El código no puede exceder 20 caracteres")
        private String code;

        @NotBlank(message = "El nombre es requerido")
        @Size(max = 200, message = "El nombre no puede exceder 200 caracteres")
        private String name;

        @Size(max = 500)
        private String description;

        @NotNull(message = "El tipo es requerido")
        private Account.AccountType type;

        @NotNull(message = "La naturaleza es requerida")
        private Account.AccountNature nature;

        private UUID parentId;
        private Boolean allowsMovements = true;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdateAccountRequest {
        @Size(max = 200)
        private String name;
        @Size(max = 500)
        private String description;
        private Boolean isActive;
        private Boolean allowsMovements;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AccountResponse {
        private UUID id;
        private String code;
        private String name;
        private String description;
        private Account.AccountType type;
        private Account.AccountNature nature;
        private Integer level;
        private UUID parentId;
        private String parentName;
        private Boolean isActive;
        private Boolean allowsMovements;
        private Boolean isSystemAccount;
        private Boolean hasChildren;
        private LocalDateTime createdAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AccountTreeNode {
        private UUID id;
        private String code;
        private String name;
        private Account.AccountType type;
        private Integer level;
        private Boolean allowsMovements;
        private Boolean isActive;
        private List<AccountTreeNode> children;
    }
}
