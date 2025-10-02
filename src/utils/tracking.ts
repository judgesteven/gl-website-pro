// Google Analytics 4 Enhanced Tracking Utilities
export function trackPurchase(plan: string, value: number, currency: string = 'EUR') {
    if (typeof gtag !== 'undefined') {
        gtag('event', 'purchase', {
            transaction_id: `${plan}-${Date.now()}`,
            value: value,
            currency: currency,
            items: [{
                item_id: plan,
                item_name: `GameLayer ${plan} Plan`,
                category: 'SaaS Subscription',
                quantity: 1,
                price: value
            }]
        });
    }
}

export function trackContactForm(formType: 'enterprise' | 'general') {
    if (typeof gtag !== 'undefined') {
        gtag('event', 'contact_form_submit', {
            form_type: formType,
            page_location: window.location.href
        });
    }
}

export function trackAPIDocView() {
    if (typeof gtag !== 'undefined') {
        gtag('event', 'page_view', {
            page_title: 'API Documentation',
            page_location: '/api-docs'
        });
    }
}

export function trackCTAClick(ctaText: string, location: string) {
    if (typeof gtag !== 'undefined') {
        gtag('event', 'cta_click', {
            cta_text: ctaText,
            location: location,
            page_location: window.location.href
        });
    }
}

// Declare gtag for TypeScript
declare global {
    interface Window {
        gtag: (command: string, action: string, parameters: Record<string, any>) => void;
    }
}

export const gtag = (typeof window !== 'undefined') ? window.gtag : undefined;
