import * as chefLib from "@/lib/chef";
import { authFetch } from "@/app/providers/AuthProvider";
import { API_BASE_URL } from "@/lib/config";

// Step 1: Mock the external dependencies (Stubs - Slide 32)
jest.mock("@/app/providers/AuthProvider", () => ({
    authFetch: jest.fn(),
}));

// Mock the global fetch for public endpoints
global.fetch = jest.fn();

describe("Chef Library: Unit Testing (Logic & I/O)", () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // --- Path Testing (Slide 20): Testing fetchProfile ---
    describe("fetchProfile", () => {
        it("Success Path: should return profile data on 200 OK", async () => {
            const mockProfile = { id: 1, email: "test@itu.edu.tr", username: "chef1", role: "chef" };

            (authFetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => mockProfile,
            });

            const result = await chefLib.fetchProfile();

            expect(authFetch).toHaveBeenCalledWith(`${API_BASE_URL}/api/auth/profile`);
            expect(result).toEqual(mockProfile);
        });

        it("Failure Path: should throw error if response is not ok", async () => {
            (authFetch as jest.Mock).mockResolvedValueOnce({ ok: false });

            await expect(chefLib.fetchProfile()).rejects.toThrow("Failed to fetch profile");
        });
    });

    // --- Black-Box Testing (Slide 58): Testing createChefRecipe ---
    describe("createChefRecipe", () => {
        const payload: chefLib.CreateRecipePayload = {
            title: "Test Recipe",
            is_vegan: true,
            ingredients: [{ name: "Tomato", quantity: 2, unit: "pcs" }]
        };

        it("should send a POST request with correct headers and body", async () => {
            (authFetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => ({ msg: "Created", recipe_id: 123 }),
            });

            const result = await chefLib.createChefRecipe(payload);

            expect(authFetch).toHaveBeenCalledWith(
                `${API_BASE_URL}/api/chef/recipes`,
                expect.objectContaining({
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                })
            );
            expect(result.recipe_id).toBe(123);
        });
    });

    // --- Testing Compound Logic (Slide 17): fetchChefPublicProfile ---
    // This function has an 'if' that tries authFetch first, then falls back to fetch
    describe("fetchChefPublicProfile", () => {
        const chefId = 99;

        it("Success Path 1: should return data from authFetch if successful", async () => {
            (authFetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => ({ username: "ChefArda" }),
            });

            const result = await chefLib.fetchChefPublicProfile(chefId);
            expect(result.username).toBe("ChefArda");
            expect(global.fetch).not.toHaveBeenCalled(); // Fallback not needed
        });

        it("Success Path 2: should fallback to standard fetch if authFetch fails", async () => {
            // First call (authFetch) fails
            (authFetch as jest.Mock).mockResolvedValueOnce({ ok: false });

            // Second call (global fetch) succeeds
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => ({ username: "GuestViewChef" }),
            });

            const result = await chefLib.fetchChefPublicProfile(chefId);
            expect(result.username).toBe("GuestViewChef");
            expect(global.fetch).toHaveBeenCalled();
        });
    });

    // --- Equivalence Partitioning (Slide 61): resetPassword ---
    describe("resetPassword", () => {
        it("should handle error messages returned from the API body", async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                json: async () => ({ msg: "Invalid Code" }),
            });

            await expect(chefLib.resetPassword({
                email: "a@b.com",
                code: "123",
                new_password: "pass"
            })).rejects.toThrow("Invalid Code");
        });
    });

    describe("Chef CRUD Operations", () => {
        const recipeId = 42;

        it("should cover fetchChefRecipes and fetchChefStats", async () => {
            (authFetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ recipes: [], total_recipes: 0 }) });

            await chefLib.fetchChefRecipes();
            await chefLib.fetchChefStats();

            expect(authFetch).toHaveBeenCalledTimes(2);
        });

        it("should cover updateChefRecipe (PUT)", async () => {
            (authFetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ msg: "Updated" }) });

            const res = await chefLib.updateChefRecipe(recipeId, { title: "New Title" });

            expect(authFetch).toHaveBeenCalledWith(expect.stringContaining(`/api/chef/recipes/${recipeId}`), expect.objectContaining({ method: "PUT" }));
            expect(res.msg).toBe("Updated");
        });

        it("should cover deleteChefRecipe (DELETE)", async () => {
            (authFetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ msg: "Deleted" }) });

            await chefLib.deleteChefRecipe(recipeId);

            expect(authFetch).toHaveBeenCalledWith(expect.stringContaining(`/api/chef/recipes/${recipeId}`), expect.objectContaining({ method: "DELETE" }));
        });

        it("should cover fetchChefOwnProfile and updateChefOwnProfile", async () => {
            (authFetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({}) });

            await chefLib.fetchChefOwnProfile();
            await chefLib.updateChefOwnProfile({ bio: "Hello" });

            expect(authFetch).toHaveBeenCalledTimes(2);
        });
    });

    // Inside your chef.test.ts
    describe("Chef Lib: Error Path Coverage (Slide 51)", () => {

        it("Line 86-93: createChefRecipe should throw on API error", async () => {
            (authFetch as jest.Mock).mockResolvedValueOnce({ ok: false });
            await expect(chefLib.createChefRecipe({ title: "a" })).rejects.toThrow("Failed to create recipe");
        });

        it("Line 118-121: updateChefRecipe should throw on API error", async () => {
            (authFetch as jest.Mock).mockResolvedValueOnce({ ok: false });
            await expect(chefLib.updateChefRecipe(1, {})).rejects.toThrow("Failed to update recipe");
        });

        it("Line 160-169: updateChefOwnProfile should throw on API error", async () => {
            (authFetch as jest.Mock).mockResolvedValueOnce({ ok: false });
            await expect(chefLib.updateChefOwnProfile({})).rejects.toThrow("Failed to update chef profile");
        });

        it("Line 222-232: fetchChefPublicRecipes fallback logic path (Slide 17)", async () => {
            // 1. First fetch (/recipes) fails
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: false
            });

            // 2. fetchChefPublicProfile is called inside. 
            // It first tries authFetch, let's make that fail too.
            (authFetch as jest.Mock).mockResolvedValueOnce({
                ok: false
            });

            // 3. fetchChefPublicProfile then falls back to a standard fetch (/chefs/id)
            // We make this one succeed.
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    username: "FallbackChef",
                    recipes: [{ id: 101, title: "Fallback Recipe" }]
                }),
            });

            const result = await chefLib.fetchChefPublicRecipes(1);

            // Verify the result matches the data from the deep fallback path
            expect(result.recipes).toHaveLength(1);
            expect(result.recipes[0].title).toBe("Fallback Recipe");

            // Verify the "Compound Logic" (Slide 17) was followed:
            // It should have tried fetch twice and authFetch once.
            expect(global.fetch).toHaveBeenCalledTimes(2);
            expect(authFetch).toHaveBeenCalledTimes(1);
        });
    });
});
