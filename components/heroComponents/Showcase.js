import Image from '../Image'

const Showcase = ({ imageSrc }) => {
  return (
    <div className="z-10 w-full flex justify-center">
      <Image src={imageSrc} className="w-full max-w-136" alt="Showcase item" />
    </div>
  )
}

export default Showcase