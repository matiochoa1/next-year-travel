import { BudgetSection } from '../features/budget/BudgetSection'
import { ComparisonSection } from '../features/comparison/ComparisonSection'
import { DestinationExplorer } from '../features/destinations/DestinationExplorer'
import { IslandExplorer } from '../features/islands/IslandExplorer'
import { RoutePlanner } from '../features/maps/RoutePlanner'
import { SessionProvider } from '../features/voting/session'
import { VotingSection } from '../features/voting/VotingSection'
import { WeatherSection } from '../features/weather/WeatherSection'

export default function BelowTheFold() {
  return (
    <SessionProvider>
      <DestinationExplorer />
      <RoutePlanner />
      <IslandExplorer />
      <WeatherSection />
      <ComparisonSection />
      <BudgetSection />
      <VotingSection />
    </SessionProvider>
  )
}
