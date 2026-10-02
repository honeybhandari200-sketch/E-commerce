import Head from 'next/head'
import { Center, Footer, Tag, Showcase, DisplayMedium } from '../components'
import ProductCard from '../components/ProductCard'
import { siteName } from '../ecommerce.config'
import { withNav } from '../lib/nav'
import { listProducts, listCategories } from '../lib/products'

const Home = ({ hero, trending, categories }) => {
  return (
    <>
      <div className="w-full">
        <Head>
          <title>{siteName} - Modern sofas delivered free</title>
          <meta name="description" content="Shop modern leather, velvet and fabric sofas, loveseats and daybeds. Free delivery on every order." />
          <meta property="og:title" content={siteName} key="title" />
        </Head>
        {hero && (
          <div className="bg-blue-300
          p-6 pb-10 sm:pb-6
          flex lg:flex-row flex-col">
            <div className="pt-4 pl-2 sm:pt-12 sm:pl-12 flex flex-col">
              <Tag
                year={new Date().getFullYear()}
                category="SOFAS"
              />
              <Center
                price={hero.price}
                title={hero.name}
                link={`/product/${hero.slug}`}
              />
              <Footer
                designer={hero.brand}
              />
            </div>
            <div className="flex flex-1 justify-center items-center relative">
                <Showcase
                  imageSrc={hero.image}
                />
                <div className="absolute
                w-48 h-48 sm:w-72 sm:h-72 xl:w-88 xl:h-88
                bg-white z-0 rounded-full" />
            </div>
          </div>
        )}
      </div>
      <div className="
        lg:grid-cols-2
        grid-cols-1
        grid gap-4 mt-4
      ">
        {categories.map(category => (
          <DisplayMedium
            key={category.slug}
            imageSrc={category.image}
            subtitle={`${category.itemCount} ${category.itemCount === 1 ? 'item' : 'items'}`}
            title={category.name}
            link={`/category/${category.slug}`}
          />
        ))}
      </div>
      <div className="pt-16 pb-8 flex flex-col items-center text-center">
        <h2 className="text-4xl mb-3">Trending Now</h2>
        <p className="text-gray-600 text-sm">The sofas our customers are loving this season.</p>
      </div>
      <div className="grid gap-x-4 gap-y-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {trending.map(product => <ProductCard key={product.id} product={product} />)}
      </div>
    </>
  )
}

export async function getServerSideProps() {
  const [products, categories] = await Promise.all([
    listProducts({ inStock: true, limit: 5 }),
    listCategories()
  ])
  return withNav({
    props: {
      hero: products[0] || null,
      trending: products.slice(1, 5),
      categories: categories.filter(c => c.itemCount > 0).slice(0, 2)
    }
  })
}

export default Home
