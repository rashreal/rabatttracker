import { Agent, setGlobalDispatcher } from 'undici';

// Marktguru's unofficial API can be slow to establish a connection, and
// undici's default connect timeout (10s) was too tight, causing spurious
// "Connect Timeout Error" failures on otherwise-fine connections. 30s gives
// real-world network hiccups room to recover.
//
// IMPORTANT: Node's built-in global fetch() is powered by its own internal,
// separately-versioned copy of undici. setGlobalDispatcher() only reaches
// that internal copy if the npm "undici" package major version here matches
// the one Node bundles internally (check via `node -e
// "console.log(process.versions.undici)"`), because the two copies only
// share global dispatcher state via a version-suffixed global symbol
// (Symbol.for('undici.globalDispatcher.<N>')). A mismatched major version
// silently no-ops (or, if passed explicitly as a `dispatcher` fetch option
// instead, throws "invalid onRequestStart method"). Node 22 currently
// bundles undici 6.x, hence the "^6.x" pin in package.json - re-verify this
// after any Node major version bump in the Dockerfile.
setGlobalDispatcher(new Agent({ connectTimeout: 30_000, headersTimeout: 30_000 }));
