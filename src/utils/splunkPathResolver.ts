/**
 * Splunk Path Resolver Utility
 * Accurately finds and substitutes all placeholder variables 
 * (e.g. $splunkdirectory, $splunkdiectory, $SPLUNK_HOME, $SPLUNK_DB, %SPLUNK_HOME%, etc.)
 * with real, concrete Linux filesystem paths.
 */

import { SplunkFinding, RemediationOption } from '../types';

export const DEFAULT_SPLUNK_HOME = '/opt/splunk';
export const DEFAULT_SPLUNK_DB = '/opt/splunk/var/lib/splunk';

/**
 * Replaces all placeholder variable forms of Splunk directory with concrete paths.
 */
export function resolveSplunkPaths(
  text: string,
  splunkHome: string = DEFAULT_SPLUNK_HOME,
  splunkDb: string = DEFAULT_SPLUNK_DB
): string {
  if (!text) return '';

  let resolved = text;

  // 1. Splunk DB Path Replacements
  resolved = resolved.replace(
    /\$(?:SPLUNK_DB|splunk_db|splunkdb|SPLUNKDB|\{SPLUNK_DB\}|\{splunk_db\})/g,
    splunkDb
  );
  resolved = resolved.replace(/%SPLUNK_DB%/gi, splunkDb);

  // 2. Splunk Home / Directory Replacements (including $splunkdirectory, $splunkdiectory, $SPLUNK_HOME, etc.)
  resolved = resolved.replace(
    /\$(?:SPLUNK_HOME|splunk_home|splunkdirectory|splunkdiectory|SPLUNKDIRECTORY|SPLUNKDIECTORY|SPLUNKDIR|SPLUNK_DIR|splunk_dir|SPLUNK_PATH|splunk_path|\{SPLUNK_HOME\}|\{splunkdirectory\}|\{splunkdiectory\})/gi,
    splunkHome
  );
  resolved = resolved.replace(/%(?:SPLUNK_HOME|splunkdirectory|splunkdiectory)%/gi, splunkHome);
  resolved = resolved.replace(/<(?:SPLUNK_HOME|splunkdirectory|splunkdiectory)>/gi, splunkHome);

  return resolved;
}

/**
 * Deeply processes a RemediationOption to ensure all paths are concrete Linux paths.
 */
export function resolveOptionPaths(
  option: RemediationOption,
  splunkHome: string = DEFAULT_SPLUNK_HOME,
  splunkDb: string = DEFAULT_SPLUNK_DB
): RemediationOption {
  return {
    ...option,
    titleFa: resolveSplunkPaths(option.titleFa, splunkHome, splunkDb),
    titleEn: resolveSplunkPaths(option.titleEn, splunkHome, splunkDb),
    descriptionFa: resolveSplunkPaths(option.descriptionFa, splunkHome, splunkDb),
    descriptionEn: resolveSplunkPaths(option.descriptionEn, splunkHome, splunkDb),
    diffSnippet: resolveSplunkPaths(option.diffSnippet, splunkHome, splunkDb),
    replacementConfigSnippet: resolveSplunkPaths(option.replacementConfigSnippet || '', splunkHome, splunkDb),
    cliCommand: option.cliCommand ? resolveSplunkPaths(option.cliCommand, splunkHome, splunkDb) : undefined
  };
}

/**
 * Deeply processes a SplunkFinding to ensure all paths are concrete Linux paths.
 */
export function resolveFindingPaths(
  finding: SplunkFinding,
  splunkHome: string = DEFAULT_SPLUNK_HOME,
  splunkDb: string = DEFAULT_SPLUNK_DB
): SplunkFinding {
  return {
    ...finding,
    culpritCode: resolveSplunkPaths(finding.culpritCode, splunkHome, splunkDb),
    whyFlaggedFa: resolveSplunkPaths(finding.whyFlaggedFa, splunkHome, splunkDb),
    whyFlaggedEn: resolveSplunkPaths(finding.whyFlaggedEn, splunkHome, splunkDb),
    potentialImpactFa: resolveSplunkPaths(finding.potentialImpactFa, splunkHome, splunkDb),
    potentialImpactEn: resolveSplunkPaths(finding.potentialImpactEn, splunkHome, splunkDb),
    seniorRecommendationFa: resolveSplunkPaths(finding.seniorRecommendationFa, splunkHome, splunkDb),
    seniorRecommendationEn: resolveSplunkPaths(finding.seniorRecommendationEn, splunkHome, splunkDb),
    splQuery: resolveSplunkPaths(finding.splQuery || '', splunkHome, splunkDb),
    splExplanationFa: resolveSplunkPaths(finding.splExplanationFa || '', splunkHome, splunkDb),
    splExplanationEn: resolveSplunkPaths(finding.splExplanationEn || '', splunkHome, splunkDb),
    splSearchTipFa: finding.splSearchTipFa ? resolveSplunkPaths(finding.splSearchTipFa, splunkHome, splunkDb) : undefined,
    splSearchTipEn: finding.splSearchTipEn ? resolveSplunkPaths(finding.splSearchTipEn, splunkHome, splunkDb) : undefined,
    options: (finding.options || []).map(opt => resolveOptionPaths(opt, splunkHome, splunkDb))
  };
}
