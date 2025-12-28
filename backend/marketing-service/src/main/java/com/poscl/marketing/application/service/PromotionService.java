package com.poscl.marketing.application.service;

import com.poscl.marketing.domain.entity.*;
import com.poscl.marketing.domain.entity.Promotion.PromotionType;
import com.poscl.marketing.domain.repository.CouponRepository;
import com.poscl.marketing.domain.repository.PromotionRepository;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class PromotionService {
    
    private final PromotionRepository promotionRepository;
    private final CouponRepository couponRepository;
    
    // ========== Promotions CRUD ==========
    
    public Page<Promotion> findAll(UUID tenantId, Pageable pageable) {
        return promotionRepository.findByTenantId(tenantId, pageable);
    }
    
    public Optional<Promotion> findById(UUID tenantId, UUID id) {
        return promotionRepository.findByIdAndTenantId(id, tenantId);
    }
    
    public List<Promotion> findActive(UUID tenantId) {
        return promotionRepository.findActivePromotions(tenantId, LocalDateTime.now());
    }
    
    @Transactional
    public Promotion create(UUID tenantId, Promotion promotion) {
        promotion.setTenantId(tenantId);
        promotion.setCreatedAt(LocalDateTime.now());
        return promotionRepository.save(promotion);
    }
    
    @Transactional
    public Promotion update(UUID tenantId, UUID id, Promotion updated) {
        return promotionRepository.findByIdAndTenantId(id, tenantId)
            .map(existing -> {
                existing.setName(updated.getName());
                existing.setDescription(updated.getDescription());
                existing.setType(updated.getType());
                existing.setDiscountValue(updated.getDiscountValue());
                existing.setMinPurchase(updated.getMinPurchase());
                existing.setMaxDiscount(updated.getMaxDiscount());
                existing.setStartDate(updated.getStartDate());
                existing.setEndDate(updated.getEndDate());
                existing.setMaxUses(updated.getMaxUses());
                existing.setUsesPerCustomer(updated.getUsesPerCustomer());
                existing.setTargetSegment(updated.getTargetSegment());
                existing.setTargetTier(updated.getTargetTier());
                existing.setActive(updated.getActive());
                existing.setStackable(updated.getStackable());
                existing.setProductIds(updated.getProductIds());
                existing.setCategoryIds(updated.getCategoryIds());
                return promotionRepository.save(existing);
            })
            .orElseThrow(() -> new RuntimeException("Promotion not found"));
    }
    
    @Transactional
    public void delete(UUID tenantId, UUID id) {
        promotionRepository.findByIdAndTenantId(id, tenantId)
            .ifPresent(promotionRepository::delete);
    }
    
    @Transactional
    public Promotion toggleActive(UUID tenantId, UUID id) {
        return promotionRepository.findByIdAndTenantId(id, tenantId)
            .map(promo -> {
                promo.setActive(!promo.getActive());
                return promotionRepository.save(promo);
            })
            .orElseThrow(() -> new RuntimeException("Promotion not found"));
    }
    
    // ========== Coupon Management ==========
    
    @Transactional
    public Coupon createCoupon(UUID promotionId, String code, Integer maxUses, LocalDateTime expiresAt) {
        Promotion promotion = promotionRepository.findById(promotionId)
            .orElseThrow(() -> new RuntimeException("Promotion not found"));
        
        Coupon coupon = Coupon.builder()
            .promotion(promotion)
            .code(code.toUpperCase())
            .maxUses(maxUses != null ? maxUses : 1)
            .expiresAt(expiresAt)
            .qrCode(generateQRCode(code))
            .build();
        
        return couponRepository.save(coupon);
    }
    
    @Transactional
    public List<Coupon> generateCoupons(UUID promotionId, int quantity, String prefix) {
        Promotion promotion = promotionRepository.findById(promotionId)
            .orElseThrow(() -> new RuntimeException("Promotion not found"));
        
        List<Coupon> coupons = new ArrayList<>();
        for (int i = 0; i < quantity; i++) {
            String code = prefix.toUpperCase() + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
            Coupon coupon = Coupon.builder()
                .promotion(promotion)
                .code(code)
                .maxUses(1)
                .qrCode(generateQRCode(code))
                .build();
            coupons.add(couponRepository.save(coupon));
        }
        return coupons;
    }
    
    public List<Coupon> getCoupons(UUID promotionId) {
        return couponRepository.findByPromotionId(promotionId);
    }
    
    // ========== Coupon Validation & Redemption ==========
    
    public Optional<Coupon> validateCoupon(String code) {
        return couponRepository.findValidCoupon(code.toUpperCase());
    }
    
    public CouponValidationResult validateCouponForCart(String code, BigDecimal cartTotal, 
                                                         Customer.CustomerSegment customerSegment,
                                                         Customer.LoyaltyTier customerTier) {
        Optional<Coupon> couponOpt = couponRepository.findValidCoupon(code.toUpperCase());
        
        if (couponOpt.isEmpty()) {
            return new CouponValidationResult(false, "Cupón no válido o expirado", null, null);
        }
        
        Coupon coupon = couponOpt.get();
        Promotion promo = coupon.getPromotion();
        
        // Check minimum purchase
        if (promo.getMinPurchase() != null && cartTotal.compareTo(promo.getMinPurchase()) < 0) {
            return new CouponValidationResult(false, 
                "Compra mínima requerida: $" + promo.getMinPurchase(), null, null);
        }
        
        // Check segment restriction
        if (promo.getTargetSegment() != null && promo.getTargetSegment() != customerSegment) {
            return new CouponValidationResult(false, 
                "Este cupón es exclusivo para clientes " + promo.getTargetSegment(), null, null);
        }
        
        // Check tier restriction
        if (promo.getTargetTier() != null && !isTierEligible(customerTier, promo.getTargetTier())) {
            return new CouponValidationResult(false, 
                "Este cupón requiere nivel " + promo.getTargetTier() + " o superior", null, null);
        }
        
        // Calculate discount
        BigDecimal discount = calculateDiscount(promo, cartTotal);
        
        return new CouponValidationResult(true, "Cupón válido", coupon, discount);
    }
    
    private boolean isTierEligible(Customer.LoyaltyTier customerTier, Customer.LoyaltyTier requiredTier) {
        int customerLevel = tierLevel(customerTier);
        int requiredLevel = tierLevel(requiredTier);
        return customerLevel >= requiredLevel;
    }
    
    private int tierLevel(Customer.LoyaltyTier tier) {
        return switch (tier) {
            case BRONZE -> 1;
            case SILVER -> 2;
            case GOLD -> 3;
            case PLATINUM -> 4;
        };
    }
    
    private BigDecimal calculateDiscount(Promotion promo, BigDecimal cartTotal) {
        BigDecimal discount;
        
        switch (promo.getType()) {
            case PERCENTAGE:
                discount = cartTotal.multiply(promo.getDiscountValue())
                    .divide(BigDecimal.valueOf(100));
                break;
            case FIXED_AMOUNT:
                discount = promo.getDiscountValue();
                break;
            default:
                discount = BigDecimal.ZERO;
        }
        
        // Apply max discount if set
        if (promo.getMaxDiscount() != null && discount.compareTo(promo.getMaxDiscount()) > 0) {
            discount = promo.getMaxDiscount();
        }
        
        return discount;
    }
    
    @Transactional
    public void redeemCoupon(String code) {
        Coupon coupon = couponRepository.findByCode(code.toUpperCase())
            .orElseThrow(() -> new RuntimeException("Coupon not found"));
        
        coupon.setCurrentUses(coupon.getCurrentUses() + 1);
        couponRepository.save(coupon);
        
        // Also update promotion uses
        Promotion promo = coupon.getPromotion();
        promo.setCurrentUses(promo.getCurrentUses() + 1);
        promotionRepository.save(promo);
    }
    
    // ========== QR Code Generation ==========
    
    private String generateQRCode(String code) {
        try {
            QRCodeWriter writer = new QRCodeWriter();
            BitMatrix matrix = writer.encode(code, BarcodeFormat.QR_CODE, 200, 200);
            
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(matrix, "PNG", baos);
            
            return Base64.getEncoder().encodeToString(baos.toByteArray());
        } catch (Exception e) {
            return null;
        }
    }
    
    // ========== Analytics ==========
    
    public Map<String, Object> getAnalytics(UUID tenantId) {
        Map<String, Object> analytics = new HashMap<>();
        
        List<Promotion> active = findActive(tenantId);
        analytics.put("activePromotions", active.size());
        
        int totalRedemptions = active.stream()
            .mapToInt(Promotion::getCurrentUses)
            .sum();
        analytics.put("totalRedemptions", totalRedemptions);
        
        // Get most used promotions
        analytics.put("topPromotions", active.stream()
            .sorted((a, b) -> b.getCurrentUses().compareTo(a.getCurrentUses()))
            .limit(5)
            .toList());
        
        return analytics;
    }
    
    // ========== Result Classes ==========
    
    public record CouponValidationResult(
        boolean valid,
        String message,
        Coupon coupon,
        BigDecimal discount
    ) {}
}
