export default function Home() {
  return (
    <div className="container mx-auto py-6 px-4">
      <section className="text-center py-12">
        <h1 className="text-4xl font-bold mb-4">Welcome to Gunpla Community</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Your go-to platform for discovering, rating, and discussing Gunpla kits.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="p-6 border rounded-lg">
            <h3 className="text-xl font-semibold mb-2">Discover</h3>
            <p className="text-muted-foreground">
              Browse through our extensive collection of Gunpla kits
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h3 className="text-xl font-semibold mb-2">Rate & Review</h3>
            <p className="text-muted-foreground">
              Share your thoughts and experiences with the community
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h3 className="text-xl font-semibold mb-2">Track</h3>
            <p className="text-muted-foreground">
              Keep track of your wanted kits and share your collection
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
