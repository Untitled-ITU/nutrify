"use client";

import { useState, useMemo } from "react";
import {
  ActionIcon,
  Pagination,
  useMantineTheme,
  Modal,
  TextInput,
  Textarea,
  Switch,
  Button,
} from "@mantine/core";
import { IconExternalLink, IconTrash, IconEdit, IconPlus } from "@tabler/icons-react";
import { Collection } from "./types";
import { useRouter } from "next/navigation";
import { authFetch } from "@/app/providers/AuthProvider";
import { API_BASE_URL } from "@/lib/config";
import { notifications } from "@mantine/notifications";

type Props = {
  collections: Collection[];
  onCollectionsUpdated?: () => void; // callback to refresh
};

export function CollectionsTable({ collections, onCollectionsUpdated }: Props) {
  const theme = useMantineTheme();
  const router = useRouter();
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.ceil(collections.length / pageSize);

  // Modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentCollection, setCurrentCollection] = useState<Collection | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);

  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const paginatedCollections = useMemo(() => {
    const start = (page - 1) * pageSize;
    return collections.slice(start, start + pageSize);
  }, [collections, page, pageSize]);

  const openEditModal = (collection?: Collection) => {
    setCurrentCollection(collection ?? null);
    setName(collection?.name ?? "");
    setDescription(collection?.description ?? "");
    setIsPublic(collection?.is_public ?? false);
    setEditModalOpen(true);
  };

  const handleSaveCollection = async () => {
    if (!name.trim()) {
      notifications.show({ title: "Validation error", message: "Name is required", color: "red" });
      return;
    }

    setSaving(true);
    try {
      const method = currentCollection ? "PUT" : "POST";
      const url = currentCollection
        ? `${API_BASE_URL}/api/recipes/collections/${currentCollection.id}`
        : `${API_BASE_URL}/api/recipes/collections`;

      const res = await authFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, is_public: isPublic }),
      });

      if (!res.ok) throw new Error();

      notifications.show({
        title: currentCollection ? "Collection updated" : "Collection created",
        message: `Collection "${name}" saved successfully`,
        color: "green",
      });

      setEditModalOpen(false);
      onCollectionsUpdated?.();
    } catch {
      notifications.show({ title: "Error", message: "Failed to save collection", color: "red" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCollection = async (id: number) => {
    if (!confirm("Are you sure you want to delete this collection?")) return;

    setDeleteId(id);
    setDeleteLoading(true);

    try {
      const res = await authFetch(`${API_BASE_URL}/api/recipes/collections/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();

      notifications.show({ title: "Deleted", message: "Collection deleted successfully", color: "red" });
      onCollectionsUpdated?.();
    } catch {
      notifications.show({ title: "Error", message: "Failed to delete collection", color: "red" });
    } finally {
      setDeleteLoading(false);
      setDeleteId(null);
    }
  };

  return (
    <div className="shadow-xl w-full p-4 rounded-xl min-h-96 flex flex-col" style={{ backgroundColor: theme.other.contentBackground }}>
      {/* Create Collection Button */}
      <div className="flex justify-end mb-4">
        <Button leftSection={<IconPlus />} style={{ backgroundColor: theme.other.accentColor }} onClick={() => openEditModal()}>
          Create Collection
        </Button>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-end mb-6">
          <Pagination value={page} onChange={setPage} total={totalPages} />
        </div>
      )}

      {/* Header */}
      <div className="shadow-md bg-[#F6EDEA] rounded-xl px-6 py-4 text-xl font-bold mb-3">
        <div className="grid grid-cols-[4fr_2fr_1fr]">
          <span>Collection Name</span>
          <span>Recipes</span>
          <span className="text-right">Actions</span>
        </div>
      </div>

      {/* Rows */}
      <div className="space-y-3 flex-1">
        {paginatedCollections.map((c) => (
          <div key={c.id} className="shadow-md bg-[#E7C6BC] rounded-xl px-6 py-4 transition hover:shadow-md hover:-translate-y-1px hover:bg-[#EFD2C9]">
            <div className="grid grid-cols-[4fr_2fr_1fr] items-center">
              <span className="font-medium">{c.name}</span>
              <span>{c.recipe_count ?? "-"}</span>
              <div className="flex justify-end gap-3">
                <ActionIcon style={{ backgroundColor: theme.other.accentColor }} onClick={() => router.push(`/recipes/collections/${c.id}`)}>
                  <IconExternalLink size={28} />
                </ActionIcon>

                <ActionIcon style={{ backgroundColor: theme.other.accentColor }} onClick={() => openEditModal(c)}>
                  <IconEdit size={28} />
                </ActionIcon>

                <ActionIcon
                  style={{ backgroundColor: theme.other.primaryDark }}
                  onClick={() => handleDeleteCollection(c.id)}
                  loading={deleteLoading && deleteId === c.id}
                >
                  <IconTrash size={28} />
                </ActionIcon>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit/Create Modal */}
      <Modal centered={true} radius="lg" opened={editModalOpen} onClose={() => setEditModalOpen(false)} title={currentCollection ? "Edit Collection" : "Create Collection"}>
        <TextInput label="Collection Name" placeholder="Enter collection name" required mb="sm" value={name} onChange={(e) => setName(e.currentTarget.value)} />
        <Textarea label="Description" placeholder="Optional description" mb="sm" value={description} onChange={(e) => setDescription(e.currentTarget.value)} />
        <Button fullWidth loading={saving} style={{ backgroundColor: theme.other.accentColor }} onClick={handleSaveCollection}>
          {currentCollection ? "Update Collection" : "Create Collection"}
        </Button>
      </Modal>
    </div>
  );
}
