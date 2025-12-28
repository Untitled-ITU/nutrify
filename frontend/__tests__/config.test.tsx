describe("config.ts: Complete Branch Coverage (Slide 52)", () => {
    const OLD_ENV = process.env;

    const envKeys = [
        "NEXT_PUBLIC_API_BASE_URL",
        "NEXT_PUBLIC_FIREBASE_API_KEY",
        "NEXT_PUBLIC_FIREBASE_APP_ID",
        "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
        "NEXT_PUBLIC_FIREBASE_PROJECT_ID_PREPROD",
        "NEXT_PUBLIC_STORAGE_BUCKET",
        "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
        "NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID",
    ];

    beforeEach(() => {
        jest.resetModules();
        process.env = { ...OLD_ENV };
    });

    afterAll(() => {
        process.env = OLD_ENV;
    });

    it("should cover the 'TRUE' branch for all variables (Slide 51)", () => {
        // Set every single env var to a mock value
        envKeys.forEach((key) => {
            process.env[key] = `value-for-${key}`;
        });

        const config = require("@/lib/config");

        // Verify all constants picked up the env value
        expect(config.API_BASE_URL).toBe("value-for-NEXT_PUBLIC_API_BASE_URL");
        expect(config.FIREBASE_API_KEY).toBe("value-for-NEXT_PUBLIC_FIREBASE_API_KEY");
        expect(config.FIREBASE_APP_ID).toBe("value-for-NEXT_PUBLIC_FIREBASE_APP_ID");
        expect(config.FIREBASE_AUTH_DOMAIN).toBe("value-for-NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN");
        expect(config.FIREBASE_PROJECT_ID).toBe("value-for-NEXT_PUBLIC_FIREBASE_PROJECT_ID_PREPROD");
        expect(config.FIREBASE_STORAGE_BUCKET).toBe("value-for-NEXT_PUBLIC_STORAGE_BUCKET");
        expect(config.FIREBASE_MESSAGING_SENDER_ID).toBe("value-for-NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID");
        expect(config.FIREBASE_MEASUREMENT_ID).toBe("value-for-NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID");
    });

    it("should cover the 'FALSE' branch (fallback) for all variables (Slide 17)", () => {
        // Explicitly delete every env var to force the || "" path
        envKeys.forEach((key) => {
            delete process.env[key];
        });

        const config = require("@/lib/config");

        // Verify all constants fell back to empty string
        expect(config.API_BASE_URL).toBe("");
        expect(config.FIREBASE_API_KEY).toBe("");
        expect(config.FIREBASE_APP_ID).toBe("");
        expect(config.FIREBASE_AUTH_DOMAIN).toBe("");
        expect(config.FIREBASE_PROJECT_ID).toBe("");
        expect(config.FIREBASE_STORAGE_BUCKET).toBe("");
        expect(config.FIREBASE_MESSAGING_SENDER_ID).toBe("");
        expect(config.FIREBASE_MEASUREMENT_ID).toBe("");
    });
});
