import './globals.css';

export const metadata = {
  title: 'LUNA',
  description: 'Private Messenger',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'LUNA',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body className="bg-black text-white overscroll-none">
        {children}
      </body>
    </html>
  );
}
