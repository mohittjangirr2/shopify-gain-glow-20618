import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface Column {
  header: string;
  accessor: string;
  cell?: (value: any, row: any) => React.ReactNode;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  isLoading?: boolean;
}

export const DataTable = ({ columns, data, isLoading }: DataTableProps) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading data...</div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">No data available</div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-auto">
      <ScrollArea className="h-[400px] md:h-[500px] rounded-md border">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.accessor} className="font-semibold whitespace-nowrap text-xs md:text-sm">
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, idx) => (
              <TableRow key={idx} className="hover:bg-muted/50 transition-colors">
                {columns.map((column) => (
                  <TableCell key={column.accessor} className="whitespace-nowrap text-xs md:text-sm">
                    {column.cell ? column.cell(row[column.accessor], row) : row[column.accessor]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
};

export const StatusBadge = ({ status }: { status: string }) => {
  const variants: Record<string, any> = {
    paid: "default",
    pending: "secondary",
    refunded: "destructive",
    fulfilled: "default",
    unfulfilled: "secondary",
    delivered: "default",
    rto: "destructive",
  };

  return (
    <Badge variant={variants[status.toLowerCase()] || "secondary"}>
      {status}
    </Badge>
  );
};
