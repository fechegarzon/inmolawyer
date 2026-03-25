// InmoLawyer - Configuration Module
// Centralized constants and configuration

export const CONFIG = {
    N8N_BASE_URL: 'https://oqipslfzbeioakfllohm.supabase.co/functions/v1',
    ENDPOINTS: {
        ANALYZE: '/analizar-contrato',
        STATUS: '/status',
        CHAT: '/consulta-contrato'
    },
    TIMEOUT: 30000,       // 30s para el submit inicial (solo obtener job_id)
    POLL_INTERVAL: 4000,  // 4s entre cada poll
    POLL_MAX_ATTEMPTS: 90 // maximo 6 minutos de polling
};

export const CONFIG_WOMPI = {
    publicKey: 'pub_prod_uohbfwCKYyrQ0LN3EuKK18cNE6gv5yL5',
    checkoutUrl: 'https://checkout.wompi.co/p/',
    redirectUrl: 'https://inmolawyer.surge.sh/app.html',
    currency: 'COP',
    // Endpoint N8N que genera el integrity hash (secreto de integridad nunca va al frontend)
    integrityEndpoint: 'https://oqipslfzbeioakfllohm.supabase.co/functions/v1/wompi-integrity',
    plans: [
        {
            id: 'single',
            name: 'Estudio Unico',
            description: '1 analisis de contrato completo',
            price: 4990000, // centavos COP = $49,900
            priceFormatted: '$49.900',
            credits: 1,
            icon: 'fas fa-file-contract',
            badge: null,
            savings: null,
            pricePerUnit: null,
            features: [
                '1 analisis de contrato',
                'Score de riesgo (0-100)',
                'Deteccion de clausulas abusivas',
                'Chat legal incluido',
                'Descarga PDF del reporte'
            ]
        },
        {
            id: 'pack5',
            name: 'Pack 5 Estudios',
            description: '5 analisis para ti o tus clientes',
            price: 19990000, // $199,900
            priceFormatted: '$199.900',
            credits: 5,
            icon: 'fas fa-layer-group',
            badge: 'Mas popular',
            savings: '20% dcto',
            pricePerUnit: '$39.980/estudio',
            features: [
                '5 analisis de contratos',
                'Score de riesgo (0-100)',
                'Deteccion de clausulas abusivas',
                'Chat legal incluido',
                'Descarga PDF de cada analisis'
            ]
        },
        {
            id: 'pack10',
            name: 'Pack 10 Estudios',
            description: '10 analisis al mejor precio',
            price: 34990000, // $349,900
            priceFormatted: '$349.900',
            credits: 10,
            icon: 'fas fa-boxes',
            badge: 'Mayor ahorro',
            savings: '30% dcto',
            pricePerUnit: '$34.990/estudio',
            features: [
                '10 analisis de contratos',
                'Score de riesgo (0-100)',
                'Deteccion de clausulas abusivas',
                'Chat legal incluido',
                'Descarga PDF de cada analisis',
                'Atencion prioritaria por WhatsApp'
            ]
        }
    ]
};
