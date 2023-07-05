import iamDataRaw from "./data/json/iam.json";
import metadataRaw from "./data/json/metadata.json";
import changelogRaw from "./data/json/changelog.json";
import reportsRaw from "./data/json/reports.json";
import { AWSIamData, AWSIamMetadata, Changelog, Report } from "./awsIamData";

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
