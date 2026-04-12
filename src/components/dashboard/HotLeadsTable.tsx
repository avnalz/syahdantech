import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Tables } from "@/integrations/supabase/types";

interface HotLeadsTableProps {
  leads: Tables<"contacts">[];
}

export function HotLeadsTable({ leads }: HotLeadsTableProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Hot Leads Terbaru</CardTitle>
      </CardHeader>
      <CardContent>
        {leads.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Belum ada hot leads.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>No. HP</TableHead>
                <TableHead>Lead Score</TableHead>
                <TableHead>Sinyal</TableHead>
                <TableHead>Terakhir Chat</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium">
                    {lead.name || "—"}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {lead.phone_number}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-bold">
                      {lead.lead_score}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                    {lead.lead_score_signals || "—"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDate(lead.last_chat_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline">
                      <MessageSquare className="h-3.5 w-3.5 mr-1" />
                      Balas
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
