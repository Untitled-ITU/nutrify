"use client";

import { useEffect, useState } from "react";
import {
    Button,
    Group,
    Modal,
    Stack,
    Text,
    Textarea,
    Rating,
    Loader,
} from "@mantine/core";
import { authFetch } from "@/app/providers/AuthProvider";
import { API_BASE_URL } from "@/lib/config";

type RatingItem = {
    id: number;
    score: number;
    comment: string | null;
    user_id: number;
    username: string;
    created_at: string;
};

type RatingsResponse = {
    average_rating: number;
    total_ratings: number;
    ratings: RatingItem[];
};

type UserRating = {
    id: number;
    recipe_id: number;
    score: number;
    comment: string | null;
};

type Props = {
    recipeId: number;
};

export function RecipeRating({ recipeId }: Props) {
    const [data, setData] = useState<RatingsResponse | null>(null);
    const [userRating, setUserRating] = useState<UserRating | null>(null);

    const [open, setOpen] = useState(false);
    const [score, setScore] = useState(0);
    const [comment, setComment] = useState("");
    const [loading, setLoading] = useState(false);

    async function loadRatings() {
        const res = await authFetch(
            `${API_BASE_URL}/api/recipes/${recipeId}/ratings`
        );
        setData(await res.json());
    }

    async function loadUserRating() {
        const res = await authFetch(`${API_BASE_URL}/api/user/ratings`);
        const jsonRes = await res.json();
        const found = jsonRes.ratings.find((r: UserRating) => r.recipe_id === recipeId);
        if (found) {
            setUserRating(found);
            setScore(found.score);
            setComment(found.comment ?? "");
        }
    }

    useEffect(() => {
        loadRatings();
        loadUserRating();
    }, [recipeId]);

    async function submit() {
        setLoading(true);

        try {
            if (userRating) {
                await authFetch(
                    `${API_BASE_URL}/api/ratings/${userRating.id}`,
                    {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            score,
                            comment: comment || null,
                        }),
                    }
                );
            } else {
                await authFetch(
                    `${API_BASE_URL}/api/recipes/${recipeId}/ratings`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            recipe_id: recipeId,
                            score,
                            comment: comment || null,
                        }),
                    }
                );
            }

            setOpen(false);
            await loadRatings();
            await loadUserRating();
        } finally {
            setLoading(false);
        }
    }

    if (!data) return <Loader size="sm" />;

    return (
        <>
            {/* Summary */}
            <Group mt="sm">
                <Rating value={data.average_rating} readOnly fractions={2} />
                <Text size="sm" c="dimmed">
                    {data.average_rating?.toFixed(1) || "0"} (
                    {data.total_ratings})
                </Text>

                <Button size="xs" variant="light" onClick={() => setOpen(true)}>
                    {userRating ? "Edit your rating" : "Rate this recipe"}
                </Button>
            </Group>

            {/* Ratings list 

                <Stack mt="md" gap="xs">
                {data.ratings && data.ratings.map((r) => (
                <div key={r.id}>
                <Group gap="xs">
                <Text fw={600}>{r.username}</Text>
                <Rating value={r.score} readOnly size="sm" />
                </Group>
                {r.comment && (
                <Text size="sm" c="dimmed">
                {r.comment}
                </Text>
                )}
                </div>
                ))}
                </Stack>
            */}

            {/* Modal */}
            <Modal
                opened={open}
                onClose={() => setOpen(false)}
                title={userRating ? "Edit your rating" : "Rate this recipe"}
                centered
            >
                <Stack>
                    <Rating value={score} onChange={setScore} size="lg" />

                    <Textarea
                        placeholder="Leave a comment (optional)"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        minRows={3}
                    />

                    <Group justify="flex-end">
                        <Button
                            variant="default"
                            onClick={() => setOpen(false)}
                        >
                            Cancel
                        </Button>

                        <Button loading={loading} onClick={submit}>
                            Save
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </>
    );
}
