export const WA_NUMBER = '56985219094';
export const ADDRESS   = 'Marino José Manuel Ramírez #1641';

export const fmt = (n: number) => `$${n.toLocaleString('es-CL')}`;

export type SimpleItem  = { name: string; desc?: string; price: number };
export type DualItem    = { name: string; desc?: string; priceNormal: number; priceXL: number };
export type BebidaItem  = { name: string; volume: string; price: number };

export const MENU_DATA = {
  vienesas: { id:'vienesas', label:'Vienesas', emoji:'🌭', items:[
    { name:'Vienesa Alemana',        desc:'Tomate, Chucrut, Mayonesa',                       price:2800 },
    { name:'Vienesa Italiana',       desc:'Tomate, Palta, Mayonesa',                          price:3000 },
    { name:'Vienesa Completo',       desc:'Tomate, Chucrut, Palta, Mayonesa',                 price:3500 },
    { name:'Vienesa Dinámico',       desc:'Tomate, Chucrut, Salsa Verde, Palta, Mayonesa',    price:4000 },
    { name:'Vienesa Italiano Queso', desc:'Tomate, Palta, Queso, Mayonesa',                   price:4500 },
    { name:'Vienesa Queso',          desc:'Queso, Mayonesa',                                   price:2800 },
  ] as SimpleItem[] },
  as: { id:'as', label:'AS', emoji:'🥪', items:[
    { name:'AS Alemano',        desc:'Tomate, Chucrut, Mayonesa',                    price:4000 },
    { name:'AS Italiana',       desc:'Tomate, Palta, Mayonesa',                       price:4500 },
    { name:'AS Completo',       desc:'Tomate, Chucrut, Palta, Mayonesa',              price:5000 },
    { name:'AS Dinámico',       desc:'Tomate, Chucrut, Salsa Verde, Palta, Mayonesa', price:5500 },
    { name:'AS Italiano Queso', desc:'Tomate, Palta, Queso, Mayonesa',                price:6000 },
    { name:'AS Queso',          desc:'Queso, Mayonesa',                                price:4500 },
  ] as SimpleItem[] },
  churrasco: { id:'churrasco', label:'Churrasco', emoji:'🥩', items:[
    { name:'Alemano',        desc:'Tomate, Chucrut, Mayonesa',                          priceNormal:7300,  priceXL:13800 },
    { name:'Italiano',       desc:'Tomate, Palta, Mayonesa',                             priceNormal:8000,  priceXL:16300 },
    { name:'Italiano Queso', desc:'Tomate, Palta, Queso, Mayonesa',                      priceNormal:9000,  priceXL:18800 },
    { name:'Completo',       desc:'Tomate, Chucrut, Palta, Mayonesa',                    priceNormal:8700,  priceXL:17000 },
    { name:'Brasileño',      desc:'Palta, Queso, Mayonesa',                              priceNormal:8800,  priceXL:16500 },
    { name:'Luco Champiñón', desc:'Queso, Champiñón, Mayonesa',                          priceNormal:8700,  priceXL:17000 },
    { name:'Luco',           desc:'Queso',                                                priceNormal:7900,  priceXL:16000 },
    { name:'Chacarero',      desc:'Tomate, Poroto Verde, Ají Verde, Mayonesa',            priceNormal:8300,  priceXL:16400 },
    { name:'Chacarero Palta',desc:'Tomate, Poroto Verde, Ají Verde, Mayonesa, Palta',     priceNormal:9300,  priceXL:19400 },
    { name:'Rodeo',          desc:'Queso, Tocino, BBQ, Mayonesa',                         priceNormal:8500,  priceXL:17500 },
    { name:'A lo Pobre',     desc:'Cebolla Caramelizada, Huevo, Mayonesa',                priceNormal:8500,  priceXL:17500 },
  ] as DualItem[] },
  mechada: { id:'mechada', label:'Mechada', emoji:'🥖', items:[
    { name:'Alemano',        desc:'Tomate, Chucrut, Mayonesa',                       priceNormal:8500,  priceXL:15800 },
    { name:'Italiano',       desc:'Tomate, Palta, Mayonesa',                          priceNormal:9000,  priceXL:16800 },
    { name:'Italiano Queso', desc:'Tomate, Palta, Queso, Mayonesa',                   priceNormal:10000, priceXL:19300 },
    { name:'Completo',       desc:'Tomate, Chucrut, Palta, Mayonesa',                 priceNormal:9500,  priceXL:17500 },
    { name:'Brasileño',      desc:'Palta, Queso, Mayonesa',                           priceNormal:9800,  priceXL:17800 },
    { name:'Luco Champiñón', desc:'Queso, Champiñón, Mayonesa',                       priceNormal:9400,  priceXL:17500 },
    { name:'Luco',           desc:'Queso',                                             priceNormal:8900,  priceXL:16900 },
    { name:'Chacarero',      desc:'Tomate, Poroto Verde, Ají Verde, Mayonesa',         priceNormal:8900,  priceXL:16900 },
    { name:'Chacarero Palta',desc:'Tomate, Poroto Verde, Ají Verde, Mayonesa, Palta',  priceNormal:9900,  priceXL:19900 },
    { name:'Rodeo',          desc:'Queso, Tocino, BBQ, Mayonesa',                      priceNormal:9500,  priceXL:18000 },
    { name:'A lo Pobre',     desc:'Cebolla Caramelizada, Huevo, Mayonesa',             priceNormal:9500,  priceXL:18000 },
  ] as DualItem[] },
  bebidas: { id:'bebidas', label:'Bebidas', emoji:'🥤', items:[
    { name:'Coca-Cola',       volume:'350ml', price:0 },
    { name:'Coca-Cola',       volume:'500ml', price:0 },
    { name:'Coca-Cola',       volume:'1.5L',  price:0 },
    { name:'Coca-Cola',       volume:'2L',    price:0 },
    { name:'Sprite',          volume:'350ml', price:0 },
    { name:'Sprite',          volume:'1.5L',  price:0 },
    { name:'Fanta Naranja',   volume:'350ml', price:0 },
    { name:'Fanta Naranja',   volume:'1.5L',  price:0 },
    { name:'Powerade',        volume:'500ml', price:0 },
    { name:'Fuze Tea',        volume:'500ml', price:0 },
  ] as BebidaItem[] },
  papas: { id:'papas', label:'Papas & Más', emoji:'🍟', groups:[
    { name:'Empanadas', items:[
      { name:'Empanadas de Queso', desc:'5 Empanadas de queso', price:3000 },
    ] as SimpleItem[] },
    { name:'Papas Fritas Naturales', items:[
      { name:'Individual', price:2500 },
      { name:'Mediana',    price:5500 },
      { name:'Grande',     price:8000 },
    ] as SimpleItem[] },
    { name:'Salchipapas', items:[
      { name:'Individual', price:3500 },
      { name:'Mediana',    price:6500 },
      { name:'Grande',     price:9500 },
    ] as SimpleItem[] },
    { name:'Chorrillana', items:[
      { name:'Chorrillana 2 Personas', desc:'Carne, Cebolla Caramelizada, Chorizo, Huevo', price:10000 },
      { name:'Chorrillana 4 Personas', desc:'Carne, Cebolla Caramelizada, Chorizo, Huevo', price:18000 },
    ] as SimpleItem[] },
  ]},
};

export const BURRITO_DATA = {
  rellenos:  ['Arroz Blanco','Veggie (Pimiento-Cebolla)','Arroz Especial','Papas Fritas'],
  proteinas: [
    { name:'Pollo Frito',     normal:5800, xl:9000 },
    { name:'Birria (Mechada)',normal:6800, xl:9800 },
    { name:'Carne',           normal:6500, xl:9500 },
    { name:'Camarón',         normal:6700, xl:9700 },
    { name:'Al Pastor',       normal:6000, xl:9000 },
  ],
  toppings: ['Choclo','Jalapeño','Queso','Pico Gallo','Palta','Coleslaw','Lechuga','Pepinillo','Cebolla','Cilantro','Tomate','Chips de Maíz','Poroto Verde','Ají Verde','Frijoles'],
  salsas:   ['Crema Agria','Salsa de Queso','Buffalo','Burrera','BBQ','Mayonesa','Mayonesa Picante','Guacamole'],
};
