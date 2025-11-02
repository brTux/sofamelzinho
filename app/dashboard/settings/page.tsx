"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

interface Profile {
  display_name: string
  email: string
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const loadProfile = async () => {
      const { data: authData } = await supabase.auth.getUser()

      if (authData.user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("display_name, email")
          .eq("id", authData.user.id)
          .single()

        if (profileData) {
          setProfile(profileData)
        }
      }

      setLoading(false)
    }

    loadProfile()
  }, [supabase])

  const handleSave = async () => {
    if (!profile) return

    setSaving(true)

    const { data: authData } = await supabase.auth.getUser()

    if (authData.user) {
      await supabase.from("profiles").update({ display_name: profile.display_name }).eq("id", authData.user.id)
    }

    setSaving(false)
  }

  if (loading) return <div className="p-6">Loading...</div>

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account settings</p>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your profile information</CardDescription>
        </CardHeader>
        <CardContent>
          {profile && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input type="email" value={profile.email} disabled />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Display Name</label>
                <Input
                  type="text"
                  value={profile.display_name}
                  onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
                  disabled={saving}
                />
              </div>

              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
