import React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface FooterProps extends React.HTMLAttributes<HTMLElement> {
    className?: string
}

export function Footer({ className, ...props }: FooterProps) {
    return (
        <footer
            className={cn(
                "w-full border-t bg-background py-6",
                className
            )}
            {...props}
        >
            <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
                <p className="text-center text-sm text-muted-foreground">
                    &copy; {new Date().getFullYear()} DuckDB Table. All rights reserved.
                </p>
                <nav className="flex gap-4 sm:gap-6">
                    <Link
                        href="#"
                        className="text-sm text-muted-foreground underline-offset-4 hover:underline"
                    >
                        Terms
                    </Link>
                    <Link
                        href="#"
                        className="text-sm text-muted-foreground underline-offset-4 hover:underline"
                    >
                        Privacy
                    </Link>
                    <Link
                        href="https://github.com"
                        className="text-sm text-muted-foreground underline-offset-4 hover:underline"
                    >
                        GitHub
                    </Link>
                </nav>
            </div>
        </footer>
    )
}