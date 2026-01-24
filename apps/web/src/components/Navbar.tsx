'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';

// Dynamic import of PhantomWalletButton with SSR disabled
// This ensures the Phantom SDK hooks only run on the client
const PhantomWalletButton = dynamic(
  () => import('./PhantomWalletButton').then((mod) => mod.PhantomWalletButton),
  { ssr: false }
);

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 animate-slide-down">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Link href="/">
              <div className="w-12 h-12 rounded-xl bg-dark border-2 border-dark flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer">
                <img
                  src="/frog-logo.svg"
                  alt="Logo"
                  className="w-[70%] h-[70%] object-contain"
                />
              </div>
            </Link>
          </div>

          {/* Center Links */}
          <div className="hidden md:flex items-center bg-white/80 backdrop-blur-sm px-2 py-1 rounded-2xl border-2 border-dark shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <NavLink href="/dashboard">Dashboard</NavLink>
            <NavLink href="/markets">Markets</NavLink>
            <NavLink href="/agent">AI Agent</NavLink>
          </div>

          {/* Phantom Wallet Button */}
          <div>
            <PhantomWalletButton />
          </div>
        </div>
      </div>
    </nav>
  );
};

const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <Link
    href={href}
    className="px-5 py-2 font-bold text-sm text-dark/80 hover:text-dark transition-colors relative group"
  >
    {children}
    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-neon-green group-hover:w-3/4 transition-all duration-300" />
  </Link>
);

export default Navbar;
