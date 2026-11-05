import { useState, type ImgHTMLAttributes } from 'react'
import { ImageOff } from 'lucide-react'
import manifest from '../../data/images.generated.json'

export interface ImageAsset {
  id: string
  country: string
  place: string
  alt: string
  file: string
  width: number
  height: number
  widths: number[]
  color: string
  author: string
  license: string
  licenseUrl: string | null
  sourceUrl: string
}

export const IMAGES = manifest as Record<string, ImageAsset>

export const srcSetFor = (asset: ImageAsset) =>
  asset.widths.map((width) => `/images/${asset.id}-${width}.webp ${width}w`).join(', ')

interface PhotoProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet' | 'width' | 'height'> {
  id: string
  /** Decorative images pass an empty alt; otherwise the manifest provides one. */
  alt?: string
  priority?: boolean
}

export function Photo({ id, alt, priority, sizes = '100vw', className = '', ...rest }: PhotoProps) {
  const [failed, setFailed] = useState(false)
  const asset = IMAGES[id]

  if (!asset || failed) {
    return (
      <div
        role={alt === '' ? undefined : 'img'}
        aria-label={alt === '' ? undefined : (asset?.alt ?? 'Imagen no disponible')}
        className={`flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-ocean-800 to-aqua-600 text-ivory/80 ${className}`}
      >
        <ImageOff aria-hidden className="size-6" />
        {asset && <span className="px-4 text-center text-sm">{asset.place}</span>}
      </div>
    )
  }

  return (
    <img
      {...rest}
      src={`/images/${asset.id}-${asset.widths.at(-1)}.webp`}
      srcSet={srcSetFor(asset)}
      sizes={sizes}
      width={asset.width}
      height={asset.height}
      alt={alt ?? asset.alt}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : undefined}
      decoding="async"
      onError={() => setFailed(true)}
      style={{ backgroundColor: asset.color, ...rest.style }}
      className={`object-cover ${className}`}
    />
  )
}
