import Head from 'next/head'
import AuthForm from '../components/AuthForm'
import { getUserFromRequest } from '../lib/auth'
import { safeRedirectPath } from '../utils/helpers'
import { siteName } from '../ecommerce.config'
import { withNav } from '../lib/nav'

export default function Login() {
  return (
    <>
      <Head>
        <title>{siteName} - Sign in</title>
      </Head>
      <AuthForm mode="login" />
    </>
  )
}

/* Already signed in? Skip the form. */
export async function getServerSideProps({ req, query }) {
  if (getUserFromRequest(req)) {
    return { redirect: { destination: safeRedirectPath(query.next), permanent: false } }
  }
  return withNav({ props: {} })
}
