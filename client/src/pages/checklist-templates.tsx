import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
// Mock data for now, will be replaced with API call
const mockTemplates = [
  { id: 1, name: "Daily Forklift Inspection", description: "A checklist for daily forklift safety and operational checks." },
  { id: 2, name: "Power Tool Maintenance", description: "A checklist for weekly power tool maintenance." }
];

export default function ChecklistTemplates() {
  const [showAddTemplateModal, setShowAddTemplateModal] = useState(false);

  // const { data: templates, isLoading } = useQuery({
  //   queryKey: ["/api/checklist-templates"],
  // });

  return (
    <>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-medium text-gray-900 dark:text-white mb-2">Checklist Templates</h2>
            <p className="text-gray-600 dark:text-gray-400">Manage checklist templates for tool inspections.</p>
          </div>
          <Button onClick={() => setShowAddTemplateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Existing Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockTemplates.map((template) => (
              <div key={template.id} className="p-4 border rounded-lg">
                <h3 className="font-semibold">{template.name}</h3>
                <p className="text-sm text-gray-500">{template.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      {/* Add new template modal will be implemented later */}
    </>
  );
}