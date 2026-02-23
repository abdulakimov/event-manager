import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

function SkeletonLine({ width }: { width: string }) {
    return <div className={`h-4 ${width} rounded bg-muted animate-pulse`} />;
}

export default function EventRegistrationsLoading() {
    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                    <SkeletonLine width="w-48" />
                    <SkeletonLine width="w-64" />
                </div>
                <SkeletonLine width="w-24" />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Registrations</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Student</TableHead>
                                    <TableHead>Telegram ID</TableHead>
                                    <TableHead>Faculty</TableHead>
                                    <TableHead>Course</TableHead>
                                    <TableHead>Registered At</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {Array.from({ length: 6 }).map((_: undefined, index: number) => (
                                    <TableRow key={index}>
                                        <TableCell>
                                            <SkeletonLine width="w-40" />
                                        </TableCell>
                                        <TableCell>
                                            <SkeletonLine width="w-28" />
                                        </TableCell>
                                        <TableCell>
                                            <SkeletonLine width="w-36" />
                                        </TableCell>
                                        <TableCell>
                                            <SkeletonLine width="w-16" />
                                        </TableCell>
                                        <TableCell>
                                            <SkeletonLine width="w-32" />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
