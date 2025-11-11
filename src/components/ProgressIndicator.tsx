import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

interface ProgressIndicatorProps {
  isLoading: boolean;
  apiErrors?: {
    shopify?: string | null;
    facebook?: string | null;
    shiprocket?: string | null;
  };
}

export const ProgressIndicator = ({ isLoading, apiErrors }: ProgressIndicatorProps) => {
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState("Initializing...");

  useEffect(() => {
    if (!isLoading) {
      setProgress(100);
      return;
    }

    const stages = [
      { progress: 20, text: "Fetching Shopify orders..." },
      { progress: 40, text: "Loading Facebook Ads data..." },
      { progress: 60, text: "Retrieving Shiprocket shipments..." },
      { progress: 80, text: "Calculating analytics..." },
      { progress: 95, text: "Finalizing dashboard..." },
    ];

    let currentStage = 0;
    const interval = setInterval(() => {
      if (currentStage < stages.length) {
        setProgress(stages[currentStage].progress);
        setLoadingText(stages[currentStage].text);
        currentStage++;
      } else {
        clearInterval(interval);
      }
    }, 600);

    return () => clearInterval(interval);
  }, [isLoading]);

  if (!isLoading && !apiErrors) return null;

  const hasErrors = apiErrors && Object.values(apiErrors).some(err => err);

  return (
    <div className="mb-6 space-y-4">
      {isLoading && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">{loadingText}</p>
              <Progress value={progress} className="h-2" />
            </div>
          </AlertDescription>
        </Alert>
      )}

      {hasErrors && (
        <Alert variant="destructive">
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-semibold">Some APIs encountered errors:</p>
              {apiErrors?.shopify && <p className="text-sm">• Shopify: {apiErrors.shopify}</p>}
              {apiErrors?.facebook && <p className="text-sm">• Facebook: {apiErrors.facebook}</p>}
              {apiErrors?.shiprocket && <p className="text-sm">• Shiprocket: {apiErrors.shiprocket}</p>}
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
