package com.poscl.auth.api.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlanDto {
    private UUID id;
    private String code;
    private String name;
    private String description;
    private BigDecimal price;
    private String currency;
    private String billingCycle;
    private List<String> includedModules;
    private Integer maxUsers;
    private Integer maxBranches;
    private Integer maxProducts;
    private Boolean active;
}
