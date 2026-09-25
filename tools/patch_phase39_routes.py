from pathlib import Path
import re

root=Path(r"C:\Users\DIYA GOEL\Downloads\EBDESIGN")

p=root/"frontend/src/config/routes.js"
t=p.read_text(encoding="utf-8")
pattern=re.compile(r"\n\s*\{\n\s*path:\s*'/wallet',\n\s*component:\s*DigitalWalletPage,\n\s*title:\s*'Digital Wallet - Manage Your Funds',\n\s*description:\s*'Manage your digital wallet, check balance, and view transactions',\n\s*keywords:\s*'wallet, digital, balance, funds',\n\s*transition:\s*'slide',\n\s*\},",re.M)
t2,n=pattern.subn("",t,count=1)
if n!=1:
    raise RuntimeError(f"public wallet route block not uniquely found: {n}")
p.write_text(t2,encoding="utf-8")

compat=root/"frontend/src/components/ProtectedRoute.jsx"
compat.write_text("""/**
 * Compatibility export.
 *
 * RouteGuard.jsx is the canonical authentication/authorization implementation.
 * This file is retained so historical imports cannot drift into a second policy.
 */
export { ProtectedRoute as default, ProtectedRoute } from './RouteGuard';
""",encoding="utf-8")
print("wallet route normalized; guard compatibility wrapper installed")
