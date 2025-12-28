import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import MealPlanPage from "@/components/meal-plan/MealPlanPage";
import { MantineProvider } from "@mantine/core";
import { authFetch, useAuth } from "@/app/providers/AuthProvider";

jest.mock("@/app/providers/AuthProvider", () => ({
  useAuth: jest.fn(),
  authFetch: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
}));

const wrapper = ({ children }: any) => (
  <MantineProvider>{children}</MantineProvider>
);

describe("MealPlanPage: Basis Path & Subsystem Integration", () => {
  const mockUser = { id: 1, username: "ChefArda" };

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
    
    // Default Successful Stubs (Slide 32)
    (authFetch as jest.Mock).mockImplementation((url) => {
      if (url.includes("/api/recipes")) {
        return Promise.resolve({ ok: true, json: async () => ({ recipes: [] }) });
      }
      if (url.includes("/api/planning/weekly")) {
        return Promise.resolve({ ok: true, json: async () => ({ days: [] }) });
      }
      if (url.includes("/api/shopping-list") && !url.includes("compare")) {
        return Promise.resolve({ ok: true, json: async () => ({ items: [] }) });
      }
      if (url.includes("/api/shopping-list/compare-fridge")) {
        return Promise.resolve({ ok: true, json: async () => ({ comparison: [] }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });
  });

  it("Path 1 (Success): should resolve all fetches (Slide 29: Dynamic Execution)", async () => {
    render(<MealPlanPage />, { wrapper });

    // 1. Wait for Main UI
    expect(await screen.findByText("Weekly Menu")).toBeInTheDocument();

    // 2. Wait for Shopping List section to resolve (Fixes the failure)
    // We use findByText to poll until the loading state for the list finishes
    const emptyMsg = await screen.findByText(/List is empty/i);
    expect(emptyMsg).toBeInTheDocument();
  });

  it("Path 2 (Failure): should show error toast on API rejection", async () => {
    (authFetch as jest.Mock).mockImplementation((url) => {
      if (url.includes("/api/planning/weekly")) return Promise.reject(new Error("Fail"));
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    render(<MealPlanPage />, { wrapper });

    const toast = await screen.findByText(/Error loading schedule/i);
    expect(toast).toBeInTheDocument();
  });

  it("should correctly calculate shopping list buy amounts", async () => {
    (authFetch as jest.Mock).mockImplementation((url) => {
      if (url.includes("/api/shopping-list") && !url.includes("compare")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ 
            items: [{ id: 1, amount: 10, unit: "pcs", ingredient: { name: "Eggs" }, is_purchased: false }] 
          }),
        });
      }
      if (url.includes("/api/shopping-list/compare-fridge")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ comparison: [{ id: 1, in_fridge: 4 }] }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    render(<MealPlanPage />, { wrapper });

    // Verification of Integration Math: 10 - 4 = 6
    const buyLabel = await screen.findByText("+ 6 pcs");
    expect(buyLabel).toBeInTheDocument();
  });

  it("should call clear-week API when user confirms deletion (Slide 91: Acceptance)", async () => {
    // FIX: Using spyOn instead of direct cast to avoid TypeError
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
    
    render(<MealPlanPage />, { wrapper });
    await screen.findByText("Weekly Menu");

    const clearBtn = screen.getByRole("button", { name: /clear week/i });
    fireEvent.click(clearBtn);

    expect(confirmSpy).toHaveBeenCalledWith("Clear this entire week?");
    
    await waitFor(() => {
      expect(authFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/planning/clear-week"),
        expect.objectContaining({ method: "DELETE" })
      );
    });

    confirmSpy.mockRestore(); // Cleanup spy
  });
});
