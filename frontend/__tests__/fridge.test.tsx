import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import FridgePage from "@/app/fridge/page";
import { MantineProvider } from "@mantine/core";
import { authFetch } from "@/app/providers/AuthProvider";
import { useRouter } from "next/navigation";

// Step 1: Mocking Drivers & Stubs (Slide 31-32)
jest.mock("@/app/providers/AuthProvider", () => ({
    authFetch: jest.fn(),
}));

jest.mock("next/navigation", () => ({
    useRouter: jest.fn(),
}));

// Mock window.confirm for Delete Path
delete (window as any).confirm;
window.confirm = jest.fn();

const wrapper = ({ children }: any) => <MantineProvider>{children}</MantineProvider>;

describe("FridgePage: Basis Path & Integration Testing", () => {
    const mockRouter = { push: jest.fn() };

    beforeEach(() => {
        jest.clearAllMocks();
        (useRouter as jest.Mock).mockReturnValue(mockRouter);
    });

    // --- White-Box: Basis Path Testing (Slide 20) ---

    it("Path 1 (Success): should render fetched fridge items correctly", async () => {
        const mockItems = {
            items: [
                { id: 1, quantity: 5, unit: "pcs", ingredient: { id: 10, name: "Eggs" } }
            ]
        };

        (authFetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => mockItems,
        });

        render(<FridgePage />, { wrapper });

        const item = await screen.findByText("Eggs");
        expect(item).toBeInTheDocument();
        expect(screen.getByText("5 pcs")).toBeInTheDocument();
    });

    it("Path 2 (Unauthorized): should redirect to login on 401 error", async () => {
        (authFetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            status: 401,
        });

        render(<FridgePage />, { wrapper });

        await waitFor(() => {
            expect(mockRouter.push).toHaveBeenCalledWith("/auth/login");
        });
    });

    it("Path 3 (Generic Error): should display error message on fetch failure", async () => {
        (authFetch as jest.Mock).mockRejectedValueOnce(new Error("Connection Failed"));

        render(<FridgePage />, { wrapper });

        const errorMsg = await screen.findByText(/Failed to connect/i);
        expect(errorMsg).toBeInTheDocument();
    });

    // --- Black-Box: Functional Testing (Slide 45) ---

    it("should filter items locally using the search bar", async () => {
        const mockItems = {
            items: [
                { id: 1, quantity: 1, unit: "kg", ingredient: { name: "Tomato" } },
                { id: 2, quantity: 2, unit: "kg", ingredient: { name: "Onion" } },
            ]
        };
        (authFetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => mockItems });

        render(<FridgePage />, { wrapper });

        await screen.findByText("Tomato");

        const searchInput = screen.getByPlaceholderText(/Search.../i);
        fireEvent.change(searchInput, { target: { value: "Tom" } });

        expect(screen.getByText("Tomato")).toBeInTheDocument();
        expect(screen.queryByText("Onion")).not.toBeInTheDocument();
    });

    // --- Integration: Deletion Flow (Slide 37) ---

    it("should call DELETE API and remove item from UI (Slide 37)", async () => {
        const mockItems = {
            items: [{ id: 99, quantity: 1, unit: "lt", ingredient: { name: "Milk" } }]
        };

        // Mock initial load and successful delete
        (authFetch as jest.Mock)
            .mockResolvedValueOnce({ ok: true, json: async () => mockItems }) // Mount fetch
            .mockResolvedValueOnce({ ok: true }); // Delete fetch

        (window.confirm as jest.Mock).mockReturnValue(true);

        render(<FridgePage />, { wrapper });

        // 1. Wait for item to appear
        await screen.findByText("Milk");

        // 2. Click Delete button
        const deleteButtons = screen.getAllByRole("button");
        fireEvent.click(deleteButtons[deleteButtons.length - 1]);

        // 3. CRITICAL FIX: Wait for the item to be removed from the DOM.
        // This ensures the state update (setItems) is wrapped in the internal 'act'.
        await waitFor(() => {
            expect(screen.queryByText("Milk")).not.toBeInTheDocument();
        });

        // 4. Verify the Integration Boundary
        expect(authFetch).toHaveBeenCalledWith(
            expect.stringContaining("/api/fridge/99"),
            expect.objectContaining({ method: "DELETE" })
        );
    });
});
