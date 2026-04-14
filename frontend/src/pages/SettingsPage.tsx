import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Key, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, UserProfile } from "@/lib/api";
import { getToken } from "@/lib/auth";

const SettingsPage = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    api.get("/auth/me").then((response) => setProfile(response.data));
  }, []);

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Review your authenticated account details</p>
      </div>

      <motion.div className="glass rounded-2xl p-6 space-y-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-2">
          <User className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">Profile</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input value={profile?.full_name || "Not set"} className="bg-background/50" readOnly />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={profile?.email || ""} className="bg-background/50" readOnly />
          </div>
        </div>
      </motion.div>

      <motion.div className="glass rounded-2xl p-6 space-y-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-2">
          <Key className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">Session</h2>
        </div>
        <div className="space-y-2">
          <Label>Access Token</Label>
          <Input value={getToken() ? `${getToken()!.slice(0, 18)}...` : "No token"} className="bg-background/50 font-mono" readOnly />
        </div>
        <Button variant="outline" size="sm" onClick={() => api.get("/health")}>
          Check Backend Health
        </Button>
      </motion.div>
    </div>
  );
};

export default SettingsPage;
