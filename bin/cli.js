#!/usr/bin/env node

/**
 * This script is responsible for scaffolding a new project from the
 * tailwina-html starter template. It clones the repository, removes
 * the git history, and cleans up the package.json.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import minimist from 'minimist';
import prompts from 'prompts';
import { red, green, bold } from 'kolorist';
import { execSync } from 'node:child_process';

// Get the current directory of the script
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Default project name
const defaultTargetDir = 'tailwina-project';

async function init() {
  const argv = minimist(process.argv.slice(2), { string: ['_'] });
  const cwd = process.cwd();

  let targetDir = argv._[0];
  let result;

  try {
    // Prompt for project name if not provided
    result = await prompts(
      [
        {
          type: targetDir ? null : 'text',
          name: 'projectName',
          message: 'Project name:',
          initial: defaultTargetDir,
          onState: (state) => {
            targetDir = state.value.trim() || defaultTargetDir;
          },
        },
        {
          type: () => (isValidPackageName(targetDir) ? null : 'text'),
          name: 'packageName',
          message: 'Package name:',
          initial: () => toValidPackageName(targetDir),
          validate: (dir) =>
            isValidPackageName(dir) || 'Invalid package.json name',
        },
      ],
      {
        onCancel: () => {
          throw new Error(red('✖') + ' Operation cancelled');
        },
      }
    );
  } catch (cancelled) {
    console.log(cancelled.message);
    return;
  }

  const { packageName } = result;

  const root = path.join(cwd, targetDir);

  if (fs.existsSync(root)) {
    // Check if directory is empty
    if (fs.readdirSync(root).length > 0) {
      const { overwrite } = await prompts({
        type: 'confirm',
        name: 'overwrite',
        message:
          (targetDir === '.'
            ? 'Current directory'
            : `Target directory "${targetDir}"`) +
          ' is not empty. Remove existing files and continue?',
      });

      if (!overwrite) {
        throw new Error(red('✖') + ' Operation cancelled');
      }

      if (targetDir !== '.') {
        fs.rmSync(root, { recursive: true, force: true });
      }
    }
  }

  console.log(`\nScaffolding project in ${root}...`);

  // Clone functionality
  try {
    // Create directory if it doesn't exist
    if (!fs.existsSync(root)) {
      fs.mkdirSync(root, { recursive: true });
    }

    // Check if git is available
    execSync('git --version', { stdio: 'ignore' });

    console.log('Cloning repository...');
    execSync(
      `git clone https://github.com/thefathermore/tailwina-html.git "${root}"`,
      { stdio: 'inherit' }
    );

    // Remove .git directory
    const gitDir = path.join(root, '.git');
    if (fs.existsSync(gitDir)) {
      fs.rmSync(gitDir, { recursive: true, force: true });
    }

    // Update package.json
    const pkgPath = path.join(root, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

    pkg.name = packageName || toValidPackageName(targetDir);
    pkg.version = '0.0.0';

    // Remove bin entry and create- related dependencies
    delete pkg.bin;
    const dependenciesToRemove = ['prompts', 'kolorist', 'minimist'];

    // We installed these as dependencies in the template based on my action
    // but in a real "clone" scenario, we might want to ensure they are cleaned up
    // if they were part of the template itself.
    if (pkg.dependencies) {
      dependenciesToRemove.forEach((dep) => delete pkg.dependencies[dep]);
    }
    // Also check devDependencies just in case someone moved them there
    if (pkg.devDependencies) {
      dependenciesToRemove.forEach((dep) => delete pkg.devDependencies[dep]);
    }

    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));

    // Remove bin directory from the new project
    const binDir = path.join(root, 'bin');
    if (fs.existsSync(binDir)) {
      fs.rmSync(binDir, { recursive: true, force: true });
    }

    console.log(`\nDone. Now run:\n`);
    if (root !== cwd) {
      console.log(`  cd ${path.relative(cwd, root)}`);
    }
    console.log(`  pnpm install`);
    console.log(`  pnpm run dev`);
    console.log();
  } catch (e) {
    console.error(red('Error scaffolding project:'), e);
    process.exit(1);
  }
}

function isValidPackageName(projectName) {
  return /^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(
    projectName
  );
}

function toValidPackageName(projectName) {
  return projectName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/^[._]/, '')
    .replace(/[^a-z0-9-~]+/g, '-');
}

init().catch((e) => {
  console.error(e);
});
