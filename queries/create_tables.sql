-- Install httpfs extension
INSTALL httpfs;
LOAD httpfs;

-- Create sequences
create sequence aws_service_id increment by 1 start with 1;
create sequence aws_action_id increment by 1 start with 1;
create sequence aws_resource_type_id increment by 1 start with 1;
create sequence aws_condition_key_id increment by 1 start with 1;
create sequence aws_action_resource_type_id increment by 1 start with 1;
create sequence aws_action_condition_key_id increment by 1 start with 1;
create sequence aws_action_dependent_action_id increment by 1 start with 1;

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

-- Create services table
CREATE TABLE aws_services (
  service_id INTEGER PRIMARY KEY,
  name VARCHAR,
  prefix VARCHAR,
  reference_url VARCHAR
);

-- Insert into services table
INSERT INTO aws_services
SELECT 
  service_id,
  name,
  prefix,
  reference_url
FROM
  aws_iam_data;

-- Create actions table
CREATE TABLE aws_actions (
  action_id INTEGER PRIMARY KEY,
  service_id INTEGER REFERENCES aws_services (service_id),
  name VARCHAR,
  reference_url VARCHAR,
  permission_only_flag BOOL,
  access_level VARCHAR,
  resource_type_struct STRUCT(resourceType VARCHAR, required BOOLEAN, conditionKeys VARCHAR[], dependentActions VARCHAR[])[]
);
  
INSERT INTO aws_actions
SELECT
  nextval('aws_action_id') as action_id,
  service_id,
  prefix || ':' || action_struct.name AS name,
  action_struct.apireferenceurl AS reference_url,
  action_struct.permissiononly AS permission_only_flag,
  action_struct.accesslevel AS access_level,
  action_struct.resourcetypes as resource_type_struct
FROM
  (
  SELECT
    service_id,
    prefix,
    unnest(actions_struct) AS action_struct
  FROM 
    aws_iam_data
  );

CREATE TABLE aws_condition_keys (
  condition_key_id INTEGER PRIMARY KEY,
  name VARCHAR,
  reference_url VARCHAR,
  description VARCHAR,
  type VARCHAR
);

INSERT INTO aws_condition_keys
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
),
action_resource_type_condition_keys AS (
  SELECT DISTINCT
    unnest(resource_type.conditionKeys) AS name
  FROM
    (
    SELECT
      unnest(resource_type_struct) AS resource_type
    FROM
      aws_actions
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
    UNION
    SELECT DISTINCT
      s.name,
      r.reference_url,
      r.description,
      r.type
    FROM
      action_resource_type_condition_keys s
    LEFT OUTER JOIN
      raw_condition_keys r
    ON
      r.name = s.name
    )
  ORDER BY name ASC
  );

-- Create resource type table
CREATE TABLE aws_resource_types (
  resource_type_id INTEGER PRIMARY KEY,
  service_id INTEGER REFERENCES aws_services (service_id),
  name VARCHAR,
  reference_url VARCHAR,
  arn_pattern VARCHAR,
  condition_keys_struct VARCHAR[]
);

INSERT INTO aws_resource_types
SELECT
  nextval('aws_resource_type_id') as resource_type_id,
  service_id,
  name,
  reference_url,
  arn_pattern,
  condition_keys_struct
FROM
  (
  SELECT
    service_id,
    resource_type_struct.name AS name,
    resource_type_struct.apiReferenceUrl AS reference_url,
    resource_type_struct.arnPattern AS arn_pattern,
    resource_type_struct.conditionKeys as condition_keys_struct
  FROM
    (
    SELECT
      service_id,
      unnest(resource_types_struct) AS resource_type_struct
    FROM 
      aws_iam_data
    )
  UNION ALL
  SELECT DISTINCT
    service_id,
    'wildcard' AS name,
    null AS reference_url,
    '*' AS arn_pattern,
    null AS condition_key_struct
  FROM
    aws_iam_data
  );

-- Create mapping table for resource types condition keys
CREATE TABLE aws_resource_types_condition_keys AS (
  SELECT
    rt_condition_keys.resource_type_id,
    aws_condition_keys.condition_key_id
  FROM
    (
    SELECT
      resource_type_id,
      unnest(condition_keys_struct) as condition_key_name
    FROM
      aws_resource_types
    ) rt_condition_keys
  INNER JOIN
    aws_condition_keys
  ON
    aws_condition_keys.name = rt_condition_keys.condition_key_name
);

-- Remove no longer needed column
ALTER TABLE aws_resource_types DROP COLUMN condition_keys_struct;

-- Create mapping table for action resource types
CREATE TABLE aws_actions_resource_types (
  action_resource_type_id BIGINT PRIMARY KEY,
  action_id INTEGER REFERENCES aws_actions (action_id),
  resource_type_id INTEGER REFERENCES aws_resource_types (resource_type_id),
  required_flag BOOLEAN,
  condition_keys VARCHAR[],
  dependent_actions VARCHAR[]
);

INSERT INTO aws_actions_resource_types
  SELECT DISTINCT
    nextval('aws_action_resource_type_id') as action_resource_type_id,
    action_resource_types.action_id,
    aws_resource_types.resource_type_id,
    action_resource_types.required_flag,
    action_resource_types.condition_keys,
    action_resource_types.dependent_actions
  FROM
    (
    SELECT
      action_id,
      service_id,
      CASE
        WHEN resource_type.resourceType = '' THEN 'wildcard'
        ELSE resource_type.resourceType
      END AS resource_type_name,
      resource_type.required AS required_flag,
      resource_type.conditionKeys AS condition_keys,
      resource_type.dependentActions AS dependent_actions
    FROM
      (
      SELECT
        service_id,
        action_id,
        unnest(resource_type_struct) AS resource_type
      FROM
        aws_actions
      )
    ) action_resource_types
  INNER JOIN
    aws_resource_types
  ON
    aws_resource_types.name = action_resource_types.resource_type_name AND aws_resource_types.service_id = action_resource_types.service_id;

-- Remove no longer needed column
ALTER TABLE aws_actions DROP COLUMN resource_type_struct;

-- Create mapping table for action condition keys
CREATE TABLE aws_actions_condition_keys (
  action_condition_key_id BIGINT PRIMARY KEY,
  action_resource_type_id BIGINT REFERENCES aws_actions_resource_types (action_resource_type_id),
  action_id INTEGER REFERENCES aws_actions (action_id),
  condition_key_id INTEGER REFERENCES aws_condition_keys (condition_key_id),
);

INSERT INTO aws_actions_condition_keys
  SELECT DISTINCT
    nextval('aws_action_condition_key_id') AS action_condition_key_id,
    action_condition_keys.action_resource_type_id,
    action_condition_keys.action_id,
    aws_condition_keys.condition_key_id
  FROM
    (
    SELECT DISTINCT
      action_resource_type_id,
      action_id,
      unnest(condition_keys) AS condition_key_name
    FROM
      aws_actions_resource_types
    ) action_condition_keys
  INNER JOIN
    aws_condition_keys
  ON
    aws_condition_keys.name = action_condition_keys.condition_key_name;

-- Create mapping table for action resource types dependant actions
CREATE TABLE aws_actions_dependant_actions (
  action_dependent_action_id INTEGER PRIMARY KEY,
  action_resource_type_id BIGINT REFERENCES aws_actions_resource_types (action_resource_type_id),
  action_id INTEGER REFERENCES aws_actions (action_id),
  dependent_action_id INTEGER REFERENCES aws_actions (action_id)
);

INSERT INTO aws_actions_dependant_actions
SELECT DISTINCT
  nextval('aws_action_dependent_action_id') AS action_dependent_action_id,
  action_dependent_actions.action_resource_type_id,
  action_dependent_actions.action_id,
  aws_actions.action_id AS dependent_action_id
FROM
  (
  SELECT DISTINCT
    action_resource_type_id,
    action_id,
    unnest(dependent_actions) AS dependent_actions_name
  FROM
    aws_actions_resource_types
  ) action_dependent_actions
INNER JOIN
  aws_actions
ON
  aws_actions.name = action_dependent_actions.dependent_actions_name;

DROP TABLE aws_iam_data;
