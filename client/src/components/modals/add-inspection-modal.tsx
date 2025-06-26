// buzair6/tooltrackpro/ToolTrackPro-6f84785a6a149e311d88bfdf7ddafe3f8e316550/client/src/components/modals/add-inspection-modal.tsx
import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import type { Tool, ChecklistTemplateWithItems } from "@shared/schema";

interface AddInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddInspectionModal({ isOpen, onClose }: AddInspectionModalProps) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [selectedToolId, setSelectedToolId] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [inspectionValues, setInspectionValues] = useState<Record<number, any>>({});
  const [inspectionDate, setInspectionDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: tools, isLoading: toolsLoading } = useQuery<Tool[]>({
    queryKey: ["/api/tools"],
    retry: false,
  });

  const { data: templates, isLoading: templatesLoading } = useQuery<ChecklistTemplateWithItems[]>({
    queryKey: ["/api/checklist-templates"],
    retry: false,
  });

  const selectedTemplate = templates?.find(t => t.id.toString() === selectedTemplateId);
  
  const inspectionMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTemplate) return;

      const items = selectedTemplate.items.map(item => ({
        templateItemId: item.id,
        ...inspectionValues[item.id],
      }));
      
      const payload = {
        toolId: parseInt(selectedToolId, 10),
        templateId: selectedTemplate.id,
        inspectionDate: new Date(inspectionDate).toISOString(),
        items,
      };

      await apiRequest("POST", "/api/inspections", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inspections"] });
      toast({
        title: "Success",
        description: "Inspection submitted successfully.",
      });
      onClose();
      resetState();
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
    setInspectionValues(prev => ({ ...prev, [itemId]: valuePayload }));
  };

  const resetState = () => {
    setStep(1);
    setSelectedToolId("");
    setSelectedTemplateId("");
    setInspectionValues({});
    setInspectionDate(new Date().toISOString().split('T')[0]);
  };

  const handleClose = () => {
    onClose();
    resetState();
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
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>New Tool Inspection</DialogTitle>
          <DialogDescription>
            {step === 1 ? "Select the tool and checklist template." : "Complete the checklist items."}
          </DialogDescription>
        </DialogHeader>
        
        {step === 1 && (
          <div className="space-y-4 py-4">
            <div>
              <Label>Tool</Label>
              <Select value={selectedToolId} onValueChange={setSelectedToolId} disabled={toolsLoading}>
                <SelectTrigger><SelectValue placeholder="Select a tool..." /></SelectTrigger>
                <SelectContent>
                  {tools?.map(tool => <SelectItem key={tool.id} value={tool.id.toString()}>{tool.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Checklist Template</Label>
              <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId} disabled={templatesLoading}>
                <SelectTrigger><SelectValue placeholder="Select a template..." /></SelectTrigger>
                <SelectContent>
                  {templates?.map(template => <SelectItem key={template.id} value={template.id.toString()}>{template.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
             <div>
              <Label>Inspection Date</Label>
              <Input type="date" value={inspectionDate} onChange={e => setInspectionDate(e.target.value)} />
            </div>
          </div>
        )}

        {step === 2 && selectedTemplate && (
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            {selectedTemplate.items.map(item => (
              <div key={item.id} className="p-4 border rounded-md">
                {renderChecklistItem(item)}
              </div>
            ))}
          </div>
        )}
        
        <DialogFooter>
          {step === 1 && (
            <>
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button onClick={() => setStep(2)} disabled={!selectedToolId || !selectedTemplateId}>Next</Button>
            </>
          )}
          {step === 2 && (
             <>
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button onClick={() => inspectionMutation.mutate()} disabled={inspectionMutation.isPending}>
                {inspectionMutation.isPending ? "Submitting..." : "Submit Inspection"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}