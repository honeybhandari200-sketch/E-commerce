import { useRef } from 'react'
import '../styles/globals.css'
import Layout from '../layouts/layout'
import { ContextProviderComponent } from '../context/mainContext'
import { AuthProvider } from '../context/authContext'

function Ecommerce({ Component, pageProps }) {
  // Pages add navCategories via withNav() in getServerSideProps. Keep the last
  // list so pages without it (e.g. the 404 page) still show the menu.
  const navCategories = useRef([])
  if (pageProps.navCategories) navCategories.current = pageProps.navCategories

  return (
    <AuthProvider>
      <ContextProviderComponent>
        <Layout categories={navCategories.current}>
          <Component {...pageProps} />
        </Layout>
      </ContextProviderComponent>
    </AuthProvider>
  )
}

export default Ecommerce
