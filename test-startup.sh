#!/bin/bash
# Test CLI startup performance

echo "Testing CLI startup time..."
echo ""

# Test 1: Help command (minimal load)
echo "Test 1: omc --help"
time node dist/cli/index.js --help > /dev/null

echo ""

# Test 2: Version command
echo "Test 2: omc --version"
time node dist/cli/index.js --version > /dev/null

echo ""

# Test 3: Stats command (lazy loaded)
echo "Test 3: omc stats --help"
time node dist/cli/index.js stats --help > /dev/null

echo ""
echo "Performance test complete!"
