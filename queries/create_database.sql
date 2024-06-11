
CREATE TABLE services (
  service_id INTEGER PRIMARY KEY, 
  "name" VARCHAR, 
  prefix VARCHAR, 
  reference_url VARCHAR 
);

CREATE TABLE actions (
  action_id INTEGER PRIMARY KEY, 
  service_id INTEGER, 
  "name" VARCHAR, 
  reference_url VARCHAR, 
  permission_only_flag BOOLEAN, 
  access_level VARCHAR,
  FOREIGN KEY (service_id) REFERENCES services (service_id)
);

CREATE TABLE condition_keys (
  condition_key_id INTEGER PRIMARY KEY, 
  "name" VARCHAR, 
  reference_url VARCHAR, 
  description VARCHAR, 
  "type" VARCHAR
);

CREATE TABLE resource_types (
  resource_type_id INTEGER PRIMARY KEY, 
  service_id INTEGER, 
  "name" VARCHAR, 
  reference_url VARCHAR, 
  arn_pattern VARCHAR,
  FOREIGN KEY (service_id) REFERENCES services (service_id)
);

CREATE TABLE resource_types_condition_keys (
  resource_type_condition_key_id INTEGER PRIMARY KEY, 
  resource_type_id INTEGER, 
  condition_key_id INTEGER,
  FOREIGN KEY (resource_type_id) REFERENCES resource_types (resource_type_id),
  FOREIGN KEY (condition_key_id) REFERENCES condition_keys (condition_key_id)
);

CREATE TABLE actions_resource_types (
  action_resource_type_id BIGINT PRIMARY KEY, 
  action_id INTEGER, 
  resource_type_id INTEGER, 
  required_flag BOOLEAN,
  FOREIGN KEY (action_id) REFERENCES actions (action_id)
);

CREATE TABLE actions_condition_keys (
  action_condition_key_id BIGINT PRIMARY KEY, 
  action_resource_type_id BIGINT, 
  action_id INTEGER, 
  condition_key_id INTEGER,
  FOREIGN KEY (action_id) REFERENCES actions (action_id),
  FOREIGN KEY (condition_key_id) REFERENCES condition_keys (condition_key_id)
);

CREATE TABLE actions_dependant_actions (
  action_dependent_action_id INTEGER PRIMARY KEY, 
  action_resource_type_id BIGINT, 
  action_id INTEGER, 
  dependent_action_id INTEGER,
  FOREIGN KEY (action_id) REFERENCES actions (action_id),
  FOREIGN KEY (action_resource_type_id) REFERENCES actions_resource_types (action_resource_type_id)
);

INSERT INTO services SELECT * FROM 'data/parquet/aws_services.parquet';
INSERT INTO resource_types SELECT * FROM 'data/parquet/aws_resource_types.parquet';
INSERT INTO condition_keys SELECT * FROM 'data/parquet/aws_condition_keys.parquet';
INSERT INTO actions SELECT * FROM 'data/parquet/aws_actions.parquet';
INSERT INTO resource_types_condition_keys SELECT * FROM 'data/parquet/aws_resource_types_condition_keys.parquet';
INSERT INTO actions_resource_types SELECT * FROM 'data/parquet/aws_actions_resource_types.parquet';
INSERT INTO actions_condition_keys SELECT * FROM 'data/parquet/aws_actions_condition_keys.parquet';
INSERT INTO actions_dependant_actions SELECT * FROM 'data/parquet/aws_actions_dependant_actions.parquet';
