import { PublicOnlyRoute } from "@/components/PublicOnlyRoute";

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <PublicOnlyRoute>{children}</PublicOnlyRoute>;
}
