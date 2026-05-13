export default function RestaurantJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: "Gustoso's",
    description: 'Vienesas, sándwiches mechada, burritos y papas en Los Andes. Pedidos por WhatsApp.',
    url: 'https://gustoso-dun.vercel.app',
    telephone: '+56985219094',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Marino José Manuel Ramírez #1641',
      addressLocality: 'Los Andes',
      addressRegion: 'Región de Valparaíso',
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
    servesCuisine: ['Chilena', 'Comida rápida', 'Sándwiches', 'Burritos'],
    priceRange: '$$',
    hasMenu: 'https://gustoso-dun.vercel.app/#menu',
    acceptsReservations: false,
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
