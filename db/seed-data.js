// Starter catalogue loaded by `npm run db:seed`. Prices are in dollars here and
// stored in cents. Seeding never overwrites a product that already exists, so
// edits made in the admin panel are safe.

const categories = [
  { slug: 'new-arrivals', name: 'New Arrivals', description: 'The latest sofas to land in the showroom.' },
  { slug: 'sofas', name: 'Sofas', description: 'Three-seaters and sectionals built for the whole family.' },
  { slug: 'loveseats', name: 'Loveseats', description: 'Two-seaters for smaller rooms and cosy corners.' },
  { slug: 'leather', name: 'Leather', description: 'Full-grain leather that gets better with every year.' },
  { slug: 'on-sale', name: 'On Sale', description: 'Showroom favourites at reduced prices.' },
  { slug: 'fabric', name: 'Fabric & Velvet', description: 'Soft-touch upholstery in tweed, velvet and bouclé.' },
  { slug: 'daybeds', name: 'Daybeds', description: 'Lounge, nap or host an overnight guest.' }
]

const BRAND = 'JSEC Studio'

// `legacyName` is the name the product had in the old static catalogue, used to
// link orders imported from data/orders.json to the right product.
const products = [
  {
    slug: 'timber-gray-sofa', legacyName: 'Timber Gray Sofa 2.0', name: 'Timber Gray Sofa',
    image: '/products/couch1.png', price: 1000, stock: 4,
    material: 'Fabric', color: 'Gray', seats: 3, width: 213, depth: 89, height: 81,
    categories: ['new-arrivals', 'sofas', 'fabric'],
    description: 'A clean-lined three-seater in a hard-wearing grey tweed. The single bench cushion means no gaps, and the solid walnut legs keep it light on its feet.'
  },
  {
    slug: 'swan-pink-loveseat', legacyName: 'Galaxy Blue Sofa', name: 'Swan Pink Loveseat',
    image: '/products/couch2.png', price: 800, stock: 6,
    material: 'Wool', color: 'Pink', seats: 2, width: 145, depth: 70, height: 77,
    categories: ['loveseats', 'fabric'],
    description: 'A sculpted mid-century loveseat with sweeping wings, upholstered in fuchsia wool on a brushed steel base. A statement piece for a reading nook or bedroom.'
  },
  {
    slug: 'markus-black-leather-sofa', legacyName: 'Markus Green Love Seat', name: 'Markus Black Leather Sofa',
    image: '/products/couch3.png', price: 900, stock: 5,
    material: 'Leather', color: 'Black', seats: 3, width: 210, depth: 82, height: 77,
    categories: ['new-arrivals', 'sofas', 'leather'],
    description: 'Danish-inspired three-seater in semi-aniline black leather with a tight back and slim, square arms. Solid oak frame and legs.'
  },
  {
    slug: 'dabit-tan-leather-sofa', legacyName: 'Dabit Matte Black', name: 'Dabit Tan Leather Sofa',
    image: '/products/couch4.png', price: 1200, compareAt: 1450, stock: 3,
    material: 'Leather', color: 'Tan', seats: 3, width: 224, depth: 94, height: 86,
    categories: ['on-sale', 'sofas', 'leather'],
    description: 'Tufted bench seat, two bolster pillows and full-aniline tan leather that develops a rich patina with use. Sits on tapered walnut legs.'
  },
  {
    slug: 'carmel-brown-sectional', legacyName: 'Carmel Brown Sofa', name: 'Carmel Brown Sectional',
    image: '/products/couch5.png', price: 2400, stock: 2,
    material: 'Leather', color: 'Tan', seats: 5, width: 262, depth: 262, height: 84,
    categories: ['sofas', 'leather'],
    description: 'An L-shaped corner sectional in caramel leather with a wooden plinth base. Room for the whole family on movie night.'
  },
  {
    slug: 'mod-navy-velvet-sofa', legacyName: 'Mod Leather Sofa', name: 'Mod Navy Velvet Sofa',
    image: '/products/couch6.png', price: 800, stock: 8,
    material: 'Velvet', color: 'Navy', seats: 3, width: 224, depth: 94, height: 86,
    categories: ['new-arrivals', 'sofas', 'fabric'],
    description: 'Deep navy velvet, a tufted bench seat and two bolster pillows. Stain-resistant performance velvet keeps it looking new.'
  },
  {
    slug: 'thetis-gray-sofa', legacyName: 'Thetis Gray Love Seat', name: 'Thetis Gray Sofa',
    image: '/products/couch7.png', price: 900, stock: 10,
    material: 'Fabric', color: 'Gray', seats: 3, width: 220, depth: 90, height: 84,
    categories: ['new-arrivals', 'sofas', 'fabric'],
    description: 'Three plush seat cushions, piped arms and a warm walnut base. The heathered grey weave hides everyday wear.'
  },
  {
    slug: 'sven-pebble-gray-sofa', legacyName: 'Sven Tan Matte', name: 'Sven Pebble Gray Sofa',
    image: '/products/couch8.png', price: 1200, compareAt: 1399, stock: 7,
    material: 'Fabric', color: 'Gray', seats: 3, width: 218, depth: 91, height: 84,
    categories: ['on-sale', 'sofas', 'fabric'],
    description: 'A light pebble-grey three-seater with a corner-blocked hardwood frame and angled oak legs. Cushions are reversible for even wear.'
  },
  {
    slug: 'otis-teal-loveseat', legacyName: 'Otis Malt Sofa', name: 'Otis Teal Loveseat',
    image: '/products/couch9.png', price: 500, compareAt: 650, stock: 13,
    material: 'Fabric', color: 'Teal', seats: 2, width: 150, depth: 88, height: 84,
    categories: ['on-sale', 'loveseats', 'fabric'],
    description: 'A compact two-seater in rich teal with a walnut-stained base. Fits apartments and studio flats without giving up comfort.'
  },
  {
    slug: 'ceni-brown-3-seater', legacyName: 'Ceni Brown 3 Seater', name: 'Ceni Brown 3 Seater',
    image: '/products/couch10.png', price: 650, compareAt: 899, stock: 9,
    material: 'Leather', color: 'Tan', seats: 3, width: 213, depth: 86, height: 79,
    categories: ['on-sale', 'sofas', 'leather'],
    description: 'Distressed tan leather with loose back cushions and slim track arms. Natural markings and colour variation make every piece unique.'
  },
  {
    slug: 'jameson-black-leather-sofa', legacyName: 'Jameson Jack Lounger', name: 'Jameson Black Leather Sofa',
    image: '/products/couch11.png', price: 1230, stock: 4,
    material: 'Leather', color: 'Black', seats: 3, width: 226, depth: 91, height: 84,
    categories: ['sofas', 'leather'],
    description: 'Oiled black leather over a solid wood frame, with flared walnut legs. The leather softens and wrinkles like a favourite jacket.'
  },
  {
    slug: 'nimbus-boucle-loveseat', name: 'Nimbus Bouclé Loveseat',
    image: '/products/couch12.png', price: 720, stock: 6,
    material: 'Bouclé', color: 'Ivory', seats: 2, width: 160, depth: 82, height: 80,
    categories: ['new-arrivals', 'loveseats', 'fabric'],
    description: 'Rounded arms, a cloud-soft ivory bouclé and splayed ash legs. A bright, friendly loveseat for living rooms and bedrooms alike.'
  },
  {
    slug: 'alder-tufted-leather-sofa', name: 'Alder Tufted Leather Sofa',
    image: '/products/couch13.png', price: 1450, stock: 3,
    material: 'Leather', color: 'Black', seats: 3, width: 203, depth: 86, height: 76,
    categories: ['sofas', 'leather'],
    description: 'A modern take on the Chesterfield: diamond-tufted black leather, a tuxedo silhouette and a solid wood plinth.'
  },
  {
    slug: 'timber-charme-tan-sofa', name: 'Timber Charme Tan Sofa',
    image: '/products/couch14.png', price: 1290, stock: 5,
    material: 'Leather', color: 'Tan', seats: 3, width: 225, depth: 95, height: 85,
    categories: ['sofas', 'leather'],
    description: 'Our best-selling sofa: full-aniline tan leather, plush down-blend cushions and a sculpted oak base. It only gets better with age.'
  },
  {
    slug: 'sola-leather-daybed', name: 'Sola Leather Daybed',
    image: '/products/couch15.png', price: 980, stock: 4,
    material: 'Leather', color: 'Tan', seats: 3, width: 203, depth: 91, height: 46,
    categories: ['new-arrivals', 'daybeds', 'leather'],
    description: 'A tufted tan leather daybed with a matching bolster. Use it as a backless sofa, a lounger or an extra bed for guests.'
  }
].map(product => ({ brand: BRAND, compareAt: null, legacyName: null, ...product }))

module.exports = { categories, products }
