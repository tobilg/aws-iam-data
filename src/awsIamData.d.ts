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
    lastUpdatedAt: string;
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
    name?: string;
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