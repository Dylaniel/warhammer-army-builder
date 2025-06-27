export default function Header() {
  return (
    <header className="bg-gray-800 bg-opacity-90 flex items-center justify-between px-4 h-16">
      <h1 className="text-xl font-bold uppercase tracking-wider">Battle Forge</h1>
      <button className="p-2 rounded-full hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-500">
        {/* three-dots icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-gray-300 hover:text-white"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M6 10a2 2 0 100-4 2 2 0 000 4zm4 0a2 2 0 100-4 2 2 0 000 4zm4 0a2 2 0 100-4 2 2 0 000 4z" />
        </svg>
      </button>
    </header>
  );
}
