#!/bin/bash

# Where to store the db file for DuckDB
DATA_PATH="/tmp/duckdb-database-$(date '+%F').duckdb"

# Export data as CSV and Parquet
duckdb $DATA_PATH < queries/create_reports.sql

# Pipe unformatted DuckDB JSON through formatter
cat data/json/reports_unformatted.json | node process/formatJSON.js > data/json/reports.json

# Delete intermediate unformatted JSON
rm data/json/reports_unformatted.json
