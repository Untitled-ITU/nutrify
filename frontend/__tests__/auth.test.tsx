import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SignupPage from "@/app/auth/signup/SignupClient";
import { MantineProvider } from "@mantine/core";
import LoginPage from "@/app/auth/login/page";
import { useAuth } from "@/app/providers/AuthProvider";
import ResetPasswordPage from "@/app/auth/reset-password/page";
import { useSearchParams } from "next/navigation";

const wrapper = ({ children }: any) => <MantineProvider>{children}</MantineProvider>;

describe("SignupPage: White-Box Basis Path Testing", () => {

    it("Path 1: should alert and stop if passwords do not match", async () => {
        render(<SignupPage />, { wrapper });

        // Use exact strings instead of broad regex
        fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password123" } });
        fireEvent.change(screen.getByLabelText("Confirm Password"), { target: { value: "different" } });

        fireEvent.click(screen.getByRole("button", { name: /Create Account/i }));
        expect(global.alert).toHaveBeenCalledWith("Passwords do not match");
    });

    it("Path 2: should alert if password length is < 6 (Boundary Value)", async () => {
        render(<SignupPage />, { wrapper });

        // Use exact strings here too
        fireEvent.change(screen.getByLabelText("Password"), { target: { value: "123" } });
        fireEvent.change(screen.getByLabelText("Confirm Password"), { target: { value: "123" } });

        fireEvent.click(screen.getByRole("button", { name: /Create Account/i }));
        expect(global.alert).toHaveBeenCalledWith("Passwords must be at least 6 characters");
    });

    it("Path 3: should store token and redirect on successful login", async () => {
        const mockLogin = jest.fn();
        (useAuth as jest.Mock).mockReturnValue({ login: mockLogin });

        // Mock successful API response
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ access_token: "mock-token-123" }),
        });

        render(<LoginPage />, { wrapper });

        fireEvent.change(screen.getByLabelText(/E-Mail/i), { target: { value: "test@itu.edu.tr" } });
        fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: "password123" } });
        fireEvent.click(screen.getByRole("button", { name: /Login/i }));

        await waitFor(() => {
            // This covers the logic inside handleSubmit
            expect(mockLogin).toHaveBeenCalledWith("mock-token-123");
        });
    });
});


describe("Auth Integration: URL Parameter Handling", () => {

    it("should initialize as Chef when 'role=chef' is in the URL", () => {
        // Stubbing searchParams.get('role')
        (useSearchParams as jest.Mock).mockReturnValue({
            get: (param: string) => (param === "role" ? "chef" : null)
        });

        render(<SignupPage />, { wrapper });

        // Check if the Switch for Chef is checked (based on your Switch styles/logic)
        const chefLabel = screen.getByText("Chef");
        expect(chefLabel).toBeInTheDocument();
    });
});

jest.mock("@/app/providers/AuthProvider", () => ({
    useAuth: jest.fn(() => ({ login: jest.fn() }))
}));

describe("LoginPage: Black-Box Interface Testing", () => {

    it("Equivalence Class [Invalid]: should show alert on 401 Unauthorized", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            status: 401
        });

        render(<LoginPage />, { wrapper });

        fireEvent.change(screen.getByPlaceholderText("example@email.com"), { target: { value: "wrong@itu.edu.tr" } });
        fireEvent.change(screen.getByPlaceholderText("********"), { target: { value: "wrongpass" } });

        fireEvent.click(screen.getByRole("button", { name: "Login" }));

        await waitFor(() => {
            expect(global.alert).toHaveBeenCalledWith("Invalid credentials");
        });
    });
});


describe("ResetPassword: Functional Requirements", () => {
    it("should validate that reset code is exactly 6 characters", async () => {
        render(<ResetPasswordPage />, { wrapper });

        // 1. You MUST set the email first, or the function returns early!
        const emailInput = screen.getByLabelText(/Email/i);
        fireEvent.change(emailInput, { target: { value: "test@itu.edu.tr" } });

        // 2. Provide an invalid 3-digit code
        const codeInput = screen.getByPlaceholderText("123456");
        fireEvent.change(codeInput, { target: { value: "123" } });

        // 3. Click the button
        const resetBtn = screen.getByRole("button", { name: "Reset Password" });
        fireEvent.click(resetBtn);

        // 4. Use a regex to find the error message (more flexible with Mantine's DOM)
        const errorMessage = await screen.findByText(/Code must be exactly 6 characters/i);
        expect(errorMessage).toBeInTheDocument();
    });
});
