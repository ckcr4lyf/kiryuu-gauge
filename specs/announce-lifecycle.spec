# Announce lifecycle

These scenarios exercise announce write paths against Redis.

## Announce as seeder should register peer in redis

* Generate fresh infohash
* Send announce as seeder
* Peer should exist in seeder hash

## Stopped announce should remove peer from redis

* Generate fresh infohash
* Send announce as seeder
* Send announce as stopped
* Peer should not exist in seeder hash

## Completed announce should move peer from leecher to seeder

* Generate fresh infohash
* Send announce as leecher
* Peer should exist in leecher hash
* Send announce as completed
* Peer should exist in seeder hash
* Peer should not exist in leecher hash
