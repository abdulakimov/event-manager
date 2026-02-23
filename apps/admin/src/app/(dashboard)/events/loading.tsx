import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { uz } from "@/lib/strings.uz";

function SkeletonLine({ width }: { width: string }) {
    return <div className={`h-4 ${width} rounded bg-muted animate-pulse`} />;
}

export default function EventsLoading() {
    return (
        <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                    <SkeletonLine width="w-32" />
                    <SkeletonLine width="w-48" />
                </div>
                <SkeletonLine width="w-28" />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{uz.events}</CardTitle>
                </CardHeader>

                <CardContent>
                    <div className="space-y-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex gap-2">
                                <SkeletonLine width="w-24" />
                                <SkeletonLine width="w-20" />
                            </div>
                            <SkeletonLine width="w-64" />
                        </div>

                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Sarlavha</TableHead>
                                        <TableHead>Tashkilotchi</TableHead>
                                        <TableHead>Boshlanish vaqti</TableHead>
                                        <TableHead>Manzil</TableHead>
                                        <TableHead>{uz.status}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {Array.from({ length: 6 }).map((_value: unknown, index: number) => (
                                        <TableRow key={index}>
                                            <TableCell>
                                                <SkeletonLine width="w-40" />
                                            </TableCell>
                                            <TableCell>
                                                <SkeletonLine width="w-32" />
                                            </TableCell>
                                            <TableCell>
                                                <SkeletonLine width="w-36" />
                                            </TableCell>
                                            <TableCell>
                                                <SkeletonLine width="w-28" />
                                            </TableCell>
                                            <TableCell>
                                                <SkeletonLine width="w-20" />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
