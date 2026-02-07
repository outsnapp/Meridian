"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Eye, TrendingUp, MapPin } from "lucide-react"

const WATCHLIST_ITEMS = [
  { id: "1", label: "EU regulatory timelines", priority: "High", category: "Regulatory" },
  { id: "2", label: "Competitor pipeline updates", priority: "Medium", category: "Competitive" },
  { id: "3", label: "Pricing & reimbursement signals", priority: "High", category: "Market" },
  { id: "4", label: "Safety surveillance trends", priority: "Medium", category: "Safety" },
]

const RECOMMENDED_AREAS = [
  "Biosimilar entry patterns in key markets",
  "Payer policy changes (EU5 + US)",
  "Real-world evidence requirements",
]

export function DiscoveryPanel() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 px-8 py-8">
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Strategic Watchlist
        </h2>
        <p className="text-xs text-muted-foreground/80 mb-4">
          Key areas to monitor for strategic decisions
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {WATCHLIST_ITEMS.map((item) => (
            <Card key={item.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  {item.label}
                </CardTitle>
                <Badge variant={item.priority === "High" ? "destructive" : "secondary"}>
                  {item.priority}
                </Badge>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">{item.category}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Recommended Monitoring Areas
        </h2>
        <p className="text-xs text-muted-foreground/80 mb-4">
          Suggested focus based on your profile and market context
        </p>
        <Card>
          <CardContent className="pt-6">
            <ul className="space-y-3">
              {RECOMMENDED_AREAS.map((area, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <TrendingUp className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <span className="text-foreground">{area}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <MapPin className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              Add custom watchlist items from the feed or analytics
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Discovery recommendations update as new signals are loaded
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
