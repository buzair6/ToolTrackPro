import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import AddToolModal from "@/components/modals/add-tool-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  Grid3X3,
  List,
  Eye,
  Edit3,
  Trash2,
  ClipboardPlus,
  MoreVertical,
} from "lucide-react";
import AssignChecklistModal from "@/components/modals/assign-checklist-modal";

// Modal for viewing tool details
function ViewToolModal({ tool, onClose }: { tool: any; onClose: () => void }) {
  if (!tool) return null;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{tool.name}</DialogTitle>
          <DialogDescription>Tool ID: {tool.toolId}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
            <span className="text-gray-400 text-sm">No Image</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {tool.description || "No description available."}
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Category:</span>
              <span className="font-medium capitalize">
                {tool.category.replace("-", " ")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Location:</span>
              <span className="font-medium">{tool.location}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <Badge
                className={
                  tool.status === "available"
                    ? "status-available"
                    : tool.status === "in-use"
                      ? "status-in-use"
                      : "status-maintenance"
                }
              >
                {tool.status}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Tools() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [editingTool, setEditingTool] = useState<any | null>(null);
  const [viewingTool, setViewingTool] = useState<any | null>(null);
  const [assigningChecklistTool, setAssigningChecklistTool] =
    useState<any | null>(null);

  // DEBUG: Check the user object when the component renders
  console.log("Current user object in Tools page:", user);
  if (user) {
    console.log("User role is:", user.role);
  }

  const { data: tools, isLoading: toolsLoading } = useQuery<any[]>({
    queryKey: ["/api/tools"],
    retry: false,
  });

  const deleteMutation = useMutation({
    mutationFn: async (toolId: number) => {
      await apiRequest("DELETE", `/api/tools/${toolId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tools"] });
      toast({
        title: "Success",
        description: "Tool deleted successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out.",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete tool",
        variant: "destructive",
      });
    },
  });

  const filteredTools =
    tools?.filter((tool: any) => {
      const matchesSearch =
        tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.toolId.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || tool.status === statusFilter;
      const matchesCategory =
        categoryFilter === "all" || tool.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    }) || [];

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "available":
        return "status-available";
      case "in-use":
        return "status-in-use";
      case "maintenance":
        return "status-maintenance";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  const handleDeleteTool = (toolId: number) => {
    // DEBUG: Confirm delete handler is called
    console.log("handleDeleteTool called for tool ID:", toolId);
    if (window.confirm("Are you sure you want to delete this tool?")) {
      deleteMutation.mutate(toolId);
    }
  };

  const handleOpenEditModal = (tool: any) => {
    // DEBUG: Confirm edit handler is called
    console.log("handleOpenEditModal called for tool:", tool);
    setEditingTool(tool);
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingTool(null);
  };

  return (
    <>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-medium text-gray-900 dark:text-white mb-2">
              Tools Management
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your tool inventory and availability
            </p>
          </div>
          {user?.role === "admin" && (
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add New Tool
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search tools..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="in-use">In Use</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="power-tools">Power Tools</SelectItem>
                  <SelectItem value="hand-tools">Hand Tools</SelectItem>
                  <SelectItem value="safety-equipment">
                    Safety Equipment
                  </SelectItem>
                  <SelectItem value="measuring-tools">
                    Measuring Tools
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {toolsLoading ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              Loading tools...
            </p>
          ) : filteredTools.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              No tools found
            </p>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredTools.map((tool: any) => (
                <Card
                  key={tool.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-4">
                    <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg mb-3 flex items-center justify-center">
                      <span className="text-gray-400 text-sm">No Image</span>
                    </div>

                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {tool.name}
                      </h4>
                      <Badge className={getStatusBadgeClass(tool.status)}>
                        {tool.status}
                      </Badge>
                    </div>

                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
                      {tool.description || "No description available"}
                    </p>

                    <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400 mb-4">
                      <div className="flex justify-between">
                        <span>ID:</span>
                        <span>{tool.toolId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Category:</span>
                        <span className="capitalize">
                          {tool.category.replace("-", " ")}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Location:</span>
                        <span>{tool.location}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          console.log("View clicked for:", tool);
                          setViewingTool(tool);
                        }}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      {user?.role === "admin" && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-9 w-9 shrink-0"
                            >
                              <MoreVertical className="h-4 w-4" />
                              <span className="sr-only">More actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => setAssigningChecklistTool(tool)}
                            >
                              <ClipboardPlus className="mr-2 h-4 w-4" />
                              <span>Checklist</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleOpenEditModal(tool)}
                            >
                              <Edit3 className="mr-2 h-4 w-4" />
                              <span>Edit</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleDeleteTool(tool.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>Delete</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTools.map((tool: any) => (
                <Card key={tool.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                          <span className="text-gray-400 text-xs">
                            No Image
                          </span>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                            {tool.name}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {tool.toolId} • {tool.category.replace("-", " ")} •{" "}
                            {tool.location}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {tool.description || "No description available"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Badge className={getStatusBadgeClass(tool.status)}>
                          {tool.status}
                        </Badge>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              console.log("View clicked for:", tool);
                              setViewingTool(tool);
                            }}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          {user?.role === "admin" && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setAssigningChecklistTool(tool)
                                }
                              >
                                <ClipboardPlus className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenEditModal(tool)}
                              >
                                <Edit3 className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteTool(tool.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {(showAddModal || editingTool) && (
        <AddToolModal toolToEdit={editingTool} onClose={handleCloseModal} />
      )}

      {viewingTool && (
        <ViewToolModal tool={viewingTool} onClose={() => setViewingTool(null)} />
      )}

      {assigningChecklistTool && (
        <AssignChecklistModal
          tool={assigningChecklistTool}
          onClose={() => setAssigningChecklistTool(null)}
        />
      )}
    </>
  );
}