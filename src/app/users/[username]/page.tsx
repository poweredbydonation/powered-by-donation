interface UserPageProps {
  params: {
    username: string
  }
}

export default function UserPage({ params }: UserPageProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">User: {params.username}</h1>
      <p className="text-gray-600">Coming soon - User profile page for both providers and supporters.</p>
    </div>
  )
}