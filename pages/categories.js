import Head from 'next/head'
import { DisplayMedium } from '../components'
import { siteName } from '../ecommerce.config'
import { withNav } from '../lib/nav'
import { listCategories } from '../lib/products'

function Categories ({ categories = [] }) {
  return (
    <>
      <div className="w-full">
        <Head>
          <title>{siteName} - All Categories</title>
          <meta name="description" content={`${siteName} - All categories`} />
          <meta property="og:title" content={`${siteName} - All Categories`} key="title" />
        </Head>
        <div className="pt-4 pb-8">
          <h1 className="text-5xl font-light">All categories</h1>
        </div>
        <div>
          <div className="grid gap-4
          lg:grid-cols-3 md:grid-cols-2 grid-cols-1">
          {
            categories.map(category => (
              <DisplayMedium
                key={category.slug}
                imageSrc={category.image}
                subtitle={`${category.itemCount} ${category.itemCount === 1 ? 'item' : 'items'}`}
                title={category.name}
                link={`/category/${category.slug}`}
              />
            ))
          }
          </div>
        </div>
      </div>
    </>
  )
}

export async function getServerSideProps() {
  const categories = await listCategories()
  return withNav({ props: { categories: categories.filter(c => c.itemCount > 0) } })
}

export default Categories
