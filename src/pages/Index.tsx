import { useAuth } from "@/contexts/AuthContext";

export default function Index() {
  const { tenantUser } = useAuth();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
      <p className="text-muted-foreground">
        Selamat datang{tenantUser ? `, ${tenantUser.name}` : ""}! Halaman dashboard akan segera hadir.
      </p>
    </div>
  );
}
