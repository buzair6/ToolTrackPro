// buzair6/tooltrackpro/ToolTrackPro-6f84785a6a149e311d88bfdf7ddafe3f8e316550/client/src/pages/inspect-tool.tsx
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient, getQueryFn } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import type { Tool, ChecklistTemplateWithItems } from "@shared/schema";

export default function InspectTool() {
  const { toast } = useToast();
  const [selectedToolId, setSelectedToolId] = useState<string>("");
  const [inspectionValues, setInspectionValues] = useState<Record<number, any>>({});

  const { data: tools, isLoading: toolsLoading } = useQuery<Tool[]>({
    queryKey: ["/api/tools"],
    retry: false,
  });

  const { data: checklist, isLoading: checklistLoading } = useQuery<ChecklistTemplateWithItems>({
    queryKey: [`/api/tools/${selectedToolId}/checklist`],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!selectedToolId,
    retry: false,
  });

  const inspectionMutation = useMutation({
    mutationFn: async () => {
      if (!checklist) return;

      const items = checklist.items.map(item => ({
        templateItemId: item.id,
        ...inspectionValues[item.id],
      }));
      
      const payload = {
        toolId: parseInt(selectedToolId, 10),
        templateId: checklist.id,
        items,
      };

      await apiRequest("POST", "/api/inspections", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tools", selectedToolId, "inspections"] });
      toast({
        title: "Success",
        description: "Inspection submitted successfully.",
      });
      setSelectedToolId("");
      setInspectionValues({});
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to submit inspection: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleValueChange = (itemId: number, type: string, value: any) => {
    let valuePayload = {};
    switch (type) {
      case 'tick':
        valuePayload = { valueBoolean: value };
        break;
      case 'value':
        valuePayload = { valueText: value };
        break;
      case 'image':
        valuePayload = { valueImageUrl: value };
        break;
    }
    setInspectionValues(prev => ({
      ...prev,
      [itemId]: valuePayload,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    inspectionMutation.mutate();
  };

  const renderChecklistItem = (item: ChecklistTemplateWithItems['items'][0]) => {
    switch (item.type) {
      case 'tick':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`item-${item.id}`}
              checked={inspectionValues[item.id]?.valueBoolean || false}
              onCheckedChange={(checked) => handleValueChange(item.id, item.type, checked)}
            />
            <Label htmlFor={`item-${item.id}`}>{item.label}</Label>
          </div>
        );
      case 'value':
        return (
          <div className="space-y-2">
            <Label htmlFor={`item-${item.id}`}>{item.label}</Label>
            <Textarea
              id={`item-${item.id}`}
              placeholder="Enter value..."
              value={inspectionValues[item.id]?.valueText || ""}
              onChange={(e) => handleValueChange(item.id, item.type, e.target.value)}
            />
          </div>
        );
      case 'image':
        return (
          <div className="space-y-2">
            <Label htmlFor={`item-${item.id}`}>{item.label}</Label>
            <Input id={`item-${item.id}`} type="file" disabled />
            <p className="text-xs text-muted-foreground">Image upload is not yet supported.</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-medium text-gray-900 dark:text-white mb-2">Inspect Tool</h2>
        <p className="text-gray-600 dark:text-gray-400">Select a tool and complete the inspection checklist.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Select a Tool</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>Tool</Label>
                <Select value={selectedToolId} onValueChange={setSelectedToolId} disabled={toolsLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder={toolsLoading ? "Loading tools..." : "Select a tool..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {tools?.map(tool => (
                      <SelectItem key={tool.id} value={tool.id.toString()}>
                        {tool.name} ({tool.toolId})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          {selectedToolId && (
            <Card>
              <CardHeader>
                <CardTitle>Inspection Checklist</CardTitle>
                <CardDescription>
                  {checklistLoading ? "Loading checklist..." : checklist?.name || "No checklist assigned to this tool."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {checklistLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : checklist ? (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {checklist.items.map((item) => (
                      <div key={item.id} className="p-4 border rounded-md">
                        {renderChecklistItem(item)}
                      </div>
                    ))}
                    <Button type="submit" disabled={inspectionMutation.isPending}>
                      {inspectionMutation.isPending ? "Submitting..." : "Submit Inspection"}
                    </Button>
                  </form>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    This tool does not have an inspection checklist assigned.
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}