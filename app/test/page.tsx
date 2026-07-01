"use client";
export const dynamic = 'force-dynamic';

import { Button } from "@/components/ui/Button";
import { Plus, Trash2 } from "lucide-react";

export default function TestPage() {
    return <div className="p-8 space-y-4">
        <h1 className="text-2xl font-bold mb-6">Button Component Test</h1>

        <div className="space-y-4">
            <div className="space-x-4">
                <Button variant="primary">Primary Button</Button>
                <Button variant="secondary">Secondary Button</Button>
                <Button variant="danger">Danger Button</Button>
                <Button variant="ghost">Ghost Button</Button>
                <Button variant="outline">Outline Button</Button>
            </div>

            <div className="space-x-4">
                <Button size="sm">Small Button</Button>
                <Button size="md">Medium Button</Button>
                <Button size="lg">Large Button</Button>
            </div>

            <div className="space-x-4">
                <Button>With Left Icon</Button>
                <Button>With Right Icon</Button>
            </div>

            <div className="space-x-4">
                <Button loading>Loading State</Button>
                <Button disabled>Disabled Button</Button>
                <Button fullWidth>Full Width Button</Button>
            </div>
        </div>
    </div>;
}
