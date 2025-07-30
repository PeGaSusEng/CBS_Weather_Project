import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";  

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();              


  const isActive = (href: string) => router.pathname === href;

  return (
    <nav
      className="fixed top-0 left-0 w-full z-50 text-white px-6 py-4 font-semibold"
      style={{
        background: "radial-gradient(circle at center,rgb(81, 17, 228) 0%, #5353a5 100%)",
      }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image
            src="/logos/logo.png"
            alt="Logo CBM"
            width={60}
            height={60}
            className="w-[60px] h-auto"
          />
          <span className="text-xl hidden sm:inline">CBS Weather System</span>
        </div>

        <div className="hidden md:flex space-x-10 text-lg tracking-wide">
          {[
            { href: "/", label: "HOME" },
            { href: "/Page_deteksi_awan", label: "DETEKSI AWAN" },
            { href: "/Page_prediksi_hujan", label: "PREDIKSI HUJAN" },
            { href: "/Page_panduan", label: "PANDUAN" },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`
                transition-all duration-300 active:scale-95
                hover:text-yellow-500
                ${isActive(href) ? "text-yellow-500" : ""}
              `}
            >
              {label}
            </Link>
          ))}
        </div>

        <button
          className="md:hidden text-2xl focus:outline-none"
          onClick={() => setIsOpen(!isOpen)}
        >
          ☰
        </button>
      </div>

      {isOpen && (
        <div className="md:hidden mt-4 flex flex-col space-y-3 text-center text-base">
          {[
            { href: "/", label: "HOME" },
            { href: "/Page_deteksi_awan", label: "DETEKSI AWAN" },
            { href: "/Page_prediksi_hujan", label: "PREDIKSI HUJAN" },
            { href: "/Page_panduan", label: "PANDUAN" },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`
                transition-all duration-300 active:scale-95
                hover:text-yellow-500
                ${isActive(href) ? "text-yellow-500" : ""}
              `}
            >
              {label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
