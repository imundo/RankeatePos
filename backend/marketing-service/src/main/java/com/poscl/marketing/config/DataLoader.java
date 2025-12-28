package com.poscl.marketing.config;

import com.poscl.marketing.domain.entity.*;
import com.poscl.marketing.domain.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Component
public class DataLoader implements CommandLineRunner {

    private final CustomerRepository customerRepository;
    private final EmailTemplateRepository emailTemplateRepository;
    private final PromotionRepository promotionRepository;
    private final CouponRepository couponRepository;
    private final ReviewRepository reviewRepository;
    private final ReferralRepository referralRepository;

    public DataLoader(CustomerRepository customerRepository,
                      EmailTemplateRepository emailTemplateRepository,
                      PromotionRepository promotionRepository,
                      CouponRepository couponRepository,
                      ReviewRepository reviewRepository,
                      ReferralRepository referralRepository) {
        this.customerRepository = customerRepository;
        this.emailTemplateRepository = emailTemplateRepository;
        this.promotionRepository = promotionRepository;
        this.couponRepository = couponRepository;
        this.reviewRepository = reviewRepository;
        this.referralRepository = referralRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        String tenantId = "demo-tenant";
        
        // Only seed if no data exists
        if (customerRepository.count() > 0) {
            System.out.println("Data already exists, skipping seed...");
            return;
        }

        System.out.println("Seeding demo data for marketing-service...");

        // Create Customers
        List<Customer> customers = createCustomers(tenantId);
        customerRepository.saveAll(customers);

        // Create Email Templates
        List<EmailTemplate> templates = createEmailTemplates(tenantId);
        emailTemplateRepository.saveAll(templates);

        // Create Promotions with Coupons
        createPromotionsWithCoupons(tenantId);

        // Create Reviews
        List<Review> reviews = createReviews(tenantId, customers);
        reviewRepository.saveAll(reviews);

        // Create Referrals
        List<Referral> referrals = createReferrals(tenantId, customers);
        referralRepository.saveAll(referrals);

        System.out.println("Demo data seeded successfully!");
    }

    private List<Customer> createCustomers(String tenantId) {
        return List.of(
            createCustomer(tenantId, "María", "González", "maria@email.cl", "+56912345678", "VIP", "PLATINUM", 25000, 15, 450000, LocalDate.of(1985, 3, 15)),
            createCustomer(tenantId, "Carlos", "Rodríguez", "carlos@email.cl", "+56923456789", "VIP", "PLATINUM", 22000, 12, 380000, LocalDate.of(1978, 7, 22)),
            createCustomer(tenantId, "Ana", "López", "ana@email.cl", "+56934567890", "REGULAR", "GOLD", 8500, 8, 180000, LocalDate.of(1990, 11, 8)),
            createCustomer(tenantId, "Pedro", "Sánchez", "pedro@email.cl", "+56945678901", "REGULAR", "SILVER", 4200, 5, 95000, LocalDate.of(1982, 5, 30)),
            createCustomer(tenantId, "Sofía", "Torres", "sofia@email.cl", "+56956789012", "NEW", "BRONZE", 1500, 2, 35000, LocalDate.of(1995, 9, 12)),
            createCustomer(tenantId, "Diego", "Martínez", "diego@email.cl", "+56967890123", "NEW", "BRONZE", 800, 1, 18000, LocalDate.of(1988, 1, 25)),
            createCustomer(tenantId, "Valentina", "Muñoz", "valentina@email.cl", "+56978901234", "AT_RISK", "SILVER", 3000, 4, 72000, LocalDate.of(1992, 6, 18)),
            createCustomer(tenantId, "Joaquín", "Sepúlveda", "joaquin@email.cl", "+56989012345", "REGULAR", "GOLD", 6500, 6, 145000, LocalDate.of(1987, 12, 3))
        );
    }

    private Customer createCustomer(String tenantId, String firstName, String lastName, String email, String phone,
                                     String segment, String tier, int points, int purchases, double clv, LocalDate birthday) {
        Customer c = new Customer();
        c.setTenantId(tenantId);
        c.setFirstName(firstName);
        c.setLastName(lastName);
        c.setEmail(email);
        c.setPhone(phone);
        c.setSegment(segment);
        c.setLoyaltyTier(tier);
        c.setLoyaltyPoints(points);
        c.setTotalPurchases(purchases);
        c.setTotalSpent(BigDecimal.valueOf(purchases * 25000));
        c.setCustomerLifetimeValue(BigDecimal.valueOf(clv));
        c.setBirthDate(birthday);
        c.setReferralCode("REF" + firstName.toUpperCase().substring(0, 3) + String.format("%03d", purchases));
        c.setCustomerScore(calculateScore(segment, tier));
        c.setEmailOptIn(true);
        c.setSmsOptIn(true);
        c.setWhatsappOptIn(phone != null);
        c.setCreatedAt(LocalDateTime.now().minusDays(purchases * 30L));
        c.setLastPurchaseDate(LocalDateTime.now().minusDays(segment.equals("AT_RISK") ? 90 : 7));
        return c;
    }

    private int calculateScore(String segment, String tier) {
        int base = switch (segment) {
            case "VIP" -> 90;
            case "REGULAR" -> 60;
            case "NEW" -> 40;
            case "AT_RISK" -> 30;
            default -> 20;
        };
        int tierBonus = switch (tier) {
            case "PLATINUM" -> 10;
            case "GOLD" -> 5;
            case "SILVER" -> 2;
            default -> 0;
        };
        return base + tierBonus;
    }

    private List<EmailTemplate> createEmailTemplates(String tenantId) {
        return List.of(
            createTemplate(tenantId, "Bienvenida", "¡Bienvenido/a a nuestra familia, {{name}}!", "AUTOMATED", "WELCOME"),
            createTemplate(tenantId, "Cumpleaños", "🎂 ¡Feliz Cumpleaños {{name}}! Tu regalo te espera", "AUTOMATED", "BIRTHDAY"),
            createTemplate(tenantId, "Te extrañamos", "{{name}}, te extrañamos 😢 Vuelve con 15% OFF", "AUTOMATED", "RE_ENGAGEMENT"),
            createTemplate(tenantId, "Promoción Navidad", "🎄 Ofertas especiales de Navidad para ti", "MARKETING", null),
            createTemplate(tenantId, "Gracias por tu compra", "¡Gracias por tu compra, {{name}}!", "TRANSACTIONAL", "POST_PURCHASE")
        );
    }

    private EmailTemplate createTemplate(String tenantId, String name, String subject, String type, String trigger) {
        EmailTemplate t = new EmailTemplate();
        t.setTenantId(tenantId);
        t.setName(name);
        t.setSubject(subject);
        t.setType(type);
        t.setTrigger(trigger);
        t.setBodyHtml("<html><body><h1>" + name + "</h1><p>Contenido del email...</p></body></html>");
        t.setActive(true);
        t.setCreatedAt(LocalDateTime.now());
        return t;
    }

    private void createPromotionsWithCoupons(String tenantId) {
        // Promo 1: Navidad
        Promotion p1 = createPromotion(tenantId, "10% Descuento Navidad", "PERCENTAGE", 10, 10000, null, null);
        p1 = promotionRepository.save(p1);
        couponRepository.save(createCoupon(p1, "NAVIDAD10", 1000, 156));

        // Promo 2: VIP
        Promotion p2 = createPromotion(tenantId, "15% VIP Exclusivo", "PERCENTAGE", 15, 20000, "VIP", null);
        p2 = promotionRepository.save(p2);
        couponRepository.save(createCoupon(p2, "VIP15", 500, 42));

        // Promo 3: 2x1
        Promotion p3 = createPromotion(tenantId, "2x1 en Postres", "BOGO", 50, 0, null, null);
        p3 = promotionRepository.save(p3);
        couponRepository.save(createCoupon(p3, "POSTRE2X1", 200, 34));

        // Promo 4: Descuento fijo
        Promotion p4 = createPromotion(tenantId, "$5.000 Descuento", "FIXED_AMOUNT", 5000, 25000, null, null);
        p4 = promotionRepository.save(p4);
        couponRepository.save(createCoupon(p4, "AHORRA5K", 500, 89));
    }

    private Promotion createPromotion(String tenantId, String name, String type, double value, double minPurchase,
                                       String targetSegment, String targetTier) {
        Promotion p = new Promotion();
        p.setTenantId(tenantId);
        p.setName(name);
        p.setDescription(name);
        p.setType(type);
        p.setDiscountValue(BigDecimal.valueOf(value));
        p.setMinPurchaseAmount(BigDecimal.valueOf(minPurchase));
        p.setTargetSegment(targetSegment);
        p.setTargetTier(targetTier);
        p.setStartDate(LocalDateTime.now().minusDays(10));
        p.setEndDate(LocalDateTime.now().plusDays(30));
        p.setActive(true);
        p.setCreatedAt(LocalDateTime.now());
        return p;
    }

    private Coupon createCoupon(Promotion promotion, String code, int maxUses, int currentUses) {
        Coupon c = new Coupon();
        c.setPromotion(promotion);
        c.setCode(code);
        c.setMaxUses(maxUses);
        c.setCurrentUses(currentUses);
        c.setActive(true);
        c.setCreatedAt(LocalDateTime.now());
        return c;
    }

    private List<Review> createReviews(String tenantId, List<Customer> customers) {
        return List.of(
            createReview(tenantId, customers.get(0), 5, "¡Excelente atención y productos de primera calidad!", "APPROVED", "¡Gracias María!"),
            createReview(tenantId, customers.get(1), 5, "El mejor lugar para reuniones de negocios.", "APPROVED", "¡Gracias Carlos!"),
            createReview(tenantId, customers.get(2), 5, "Me encanta el programa de lealtad.", "APPROVED", null),
            createReview(tenantId, customers.get(3), 4, "Muy buena comida, tiempo de espera un poco largo.", "APPROVED", "Trabajamos en mejorar los tiempos."),
            createReview(tenantId, customers.get(4), 4, "Primera vez y quedé encantada!", "PENDING", null),
            createReview(tenantId, customers.get(6), 3, "La comida estuvo bien, servicio podría mejorar.", "APPROVED", "Gracias por tu honestidad.")
        );
    }

    private Review createReview(String tenantId, Customer customer, int rating, String comment, String status, String response) {
        Review r = new Review();
        r.setTenantId(tenantId);
        r.setCustomerId(customer.getId());
        r.setCustomerName(customer.getFirstName() + " " + customer.getLastName());
        r.setRating(rating);
        r.setComment(comment);
        r.setStatus(status);
        r.setIsPublic(true);
        r.setIsVerified(true);
        r.setHelpfulCount(rating > 3 ? rating * 2 : 0);
        r.setResponse(response);
        r.setRespondedAt(response != null ? LocalDateTime.now().minusDays(1) : null);
        r.setCreatedAt(LocalDateTime.now().minusDays(rating));
        return r;
    }

    private List<Referral> createReferrals(String tenantId, List<Customer> customers) {
        return List.of(
            createReferral(tenantId, customers.get(0), customers.get(4), "REWARDED", 5000, 3000, true, true, 18500),
            createReferral(tenantId, customers.get(0), customers.get(5), "CONVERTED", 5000, 3000, false, true, 15200),
            createReferral(tenantId, customers.get(1), customers.get(7), "CONVERTED", 5000, 3000, false, true, 12800),
            createReferral(tenantId, customers.get(2), null, "PENDING", 5000, 3000, false, false, 0)
        );
    }

    private Referral createReferral(String tenantId, Customer referrer, Customer referred, String status,
                                     double referrerReward, double referredReward, boolean referrerRewarded,
                                     boolean referredRewarded, double firstPurchase) {
        Referral r = new Referral();
        r.setTenantId(tenantId);
        r.setReferrerId(referrer.getId());
        r.setReferrerName(referrer.getFirstName() + " " + referrer.getLastName());
        r.setReferralCode(referrer.getReferralCode());
        if (referred != null) {
            r.setReferredId(referred.getId());
            r.setReferredName(referred.getFirstName() + " " + referred.getLastName());
        }
        r.setStatus(status);
        r.setReferrerReward(BigDecimal.valueOf(referrerReward));
        r.setReferredReward(BigDecimal.valueOf(referredReward));
        r.setReferrerRewarded(referrerRewarded);
        r.setReferredRewarded(referredRewarded);
        if (firstPurchase > 0) {
            r.setFirstPurchaseAmount(BigDecimal.valueOf(firstPurchase));
            r.setConvertedAt(LocalDateTime.now().minusDays(5));
        }
        r.setCreatedAt(LocalDateTime.now().minusDays(15));
        return r;
    }
}
