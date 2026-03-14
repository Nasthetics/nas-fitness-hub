import { useState, useRef, useEffect } from 'react';
import { format, subDays } from 'date-fns';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useProfile, useTodayWorkout, useBodyMetrics } from '@/hooks/use-fitness-data';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import ReactMarkdown from 'react-markdown';

type Msg = { role: 'user' | 'assistant'; content: string };

const QUICK_QUESTIONS = [
  "Should I push hard today?",
  "Why is my bench plateauing?",
  "Adjust my macros this week?",
  "Am I recovering well?",
  "What should I focus on?",
];

export default function Coach() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: todayWorkout } = useTodayWorkout();
  const { data: bodyMetrics } = useBodyMetrics(7);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const buildSystemContext = () => {
    const weight = bodyMetrics?.[0]?.weight_kg || 95;
    const bf = bodyMetrics?.[0]?.body_fat_percent || 14;
    const workoutStatus = todayWorkout?.completed ? 'completed' : todayWorkout ? 'in progress' : 'not started';
    
    return `You are Nas's AI fitness coach. Be direct, knowledgeable, and motivating.

User Profile:
- Name: ${profile?.display_name || 'Nas'}
- Weight: ${weight}kg, Height: ${profile?.height_cm || 190}cm
- Body Fat: ${bf}%, Lean Mass: ${profile?.lean_mass_kg || 81.7}kg
- Goal: Clean bulk +0.3kg/week
- Daily targets: ${profile?.training_day_calories || 2556} kcal, ${profile?.training_day_protein || 245}g protein
- Water: ${profile?.water_target_ml || 4000}ml/day

Today's workout: ${workoutStatus}
${todayWorkout?.template ? `Workout type: ${todayWorkout.template.day_type}` : ''}

Recent weight trend: ${bodyMetrics?.slice(0, 5).map(m => `${m.recorded_date}: ${m.weight_kg}kg`).join(', ') || 'No data'}

Give practical, evidence-based advice. Keep responses concise but thorough.`;
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    
    const userMsg: Msg = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await supabase.functions.invoke('ai-coach', {
        body: {
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          systemPrompt: buildSystemContext(),
        },
      });

      if (response.error) throw response.error;
      
      const assistantContent = response.data?.content || response.data?.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';
      setMessages(prev => [...prev, { role: 'assistant', content: assistantContent }]);
    } catch (error) {
      console.error('Coach error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] animate-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
          <Bot className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">AI Coach</h1>
          <p className="text-sm text-muted-foreground">Your personal fitness advisor</p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-6">
            <Bot className="h-16 w-16 text-muted-foreground/30" />
            <p className="text-muted-foreground">Ask me anything about your training, nutrition, or recovery.</p>
            <div className="flex flex-wrap gap-2 justify-center max-w-lg">
              {QUICK_QUESTIONS.map(q => (
                <Button 
                  key={q} 
                  variant="outline" 
                  size="sm"
                  onClick={() => sendMessage(q)}
                  className="text-xs"
                >
                  {q}
                </Button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'assistant' && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20">
                <Bot className="h-4 w-4 text-primary" />
              </div>
            )}
            <Card className={`max-w-[80%] ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : ''}`}>
              <CardContent className="p-3">
                {msg.role === 'assistant' ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm">{msg.content}</p>
                )}
              </CardContent>
            </Card>
            {msg.role === 'user' && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                <User className="h-4 w-4" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <Card>
              <CardContent className="p-3 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Thinking...</span>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-2 pt-4 border-t">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
          placeholder="Ask your coach..."
          disabled={isLoading}
          className="flex-1"
        />
        <Button onClick={() => sendMessage(input)} disabled={isLoading || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
