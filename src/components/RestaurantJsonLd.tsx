export default function RestaurantJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: "Gustoso's Los Andes",
    alternateName: ["Gustoso's", 'Gustoso Los Andes', 'Gustoso'],
    description: 'Vienesas, sándwiches mechada, burritos y papas en Los Andes, Chile. Pedidos por WhatsApp con delivery o retiro en local.',
    url: 'https://gustosolosandes.cl',
    telephone: '+56985219094',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Marino José Manuel Ramírez #1641',
      addressLocality: 'Los Andes',
      addressRegion: 'Región de Valparaíso',
      postalCode: '1700000',
      addressCountry: 'CL',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude:  -32.8338,
      longitude: -70.5987,
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'],
        opens:  '12:00',
        closes: '22:00',
      },
    ],
    servesCuisine: ['Chilena', 'Comida rápida', 'Sándwiches', 'Burritos', 'Vienesas'],
    priceRange: '$$',
    hasMenu: 'https://gustosolosandes.cl/#menu',
    acceptsReservations: false,
    currenciesAccepted: 'CLP',
    paymentAccepted: 'Efectivo, Transferencia, Débito, Crédito',
    areaServed: {
      '@type': 'City',
      name: 'Los Andes',
      sameAs: 'https://es.wikipedia.org/wiki/Los_Andes_(Chile)',
    },
    potentialAction: {
      '@type': 'OrderAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://wa.me/56985219094',
        actionPlatform: ['http://schema.org/DesktopWebPlatform', 'http://schema.org/MobileWebPlatform'],
      },
      deliveryMethod: ['http://purl.org/goodrelations/v1#DeliveryModeOwnFleet'],
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
