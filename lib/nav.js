// Server-only: adds the store's categories to a page's props so the header and
// footer can link to them. Use in getServerSideProps: `return withNav({ props })`.
import { listCategories } from './products'

async function withNav(result) {
  if (!result.props) return result
  const categories = await listCategories()
  const navCategories = categories
    .filter(c => c.itemCount > 0)
    .map(c => ({ slug: c.slug, name: c.name }))
  return { ...result, props: { ...result.props, navCategories } }
}

export { withNav }
