# Blacklist

Kiryuus blacklist is loaded at startup. No URL = 451 (Unavailable For Legal Reasons).
A URL = 307 redirect so the client can fetch the DMCA notice.

## Infohash without DMCA URL returns HTTP 451
* Announce with no-URL blacklisted infohash should return HTTP 451

## Infohash with DMCA URL returns HTTP 307 redirect
* Announce with URL blacklisted infohash should return HTTP 307 to correct location
