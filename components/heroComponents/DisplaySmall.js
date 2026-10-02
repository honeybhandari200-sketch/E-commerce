import Link from 'next/link'
import { getTrimmedString } from '../../utils/helpers'
import Image from '../Image'

const DisplaySmall = ({ link, title, subtitle, imageSrc }) =>  (
  <div className="bg-light px-6 pt-8 pb-2 hover:bg-light-200 transition-colors">
    <Link href={link}>
      <a aria-label={title}>
        <div className="flex justify-center items-center h-32 mb-4">
          <Image alt={title} src={imageSrc} className="w-3/5" />
        </div>
        <div className="">
          <p className="text-xl font-semibold mb-1">{title}</p>
          <p className="text-xs text-gray-700 mb-4">{getTrimmedString(subtitle, 150)}</p>
        </div>
      </a>
    </Link>
  </div>
)

export default DisplaySmall