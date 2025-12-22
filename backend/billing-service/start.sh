#!/bin/sh
# Render startup script - transforms DATABASE_URL to JDBC format
# DATABASE_URL format: postgresql://user:password@host:port/database
# JDBC format: jdbc:postgresql://host:port/database

if [ -n "$DATABASE_URL" ]; then
    echo "Converting DATABASE_URL to JDBC format..."
    
    # Parse DATABASE_URL
    # Format: postgresql://user:password@host:port/database
    
    # Extract user:password@host:port/database (remove postgresql://)
    url_without_protocol=$(echo "$DATABASE_URL" | sed 's|postgresql://||')
    
    # Extract user:password (before @)
    user_pass=$(echo "$url_without_protocol" | cut -d'@' -f1)
    
    # Extract user
    export SPRING_DATASOURCE_USERNAME=$(echo "$user_pass" | cut -d':' -f1)
    
    # Extract password
    export SPRING_DATASOURCE_PASSWORD=$(echo "$user_pass" | cut -d':' -f2)
    
    # Extract host:port/database (after @)
    host_port_db=$(echo "$url_without_protocol" | cut -d'@' -f2)
    
    # Build JDBC URL
    export SPRING_DATASOURCE_URL="jdbc:postgresql://$host_port_db"
    
    echo "SPRING_DATASOURCE_URL=$SPRING_DATASOURCE_URL"
    echo "SPRING_DATASOURCE_USERNAME=$SPRING_DATASOURCE_USERNAME"
fi

# Start the application
exec java -jar app.jar
