"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function RegistrationsTabs({ value }: { value: string }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const handleChange = (next: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (next === "ACTIVE") {
            params.delete("status");
        } else {
            params.set("status", next);
        }
        const query = params.toString();
        router.replace(query ? `${pathname}?${query}` : pathname);
    };

    return (
        <Tabs value={value} onValueChange={handleChange}>
            <TabsList>
                <TabsTrigger value="ACTIVE">Aktiv</TabsTrigger>
                <TabsTrigger value="CANCELED">Bekor qilingan</TabsTrigger>
            </TabsList>
        </Tabs>
    );
}
