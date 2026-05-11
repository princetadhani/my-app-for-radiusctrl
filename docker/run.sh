#!/bin/bash
# ============================================
# Run FreeRADIUS Control Panel Docker Container
# ============================================
# This script runs the Docker container with all required configurations
# Usage: ./docker/run.sh
# ============================================

set -e

echo "============================================"
echo "Starting FreeRADIUS Control Panel Container"
echo "============================================"
echo ""

# Check if container already exists
if [ "$(docker ps -aq -f name=freeradius-control)" ]; then
    echo "⚠️  Container 'freeradius-control' already exists"
    read -p "Stop and remove it? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker stop freeradius-control 2>/dev/null || true
        docker rm freeradius-control 2>/dev/null || true
    else
        echo "Cancelled."
        exit 1
    fi
fi

# Run the container
echo "🚀 Starting container..."
docker run -d \
    --name freeradius-control \
    --restart unless-stopped \
    -p 9000:80 \
    -v /etc/freeradius/3.0:/etc/freeradius/3.0 \
    -v /var/log/freeradius:/var/log/freeradius \
    -v /run/systemd/private:/run/systemd/private \
    -v /var/run/dbus:/var/run/dbus \
    --privileged \
    --pid host \
    freeradius-control:latest

echo ""
echo "============================================"
echo "✅ Container Started Successfully!"
echo "============================================"
echo ""
echo "Container name: freeradius-control"
echo ""
echo "Access the application at:"
echo "  http://$(hostname -I | awk '{print $1}'):9000"
echo ""
echo "Useful commands:"
echo "  View logs:    docker logs -f freeradius-control"
echo "  Stop:         docker stop freeradius-control"
echo "  Restart:      docker restart freeradius-control"
echo "  Remove:       docker rm -f freeradius-control"
echo ""
