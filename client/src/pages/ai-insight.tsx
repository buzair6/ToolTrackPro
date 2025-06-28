import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bot, Send, Sparkles } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Chat } from "@shared/schema";

export default function AiInsightPage() {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const { data: chats, isLoading: chatsLoading } = useQuery<Chat[]>({
    queryKey: ["/api/ai/chats"],
  });

  const mutation = useMutation({
    mutationFn: (newMessage: string) => apiRequest("POST", "/api/ai/chat", { message: newMessage }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai/chats"] });
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    mutation.mutate(message);
    setMessage("");
  };

  const handleSuggestedPrompt = (prompt: string) => {
    setMessage(prompt);
    mutation.mutate(prompt);
    setMessage("");
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [chats]);

  const getUserInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || "U"}${lastName?.[0] || ""}`;
  };

  const suggestedPrompts = [
    "Which tool is most frequently booked?",
    "What is the total cost of all bookings this month?",
    "Are there any booking conflicts for next week?",
    "Suggest a maintenance schedule for the power tools.",
  ];

  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-medium text-gray-900 dark:text-white mb-2">AI Insight</h2>
        <p className="text-gray-600 dark:text-gray-400">Ask questions and get AI-powered insights from your data.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="h-[75vh] flex flex-col">
            <CardHeader>
              <CardTitle>Chat with your Data</CardTitle>
              <CardDescription>The AI has access to your tool and booking data to answer your questions.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
              <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
                <div className="space-y-6">
                  {chatsLoading ? (
                    <p>Loading chat history...</p>
                  ) : (
                    chats?.map((chat) => (
                      <div key={chat.id}>
                        <div className="flex items-start gap-3 justify-end">
                          <div className="bg-primary text-primary-foreground p-3 rounded-lg max-w-lg">
                            <p>{chat.message}</p>
                          </div>
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={user?.profileImageUrl} />
                            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                              {getUserInitials(user?.firstName, user?.lastName)}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <div className="flex items-start gap-3 mt-4">
                          <Avatar className="h-9 w-9 bg-muted text-muted-foreground">
                            <Bot className="h-5 w-5 m-auto" />
                          </Avatar>
                          <div className="bg-muted p-3 rounded-lg max-w-lg">
                            <p>{chat.response}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
              <form onSubmit={handleSendMessage} className="flex items-center gap-2 pt-4 border-t">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ask a question about your tools or bookings..."
                  className="flex-1"
                />
                <Button type="submit" size="icon" disabled={mutation.isPending}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" /> AI Suggestions
              </CardTitle>
              <CardDescription>Click a suggestion to ask the AI.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {suggestedPrompts.map((prompt, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="w-full justify-start text-left h-auto"
                  onClick={() => handleSuggestedPrompt(prompt)}
                >
                  {prompt}
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}