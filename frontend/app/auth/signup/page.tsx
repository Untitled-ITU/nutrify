"use client"

import { Button, Divider, Input, Switch, TextInput, useMantineTheme } from "@mantine/core";
import Link from "next/link";

export default function SignupPage() {
    const theme = useMantineTheme();
    return (
        <div className="flex flex-col w-full items-center justify-center">
            <form className="w-md">
                <h2 className="text-4xl text-center">
                    Sign Up
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
                    <TextInput size="lg" radius="lg" label="Confirm Password" placeholder="Input component" styles={
                        {
                            label: {
                                fontSize: 24,
                            }
                        }
                    } />
                    <div className="w-full">
                        <div className="text-2xl font-medium mb-3">
                            User Type
                        </div>
                        <div className="flex flex-row w-full items-center justify-center gap-8">
                            <div className="w-24 text-right">
                                Consumer
                            </div>
                            <Switch size="xl" />
                            <div className="w-24 text-left">
                                Chef
                            </div>
                        </div>
                    </div>
                    <Button
                        fullWidth
                        radius="lg"
                        type='submit'
                        style={{ backgroundColor: theme.other.primaryDark }}
                        className='text-2xl h-4' fz="h3" size='xl'>Create Account</Button>
                    <Link className="text-center" href="/auth/login">Already have an account? Log in</Link>
                </div>
            </form>
        </div>
    )
}
