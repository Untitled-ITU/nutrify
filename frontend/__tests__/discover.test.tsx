import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import DiscoverPage from "@/app/discover/page";
import { MantineProvider } from "@mantine/core";
import { authFetch } from "@/app/providers/AuthProvider";
import * as tableActions from "@/lib/tableActions";

// 1. Mock the Stubs (Slide 32)
jest.mock("@/app/providers/AuthProvider", () => ({
  authFetch: jest.fn(),
}));

// Mock the entire library to prevent internal component crashes
jest.mock("@/lib/tableActions", () => ({
  handleAddFavorite: jest.fn(),
  handleRemoveFavorite: jest.fn(),
  fetchCollections: jest.fn(() => Promise.resolve({ collections: [] })),
}));

// 2. Stub out complex child components to isolate DiscoverPage (Slide 29)
jest.mock("@/components/recipes/RecipeExplorer", () => ({
  RecipeExplorer: ({ recipes, onFiltersChangeAction, renderActions }: any) => (
    <div data-testid="explorer">
      <button onClick={() => onFiltersChangeAction({ is_vegan: true })}>Apply Vegan Filter</button>
      {recipes.map((r: any) => (
        <div key={r.id}>
          <span>{r.title}</span>
          {renderActions(r)}
        </div>
      ))}
    </div>
  ),
}));

jest.mock("@/components/meal-plan/AddToPlanButton", () => ({
  AddToPlanButton: () => <div data-testid="plan-stub" />
}));

jest.mock("@/components/recipes/AddToCollectionMenu", () => ({
  AddToCollectionMenu: () => <div data-testid="collection-stub" />
}));

const wrapper = ({ children }: any) => (
  <MantineProvider>{children}</MantineProvider>
);

describe("DiscoverPage: Basis Path & Integration Testing", () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Default success response for mount fetch
    (authFetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ recipes: [] }),
    });
  });

  // --- Path Testing: Success Branch (Slide 20) ---
  it("Path 1: should fetch and display recipes on mount", async () => {
    const mockRecipes = [{ id: 1, title: "Karnıyarık", is_favorite: false }];
    (authFetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ recipes: mockRecipes }),
    });

    render(<DiscoverPage />, { wrapper });

    expect(screen.getByText(/Loading recipes.../i)).toBeInTheDocument();

    const recipeTitle = await screen.findByText("Karnıyarık");
    expect(recipeTitle).toBeInTheDocument();
  });

  // --- Path Testing: Failure Branch (Slide 51) ---
  it("Path 2: should handle API errors correctly", async () => {
    (authFetch as jest.Mock).mockResolvedValueOnce({ ok: false });

    render(<DiscoverPage />, { wrapper });

    const errorMsg = await screen.findByText(/Failed to fetch recipes/i);
    expect(errorMsg).toBeInTheDocument();
  });

  // --- Integration Boundary: URL Construction (Slide 58) ---
  it("should re-fetch with vegan filter when triggered", async () => {
    render(<DiscoverPage />, { wrapper });

    const filterBtn = screen.getByText("Apply Vegan Filter");
    fireEvent.click(filterBtn);

    await waitFor(() => {
      expect(authFetch).toHaveBeenCalledWith(expect.stringContaining("is_vegan=true"));
    });
  });

  // --- Side Effect Testing (Slide 37) ---
it("should toggle favorite status optimistically (Slide 37)", async () => {
    const mockRecipe = { id: 77, title: "Favorite Test", is_favorite: false };
    
    // Initial fetch mock
    (authFetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ recipes: [mockRecipe] }),
    });

    render(<DiscoverPage />, { wrapper });

    // 1. Wait for the initial render (Slide 29: Dynamic Execution)
    const recipeTitle = await screen.findByText("Favorite Test");
    expect(recipeTitle).toBeInTheDocument();

    // 2. Find the heart button (ActionIcon)
    const buttons = screen.getAllByRole("button");
    const heartBtn = buttons.find(btn => !btn.textContent); // Find the icon-only button
    
    // 3. Trigger the click
    if (heartBtn) fireEvent.click(heartBtn);

    // 4. CRITICAL FIX: Wait for the library call AND the state update
    // waitFor automatically wraps your assertions in 'act()'
    await waitFor(() => {
        expect(tableActions.handleAddFavorite).toHaveBeenCalledWith(mockRecipe);
    });

    // 5. Verify the state update was processed by looking for the item again
    // This ensures the optimistic update on Line 87 is fully resolved.
    expect(await screen.findByText("Favorite Test")).toBeInTheDocument();
});
});
