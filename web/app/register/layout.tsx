import { PublicOnlyRoute } from "@/components/PublicOnlyRoute";

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <PublicOnlyRoute>{children}</PublicOnlyRoute>;
}
