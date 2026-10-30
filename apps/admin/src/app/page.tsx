import { ApiStatusBadge } from '@/components/api-status-badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function DashboardPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Ziarnista — panel administracyjny</CardTitle>
          <CardDescription>
            Szkielet panelu. Logowanie i moduły pojawią się w fazie 3.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4 text-sm">
          <span className="text-muted-foreground">Status API</span>
          <ApiStatusBadge />
        </CardContent>
      </Card>
    </main>
  );
}
