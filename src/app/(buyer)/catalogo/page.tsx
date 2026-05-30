import { auth } from "@/lib/auth";
import CardSearch from "@/components/CardSearch";

export default async function CatalogoPage() {
  const session = await auth();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Catálogo de Cartas</h1>
      <CardSearch userId={session!.user.id} />
    </div>
  );
}
