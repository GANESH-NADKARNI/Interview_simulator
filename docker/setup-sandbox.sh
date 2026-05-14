#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Code Execution Sandbox Setup Script
# Run this once to prepare Docker images for code execution
# ─────────────────────────────────────────────────────────────────────────────

set -e

echo "🐳 Pulling code execution base images..."
docker pull openjdk:21-slim
docker pull python:3.11-slim
docker pull node:20-slim
docker pull gcc:13

echo "✅ Testing Java execution..."
docker run --rm --network=none openjdk:21-slim \
  sh -c 'echo "class T{public static void main(String[] a){System.out.println(42);}}" > T.java && javac T.java && java T'

echo "✅ Testing Python execution..."
docker run --rm --network=none python:3.11-slim \
  sh -c 'echo "print(42)" | python3'

echo "✅ Testing JavaScript execution..."
docker run --rm --network=none node:20-slim \
  sh -c 'echo "console.log(42)" | node'

echo ""
echo "🎉 All sandbox images ready!"
echo ""
echo "Security settings applied per container:"
echo "  --network=none     : No internet access"
echo "  --memory=256m      : 256 MB RAM limit"
echo "  --cpus=1           : 1 CPU core only"
echo "  Timeout: 10s       : Hard kill after 10 seconds"
