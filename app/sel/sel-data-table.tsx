"use client"

import type React from "react"
import { Suspense } from "react"

import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter, useSearchParams } from "next/navigation"

export default function SelDataTableWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SelDataTable />
    </Suspense>
  )
}

function SelDataTable() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [data, setData] = useState<any[]>([])
  const [filteredData, setFilteredData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [seasons, setSeasons] = useState<string[]>([])
  const [selectedSeason, setSelectedSeason] = useState<string>("")
  const [sortConfig, setSortConfig] = useState<{
    key: string | null
    direction: "ascending" | "descending" | null
  }>({
    key: null,
    direction: null,
  })
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")

  // Update URL when season changes
  const updateUrlWithSeason = (season: string) => {
    const params = new URLSearchParams(searchParams.toString())

    if (season) {
      // Set the URL parameter to "all" when "All Seasons" is selected
      params.set("season", season)
    } else {
      params.delete("season")
    }

    router.push(`?${params.toString()}`)
  }

  // Update URL with search term
  const updateUrlWithSearch = (search: string) => {
    const params = new URLSearchParams(searchParams.toString())

    if (search) {
      params.set("search", search)
    } else {
      params.delete("search")
    }

    router.push(`?${params.toString()}`)
  }

  // Handle season change from dropdown
  const handleSeasonChange = (value: string) => {
    setSelectedSeason(value)
    updateUrlWithSeason(value)
  }

  useEffect(() => {
    async function fetchData() {
      try {
        console.log("Fetching data from API...")
        const response = await fetch("/api/sel")

        console.log("API response status:", response.status)

        if (!response.ok) {
          const errorText = await response.text()
          console.error("API error response:", errorText)
          throw new Error(`Failed to fetch data: ${response.status} ${errorText}`)
        }

        const result = await response.json()
        console.log("API data received:", result)

        if (!Array.isArray(result)) {
          console.error("API did not return an array:", result)
          throw new Error("Invalid data format received")
        }

        setData(result)
        setFilteredData(result)

        // Extract unique seasons from the data
        const uniqueSeasons = Array.from(new Set(result.map(item =>
          item.season?.toString() || item.Season?.toString() || ""
        ))).filter(Boolean).sort().reverse(); // Sort and then reverse to get descending order
        setSeasons(uniqueSeasons);

        // Check URL for season parameter
        const seasonFromUrl = searchParams.get("season")

        // Check URL for search parameter
        const searchFromUrl = searchParams.get("search")
        if (searchFromUrl) {
          setSearchTerm(searchFromUrl)
        }

        // Set selected season based on URL parameter, or default to most recent
        if (seasonFromUrl === "all") {
          setSelectedSeason("all")
        } else if (seasonFromUrl && uniqueSeasons.includes(seasonFromUrl)) {
          setSelectedSeason(seasonFromUrl)
        } else if (uniqueSeasons.length > 0) {
          setSelectedSeason(uniqueSeasons[0])
          // Update URL with default season
          updateUrlWithSeason(uniqueSeasons[0])
        }
      } catch (err) {
        console.error("Error in fetchData:", err)
        setError(`Error loading data: ${err instanceof Error ? err.message : "Unknown error"}`)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [searchParams])

  // Apply filtering based on season and search term
  useEffect(() => {
    if (!data.length) return;

    let result = [...data];

    // Filter by season if one is selected and it's not "all"
    if (selectedSeason && selectedSeason !== "all") {
      result = result.filter(item => {
        const itemSeason = item.season?.toString() || item.Season?.toString() || "";
        return itemSeason === selectedSeason;
      });
    }

    // Apply search term filtering
    if (searchTerm.trim() !== "") {
      const lowercasedValue = searchTerm.toLowerCase();
      result = result.filter((item) => {
        return Object.values(item).some((val) =>
          val?.toString().toLowerCase().includes(lowercasedValue)
        );
      });
    }

    setFilteredData(result);
  }, [data, searchTerm, selectedSeason]);

  // Sorting logic
  const requestSort = (key: string) => {
    // Special case for rank column - don't allow sorting on it
    if (key === 'rank') {
      return;
    }

    let direction: "ascending" | "descending" | null = "ascending"

    if (sortConfig.key === key) {
      if (sortConfig.direction === "ascending") {
        direction = "descending"
      } else if (sortConfig.direction === "descending") {
        direction = null
      }
    }

    setSortConfig({ key, direction })
  }

  // Filtering logic
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)
  }

  // Debounce search term updates to URL
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateUrlWithSearch(searchTerm)
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  // Apply sorting to filtered data
  useEffect(() => {
    let sortedData = [...filteredData];

    if (sortConfig.key && sortConfig.direction) {
      sortedData.sort((a, b) => {
        const aValue = a[sortConfig.key!];
        const bValue = b[sortConfig.key!];

        // Handle different data types
        if (typeof aValue === "number" && typeof bValue === "number") {
          return sortConfig.direction === "ascending" ? aValue - bValue : bValue - aValue;
        }

        // Default string comparison
        const aString = String(aValue).toLowerCase();
        const bString = String(bValue).toLowerCase();

        if (aString < bString) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (aString > bString) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }

    setFilteredData(sortedData);
  }, [sortConfig]);

  // Render sort icon based on current sort state
  const getSortIcon = (columnName: string) => {
    // Default state - no sorting
    if (sortConfig.key !== columnName) {
      return (
        <span className="ml-2 inline-block text-gray-500">▾</span>
      )
    }

    // Ascending sort - down triangle
    if (sortConfig.direction === "ascending") {
      return (
        <span className="ml-2 inline-block text-gray-900 font-bold">▴</span>
      )
    }

    // Descending sort - up triangle
    if (sortConfig.direction === "descending") {
      return (
        <span className="ml-2 inline-block text-gray-900 font-bold">▾</span>
      )
    }

    // Fallback (should not happen)
    return (
      <span className="ml-2 inline-block text-gray-500">▾</span>
    )
  }

  // Debounce search term for URL updates and table refresh
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 500) // 500ms delay

    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  // Update URL and filter table when debounced search term changes
  useEffect(() => {
    if (debouncedSearchTerm !== "") {
      updateUrlWithSearch(debouncedSearchTerm)
    }

    // Apply filtering based on debounced search term
    let result = [...data]

    if (selectedSeason && selectedSeason !== "all") {
      result = result.filter(item => {
        const itemSeason = item.season?.toString() || item.Season?.toString() || ""
        return itemSeason === selectedSeason
      })
    }

    if (debouncedSearchTerm.trim() !== "") {
      const lowercasedValue = debouncedSearchTerm.toLowerCase()
      result = result.filter(item => {
        return Object.values(item).some(val =>
          val?.toString().toLowerCase().includes(lowercasedValue)
        )
      })
    }

    setFilteredData(result)
  }, [debouncedSearchTerm, selectedSeason, data])

  if (loading) {
    return (
      <div className="w-full">
        {/* <div className="mb-4">
          <h2 className="text-lg font-semibold">Data Table</h2>
        </div> */}
        <div className="p-4">
          <p className="text-muted-foreground">Loading data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full">
        {/* <div className="mb-4">
          <h2 className="text-lg font-semibold">Data Table</h2>
        </div> */}
        <div className="p-4">
          <p className="text-destructive">{error}</p>
        </div>
      </div>
    )
  }

  // Early return if no data or empty array
  if (!data || data.length === 0) {
    return (
      <div className="w-full">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Data Table</h2>
        </div>
        <div className="p-4">
          <p className="text-muted-foreground">No data available</p>
        </div>
      </div>
    )
  }

  // Get column headers from the first row
  const columns = Object.keys(data[0])

  // Determine which columns to display based on the selected season
  const visibleColumns = selectedSeason && selectedSeason !== "all"
    ? columns.filter(column => !['season', 'Season'].includes(column))
    : columns;

  // Create an array for frozen columns (rank + first 3 actual columns)
  const frozenColumns = ['rank', ...visibleColumns.slice(0, 3)];

  // Create an array for scrollable columns (remaining columns after the first 3)
  const scrollableColumns = visibleColumns.slice(3);

  return (
    <div className="w-full">
      <div className="flex flex-row items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Select value={selectedSeason} onValueChange={handleSeasonChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Season" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Seasons</SelectItem>
              {seasons.map((season) => (
                <SelectItem key={season} value={season}>
                  {season}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search..."
            className="pl-8 pr-8" // Add padding for the cross icon
            value={searchTerm}
            onChange={handleSearch}
          />
          {searchTerm && (
            <button
              className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground hover:text-black"
              onClick={() => {
                setSearchTerm("") // Clear the search term
                updateUrlWithSearch("") // Update the URL
              }}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>
      <div className="w-full overflow-x-auto relative">
        <div style={{ display: "flex" }}>
          {/* Frozen first 4 columns */}
          <div className="sticky left-0 z-10 bg-white/95 backdrop-blur-sm dark:bg-gray-950/95" style={{ minWidth: "fit-content" }}>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  {frozenColumns.map((column) => (
                    <TableHead key={column} className="py-2 text-xs font-medium whitespace-nowrap">
                      <Button
                        variant="ghost"
                        onClick={() => requestSort(column)}
                        className="flex items-center p-0 text-xs font-medium hover:bg-transparent"
                      >
                        {column}
                        {getSortIcon(column)}
                      </Button>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-16 text-center">
                      No results found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((row, rowIndex) => (
                    <TableRow key={rowIndex} className="h-8 text-sm hover:bg-muted/30">
                      {frozenColumns.map((column) => (
                        <TableCell key={`frozen-${rowIndex}-${column}`} className="py-1 px-3 whitespace-nowrap">
                          {column === 'rank'
                            ? rowIndex + 1
                            : (["Average", "Home Avg.", "Away Avg."].includes(column) && row[column] != null && !isNaN(Number(row[column])))
                              ? Number(row[column]).toFixed(3)
                              : row[column]?.toString() || ""}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Scrollable remaining columns */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  {scrollableColumns.map((column) => (
                    <TableHead key={column} className="py-2 text-xs font-medium whitespace-nowrap">
                      <Button
                        variant="ghost"
                        onClick={() => requestSort(column)}
                        className="flex items-center p-0 text-xs font-medium hover:bg-transparent"
                      >
                        {column}
                        {getSortIcon(column)}
                      </Button>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={scrollableColumns.length} className="h-16 text-center">
                      No results found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((row, rowIndex) => (
                    <TableRow key={rowIndex} className="h-8 text-sm hover:bg-muted/30">
                      {scrollableColumns.map((column) => (
                        <TableCell key={`scroll-${rowIndex}-${column}`} className="py-1 px-3 whitespace-nowrap">
                          {column === 'rank'
                            ? rowIndex + 1
                            : (["Average", "Home Avg.", "Away Avg."].includes(column) && row[column] != null && !isNaN(Number(row[column])))
                              ? Number(row[column]).toFixed(3)
                              : row[column]?.toString() || ""}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
      <div className="mt-4 text-sm text-muted-foreground">
        Showing {filteredData.length} {filteredData.length === 1 ? "record" : "records"}
        {filteredData.length !== data.length && ` (filtered from ${data.length} total)`}
        {selectedSeason && selectedSeason !== "all" && ` for season: ${selectedSeason}`}
      </div>
    </div>
  )
}

