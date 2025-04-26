import Link from "next/link";

export default function SelPage() {
    return (
        <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)] bg-white text-black">
            <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
                <span className="text-4xl font-bold">
                    Sel Page
                </span>
                <p className="mb-4">Welcome to the Sel page!</p>

                <div className="flex gap-4 items-center flex-col sm:flex-row">
                    <Link
                        className="rounded-full border border-solid border-black/[.08] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto"
                        href="/"
                    >
                        Back to Home
                    </Link>
                </div>
            </main>
        </div>
    );
}
