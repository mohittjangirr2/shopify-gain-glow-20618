import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const Footer = () => {
  const [footerText, setFooterText] = useState("Powered by");
  const [footerNames, setFooterNames] = useState("OVIX Analytics");

  useEffect(() => {
    loadFooterSettings();
  }, []);

  const loadFooterSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('api_settings')
        .select('footer_text, footer_names')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data && !error) {
        // @ts-ignore
        setFooterText(data.footer_text || "Powered by");
        // @ts-ignore
        setFooterNames(data.footer_names || "OVIX Analytics");
      }
    } catch (error) {
      console.error('Error loading footer settings:', error);
    }
  };

  return (
    <footer className="border-t bg-card mt-auto">
      <div className="container mx-auto px-4 py-4">
        <p className="text-center text-sm text-muted-foreground">
          {footerText} <span className="font-semibold text-foreground">{footerNames}</span>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
