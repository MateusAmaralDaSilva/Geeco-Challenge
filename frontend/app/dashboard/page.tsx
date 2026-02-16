import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export default async function DashboardPage() {
    const supabase = await createSupabaseServerClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    return (
            <div className="p-10">
            <h1 className="text-3xl font-bold mb-6">
                Dashboard
            </h1>
            <p>Usuário autenticado: {user.email}</p>
        </div>
    );
}
