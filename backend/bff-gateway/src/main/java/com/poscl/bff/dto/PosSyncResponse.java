package com.poscl.bff.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * Aggregated POS sync response
 * Contains all data needed to initialize the POS screen
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PosSyncResponse {
    
    /**
     * List of products with variants
     */
    private List<Map<String, Object>> products;
    
    /**
     * List of categories
     */
    private List<Map<String, Object>> categories;
    
    /**
     * Current cash session (if any)
     */
    private Map<String, Object> currentSession;
}
