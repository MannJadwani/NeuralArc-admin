#!/usr/bin/env node
/*
  Usage:
    SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/setup-admin.js --email you@example.com --password "UserPassword123" --passcode "PortalPasscode!"
    (Supports both --key=value and --key value forms)
*/

const { createClient } = require('@supabase/supabase-js')
const bcrypt = require('bcryptjs')

function parseArgs(argv) {
  const args = {}
  for (let i = 2; i < argv.length; i++) {
    const token = argv[i]
    if (!token.startsWith('--')) continue
    let key = ''
    let value = ''
    const eqIdx = token.indexOf('=')
    if (eqIdx !== -1) {
      key = token.slice(2, eqIdx)
      value = token.slice(eqIdx + 1)
    } else {
      key = token.slice(2)
      // Read next argv as value if present and not another flag
      if (i + 1 < argv.length && !argv[i + 1].startsWith('--')) {
        value = argv[i + 1]
        i++
      } else {
        value = ''
      }
    }
    args[key] = value
  }
  return args
}

async function main() {

  const SUPABASE_URL = "https://hjongcjpjvzxozbhmimy.supabase.co"
  const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqb25nY2pwanZ6eG96YmhtaW15Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTQzMTgwNiwiZXhwIjoyMDYxMDA3ODA2fQ.SdOMwXy9tlxlTDqmcGm9wjJyXp75vY_SD04fF8jKsZU"

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env')
    process.exit(1)
  }

  const { email, password, passcode } = parseArgs(process.argv)
  if (typeof email !== 'string' || email.length === 0 || typeof password !== 'string' || password.length === 0 || typeof passcode !== 'string' || passcode.length === 0) {
    console.error('Usage: node scripts/setup-admin.js --email <email> --password <password> --passcode <portal-passcode>')
    process.exit(1)
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  console.log('Creating/fetching user in Supabase Auth...')

  let user = null
  // Try to create the user first
  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (createError) {
    // If user exists, try to look up by email
    console.warn('Create user failed, attempting to find existing user by email:', createError.message)
    // Fallback: scan pages to find the user by email
    let found = null
    for (let page = 1; page <= 10 && !found; page++) {
      const { data: listed, error: listError } = await supabase.auth.admin.listUsers({
        page,
        perPage: 200,
      })
      if (listError) {
        console.error('List users failed:', listError.message)
        process.exit(1)
      }
      if (listed && Array.isArray(listed.users)) {
        found = listed.users.find((u) => (u.email || '').toLowerCase() === email.toLowerCase()) || null
      }
    }
    if (!found) {
      console.error('Unable to find existing user with that email')
      process.exit(1)
    }
    user = found
  } else {
    user = created.user
  }

  if (!user) {
    console.error('No user returned from Supabase')
    process.exit(1)
  }

  console.log('Hashing admin portal passcode...')
  const salt = await bcrypt.genSalt(10)
  const passcodeHash = await bcrypt.hash(passcode, salt)

  console.log('Inserting into public.admin_users...')
  const { error: insertError } = await supabase
    .from('admin_users')
    .upsert({ id: user.id, email: user.email, passcode_hash: passcodeHash }, { onConflict: 'id' })

  if (insertError) {
    console.error('Failed to upsert admin_users row:', insertError.message)
    process.exit(1)
  }

  console.log('Admin setup complete!')
  console.log(`- User ID: ${user.id}`)
  console.log(`- Email:   ${user.email}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})


