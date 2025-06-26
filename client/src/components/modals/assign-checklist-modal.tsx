import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient, getQueryFn } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { ChecklistTemplateWithItems, Tool } from "@shared/schema";

interface AssignChecklistModalProps {
  tool: Tool;
  onClose: () => void;
}

export default function AssignChecklistModal({ tool, onClose }: AssignChecklistModalProps) {
  const { toast } = useToast();
  const [selectedTemplateId, setSelectedTemplateId] = useState("");

  const { data: templates, isLoading: templatesLoading } = useQuery<ChecklistTemplateWithItems[]>({
    queryKey: ["/api/checklist-templates"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
  });

  const { data: assignedChecklist, isLoading: assignedLoading } = useQuery<ChecklistTemplateWithItems>({
    queryKey: [`/api/tools/${tool.id}/checklist`],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!tool,
    retry: false,
  });

  useEffect(() => {
    if (assignedChecklist) {
      setSelectedTemplateId(assignedChecklist.id.toString());
    }
  }, [assignedChecklist]);

  const mutation = useMutation({
    mutationFn: async (templateId: string) => {
      await apiRequest("POST", `/api/tools/${tool.id}/checklist`, { templateId: parseInt(templateId, 10) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tools/${tool.id}/checklist`] });
      toast({
        title: "Success",
        description: "Checklist assigned successfully.",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to assign checklist: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplateId) {
        toast({ title: "Error", description: "Please select a template.", variant: "destructive" });
        return;
    }
    mutation.mutate(selectedTemplateId);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Checklist to "{tool.name}"</DialogTitle>
          <DialogDescription>
            Select a checklist template to associate with this tool.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div>
            <Label htmlFor="template">Checklist Template</Label>
            <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId} disabled={templatesLoading || assignedLoading}>
              <SelectTrigger>
                <SelectValue placeholder={templatesLoading || assignedLoading ? "Loading..." : "Select a template..."} />
              </SelectTrigger>
              <SelectContent>
                {templates?.map((template) => (
                  <SelectItem key={template.id} value={template.id.toString()}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex space-x-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={mutation.isPending}>
              {mutation.isPending ? "Assigning..." : "Assign Checklist"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
