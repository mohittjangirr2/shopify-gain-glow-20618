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
import { ChevronLeft, ChevronRight, Columns3, Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
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
  const [sortConfig, setSortConfig] = useState<{ accessor: string; direction: 'asc' | 'desc' } | null>(null);

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

  // Sort data
  const sortedData = sortConfig
    ? [...filteredData].sort((a, b) => {
        const aVal = a[sortConfig.accessor];
        const bVal = b[sortConfig.accessor];
        
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;
        
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
        }
        
        const aStr = String(aVal).toLowerCase();
        const bStr = String(bVal).toLowerCase();
        
        if (sortConfig.direction === 'asc') {
          return aStr < bStr ? -1 : aStr > bStr ? 1 : 0;
        } else {
          return aStr > bStr ? -1 : aStr < bStr ? 1 : 0;
        }
      })
    : filteredData;

  const handleSort = (accessor: string) => {
    setSortConfig(current => {
      if (!current || current.accessor !== accessor) {
        return { accessor, direction: 'asc' };
      }
      if (current.direction === 'asc') {
        return { accessor, direction: 'desc' };
      }
      return null;
    });
  };

  // Pagination
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = sortedData.slice(startIndex, endIndex);

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
      <div className="w-full overflow-x-auto">
        <ScrollArea className="h-[400px] md:h-[500px] rounded-md border">
          <div className="min-w-max">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  {displayColumns.map((column) => (
                    <TableHead key={column.accessor} className="font-semibold whitespace-nowrap text-xs md:text-sm">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2"
                        onClick={() => handleSort(column.accessor)}
                      >
                        {column.header}
                        {sortConfig?.accessor === column.accessor ? (
                          sortConfig.direction === 'asc' ? (
                            <ArrowUp className="ml-2 h-4 w-4" />
                          ) : (
                            <ArrowDown className="ml-2 h-4 w-4" />
                          )
                        ) : (
                          <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
                        )}
                      </Button>
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
          </div>
        </ScrollArea>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-muted-foreground">
          Showing {startIndex + 1}-{Math.min(endIndex, sortedData.length)} of {sortedData.length}
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
