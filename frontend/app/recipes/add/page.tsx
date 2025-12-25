"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authFetch } from "@/app/providers/AuthProvider";
import { notifications } from "@mantine/notifications";
import { API_BASE_URL } from "@/lib/config";
import { RecipeForm, RecipeFormData } from "@/components/recipes/RecipeForm";
import { storage } from "@/app/firebaseConfig";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import { v4 as uuid } from "uuid";

export default function NewRecipePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState(null);

    const [form, setForm] = useState<RecipeFormData>({
        title: "",
        description: "",
        directions: "",
        ingredients: [],
        category: "",
        cuisine: "",
        meal_type: "",
        is_vegan: false,
        is_vegetarian: false,
        file: undefined,
    });

    useEffect(() => {
        authFetch(API_BASE_URL + "/api/recipes/filters")
            .then((r) => r.json())
            .then(setFilters);
    }, []);

    async function handleSubmit() {
        setLoading(true);
        try {
            // 
            //  image input -> google'a upload w -> url'i alıp backende atıcam
            //
            //
            //    setUploading(true); // Set uploading state to true
            if (!form.file) {
                return;
            }

            console.log(storage);
            var id = uuid();
            const storageRef = ref(storage, `img/${id}`); // Create a reference to the file in Firebase Storage
            var url = "";

            try {
                await uploadBytes(storageRef, form.file); // Upload the file to Firebase Storage
                url = await getDownloadURL(storageRef); // Get the download URL of the uploaded file
                console.log(url);
                console.log("File Uploaded Successfully");
            } catch (error) {
                console.error('Error uploading the file', error);
            } 

            const res = await authFetch(API_BASE_URL + "/api/chef/recipes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...form,
                    description: form.description || null,
                    directions: form.directions || null,
                    category: form.category || null,
                    cuisine: form.cuisine || null,
                    meal_type: form.meal_type || null,
                    image_name: id,
                    ingredients: form.ingredients.filter(
                        (i) => i.name
                    ),
                }),
            });

            if (!res.ok) throw new Error();

            notifications.show({
                title: "Recipe created",
                message: "Your recipe was saved",
                color: "green",
            });

            router.push("/discover");
        } catch {
            notifications.show({
                title: "Error",
                message: "Failed to create recipe",
                color: "red",
            });
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="w-full px-4">
            <h1 className="text-4xl font-bold mb-8">
                Create New Recipe
            </h1>

            <RecipeForm
                value={form}
                onChange={setForm}
                filters={filters}
                loading={loading}
                submitLabel="Create Recipe"
                onSubmit={handleSubmit}
            />
        </div>
    );
}
