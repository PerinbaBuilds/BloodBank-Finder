import Link from "next/link";
import { Droplet, HeartPulse, ShieldCheck } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-zinc-50">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
          <div className="max-w-sm">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-600 text-white">
                <Droplet className="h-3.5 w-3.5" fill="currentColor" strokeWidth={1.5} />
              </span>
              <span className="text-base font-bold tracking-tight text-zinc-900">BloodBank Finder</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-zinc-500">
              Connecting voluntary donors, hospitals, and blood banks in real time to resolve urgent blood
              shortages — wherever you are.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:flex sm:gap-12">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">For Donors</p>
              <ul className="mt-3 flex flex-col gap-2 text-sm text-zinc-600">
                <li>
                  <Link href="/register/donor" className="hover:text-red-600">
                    Become a donor
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-red-600">
                    Log in
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">For Organizations</p>
              <ul className="mt-3 flex flex-col gap-2 text-sm text-zinc-600">
                <li>
                  <Link href="/register/organization" className="hover:text-red-600">
                    Register hospital / blood bank
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-red-600">
                    Log in
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-zinc-200 pt-6 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} BloodBank Finder. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" />
              Verified organizations only
            </span>
            <span className="inline-flex items-center gap-1.5">
              <HeartPulse className="h-3.5 w-3.5" />
              Built for emergencies — always confirm details with the requesting hospital.
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
