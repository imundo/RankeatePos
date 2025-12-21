export const environment = {
    production: false,

    // Docker local - Frontend runs in browser, calls BFF via exposed port on localhost
    apiUrl: 'http://localhost:8080/api',
    authUrl: 'http://localhost:8080/api',
    catalogUrl: 'http://localhost:8080/api',
    salesUrl: 'http://localhost:8080/api',
    billingUrl: 'http://localhost:8080/api'
};
