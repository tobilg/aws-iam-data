#!/bin/bash

# Where to store the db file for DuckDB
DATA_PATH="/tmp/duckdb-database-$(date '+%F').duckdb"

# Load data and create tables
duckdb $DATA_PATH < queries/create_tables.sql
