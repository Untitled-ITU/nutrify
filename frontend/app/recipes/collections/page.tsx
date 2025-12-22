"use client";

import { useCallback, useEffect, useState } from "react";
import { CollectionsTable } from "@/components/recipes/CollectionsTable";
import { Collection } from "@/components/recipes/types";
import { authFetch } from "@/app/providers/AuthProvider";
import { API_BASE_URL } from "@/lib/config";
import { notifications } from "@mantine/notifications";

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCollections = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await authFetch(`${API_BASE_URL}/api/recipes/collections`);
      if (!res.ok) throw new Error("Failed to fetch collections");

      const data = await res.json();
      setCollections(data.collections);
    } catch (err) {
      setError((err as Error).message);
      notifications.show({
        title: "Error",
        message: "Failed to load collections",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  return (
    <div className="w-full px-4">
      <h1 className="text-4xl font-bold mb-8">My Collections</h1>

      {loading && <div className="text-center py-10 text-gray-500">Loading collections...</div>}
      {error && <div className="text-center py-10 text-red-500">{error}</div>}

      {!loading && !error && (
        <CollectionsTable collections={collections} onCollectionsUpdated={fetchCollections} />
      )}
    </div>
  );
}
