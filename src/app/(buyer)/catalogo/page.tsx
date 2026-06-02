import { auth } from "@/lib/auth";
import CardCatalog from "@/components/CardCatalog";

export default async function CatalogoPage() {
  const session = await auth();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Catálogo de Cartas</h1>
      <CardCatalog userId={session!.user.id} />
    </div>
  );
}
