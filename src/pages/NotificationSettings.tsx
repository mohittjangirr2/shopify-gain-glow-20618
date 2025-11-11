import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Bell, Save } from "lucide-react";

const NotificationSettings = () => {
  const [loading, setLoading] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [firebaseProjectId, setFirebaseProjectId] = useState("");
  const [firebaseServerKey, setFirebaseServerKey] = useState("");
  const [firebaseSenderId, setFirebaseSenderId] = useState("");
  const [firebaseVapidKey, setFirebaseVapidKey] = useState("");
  const [serviceAccount, setServiceAccount] = useState("");
  const [notificationSoundUrl, setNotificationSoundUrl] = useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('fcm_config')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setEnabled(data.enabled || false);
        setFirebaseProjectId(data.firebase_project_id || "");
        setFirebaseServerKey(data.firebase_server_key || "");
        setFirebaseSenderId(data.firebase_sender_id || "");
        setFirebaseVapidKey(data.firebase_vapid_key || "");
        setServiceAccount(data.firebase_service_account ? JSON.stringify(data.firebase_service_account, null, 2) : "");
        setNotificationSoundUrl(data.notification_sound_url || "");
      }
    } catch (error) {
      console.error('Error loading FCM settings:', error);
      toast.error("Failed to load notification settings");
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please log in to save settings");
        return;
      }

      let parsedServiceAccount = null;
      if (serviceAccount) {
        try {
          parsedServiceAccount = JSON.parse(serviceAccount);
        } catch (e) {
          toast.error("Invalid JSON in service account field");
          setLoading(false);
          return;
        }
      }

      const config = {
        user_id: user.id,
        enabled,
        firebase_project_id: firebaseProjectId,
        firebase_server_key: firebaseServerKey,
        firebase_sender_id: firebaseSenderId,
        firebase_vapid_key: firebaseVapidKey,
        firebase_service_account: parsedServiceAccount,
        notification_sound_url: notificationSoundUrl,
      };

      const { error } = await supabase
        .from('fcm_config')
        .upsert(config, { onConflict: 'user_id' });

      if (error) throw error;

      toast.success("Notification settings saved successfully");
    } catch (error) {
      console.error('Error saving FCM settings:', error);
      toast.error("Failed to save notification settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Push Notification Settings (Firebase Cloud Messaging)
        </CardTitle>
        <CardDescription>
          Configure Firebase Cloud Messaging for real-time push notifications about orders, shipments, and updates.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="fcm-enabled">Enable Push Notifications</Label>
            <p className="text-sm text-muted-foreground">
              Receive instant notifications for all events
            </p>
          </div>
          <Switch
            id="fcm-enabled"
            checked={enabled}
            onCheckedChange={setEnabled}
          />
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project-id">Firebase Project ID</Label>
            <Input
              id="project-id"
              placeholder="your-project-id"
              value={firebaseProjectId}
              onChange={(e) => setFirebaseProjectId(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="server-key">Firebase Server Key</Label>
            <Input
              id="server-key"
              type="password"
              placeholder="Your Firebase server key"
              value={firebaseServerKey}
              onChange={(e) => setFirebaseServerKey(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sender-id">Firebase Sender ID</Label>
            <Input
              id="sender-id"
              placeholder="123456789012"
              value={firebaseSenderId}
              onChange={(e) => setFirebaseSenderId(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vapid-key">Firebase VAPID Key</Label>
            <Input
              id="vapid-key"
              placeholder="Your VAPID public key"
              value={firebaseVapidKey}
              onChange={(e) => setFirebaseVapidKey(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="service-account">Firebase Service Account JSON (Optional)</Label>
            <Textarea
              id="service-account"
              placeholder='{"type": "service_account", ...}'
              value={serviceAccount}
              onChange={(e) => setServiceAccount(e.target.value)}
              className="font-mono text-sm"
              rows={6}
            />
            <p className="text-xs text-muted-foreground">
              Paste your Firebase service account JSON for advanced features
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sound-url">Notification Sound URL (Optional)</Label>
            <Input
              id="sound-url"
              type="url"
              placeholder="https://example.com/notification-sound.mp3"
              value={notificationSoundUrl}
              onChange={(e) => setNotificationSoundUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Custom sound for push notifications
            </p>
          </div>
        </div>

        <div className="pt-4 border-t">
          <h4 className="font-medium mb-3">Notification Events</h4>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>New orders received</li>
            <li>Order status updates</li>
            <li>Shipment tracking updates</li>
            <li>Delivery confirmations</li>
            <li>Payment notifications</li>
            <li>Cancellations and returns</li>
            <li>Low inventory alerts</li>
            <li>API errors and webhook failures</li>
          </ul>
        </div>

        <Button onClick={handleSave} disabled={loading} className="w-full">
          <Save className="mr-2 h-4 w-4" />
          {loading ? "Saving..." : "Save Notification Settings"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default NotificationSettings;
