import iamDataRaw from "./data/json/iam.json";
import metadataRaw from "./data/json/metadata.json";
import changelogRaw from "./data/json/changelog.json";
import reportsRaw from "./data/json/reports.json";
import { AWSIamData, AWSIamMetadata, Changelog, Report } from "./awsIamData";

export const iamData = iamDataRaw as AWSIamData;
export const metadata = metadataRaw as AWSIamMetadata;
export const changelog = changelogRaw as Changelog;
export const reports = reportsRaw as Report;
