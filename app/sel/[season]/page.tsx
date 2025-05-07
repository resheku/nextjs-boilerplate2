import SelDataTable from "../sel-data-table"

export default function SeasonPage() {
    return (
        <main className="flex min-h-screen p-4 pt-8">
            <div className="w-full">
                <h1 className="mb-6 text-2xl font-bold">SPDW SEL</h1>
                <SelDataTable />
            </div>
        </main>
    )
}
