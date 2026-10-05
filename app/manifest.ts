import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Lahari Annapoorna',
    short_name: 'Annapoorna',
    description: 'Traditional Indian Culinary Excellence',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    icons: [
      {
        src: '/backdrop.ico',
        sizes: '288x288',
        type: 'image/x-icon',
      },
    ],
  }
}