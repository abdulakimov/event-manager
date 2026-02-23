"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function UserRegistrationsTabs({ value }: { value: string }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const handleChange = (next: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (next === "active") {
            params.delete("tab");
        } else {
            params.set("tab", next);
        }
        const query = params.toString();
        router.replace(query ? `${pathname}?${query}` : pathname);
    };

    return (
        <Tabs value={value} onValueChange={handleChange}>
            <TabsList>
                <TabsTrigger value="active">Aktiv</TabsTrigger>
                <TabsTrigger value="past">O'tgan</TabsTrigger>
                <TabsTrigger value="canceled">Bekor qilingan</TabsTrigger>
            </TabsList>
        </Tabs>
    );
}
