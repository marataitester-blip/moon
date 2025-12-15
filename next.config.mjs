/** @type {import('next').NextConfig} */
const nextConfig = {
  // Разрешаем загрузку картинок с любых источников (для нейросетей)
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
