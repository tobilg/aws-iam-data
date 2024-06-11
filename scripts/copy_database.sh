#!/bin/bash

DATA_PATH="/tmp/duckdb-database-$(date '+%F').duckdb"

mkdir -p $PWD/data/db/

cp $DATA_PATH $PWD/data/db/iam.duckdb
