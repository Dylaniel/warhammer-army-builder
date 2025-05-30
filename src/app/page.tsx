export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-center">Warhammer Army Builder</h1>
        <p className="text-center text-gray-600 mt-2">Create and manage your Warhammer armies</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Army List Card */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Create New Army</h2>
          <p className="text-gray-600 mb-4">Start building a new army list from scratch</p>
          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
            Create Army
          </button>
        </div>

        {/* Saved Armies Card */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Saved Armies</h2>
          <p className="text-gray-600 mb-4">View and edit your saved army lists</p>
          <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors">
            View Armies
          </button>
        </div>

        {/* Reference Card */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Rules Reference</h2>
          <p className="text-gray-600 mb-4">Quick access to army building rules and points values</p>
          <button className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors">
            View Rules
          </button>
        </div>
      </div>
    </div>
  )
} 