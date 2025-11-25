"use client"

import { Button, Divider, Input, Switch, TextInput, useMantineTheme } from "@mantine/core";
import Link from "next/link";

export default function LoginPage() {
    const theme = useMantineTheme();
    return (
        <div className="flex flex-col w-full items-center justify-center">
            <form className="w-md">
                <h2 className="text-4xl text-center">
                    Login
                </h2>
                <Divider my="xl" color="dark" />
                <div className="flex flex-col gap-8 w-full">
                    <TextInput size="lg" radius="lg" label="E-Mail" placeholder="Input component" styles={
                        {
                            label: {
                                fontSize: 24,
                            }
                        }
                    } />
                    <TextInput size="lg" radius="lg" label="Password" placeholder="Input component" styles={
                        {
                            label: {
                                fontSize: 24,
                            }
                        }
                    } />
                    <Button
                        fullWidth
                        radius="lg"
                        type='submit'
                        style={{ backgroundColor: theme.other.primaryDark }}
                        className='text-2xl h-4' fz="h3" size='xl'>Login</Button>
                    <Link className="text-center" href="/auth/signup">Don’t have an account? Sign up</Link>
                </div>
            </form>
        </div>
    )
}
