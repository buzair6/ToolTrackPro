// buzair6/tooltrackpro/ToolTrackPro-6f84785a6a149e311d88bfdf7ddafe3f8e316550/client/src/pages/inspect-tool.tsx
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus } from "lucide-react";
import AddInspectionModal from "@/components/modals/add-inspection-modal";
import type { Tool } from "@shared/schema";

export default function InspectTool() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toolFilter, setToolFilter] = useState("all");
  const [templateFilter, setTemplateFilter] = useState("all");

  const { data: inspections, isLoading: inspectionsLoading } = useQuery<any[]>({
    queryKey: ["/api/inspections"],
    retry: false,
  });

  const { data: tools, isLoading: toolsLoading } = useQuery<Tool[]>({
    queryKey: ["/api/tools"],
    retry: false,
  });
  
  const uniqueTemplates = useMemo(() => {
    if (!inspections) return [];
    const templatesMap = new Map();
    inspections.forEach(inspection => {
      if (inspection.template) {
        templatesMap.set(inspection.template.id, inspection.template);
      }
    });
    return Array.from(templatesMap.values());
  }, [inspections]);

  const filteredInspections = useMemo(() => {
    if (!inspections) return [];
    return inspections.filter(inspection => {
      const matchesTool = toolFilter === 'all' || inspection.tool?.id.toString() === toolFilter;
      const matchesTemplate = templateFilter === 'all' || inspection.template?.id.toString() === templateFilter;
      return matchesTool && matchesTemplate;
    });
  }, [inspections, toolFilter, templateFilter]);

  return (
    <>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-medium text-gray-900 dark:text-white mb-2">Tool Inspections</h2>
            <p className="text-gray-600 dark:text-gray-400">Create new inspection reports and view past records.</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Inspection
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Past Inspections</CardTitle>
           <CardDescription>
            <div className="flex items-center space-x-2 pt-2">
              <Select value={toolFilter} onValueChange={setToolFilter} disabled={toolsLoading}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by Tool..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tools</SelectItem>
                  {tools?.map(tool => <SelectItem key={tool.id} value={tool.id.toString()}>{tool.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={templateFilter} onValueChange={setTemplateFilter} disabled={!uniqueTemplates.length}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by Checklist..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Checklists</SelectItem>
                   {uniqueTemplates.map(template => <SelectItem key={template.id} value={template.id.toString()}>{template.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tool</TableHead>
                <TableHead>Checklist</TableHead>
                <TableHead>Inspector</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inspectionsLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  </TableRow>
                ))
              ) : filteredInspections.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No past inspections found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredInspections.map((inspection) => (
                  <TableRow key={inspection.id}>
                    <TableCell className="font-medium">{inspection.tool?.name || "N/A"}</TableCell>
                    <TableCell>{inspection.template?.name || "N/A"}</TableCell>
                    <TableCell>{inspection.inspector?.firstName || "N/A"} {inspection.inspector?.lastName || ""}</TableCell>
                    <TableCell>{format(new Date(inspection.inspectionDate), "MMM dd, yyyy")}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AddInspectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}