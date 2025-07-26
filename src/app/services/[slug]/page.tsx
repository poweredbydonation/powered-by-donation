interface ServicePageProps {
  params: {
    slug: string
  }
}

export default function ServicePage({ params }: ServicePageProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Service: {params.slug}</h1>
      <p className="text-gray-600">Coming soon - Individual service page with details, provider info, and donation options.</p>
    </div>
  )
}