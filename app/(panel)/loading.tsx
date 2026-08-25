import { Skeleton } from "@/components/ui/skeleton"

export default function PanelLoading() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <Skeleton className="h-8 w-48 rounded-xl" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
    </div>
  )
}
