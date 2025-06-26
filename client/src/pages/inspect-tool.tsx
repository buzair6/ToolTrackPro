import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";

export default function InspectTool() {
  const [selectedToolId, setSelectedToolId] = useState("");

  const { data: tools } = useQuery<any[]>({
    queryKey: ["/api/tools"],
    retry: false,
  });

  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-medium text-gray-900 dark:text-white mb-2">Inspect Tool</h2>
        <p className="text-gray-600 dark:text-gray-400">Select a tool and complete the inspection checklist.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select a Tool for Inspection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Select value={selectedToolId} onValueChange={setSelectedToolId}>
              <SelectTrigger className="w-96">
                <SelectValue placeholder="Select a tool..." />
              </SelectTrigger>
              <SelectContent>
                {tools?.map(tool => (
                  <SelectItem key={tool.id} value={tool.id.toString()}>
                    {tool.name} ({tool.toolId})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Or enter Tool ID..."
              className="w-48"
              // Add onChange handler to search for tool by ID
            />
            <Button>Start Inspection</Button>
          </div>
        </CardContent>
      </Card>

      {/* Checklist will be rendered here based on the selected tool */}
    </>
  );
}