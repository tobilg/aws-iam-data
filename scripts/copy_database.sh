#!/bin/bash

DATA_PATH="/tmp/duckdb-database-$(date '+%F').duckdb"

cp $DATA_PATH $PWD/data/db/iam.duckdb
