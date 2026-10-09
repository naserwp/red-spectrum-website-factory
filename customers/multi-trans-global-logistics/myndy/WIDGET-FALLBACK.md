# Multi Trans widget fallback

The official loader at https://widget.myndy.ai/myndy-convai-widget.es.js timed out during repeated live checks. The agent endpoint remained reachable.

Multi Trans now supplies an optional same-origin fallback to CustomerMyndy. It loads after five seconds only if the provider has not registered its custom element. Other customers do not supply this option and retain their existing behavior.

The fallback is the unmodified official bundle captured during the earlier successful widget verification. It has no relative imports or import.meta dependency and still calls Myndy services directly. No contacts API credential is embedded and no API endpoint is changed.

Asset: public/customers/multi-trans-global-logistics/myndy-widget-207f75d8.js
SHA-256: 207f75d87d2a5a3f2eb21469355c0f20f8cc0e08f4ffa7458d90e20b5a93be7f
Original source: https://widget.myndy.ai/myndy-convai-widget.es.js

Treat this as a pinned third-party dependency. Preserve the upstream notices, and validate the exact agent, browser behavior and hash before replacing it with a newer official bundle. Provider API outages remain separate from script-delivery resilience.
