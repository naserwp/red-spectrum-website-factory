import Link from "next/link";
import Image from "next/image";

export function FactoryHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-300 bg-white/95 backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-[1440px] items-center justify-between gap-5 px-5 sm:px-8 lg:px-12">
        <Link
          href="/"
          className="flex items-center gap-3 font-black tracking-tight focus:outline-none focus:ring-2 focus:ring-[#bd1e2c]"
        >
          <Image
            src="/brand/red-spectrum/logo-light.png"
            alt="Red Spectrum"
            width={758}
            height={199}
            className="h-auto w-36 sm:w-48"
          />
        </Link>
        <nav
          aria-label="Factory navigation"
          className="flex items-center gap-1 text-sm font-bold sm:gap-3"
        >
          <Link
            className="px-2 py-3 hover:text-[#bd1e2c]"
            href="/#templates-heading"
          >
            Templates
          </Link>
          <Link className="px-2 py-3 hover:text-[#bd1e2c]" href="/brief">
            Brief
          </Link>
          <Link
            className="hidden px-2 py-3 hover:text-[#bd1e2c] sm:block"
            href="/standards"
          >
            Standards
          </Link>
        </nav>
      </div>
    </header>
  );
}
