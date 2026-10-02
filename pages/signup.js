import Head from 'next/head'
import AuthForm from '../components/AuthForm'
import { getUserFromRequest } from '../lib/auth'
import { safeRedirectPath } from '../utils/helpers'
import { siteName } from '../ecommerce.config'
import { withNav } from '../lib/nav'

export default function Signup() {
  return (
    <>
      <Head>
        <title>{siteName} - Create account</title>
      </Head>
      <AuthForm mode="signup" />
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
