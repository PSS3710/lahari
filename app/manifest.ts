import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Lahari Annapoorna',
    short_name: 'Lahari Annapoorna',
    description: "The official digital archive of Annapoorna's music. Explore a beautiful collection of her original songs and sayings.",
    start_url: '/',
    display: 'standalone',
    background_color: '#FBF6EE',
    theme_color: '#5B1F1F',
    icons: [
      {
        src: '/backdropp192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/backdropp512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}