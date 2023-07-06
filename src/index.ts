import iamDataRaw from "./data/json/iam.json";
import metadataRaw from "./data/json/metadata.json";
import changelogRaw from "./data/json/changelog.json";
import reportsRaw from "./data/json/reports.json";

export interface AWSIamData extends Array<ServiceAuthReference>{}

export interface ServiceAuthReference {
  name: string;
  servicePrefix: string;
  authReferenceUrl?: string;
  actions: Action[];
  resourceTypes: ResourceType[];
  conditionKeys: ConditionKey[];
}

export interface AWSIamMetadata {
  serviceCount: number;
  services: ServiceAuthMetadata[];
}

export interface ServiceAuthMetadata {
  name: string;
  servicePrefix: string;
  authReferenceUrl?: string;
  actionsCount: number;
  actions: string[];
  resourceTypesCount: number;
  resourceTypes: string[];
  conditionKeysCount: number;
  conditionKeys: string[];
}

export interface Topic {
  name: string;
  authReferenceUrl: string;
}

export interface ResourceType {
  name: string;
  apiReferenceUrl?: string;
  arnPattern: string;
  conditionKeys: string[];
}

export interface ActionResourceType {
  resourceType?: string;
  required?: boolean;
  conditionKeys?: string[];
  dependentActions?: string[];
}

export interface Action {
  name: string;
  permissionOnly?: boolean;
  apiReferenceUrl?: string;
  description?: string;
  accessLevel?: string;
  resourceTypes?: ActionResourceType[];
}

export interface ConditionKey {
  name: string;
  apiReferenceUrl?: string;
  description: string;
  type: string;
}

export interface Changelog extends Array<ChangelogEntry>{}

export interface ChangelogActions {
  [key: string]: string[] | undefined;
}

export interface ChangelogEntry {
  dateOfChange: string;
  addedServices: string[];
  removedServices: string[];
  addedActions: ChangelogActions;
  removedActions: ChangelogActions;
}

export interface ReportEntry {
  key: string;
  value: number;
}

export interface Report {
  [key: string]: ReportEntry[];
}

const iamData = iamDataRaw as AWSIamData;
const metadata = metadataRaw as AWSIamMetadata;
const changelog = changelogRaw as Changelog;
const reports = reportsRaw as Report;

export {
  iamData,
  metadata,
  changelog,
  reports,
}
