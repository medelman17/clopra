import { AgentTest } from '@/components/debug/agent-test';

export default function AgentTestPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Ordinance Agent Testing</h1>
        <p className="text-muted-foreground mb-8">
          Test the AI agent&apos;s ability to find and validate municipal ordinances
        </p>
        
        <AgentTest />
        
        <div className="mt-8 p-4 bg-muted/50 rounded-lg">
          <h3 className="font-medium mb-2">How the Agent Works:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
            <li>Searches multiple sources with refined queries</li>
            <li>Validates content to ensure it&apos;s an actual ordinance</li>
            <li>Extracts key sections and structure</li>
            <li>Provides confidence scoring</li>
            <li>Falls back to alternative searches if needed</li>
          </ol>
        </div>
      </div>
    </div>
  );
}