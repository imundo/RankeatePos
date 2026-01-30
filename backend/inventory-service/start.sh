#!/bin/sh
# Render startup script - transforms DATABASE_URL to JDBC format

if [ -n "$DATABASE_URL" ]; then
    echo "Converting DATABASE_URL to JDBC format..."
    url_without_protocol=$(echo "$DATABASE_URL" | sed 's|postgresql://||')
    user_pass=$(echo "$url_without_protocol" | cut -d'@' -f1)
    export SPRING_DATASOURCE_USERNAME=$(echo "$user_pass" | cut -d':' -f1)
    export SPRING_DATASOURCE_PASSWORD=$(echo "$user_pass" | cut -d':' -f2)
    host_port_db=$(echo "$url_without_protocol" | cut -d'@' -f2)
    export SPRING_DATASOURCE_URL="jdbc:postgresql://$host_port_db"
    echo "SPRING_DATASOURCE_URL=$SPRING_DATASOURCE_URL"
fi

exec java -jar app.jar
