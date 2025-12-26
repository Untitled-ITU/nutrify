import type { Metadata } from "next";
import { Notifications } from "@mantine/notifications";
import { Geist, Geist_Mono, Quicksand, Urbanist } from "next/font/google";
import "./globals.css";

import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';

import { ColorSchemeScript, MantineProvider, Notification, createTheme, mantineHtmlProps } from '@mantine/core';
import Navbar from "@/components/Navbar";
import { generateColors } from "@mantine/colors-generator";
import { AuthProvider } from "./providers/AuthProvider";
import Head from "next/head";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const quicksandSans = Quicksand({
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Nutrify",
    description: "Recipe management application",
};

const theme = createTheme({
    fontFamily: "var(--font-quicksand)",
    other: {
        primaryDark: "#896C6C",
        contentBackground: "#F3E7E5",
        accentColor: "#896C6C",
    }
})

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" data-mantine-color-scheme="light">
            <head>
                <Head>
                    <title>Nutrify</title>
                    <link rel="icon" href="favicon.ico" sizes="any" />
                </Head>
                <ColorSchemeScript />
            </head>
            <body
                className={`${quicksandSans.className} ${geistMono.variable} antialiased`}
            >
                <AuthProvider>
                    <MantineProvider theme={theme}>
                        <Notifications position="top-right" />
                        <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
                            <Navbar />
                            <main className="flex flex-col gap-8 row-start-2 self-start items-center sm:items-start w-full max-w-7xl">
                                {children}
                            </main>
                        </div>
                    </MantineProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
