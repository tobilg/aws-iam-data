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

CREATE TABLE aws_condition_keys AS (
WITH raw_condition_keys AS (
  SELECT DISTINCT
    condition_key_struct.name AS name,
    min(condition_key_struct.apiReferenceUrl) AS reference_url,
    min(condition_key_struct.description) AS description,
    min(condition_key_struct.type) AS type
  FROM
    (
    SELECT
      unnest(condition_keys_struct) AS condition_key_struct
    FROM 
      aws_iam_data
    )
  GROUP BY
    name
  ORDER BY
    name ASC
),
raw_resource_type_condition_keys AS (
  SELECT DISTINCT
    unnest(resource_type_struct.conditionKeys) AS name,
  FROM
    (
    SELECT
      unnest(resource_types_struct) AS resource_type_struct
    FROM 
      aws_iam_data
    )
)
SELECT
  nextval('aws_condition_key_id') as condition_key_id,
  name,
  reference_url,
  description,
  type
FROM
  (
  SELECT
    name,
    reference_url,
    description,
    type
  FROM
    (
    SELECT
      s.name,
      r.reference_url,
      r.description,
      r.type
    FROM
      raw_resource_type_condition_keys s
      LEFT OUTER JOIN
        raw_condition_keys r
      ON
        r.name = s.name
    UNION
    SELECT
      name,
      reference_url,
      description,
      type
    FROM
      raw_condition_keys
    )
  ORDER BY name ASC
  )
);

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