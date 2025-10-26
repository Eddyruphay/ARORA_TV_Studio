#!/bin/bash

BASE_URL="https://www.pornpics.com/"

# Fetch the homepage and extract links fitting the patterns
curl -s "${BASE_URL}" \
  | grep -Eo 'href="[^"]*(\/tags\/|\/pornstars\/|\/channels\/)[^"]*"' \
  | sed -E 's/href=\"(.*?)\"/\1/' \
  | sort -u \
> discovered_main_links.txt

echo "Discovered main links saved to discovered_main_links.txt"

# Optional: Extract specific tag links as an example
curl -s "${BASE_URL}/tags/" \
  | grep -Eo 'href="\/tags\/[^\"]+\/"' \
  | sed -E 's/href=\"(.*?)\"/\1/' \
  | sort -u \
  > discovered_tags.txt

echo "Discovered tags saved to src/discovered_tags.txt"
