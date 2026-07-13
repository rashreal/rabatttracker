import { Agent, setGlobalDispatcher } from 'undici';

// Marktguru's unofficial API can be slow to establish a connection, and
// undici's default connect timeout (10s) was too tight, causing spurious
// "Connect Timeout Error" failures on otherwise-fine connections. 30s gives
// real-world network hiccups room to recover.
setGlobalDispatcher(new Agent({ connectTimeout: 30_000, headersTimeout: 30_000 }));
