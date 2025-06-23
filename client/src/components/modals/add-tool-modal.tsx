import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { X, CloudUpload } from "lucide-react";

interface AddToolModalProps {
  onClose: () => void;
  toolToEdit?: any | null;
}

export default function AddToolModal({ onClose, toolToEdit }: AddToolModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    toolId: "",
    category: "",
    description: "",
    location: "",
    status: "available",
  });

  const isEditMode = !!toolToEdit;

  useEffect(() => {
    if (isEditMode && toolToEdit) {
      setFormData({
        name: toolToEdit.name,
        toolId: toolToEdit.toolId,
        category: toolToEdit.category,
        description: toolToEdit.description || "",
        location: toolToEdit.location,
        status: toolToEdit.status,
      });
    } else {
      setFormData({
        name: "",
        toolId: "",
        category: "",
        description: "",
        location: "",
        status: "available",
      });
    }
  }, [toolToEdit, isEditMode]);


  const mutation = useMutation({
    mutationFn: async (toolData: any) => {
      const endpoint = isEditMode ? `/api/tools/${toolToEdit.id}` : "/api/tools";
      const method = isEditMode ? "PUT" : "POST";
      await apiRequest(method, endpoint, toolData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tools"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Success",
        description: `Tool ${isEditMode ? 'updated' : 'added'} successfully`,
      });
      onClose();
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out.",
          variant: "destructive",
        });
        return;
      }
      
      const message = error.message?.includes("already exists") 
        ? "Tool ID already exists"
        : `Failed to ${isEditMode ? 'update' : 'add'} tool`;
        
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.toolId || !formData.category || !formData.location) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    mutation.mutate(formData);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{isEditMode ? 'Edit Tool' : 'Add New Tool'}</DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Tool Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Electric Drill"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="toolId">Tool ID *</Label>
              <Input
                id="toolId"
                placeholder="e.g., T001"
                value={formData.toolId}
                onChange={(e) => setFormData({ ...formData, toolId: e.target.value })}
                required
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="category">Category *</Label>
            <Select 
              value={formData.category} 
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="power-tools">Power Tools</SelectItem>
                <SelectItem value="hand-tools">Hand Tools</SelectItem>
                <SelectItem value="safety-equipment">Safety Equipment</SelectItem>
                <SelectItem value="measuring-tools">Measuring Tools</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={3}
              placeholder="Tool description and specifications..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                placeholder="e.g., Warehouse A"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="out-of-order">Out of Order</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label>Tool Image</Label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
              <CloudUpload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Click to upload tool image</p>
              <p className="text-xs text-gray-400 mt-1">Image upload feature coming soon</p>
            </div>
          </div>
          
          <div className="flex space-x-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1" 
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (isEditMode ? 'Saving...' : 'Adding...') : (isEditMode ? 'Save Changes' : 'Add Tool')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}