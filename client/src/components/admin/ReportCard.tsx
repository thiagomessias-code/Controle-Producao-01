import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

export const ReportCard: React.FC<{ title: string; value: string; trend?: string }> = ({ title, value, trend }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            {trend && <p className="text-xs text-muted-foreground">{trend}</p>}
        </CardContent>
    </Card>
);
