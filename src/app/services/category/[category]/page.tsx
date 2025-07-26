interface CategoryPageProps {
  params: {
    category: string
  }
}

export default function CategoryPage({ params }: CategoryPageProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Category: {params.category}</h1>
      <p className="text-gray-600">Coming soon - Services filtered by category with SEO optimization.</p>
    </div>
  )
}