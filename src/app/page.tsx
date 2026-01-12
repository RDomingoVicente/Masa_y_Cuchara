export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">
          Masa & Cuchara
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Sistema de pedidos online
        </p>
        <div className="space-x-4">
          <a
            href="/menu"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Ver Menú
          </a>
        </div>
      </div>
    </div>
  );
}
