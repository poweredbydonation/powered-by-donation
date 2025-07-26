interface LocationPageProps {
  params: {
    location: string
  }
}

export default function LocationPage({ params }: LocationPageProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Location: {params.location}</h1>
      <p className="text-gray-600">Coming soon - Services filtered by location with local SEO optimization.</p>
    </div>
  )
}