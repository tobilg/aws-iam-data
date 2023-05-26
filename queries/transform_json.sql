create temporary sequence aws_service_id increment by 1 start with 1;
create temporary sequence aws_action_id increment by 1 start with 1;
create temporary sequence aws_resource_type_id increment by 1 start with 1;
create temporary sequence aws_condition_key_id increment by 1 start with 1;

-- Create data table
CREATE TABLE aws_iam_data AS
SELECT 
  nextval('aws_service_id') as service_id,
  name,
  prefix,
  reference_url,
  actions_struct,
  resource_types_struct,
  condition_keys_struct
FROM
  (
  SELECT
    name,
    servicePrefix AS prefix,
    authReferenceURL as reference_url,
    actions AS actions_struct,
    resourceTypes AS resource_types_struct,
    conditionKeys AS condition_keys_struct,
  FROM 
    read_json_auto('https://raw.githubusercontent.com/tobilg/aws-iam-data/main/data/iam.json', maximum_object_size=20000000) order by name
) s;

-- Create resource type table
SELECT
  service_id,
  resource_type_struct.name AS name,
  resource_type_struct.apiReferenceUrl AS reference_url,
  resource_type_struct.arnPattern AS arn_pattern,
  resource_type_struct.conditionKeys
FROM
  (
  SELECT
    service_id,
    unnest(resource_types_struct) AS resource_type_struct
  FROM 
    aws_iam_data
  );

-- Create action table
SELECT
  service_id,
  prefix || ':' || action_struct.name AS name,
  action_struct.apireferenceurl AS reference_url,
  action_struct.permissiononly AS permission_only_flag,
  action_struct.accesslevel AS access_level
FROM
  (
  SELECT
    service_id,
    prefix,
    unnest(actions_struct) AS action_struct
  FROM 
    aws_iam_data
  );