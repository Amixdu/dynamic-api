#!/bin/sh

# This script runs inside the container when it starts.
# It presents a menu to the user to choose which API server to run.

echo "========================================="
echo "  Dynamic Mock API Generator"
echo "========================================="
echo "Select which API server to start:"
echo "  1) Automatic Mode (from a sentence)"
echo "  2) Simple Manual Mode (endpoint by endpoint)"
echo ""

# -p prompts the user with the given string
read -p "Enter your choice (1 or 2): " choice

case $choice in
    1)
        echo "Starting Automatic API server..."
        # Runs the 'auto' script from package.json
        exec npm run auto
        ;;
    2)
        echo "Starting Simple Manual API server..."
        # Runs the 'simple' script from package.json
        exec npm run manual
        ;;
    *)
        echo "Invalid choice. Exiting."
        exit 1
        ;;
esac