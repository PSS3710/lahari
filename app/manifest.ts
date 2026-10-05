import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Lahari Annapoorna',
    short_name: 'Annapoorna',
    description: "The official digital archive of Annapoorna's music. Explore a beautiful collection of her original songs and sayings.",
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    icons: [
      {
        src: '/backdrop (2).ico',
        sizes: '256x256',
        type: 'image/x-icon',
      },
    ],
  }
}