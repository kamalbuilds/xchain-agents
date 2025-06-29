#!/usr/bin/env node

/**
 * Eliza Railway Deployment Validation Script
 *
 * This script validates that your Eliza project is ready for Railway deployment
 * by checking configurations, dependencies, and environment setup.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DeploymentValidator {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.info = [];
    }

    addError(message) {
        this.errors.push(`❌ ERROR: ${message}`);
    }

    addWarning(message) {
        this.warnings.push(`⚠️  WARNING: ${message}`);
    }

    addInfo(message) {
        this.info.push(`ℹ️  INFO: ${message}`);
    }

    checkFileExists(filePath, required = true) {
        const exists = fs.existsSync(filePath);
        if (!exists && required) {
            this.addError(`Required file missing: ${filePath}`);
        } else if (!exists) {
            this.addWarning(`Optional file missing: ${filePath}`);
        } else {
            this.addInfo(`File found: ${filePath}`);
        }
        return exists;
    }

    checkPackageJson() {
        console.log('\n🔍 Checking package.json configurations...');

        // Root package.json
        if (this.checkFileExists('package.json')) {
            const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

            if (!pkg.scripts?.start) {
                this.addWarning('No "start" script found in root package.json');
            }

            if (!pkg.scripts?.build) {
                this.addWarning('No "build" script found in root package.json');
            }

            if (pkg.engines?.node) {
                this.addInfo(`Node.js version specified: ${pkg.engines.node}`);
            } else {
                this.addWarning('No Node.js version specified in engines field');
            }

            if (pkg.packageManager) {
                this.addInfo(`Package manager specified: ${pkg.packageManager}`);
            }
        }

        // Agent package.json
        if (this.checkFileExists('agent/package.json')) {
            const agentPkg = JSON.parse(fs.readFileSync('agent/package.json', 'utf8'));

            if (!agentPkg.scripts?.start) {
                this.addError('No "start" script found in agent/package.json');
            }
        }

        // Client package.json
        if (this.checkFileExists('client/package.json')) {
            const clientPkg = JSON.parse(fs.readFileSync('client/package.json', 'utf8'));

            if (!clientPkg.scripts?.build) {
                this.addError('No "build" script found in client/package.json');
            }

            if (!clientPkg.scripts?.preview && !clientPkg.scripts?.start) {
                this.addWarning('No "preview" or "start" script found in client/package.json');
            }
        }
    }

    checkNixpacksConfigs() {
        console.log('\n🔍 Checking Nixpacks configurations...');

        this.checkFileExists('nixpacks.toml');
        this.checkFileExists('client/nixpacks.toml', false);
        this.checkFileExists('client/nixpacks.static.toml', false);

        if (this.checkFileExists('nixpacks.toml')) {
            const content = fs.readFileSync('nixpacks.toml', 'utf8');
            if (content.includes('[start]')) {
                this.addInfo('Start command configured in nixpacks.toml');
            } else {
                this.addWarning('No start command found in nixpacks.toml');
            }

            if (content.includes('[healthcheck]')) {
                this.addInfo('Health check configured in nixpacks.toml');
            } else {
                this.addInfo('Consider adding health check to nixpacks.toml');
            }
        }
    }

    checkEnvironmentTemplate() {
        console.log('\n🔍 Checking environment configuration...');

        this.checkFileExists('railway.env.example', false);
        this.checkFileExists('.env.example', false);

        if (fs.existsSync('.env')) {
            this.addWarning('.env file found - ensure secrets are set in Railway dashboard instead');
        }

        if (fs.existsSync('client/.env')) {
            this.addWarning('client/.env file found - ensure VITE_API_URL is set in Railway dashboard');
        }
    }

    checkRequiredFiles() {
        console.log('\n🔍 Checking required project files...');

        // Core files
        this.checkFileExists('pnpm-lock.yaml');
        this.checkFileExists('turbo.json', false);

        // Agent files
        this.checkFileExists('agent/src/index.ts');
        this.checkFileExists('agent/src/health.ts', false);

        // Client files
        this.checkFileExists('client/src/main.tsx', false);
        this.checkFileExists('client/vite.config.ts', false);
        this.checkFileExists('client/src/config/api.ts', false);

        // Deployment files
        this.checkFileExists('RAILWAY_DEPLOYMENT.md', false);
        this.checkFileExists('.railwayignore', false);
        this.checkFileExists('deploy-railway.sh', false);
    }

    checkDependencies() {
        console.log('\n🔍 Checking dependencies...');

        if (this.checkFileExists('package.json')) {
            const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

            // Check for common required dependencies
            const requiredDeps = ['@ai16z/eliza'];
            const missingDeps = requiredDeps.filter(dep =>
                !pkg.dependencies?.[dep] && !pkg.devDependencies?.[dep]
            );

            if (missingDeps.length > 0) {
                this.addWarning(`Missing dependencies: ${missingDeps.join(', ')}`);
            }

            if (pkg.dependencies?.['typescript'] || pkg.devDependencies?.['typescript']) {
                this.addInfo('TypeScript configured');
            }
        }
    }

    checkGitConfiguration() {
        console.log('\n🔍 Checking Git configuration...');

        if (!fs.existsSync('.git')) {
            this.addError('Not a Git repository - Railway requires Git for deployment');
            return;
        }

        this.checkFileExists('.gitignore');

        // Check if sensitive files are gitignored
        if (this.checkFileExists('.gitignore')) {
            const gitignore = fs.readFileSync('.gitignore', 'utf8');
            const importantIgnores = ['.env', 'node_modules', '*.log'];

            importantIgnores.forEach(pattern => {
                if (!gitignore.includes(pattern)) {
                    this.addWarning(`Consider adding "${pattern}" to .gitignore`);
                }
            });
        }
    }

    printResults() {
        console.log('\n' + '='.repeat(60));
        console.log('🚂 RAILWAY DEPLOYMENT VALIDATION RESULTS');
        console.log('='.repeat(60));

        if (this.errors.length > 0) {
            console.log('\n❌ ERRORS (must fix before deployment):');
            this.errors.forEach(error => console.log(`  ${error}`));
        }

        if (this.warnings.length > 0) {
            console.log('\n⚠️  WARNINGS (recommended to fix):');
            this.warnings.forEach(warning => console.log(`  ${warning}`));
        }

        if (this.info.length > 0) {
            console.log('\nℹ️  INFORMATION:');
            this.info.forEach(info => console.log(`  ${info}`));
        }

        console.log('\n' + '='.repeat(60));

        if (this.errors.length === 0) {
            console.log('✅ READY FOR DEPLOYMENT!');
            console.log('\nNext steps:');
            console.log('1. Run: ./deploy-railway.sh');
            console.log('2. Or follow RAILWAY_DEPLOYMENT.md guide');
            console.log('3. Set environment variables in Railway dashboard');
        } else {
            console.log('❌ NOT READY FOR DEPLOYMENT');
            console.log(`\nPlease fix ${this.errors.length} error(s) before deploying.`);
        }

        console.log('='.repeat(60));

        return this.errors.length === 0;
    }

    async validate() {
        console.log('🚂 Railway Deployment Validation Starting...');

        this.checkRequiredFiles();
        this.checkPackageJson();
        this.checkNixpacksConfigs();
        this.checkEnvironmentTemplate();
        this.checkDependencies();
        this.checkGitConfiguration();

        return this.printResults();
    }
}

// Run validation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const validator = new DeploymentValidator();
    validator.validate().then(success => {
        process.exit(success ? 0 : 1);
    }).catch(error => {
        console.error('Validation failed with error:', error);
        process.exit(1);
    });
}

export default DeploymentValidator;