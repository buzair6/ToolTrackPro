import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, ListChecks } from "lucide-react";
import AddChecklistTemplateModal from "@/components/modals/add-checklist-template-modal";
import { Skeleton } from "@/components/ui/skeleton";
import type { ChecklistTemplateWithItems } from "@shared/schema";
import { getQueryFn } from "@/lib/queryClient";

export default function ChecklistTemplates() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ChecklistTemplateWithItems | null>(null);

  // Fetch live data from the API, replacing the mock data
  const { data: templates, isLoading } = useQuery<ChecklistTemplateWithItems[]>({
    queryKey: ["/api/checklist-templates"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
  });

  const handleAddNew = () => {
    setEditingTemplate(null);
    setIsModalOpen(true);
  };

  const handleEdit = (template: ChecklistTemplateWithItems) => {
    setEditingTemplate(template);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-medium text-gray-900 dark:text-white mb-2">Checklist Templates</h2>
            <p className="text-gray-600 dark:text-gray-400">Manage checklist templates for tool inspections.</p>
          </div>
          <Button onClick={handleAddNew}>
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Existing Templates</CardTitle>
          <CardDescription>
            Click on a template to view or edit its details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : !templates || templates.length === 0 ? (
            <div className="text-center text-gray-500 py-10">
              <ListChecks className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium">No templates found</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new checklist template.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {templates.map((template) => (
                <Button
                  key={template.id}
                  variant="outline"
                  className="w-full justify-start h-auto p-4 text-left"
                  onClick={() => handleEdit(template)}
                >
                  <div>
                    <h3 className="font-semibold text-base">{template.name}</h3>
                    <p className="text-sm text-gray-500 font-normal">{template.description}</p>
                  </div>
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {isModalOpen && (
        <AddChecklistTemplateModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          templateToEdit={editingTemplate}
        />
      )}
    </>
  );
}