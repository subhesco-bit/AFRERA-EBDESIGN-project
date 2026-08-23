/**
 * This page previously called unifiedLedgerAPI, a "One Ledger + 9 Economies"
 * segmented-ledger backend. That backend was deleted 2026-08-17: the build
 * directive explicitly rejects a separate ledger per economy in favor of the
 * canonical journal_entries/journal_lines ledger (economy/region represented
 * as a cost-center tag, not a separate table), and the service wrote through
 * a signalBus instance disconnected from the real reflex engine. This page
 * now just explains that and points to the real ledger, rather than calling
 * an endpoint that no longer exists.
 */
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { ArrowRight } from 'lucide-react'

export default function UnifiedLedgerPage() {
  return (
    <div className="container mx-auto py-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold">Unified Ledger</h1>
        <p className="text-muted-foreground">This page has moved.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>The "9 economies" model was rejected</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p>
            This page was built around a segmented-ledger design that split money into nine
            separate regional "economies," each with its own balance and its own transfer
            path between them. That design was rejected in favor of a single ledger: one
            tamper-evident, hash-chained set of journal entries, with region or economy
            recorded as a tag on each entry rather than a separate ledger to keep in sync.
          </p>
          <p>
            The backend this page called for balances, entries, and reconciliation has been
            removed, so there is nothing genuine to display here anymore.
          </p>
          <Button asChild>
            <Link to="/ledger">
              Go to the ledger
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
