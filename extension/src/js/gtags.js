// Load the Google Analytics library
(function() {
    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=G-XL2EJRMD7S';
    document.head.appendChild(script);
})();

// Initialize the dataLayer and gtag function
window.dataLayer = window.dataLayer || [];
function gtag() { dataLayer.push(arguments); }
gtag('js', new Date());
gtag('config', 'G-XL2EJRMD7S');

// Custom event tracking for feature adoption
function trackFeatureAdoption(floatingTab) {
    gtag('event', 'feature_used', {
        'feature_name': floatingTab
    });
}

// Custom event tracking for feature request
function trackFeatureRequest(featureName) {
    gtag('event', 'feature_requested', {
        'feature_name': featureName
    });
}

// Custom event tracking for conversions (e.g., free to paid)
function trackConversion(conversionType) {
    gtag('event', 'conversion', {
        'conversion_type': conversionType
    });
}

// Custom event tracking for purchases
function trackPurchase(value, currency, subscriptionType) {
    gtag('event', 'purchase', {
        'value': value,
        'currency': currency,
        'subscription_type': subscriptionType
    });
}

// Custom event tracking for NPS
function trackNPS(npsScore) {
    gtag('event', 'nps_response', {
        'nps_score': npsScore
    });
}

// Custom event tracking for CSAT
function trackCSAT(csatScore) {
    gtag('event', 'csat_response', {
        'csat_score': csatScore
    });
}

// Custom event tracking for floating tab actions
function trackFloatTab(url) {
    gtag('event', 'float_tab', {
        'event_category': 'Tab Actions',
        'event_label': url,
        'value': 1
    });
}

function trackUnfloatTab(url) {
    gtag('event', 'unfloat_tab', {
        'event_category': 'Tab Actions',
        'event_label': url,
        'value': 1
    });
}

function trackFloatTabError(url, errorMessage) {
    gtag('event', 'float_tab_error', {
        'event_category': 'Tab Actions',
        'event_label': url,
        'value': 1,
        'error_message': errorMessage
    });
}

function trackUnfloatTabError(url, errorMessage) {
    gtag('event', 'unfloat_tab_error', {
        'event_category': 'Tab Actions',
        'event_label': url,
        'value': 1,
        'error_message': errorMessage
    });
}

// Custom event tracking for positioning strategy
function trackPositioningStrategy(strategy) {
    gtag('event', 'positioning_strategy', {
        'event_category': 'Options',
        'event_label': strategy,
        'value': 1
    });
}

// Custom event tracking for user activity
function trackUserActivity() {
    gtag('event', 'user_activity', {
        'event_category': 'User Engagement',
        'event_label': 'Daily Active User',
        'value': 1
    });
}

// Custom event tracking for usage metrics
function trackFloatCount() {
    gtag('event', 'float_count', {
        'event_category': 'Usage Metrics',
        'event_label': 'Total Tabs Floated',
        'value': 1
    });
}

// Custom event tracking for subscription metrics
function trackSubscriptionMetrics(subscriptionData) {
    gtag('event', 'subscription', {
        'event_category': 'Revenue',
        'event_label': 'New Subscription',
        'value': subscriptionData.amount,
        'currency': subscriptionData.currency,
        'subscription_type': subscriptionData.type // e.g., monthly or annual
    });

    // Track MRR
    if (subscriptionData.type === 'monthly') {
        gtag('event', 'mrr', {
            'event_category': 'Revenue',
            'event_label': 'Monthly Recurring Revenue',
            'value': subscriptionData.amount,
            'currency': subscriptionData.currency
        });
    }

    // Track ARR
    if (subscriptionData.type === 'annual') {
        gtag('event', 'arr', {
            'event_category': 'Revenue',
            'event_label': 'Annual Recurring Revenue',
            'value': subscriptionData.amount,
            'currency': subscriptionData.currency
        });
    }
}