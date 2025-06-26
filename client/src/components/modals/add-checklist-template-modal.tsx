import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Trash2 } from "lucide-react";
import type { ChecklistTemplateWithItems } from "@shared/schema";

interface AddChecklistTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateToEdit?: ChecklistTemplateWithItems | null;
}

const defaultItem = { label: "", type: "tick", required: false, itemOrder: 0 };

export default function AddChecklistTemplateModal({ isOpen, onClose, templateToEdit }: AddChecklistTemplateModalProps) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [items, setItems] = useState([defaultItem]);

  const isEditMode = !!templateToEdit;

  useEffect(() => {
    if (isOpen && templateToEdit) {
      setName(templateToEdit.name);
      setDescription(templateToEdit.description || "");
      setItems(templateToEdit.items.length > 0 ? templateToEdit.items.map(item => ({...item})) : [{ ...defaultItem }]);
    } else if (isOpen) {
      setName("");
      setDescription("");
      setItems([{ ...defaultItem }]);
    }
  }, [isOpen, templateToEdit]);

  const handleItemChange = (index: number, field: string, value: string | boolean) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { ...defaultItem, itemOrder: items.length }]);
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };
  
  const mutation = useMutation({
    mutationFn: (templateData: { name: string; description: string; items: any[] }) => {
        const endpoint = isEditMode ? `/api/checklist-templates/${templateToEdit!.id}` : "/api/checklist-templates";
        const method = isEditMode ? "PUT" : "POST";
        return apiRequest(method, endpoint, templateData);
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/checklist-templates"] });
        toast({
            title: "Success",
            description: `Template ${isEditMode ? 'updated' : 'created'} successfully.`,
        });
        onClose();
    },
    onError: (error: any) => {
        toast({
            title: "Error",
            description: `Failed to ${isEditMode ? 'update' : 'create'} template: ${error.message}`,
            variant: "destructive",
        });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
        toast({ title: "Error", description: "Template name is required.", variant: "destructive" });
        return;
    }
    const finalItems = items.map((item, index) => ({ ...item, itemOrder: index }));
    mutation.mutate({ name, description, items: finalItems });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Checklist Template" : "Create New Checklist Template"}</DialogTitle>
          <DialogDescription>
            {isEditMode ? "Update the details of your checklist template." : "Create a new template with custom checklist items."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 pt-4 max-h-[70vh] overflow-y-auto pr-4">
          <div className="space-y-2">
            <Label htmlFor="name">Template Name *</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Pre-flight Check" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="A brief description of the template's purpose" />
          </div>

          <div className="space-y-4">
            <Label>Checklist Items</Label>
            {items.map((item, index) => (
              <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                <span className="text-sm font-medium text-gray-500">{index + 1}.</span>
                <Input
                  placeholder="Item Label"
                  value={item.label}
                  onChange={(e) => handleItemChange(index, 'label', e.target.value)}
                  className="flex-grow"
                />
                <Select value={item.type} onValueChange={(value) => handleItemChange(index, 'type', value)}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tick">Checkbox</SelectItem>
                    <SelectItem value="value">Text Value</SelectItem>
                    <SelectItem value="image">Image Upload</SelectItem>
                  </SelectContent>
                </Select>
                <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addItem} className="w-full">
              <PlusCircle className="h-4 w-4 mr-2" /> Add Item
            </Button>
          </div>
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving...' : 'Save Template'}
          </Button>
        </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}