import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const Footer = () => {
  const [footerText, setFooterText] = useState("Built with 💪 by");
  const [footerNames, setFooterNames] = useState("Mohit Jangir & Jainendra Bhati");

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
        .single();

      if (data && !error) {
        setFooterText(data.footer_text || "Built with 💪 by");
        setFooterNames(data.footer_names || "Mohit Jangir & Jainendra Bhati");
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
