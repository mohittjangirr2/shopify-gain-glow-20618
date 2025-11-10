import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, XCircle, RefreshCw, Info } from "lucide-react";

interface ApiError {
  service: string;
  error: string;
  status: "error" | "success" | "warning";
}

interface ApiStatusProps {
  errors: ApiError[];
  onRetry?: () => void;
}

export const ApiStatus = ({ errors, onRetry }: ApiStatusProps) => {
  if (errors.length === 0) return null;

  const getIcon = (status: string) => {
    switch (status) {
      case "error":
        return <XCircle className="h-5 w-5 text-destructive" />;
      case "warning":
        return <AlertCircle className="h-5 w-5 text-warning" />;
      case "success":
        return <CheckCircle className="h-5 w-5 text-success" />;
      default:
        return <AlertCircle className="h-5 w-5" />;
    }
  };

  const getErrorSolution = (service: string, error: string) => {
    if (service === "Shiprocket" && error.includes("blocked")) {
      return (
        <div className="space-y-2">
          <p>Your Shiprocket account is temporarily blocked due to failed login attempts.</p>
          <p className="font-semibold">Action Required:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Wait 15-30 minutes for the block to lift automatically</li>
            <li>Verify your Shiprocket email and password are correct</li>
            <li>Use the "Retry Failed Connections" button after waiting</li>
          </ul>
        </div>
      );
    }
    if (service === "Shiprocket" && error.includes("Forbidden")) {
      return "Please verify your Shiprocket email and password are correct in your environment secrets.";
    }
    if (service === "Facebook Ads" && error.includes("Bad Request")) {
      return (
        <div className="space-y-2">
          <p className="font-semibold">Facebook credentials issue detected:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Verify your Access Token is valid at: developers.facebook.com/tools/debug/accesstoken</li>
            <li>Check Ad Account ID format - should be numbers only: <code className="bg-muted px-1 py-0.5 rounded">668304479225041</code></li>
            <li>Remove any prefixes like 'ct_' or 'act_' from your ad account ID</li>
          </ul>
        </div>
      );
    }
    return "Please check your API credentials in the backend settings and try again.";
  };

  return (
    <Card className="mb-6 border-warning">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-warning" />
          API Connection Issues
        </CardTitle>
        <CardDescription>
          Some services are experiencing connectivity issues. Failing APIs have been temporarily disabled to prevent further errors. The dashboard shows data from available sources.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {errors.map((err, idx) => (
          <Alert key={idx} variant={err.status === "error" ? "destructive" : "default"}>
            <div className="flex items-start gap-3">
              {getIcon(err.status)}
              <div className="flex-1">
                <AlertTitle className="mb-1">{err.service}</AlertTitle>
                <AlertDescription className="text-sm mb-2">
                  <strong>Error:</strong> {err.error}
                </AlertDescription>
                <AlertDescription className="text-sm">
                  <strong>Solution:</strong> {getErrorSolution(err.service, err.error)}
                </AlertDescription>
              </div>
            </div>
          </Alert>
        ))}
        {onRetry && (
          <Button onClick={onRetry} variant="outline" className="w-full">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry Failed Connections
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
