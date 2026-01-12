/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración para TypeScript estricto
  typescript: {
    ignoreBuildErrors: false,
  },
  // Configuración para ES Modules
  experimental: {
    esmExternals: true,
  },
};

export default nextConfig;
