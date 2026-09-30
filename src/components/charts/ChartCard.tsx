/**
 * Project Kuma - ChartCard Container Wrapper
 * Standardized container with title, description, legend slot, "View as table" toggle, and CSV export.
 */

import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '../ui/Table';
import { InlineAlert } from '../ui/Feedback';
import { Table as TableIcon, BarChart2, Download } from 'lucide-react';

export interface ChartCardProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  legend?: React.ReactNode;
  tableData?: Array<Record<string, any>>;
  tableHeaders?: string[];
  exportFileName?: string;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  description,
  children,
  legend,
  tableData = [],
  tableHeaders,
  exportFileName = 'chart-data',
  isLoading = false,
  error = null,
  className,
}) => {
  const [showTable, setShowTable] = useState(false);

  const handleExportCsv = () => {
    if (!tableData || tableData.length === 0) return;
    const keys = tableHeaders || Object.keys(tableData[0]);
    let csv = keys.join(',') + '\n';

    tableData.forEach((row) => {
      const line = keys.map((k) => `"${row[k] ?? ''}"`).join(',');
      csv += line + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${exportFileName}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className={className}>
      <div className="p-6 space-y-4">
        {/* Header with Title, Description, and Actions */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-2 border-b border-border">
          <div>
            <h3 className="text-base font-semibold text-text-primary">{title}</h3>
            {description && <p className="text-xs text-text-secondary mt-1">{description}</p>}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {tableData.length > 0 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowTable(!showTable)}
                aria-label={showTable ? 'View as chart' : 'View as data table'}
              >
                {showTable ? (
                  <>
                    <BarChart2 className="h-4 w-4 mr-1.5" /> View Chart
                  </>
                ) : (
                  <>
                    <TableIcon className="h-4 w-4 mr-1.5" /> View as table
                  </>
                )}
              </Button>
            )}

            {tableData.length > 0 && (
              <Button variant="ghost" size="sm" onClick={handleExportCsv} aria-label="Export chart data as CSV">
                <Download className="h-4 w-4 mr-1.5" /> Export
              </Button>
            )}
          </div>
        </div>

        {/* Legend Slot */}
        {legend && <div className="py-1">{legend}</div>}

        {/* Error State */}
        {error && <InlineAlert variant="danger">{error}</InlineAlert>}

        {/* Loading State */}
        {isLoading ? (
          <div className="py-12 text-center text-xs text-text-secondary animate-pulse">
            Loading chart visualization...
          </div>
        ) : showTable && tableData.length > 0 ? (
          /* ACCESSIBLE DATA TABLE ALTERNATIVE */
          <div className="border border-border rounded-container overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {(tableHeaders || Object.keys(tableData[0])).map((h, i) => (
                    <TableHead key={i} className="capitalize">
                      {h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableData.map((row, idx) => (
                  <TableRow key={idx}>
                    {(tableHeaders || Object.keys(tableData[0])).map((k, colIdx) => (
                      <TableCell key={colIdx} className="text-xs font-mono">
                        {String(row[k] ?? '')}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          /* VISUAL CHART SLOT */
          <div>{children}</div>
        )}
      </div>
    </Card>
  );
};
