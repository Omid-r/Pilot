import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { SPLUNK_APP_FILES, SPLUNK_APP_METADATA } from './data/splunkAppFiles';

function buildSplApp() {
  console.log('Starting Splunk App Compilation (.spl)...');
  
  const tmpDir = path.join('/tmp', SPLUNK_APP_METADATA.id);
  
  // Clean old build folder
  if (fs.existsSync(tmpDir)) {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tmpDir, { recursive: true });
  
  // Create file structure
  for (const file of SPLUNK_APP_FILES) {
    const targetPath = path.join(tmpDir, file.path);
    const parentDir = path.dirname(targetPath);
    
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    
    fs.writeFileSync(targetPath, file.content, 'utf8');
    console.log(`Created: ${file.path}`);
  }
  
  // Package into public folder as .spl (gzipped tarball)
  const outputFileName = `${SPLUNK_APP_METADATA.id}-${SPLUNK_APP_METADATA.version}.spl`;
  const outputPath = path.join(process.cwd(), 'public', outputFileName);
  
  console.log(`Packaging app into: ${outputPath}...`);
  try {
    // Run standard tar command: -c (create), -z (gzip), -f (file)
    execSync(`tar -czf "${outputPath}" -C /tmp "${SPLUNK_APP_METADATA.id}"`);
    
    // Also copy as .tar.gz
    const tarGzPath = path.join(process.cwd(), 'public', `${SPLUNK_APP_METADATA.id}-${SPLUNK_APP_METADATA.version}.tar.gz`);
    fs.copyFileSync(outputPath, tarGzPath);
    
    console.log(`Successfully built Splunk app package!`);
    console.log(`Filename: ${outputFileName} & .tar.gz`);
    console.log(`Size: ${fs.statSync(outputPath).size} bytes`);
  } catch (error) {
    console.error('Error compiling Splunk .spl package via tar:', error);
  }
}

buildSplApp();
