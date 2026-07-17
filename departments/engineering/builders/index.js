'use strict';

/**
 * builders/index.js
 * ---------------------------------------------------------------------------
 * Builders CREATE. They never make architectural decisions (that's
 * processors/agents) — they take already-decided content and materialize
 * it into concrete files, manifests, and packages.
 * ---------------------------------------------------------------------------
 */

const path = require('path');
const { Artifact } = require('../artifact');
const { MANDATORY_FILES } = require('../constants');

/** Assembles the full department file map into a single immutable Artifact. */
class DepartmentBuilder {
  build({ contract, plan, files, contributors }) {
    return new Artifact({
      contractId: contract.id,
      departmentName: plan.departmentName,
      files,
      architecture: plan,
      contributors
    });
  }
}

/** Renders the architecture plan itself as a stored artifact file (traceability). */
class ArchitectureBuilder {
  build(plan) {
    return { 'architecture.json': JSON.stringify(plan, null, 2) };
  }
}

/** Generic single-file writer used by other builders. */
class FileBuilder {
  build(relativePath, content) {
    return { [relativePath]: content };
  }
}

/** Ensures generated modules export a coherent public surface (index barrel). */
class ModuleBuilder {
  build(departmentName, fileMap) {
    const exportsList = Object.keys(fileMap)
      .filter(f => f.endsWith('.js') && f !== 'index.js')
      .map(f => `'./${f.replace(/\.js$/, '')}'`);
    return {
      'module-map.json': JSON.stringify({ department: departmentName, modules: exportsList }, null, 2)
    };
  }
}

/** Builds the public interface/contract description for the department. */
class InterfaceBuilder {
  build(plan) {
    return {
      'interface.json': JSON.stringify({
        department: plan.departmentName,
        capabilities: plan.capabilities,
        dataModels: plan.dataModels
      }, null, 2)
    };
  }
}

/** Builds JSON-schema files describing artifact/contract/manifest shapes. */
class SchemaBuilder {
  build(plan) {
    return {
      'schemas/artifact.schema.json': JSON.stringify({
        type: 'object',
        required: ['departmentName', 'files'],
        properties: {
          departmentName: { type: 'string' },
          files: { type: 'object' }
        }
      }, null, 2)
    };
  }
}

/** Builds a minimal UI descriptor when the plan requires a dashboard. */
class UIBuilder {
  build(plan) {
    if (!plan.optionalDirectories.includes('ui')) return {};
    return {
      'ui/menu.json': JSON.stringify({
        department: plan.departmentName,
        menu: [{ label: 'Overview', route: '/' }, { label: 'Activity', route: '/activity' }]
      }, null, 2)
    };
  }
}

/** Builds navigational menu configuration consumed by the platform shell. */
class MenuBuilder {
  build(plan) {
    return {
      'menu.json': JSON.stringify({
        department: plan.departmentName,
        title: plan.departmentName.replace(/-/g, ' ')
      }, null, 2)
    };
  }
}

/** Builds README/API docs (delegates content to the Documentation Engineer's output). */
class DocumentationBuilder {
  build(readmeContent) {
    return { 'README.md': readmeContent };
  }
}

/** Builds a minimal test harness scaffold. */
class TestBuilder {
  build(plan) {
    return {
      'tests/index.js': `'use strict';\n// Auto-generated smoke test for ${plan.departmentName}\nconst assert = require('assert');\nconst pkg = require('../package.json');\nassert.strictEqual(typeof pkg.name, 'string');\nconsole.log('${plan.departmentName}: smoke test passed');\n`
    };
  }
}

/** Builds the installation manifest describing how to install this department. */
class ManifestBuilder {
  build(plan, artifactSummary) {
    return {
      'manifest.json': JSON.stringify({
        department: plan.departmentName,
        version: '0.1.0',
        artifactId: artifactSummary.id,
        checksum: artifactSummary.checksum,
        mandatoryFiles: MANDATORY_FILES,
        generatedAt: new Date().toISOString()
      }, null, 2)
    };
  }
}

/** Builds the final distributable marketplace package on disk as DepartmentName-Version.zip. */
class PackageBuilder {
  constructor({ filesystem, archiver }) {
    this.filesystem = filesystem;
    this.archiver = archiver; // adapters/archiver.js
  }

  async build({ artifact, outputDir }) {
    const version = '0.1.0';
    const packageName = `${capitalize(artifact.departmentName)}-${version}.zip`;
    const stagingDir = path.join(outputDir, `.staging-${artifact.id}`);
    await this.filesystem.writeFileMap(stagingDir, artifact.files);
    const zipPath = path.join(outputDir, packageName);
    await this.archiver.zipDirectory(stagingDir, zipPath);
    return { packageName, zipPath };
  }
}

function capitalize(str) {
  return str.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');
}

module.exports = {
  DepartmentBuilder,
  ArchitectureBuilder,
  FileBuilder,
  ModuleBuilder,
  InterfaceBuilder,
  SchemaBuilder,
  UIBuilder,
  MenuBuilder,
  DocumentationBuilder,
  TestBuilder,
  ManifestBuilder,
  PackageBuilder
};
