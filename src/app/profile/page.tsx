"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ProfileData = {
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    createdAt: string;
  };
  stats: {
    experimentCount: number;
    datasetCount: number;
  };
};

export default function ProfilePage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (!session) return;
    fetchProfile();
  }, [session]);

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/profile");
      if (!response.ok) throw new Error("Failed to fetch profile");
      const data: ProfileData = await response.json();
      setProfile(data);
      setName(data.user.name);
    } catch {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveName = async () => {
    if (!name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!response.ok) throw new Error("Failed to update name");
      toast.success("Name updated successfully");
      setProfile((prev) => prev ? { ...prev, user: { ...prev.user, name } } : prev);
    } catch {
      toast.error("Failed to update name");
    } finally {
      setSaving(false);
    }
  };

  if (isPending || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Loading profile...</p>
      </div>
    );
  }

  if (!profile) return null;

  const initials = profile.user.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const memberSince = new Date(profile.user.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-4xl font-bold mb-8">Profile</h1>

      <div className="space-y-6">
        {/* Avatar + identity */}
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Your identity on ML Pathways</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              {profile.user.image ? (
                <img
                  src={profile.user.image}
                  alt={profile.user.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold">
                  {initials}
                </div>
              )}
              <div>
                <p className="font-semibold text-lg">{profile.user.name}</p>
                <p className="text-sm text-gray-500">{profile.user.email}</p>
                <p className="text-xs text-gray-400 mt-1">Member since {memberSince}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Display Name</Label>
              <div className="flex gap-2">
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                  placeholder="Your name"
                />
                <Button onClick={handleSaveName} disabled={saving || name === profile.user.name}>
                  {saving ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>

            <div className="space-y-1">
              <Label>Email</Label>
              <p className="text-sm text-gray-600 bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-md">
                {profile.user.email}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Activity</CardTitle>
            <CardDescription>Your usage across ML Pathways</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg text-center">
                <p className="text-3xl font-bold text-blue-600">{profile.stats.experimentCount}</p>
                <p className="text-sm text-gray-600 mt-1">Experiments</p>
              </div>
              <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg text-center">
                <p className="text-3xl font-bold text-green-600">{profile.stats.datasetCount}</p>
                <p className="text-sm text-gray-600 mt-1">Datasets Uploaded</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
