#!/bin/sh

cd /app

# Match the image-baked plugin dir even if the runtime remaps HOME
# (GitHub Actions container jobs set HOME=/github/home).
export GAUGE_HOME="${GAUGE_HOME:-/opt/gauge}"

gauge run -v specs/
