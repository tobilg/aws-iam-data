#!/bin/bash

# Where to store the db file for DuckDB
DATA_PATH="/tmp/duckdb-database-$(date '+%F').duckdb"

# Export data as CSV and Parquet
duckdb $DATA_PATH < queries/reports.sql
