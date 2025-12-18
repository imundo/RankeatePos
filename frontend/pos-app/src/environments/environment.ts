export const environment = {
    production: false,

    // BFF Gateway - Single entry point for all API calls
    apiUrl: 'http://localhost:8080/api',

    // Direct service URLs (for fallback or specific cases)
    authUrl: 'http://localhost:8080/api',
    catalogUrl: 'http://localhost:8080/api',
    salesUrl: 'http://localhost:8080/api'
};
