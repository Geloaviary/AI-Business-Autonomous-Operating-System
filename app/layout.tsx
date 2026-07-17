import './globals.css';
import Nav from '../components/Nav';

export const metadata = {
  title: 'AIBAOS — Executive Headquarters',
  description: 'The Executive Headquarters of an AI Autonomous Company.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <div className="flex min-h-screen">
          <Nav />
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </body>
    </html>
  );
}
