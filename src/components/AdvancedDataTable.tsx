import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronLeft, ChevronRight, Columns3, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Column {
  header: string;
  accessor: string;
  cell?: (value: any, row: any) => React.ReactNode;
}

interface AdvancedDataTableProps {
  columns: Column[];
  data: any[];
  isLoading?: boolean;
  searchable?: boolean;
  onRowClick?: (row: any) => void;
}

export const AdvancedDataTable = ({ 
  columns, 
  data, 
  isLoading,
  searchable = false,
  onRowClick
}: AdvancedDataTableProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(columns.map(col => col.accessor))
  );
  const [searchQuery, setSearchQuery] = useState("");

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

  // Filter data based on search
  const filteredData = searchable && searchQuery
    ? data.filter(row => 
        Object.values(row).some(value => 
          String(value).toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    : data;

  // Pagination
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  // Toggle column visibility
  const toggleColumn = (accessor: string) => {
    const newVisible = new Set(visibleColumns);
    if (newVisible.has(accessor)) {
      newVisible.delete(accessor);
    } else {
      newVisible.add(accessor);
    }
    setVisibleColumns(newVisible);
  };

  // Visible columns only
  const displayColumns = columns.filter(col => visibleColumns.has(col.accessor));

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between">
        {searchable && (
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1); // Reset to first page on search
              }}
              className="pl-8"
            />
          </div>
        )}
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Columns3 className="mr-2 h-4 w-4" />
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {columns.map((column) => (
              <DropdownMenuCheckboxItem
                key={column.accessor}
                checked={visibleColumns.has(column.accessor)}
                onCheckedChange={() => toggleColumn(column.accessor)}
              >
                {column.header}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table */}
      <div className="w-full overflow-auto">
        <ScrollArea className="h-[400px] md:h-[500px] rounded-md border">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                {displayColumns.map((column) => (
                  <TableHead key={column.accessor} className="font-semibold whitespace-nowrap text-xs md:text-sm">
                    {column.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((row, idx) => (
                <TableRow 
                  key={idx} 
                  className={`hover:bg-muted/50 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                  onClick={() => onRowClick?.(row)}
                >
                  {displayColumns.map((column) => (
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

      {/* Pagination */}
      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-muted-foreground">
          Showing {startIndex + 1}-{Math.min(endIndex, filteredData.length)} of {filteredData.length}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-sm">
            Page {currentPage} of {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
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
