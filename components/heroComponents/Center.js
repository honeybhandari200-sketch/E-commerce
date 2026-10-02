import { Button } from '../';
import { useRouter } from 'next/router'

const Center = ({ price, title, link }) => {
  const router = useRouter()
  function navigate() {
    router.push(link)
  }
  return (
    <div>
      <p className="text-3xl sm:text-4xl xl:text-5xl font-bold tracking-wider sm:tracking-widest leading-tight sm:leading-none">{title}</p>
      <p className="py-6 tracking-wide">FROM <span>${price}</span></p>
      <Button
        onClick={navigate}
        title="Shop Now"
      />
    </div>
  )
}

export default Center