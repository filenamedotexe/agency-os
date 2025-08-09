#!/bin/bash

# Supabase API configuration
SUPABASE_URL="https://lfqnpszawjpcydobpxul.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmcW5wc3phd2pwY3lkb2JweHVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3MTE4NDAsImV4cCI6MjA3MDI4Nzg0MH0.b4A5oq-iGVtprAu9K1yfquH8-DiVd-7ytX_Cp6QojDo"

echo "Creating users via Supabase Auth API..."

# Function to create a user
create_user() {
  local email=$1
  local first_name=$2
  local last_name=$3
  local role=$4
  
  echo "Creating $email ($role)..."
  
  response=$(curl -s -X POST "$SUPABASE_URL/auth/v1/signup" \
    -H "apikey: $ANON_KEY" \
    -H "Content-Type: application/json" \
    -d "{
      \"email\": \"$email\",
      \"password\": \"password123\",
      \"data\": {
        \"first_name\": \"$first_name\",
        \"last_name\": \"$last_name\",
        \"role\": \"$role\"
      }
    }")
  
  if echo "$response" | grep -q '"id"'; then
    echo "✓ Created $email"
    # Auto-confirm the user via database
    psql "postgresql://postgres:agency-final@db.lfqnpszawjpcydobpxul.supabase.co:5432/postgres" -c "UPDATE auth.users SET email_confirmed_at = NOW() WHERE email = '$email';" > /dev/null 2>&1
  else
    echo "✗ Failed to create $email: $response"
  fi
}

# Create team members
create_user "john@agencyos.dev" "John" "Smith" "team_member"
create_user "sarah@agencyos.dev" "Sarah" "Johnson" "team_member"

# Create clients
create_user "client1@acme.com" "Alice" "Brown" "client"
create_user "client2@techcorp.com" "Bob" "Wilson" "client"
create_user "client3@startup.io" "Carol" "Davis" "client"

echo ""
echo "All users created with password: password123"
echo ""
echo "Test accounts:"
echo "Admin:    admin@agencyos.dev"
echo "Team:     john@agencyos.dev"
echo "Client:   client1@acme.com"