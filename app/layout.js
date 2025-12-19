import './globals.css';

export const metadata = {
  title: 'LUNA',
  description: 'Private connection',
  manifest: '/manifest.json', // Ссылка на ваш паспорт
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false, 
  },
  themeColor: '#000000',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Современный тег для мобильных приложений */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="bg-black text-white antialiased">
        {children}
      </body>
    </html>
  );
}
