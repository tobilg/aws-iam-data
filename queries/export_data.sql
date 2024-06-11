COPY (SELECT * FROM aws_services ORDER BY service_id ASC) TO 'data/csv/aws_services.csv' WITH (HEADER 1, DELIMITER ',');
COPY (SELECT * FROM aws_services ORDER BY service_id ASC) TO 'data/parquet/aws_services.parquet' (FORMAT 'parquet', COMPRESSION 'SNAPPY');

COPY (SELECT * EXCLUDE (resource_type_struct) FROM aws_actions ORDER BY action_id ASC, service_id ASC) TO 'data/csv/aws_actions.csv' WITH (HEADER 1, DELIMITER ',');
COPY (SELECT * EXCLUDE (resource_type_struct)FROM aws_actions ORDER BY action_id ASC, service_id ASC) TO 'data/parquet/aws_actions.parquet' (FORMAT 'parquet', COMPRESSION 'SNAPPY');

COPY (SELECT * FROM aws_condition_keys ORDER BY condition_key_id ASC) TO 'data/csv/aws_condition_keys.csv' WITH (HEADER 1, DELIMITER ',');
COPY (SELECT * FROM aws_condition_keys ORDER BY condition_key_id ASC) TO 'data/parquet/aws_condition_keys.parquet' (FORMAT 'parquet', COMPRESSION 'SNAPPY');

COPY (SELECT * EXCLUDE (condition_keys_struct) FROM aws_resource_types ORDER BY resource_type_id ASC, service_id ASC) TO 'data/csv/aws_resource_types.csv' WITH (HEADER 1, DELIMITER ',');
COPY (SELECT * EXCLUDE (condition_keys_struct) FROM aws_resource_types ORDER BY resource_type_id ASC, service_id ASC) TO 'data/parquet/aws_resource_types.parquet' (FORMAT 'parquet', COMPRESSION 'SNAPPY');

COPY (SELECT * FROM aws_resource_types_condition_keys ORDER BY resource_type_condition_key_id ASC) TO 'data/csv/aws_resource_types_condition_keys.csv' WITH (HEADER 1, DELIMITER ',');
COPY (SELECT * FROM aws_resource_types_condition_keys ORDER BY resource_type_condition_key_id ASC) TO 'data/parquet/aws_resource_types_condition_keys.parquet' (FORMAT 'parquet', COMPRESSION 'SNAPPY');

COPY (SELECT * FROM aws_actions_condition_keys ORDER BY action_condition_key_id ASC) TO 'data/csv/aws_actions_condition_keys.csv' WITH (HEADER 1, DELIMITER ',');
COPY (SELECT * FROM aws_actions_condition_keys ORDER BY action_condition_key_id ASC) TO 'data/parquet/aws_actions_condition_keys.parquet' (FORMAT 'parquet', COMPRESSION 'SNAPPY');

COPY (SELECT * FROM aws_actions_dependant_actions ORDER BY action_dependent_action_id ASC) TO 'data/csv/aws_actions_dependant_actions.csv' WITH (HEADER 1, DELIMITER ',');
COPY (SELECT * FROM aws_actions_dependant_actions ORDER BY action_dependent_action_id ASC) TO 'data/parquet/aws_actions_dependant_actions.parquet' (FORMAT 'parquet', COMPRESSION 'SNAPPY');

COPY (SELECT * EXCLUDE (condition_keys, dependent_actions) FROM aws_actions_resource_types ORDER BY action_resource_type_id ASC) TO 'data/csv/aws_actions_resource_types.csv' WITH (HEADER 1, DELIMITER ',');
COPY (SELECT * EXCLUDE (condition_keys, dependent_actions) FROM aws_actions_resource_types ORDER BY action_resource_type_id ASC) TO 'data/parquet/aws_actions_resource_types.parquet' (FORMAT 'parquet', COMPRESSION 'SNAPPY');
