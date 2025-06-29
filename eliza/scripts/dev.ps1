# PowerShell script for Windows development

# Navigate to project root (same as cd "$(dirname "$0")"/.. in bash)
Set-Location (Split-Path $PSScriptRoot)

# Convert PowerShell arguments to a format that the agent can understand
$AGENT_ARGS = $args -join " "
Write-Host "Passing arguments: $AGENT_ARGS"

# Base packages directory
$PACKAGES_DIR = "./packages"

# Display the same help message
Write-Host @"

***********************************************************************
*                                                                     *
* IMPORTANT NOTICE:                                                  *
*                                                                     *
* To add your plugin to the development workflow:                    *
*                                                                     *
*  1. Navigate to the 'scripts' directory in your project.           *
*                                                                     *
*        cd scripts                                                  *
*                                                                     *
*  2. Edit the 'dev.ps1' script file.                                *
*                                                                     *
*     Add your plugin's folder name to the `WORKING_FOLDERS` array    *
*                                                                     *
* This will ensure that your plugin's development server runs        *
* alongside others when you execute this script.                     *
***********************************************************************

"@

# Brief delay with visual feedback
1..5 | ForEach-Object {
    Write-Host "." -NoNewline
    Start-Sleep -Milliseconds 400
}
Write-Host ""

# Check if packages directory exists
if (-not (Test-Path $PACKAGES_DIR)) {
    Write-Host "Error: Directory $PACKAGES_DIR does not exist."
    exit 1
}

# List of working folders to watch (relative to $PACKAGES_DIR)
$WORKING_FOLDERS = @(
    "client-direct",
    "client-auto",
    "client-discord",
    "client-telegram",
    "client-twitter",
    "client-farcaster",
    "plugin-crossmint",
    "plugin-bootstrap",
    "plugin-coinbase",
    "plugin-image-generation",
    "plugin-node",
    "plugin-whatsapp",
    "plugin-video-generation",
    "plugin-0g",
    "adapter-postgres",
    "adapter-sqlite",
    "adapter-sqljs",
    "adapter-supabase"
)

# Initialize array for commands
$COMMANDS = @()

# Handle core package first
$CORE_PACKAGE = Join-Path $PACKAGES_DIR "core"
if (Test-Path $CORE_PACKAGE) {
    $COMMANDS += "pnpm --dir `"$CORE_PACKAGE`" dev"
}
else {
    Write-Host "Warning: 'core' package not found in $PACKAGES_DIR"
}

# Process remaining working folders
foreach ($FOLDER in $WORKING_FOLDERS) {
    $PACKAGE = Join-Path $PACKAGES_DIR $FOLDER
    if (Test-Path $PACKAGE) {
        $COMMANDS += "pnpm --dir `"$PACKAGE`" dev"
    }
    else {
        Write-Host "Warning: '$FOLDER' folder not found in $PACKAGES_DIR"
    }
}

# Add specific commands for other directories
if (Test-Path "./client") {
    $COMMANDS += "pnpm --dir client dev"
}
else {
    Write-Host "Warning: 'client' directory not found."
}

if (Test-Path "./agent") {
    $WATCH_PATHS = $WORKING_FOLDERS | ForEach-Object { "--watch `"./packages/$_/dist`"" }
    # Ensure the character argument is properly formatted and escaped
    $AGENT_CMD = "nodemon $($WATCH_PATHS -join ' ') -e js,json,map --delay 2 node `"./agent/dist/index.js`" -- $AGENT_ARGS"
    Write-Host "Agent command: $AGENT_CMD"  # Debug line
    $COMMANDS += $AGENT_CMD
}
else {
    Write-Host "Warning: 'agent' directory not found."
}

# Run build command first
Write-Host "Running build..."
pnpm build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed. Exiting."
    exit 1
}

# Run all commands concurrently with proper quoting
if ($COMMANDS.Count -gt 0) {
    $CONCURRENT_CMD = "npx concurrently --raw " + ($COMMANDS -join " ")
    Invoke-Expression $CONCURRENT_CMD
}
else {
    Write-Host "No valid packages to run."
}
