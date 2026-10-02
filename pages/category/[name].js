import Head from 'next/head'
import ProductBrowser from '../../components/ProductBrowser'
import { siteName } from '../../ecommerce.config'
import { withNav } from '../../lib/nav'
import { getCategory, listProducts, listFacets } from '../../lib/products'

const Category = ({ category, products, facets }) => {
  return (
    <>
      <Head>
        <title>{siteName} - {category.name}</title>
        <meta name="description" content={category.description || `${siteName} - ${category.name}`} />
        <meta property="og:title" content={`${siteName} - ${category.name}`} key="title" />
      </Head>
      <div className="pt-4 pb-8">
        <h1 className="text-5xl font-light">{category.name}</h1>
        {category.description && <p className="mt-2 text-gray-600">{category.description}</p>}
      </div>
      <ProductBrowser products={products} facets={facets} />
    </>
  )
}

export async function getServerSideProps ({ params, query }) {
  const category = await getCategory(params.name)
  if (!category) return { notFound: true }
  const [products, facets] = await Promise.all([
    listProducts({ ...query, category: category.slug }),
    listFacets(category.slug)
  ])
  return withNav({ props: { category, products, facets } })
}

export default Category
