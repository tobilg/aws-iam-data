CREATE TABLE reports AS (
WITH service_actions_agg AS (
  SELECT
    count(distinct a.action_id) actions_cnt,
    count(distinct s.service_id) services_cnt
  FROM 
    aws_services s
  INNER JOIN
    aws_actions a
  ON
    s.service_id = a.service_id
), service_actions AS (
  SELECT
    s.service_id,
    s.name,
    s.prefix,
    count(distinct a.action_id) actions_cnt
  FROM 
    aws_services s
  INNER JOIN
    aws_actions a
  ON
    s.service_id = a.service_id
  GROUP BY
    s.service_id,
    s.name,
    s.prefix
  ORDER BY
    s.service_id
)
SELECT 'Summary' AS report_name, 'Total number of services' AS metric_name, count(distinct service_id)::INTEGER AS value FROM aws_services
UNION ALL
SELECT 'Summary' AS report_name, 'Average number of actions per service' AS metric_name, (actions_cnt/services_cnt)::INTEGER AS value FROM service_actions_agg
UNION ALL
SELECT 'Summary' AS report_name, 'Median number of actions per service' AS metric_name, median(actions_cnt)::INTEGER AS value FROM service_actions
UNION ALL
SELECT 'Summary' AS report_name, 'Total number of distinct resource ARNS' AS metric_name, count(distinct arn_pattern)::INTEGER AS value FROM aws_resource_types
UNION ALL
SELECT 'Summary' AS report_name, 'Total number of distinct condition keys' AS metric_name, count(distinct name)::INTEGER AS value FROM aws_condition_keys
UNION ALL
SELECT
  'Actions by type' AS report_name,
  CASE
    WHEN access_level = 'Read' THEN 'Read Actions'
    WHEN access_level = 'List' THEN 'List Actions'
    WHEN access_level IN ('Write' ,'Tagging') THEN 'Write Actions'
    WHEN access_level = 'Permissions management' THEN 'Permissions Actions'
  END AS metric_name,
  count(distinct action_id) AS value
FROM
  aws_actions
GROUP BY
  report_name,
  metric_name
UNION ALL
SELECT * FROM (SELECT 'Services with most actions' AS report_name, name AS metric_name, actions_cnt AS value FROM service_actions ORDER BY actions_cnt DESC, name ASC LIMIT 10)
UNION ALL
SELECT * FROM (SELECT 'Services with least actions' AS report_name, name AS metric_name, actions_cnt AS value FROM service_actions ORDER BY actions_cnt ASC, name ASC LIMIT 10)
UNION ALL
SELECT * FROM (SELECT 'Longest service prefixes' AS report_name, prefix AS metric_name, length(prefix) AS value FROM service_actions ORDER BY length(prefix) DESC, prefix ASC LIMIT 10)
UNION ALL
SELECT * FROM (SELECT 'Shortest service prefixes' AS report_name, prefix AS metric_name, length(prefix) AS value FROM service_actions ORDER BY length(prefix) ASC, prefix ASC LIMIT 10)
UNION ALL
SELECT * FROM (SELECT 'Longest action names' AS report_name, name AS metric_name, length(name) AS value FROM aws_actions ORDER BY length(name) DESC, name ASC LIMIT 10)
UNION ALL
SELECT * FROM (SELECT 'Shortest action names' AS report_name, name AS metric_name, length(name) AS value FROM aws_actions ORDER BY length(name) ASC, name ASC LIMIT 10)
UNION ALL
SELECT * FROM (SELECT 'Longest condition key names' AS report_name, name AS metric_name, length(name) AS value FROM aws_condition_keys ORDER BY length(name) DESC, name ASC LIMIT 10)
UNION ALL
SELECT * FROM (SELECT 'Shortest condition key names' AS report_name, name AS metric_name, length(name) AS value FROM aws_condition_keys ORDER BY length(name) ASC, name ASC LIMIT 10)
UNION ALL
SELECT * FROM (SELECT
  'Most referenced resource ARNs' AS report_name,
  rt.name || ' - ' || rt.arn_pattern AS metric_name,
  count(distinct art.action_resource_type_id) AS value
FROM
  aws_actions_resource_types art
INNER JOIN
  aws_resource_types rt
ON
  art.resource_type_id = rt.resource_type_id
WHERE
  rt.name != 'wildcard'
GROUP BY
  report_name,
  metric_name
ORDER BY
  value DESC,
  metric_name ASC
LIMIT 10)
);

-- Export to CSV
COPY (SELECT * FROM reports ORDER BY report_name, value DESC) TO 'data/csv/reports.csv' WITH (HEADER 1, DELIMITER ',');

-- Export to Parquet
COPY (SELECT * FROM reports ORDER BY report_name, value DESC) TO 'data/parquet/reports.parquet' (FORMAT 'parquet', COMPRESSION 'SNAPPY');

-- Export to JSON
COPY (
  WITH data(report_name, obj ) AS (
    SELECT report_name, struct_pack(key := metric_name, value := value) AS obj FROM reports
  ),
  agg AS (
    PIVOT data
    ON report_name
    USING list(obj)
  )
  SELECT
    to_json(agg) j
  FROM
    agg
) TO 'data/json/reports_unformatted.json' (FORMAT 'json');


-- SELECT
--   SUM(is_wildcard),
--   SUM(is_arn),
--   SUM(is_condition_key)
-- FROM (
-- SELECT DISTINCT
--   a.name,
--   CASE
--     WHEN rt.name = 'wildcard' THEN 1
--     ELSE 0
--   END AS is_wildcard,
--   CASE
--     WHEN rt.name != 'wildcard' THEN 1
--     ELSE 0
--   END AS is_arn,
--   CASE
--     WHEN rt.name != 'wildcard' THEN 1
--     ELSE 0
--   END AS is_condition_key,
-- FROM
--   aws_actions a
-- LEFT OUTER JOIN
--   aws_actions_resource_types art
-- ON
--   a.action_id = art.action_id
-- LEFT OUTER JOIN
--   aws_resource_types rt
-- ON
--   rt.resource_type_id = art.resource_type_id
-- LEFT OUTER JOIN
--   aws_actions_condition_keys ack
-- ON
--   art.action_resource_type_id = ack.action_resource_type_id
-- )
-- ;
