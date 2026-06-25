import Link from "next/link";
import { Building2, Droplet, UserPlus } from "lucide-react";
import { Card } from "@/components/ui/Card";

export default function RegisterChoicePage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col px-4 py-16">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-600 text-white shadow-lifted">
        <UserPlus className="h-5 w-5" />
      </span>
      <h1 className="mt-4 text-center text-2xl font-bold text-zinc-900">How would you like to register?</h1>
      <p className="mt-1 text-center text-sm text-zinc-500">Choose the option that fits you best.</p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <Link href="/register/donor" className="rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600">
          <Card className="flex h-full flex-col gap-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lifted">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-600">
              <Droplet className="h-5 w-5" />
            </span>
            <h2 className="text-lg font-semibold text-zinc-900">I want to donate blood</h2>
            <p className="text-sm text-zinc-500">
              Register as a voluntary donor. Get notified instantly when someone nearby needs your blood type.
            </p>
          </Card>
        </Link>
        <Link href="/register/organization" className="rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600">
          <Card className="flex h-full flex-col gap-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lifted">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-600">
              <Building2 className="h-5 w-5" />
            </span>
            <h2 className="text-lg font-semibold text-zinc-900">I represent a hospital or blood bank</h2>
            <p className="text-sm text-zinc-500">
              Post emergency blood requests, manage inventory, and reach compatible donors near you.
            </p>
          </Card>
        </Link>
      </div>
    </div>
  );
}
